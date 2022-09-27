import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import {
  getOrCreateToken,
  getOrCreateLpToken,
  getOrCreateDexAmmProtocol,
  getOrCreateLiquidityPoolFee,
} from "./initializers";
import { PoolFeesType } from "./types";
import * as constants from "../common/constants";
import { Token, LiquidityPool } from "../../generated/schema";
import { Pool as PoolContract } from "../../generated/templates/PoolTemplate/Pool";
import { ERC20 as ERC20Contract } from "../../generated/templates/PoolTemplate/ERC20";
import { Pool as LiquidityPoolContract } from "../../generated/templates/PoolTemplate/Pool";
import { Registry as RegistryContract } from "../../generated/templates/PoolTemplate/Registry";
import { Gauge as LiquidityGaugeContract } from "../../generated/templates/LiquidityGauge/Gauge";

export function enumToPrefix(snake: string): string {
  return snake.toLowerCase().replace("_", "-") + "-";
}

export function equalsIgnoreCase(a: string, b: string): boolean {
  return a.replace("-", "_").toLowerCase() == b.replace("-", "_").toLowerCase();
}

export function getTokenDecimals(tokenAddr: Address): BigDecimal {
  const token = ERC20Contract.bind(tokenAddr);

  let decimals = readValue<BigInt>(
    token.try_decimals(),
    constants.DEFAULT_DECIMALS
  );

  return constants.BIGINT_TEN.pow(decimals.toI32() as u8).toBigDecimal();
}

export function getOrCreateTokenFromString(
  tokenAddress: string,
  block: ethereum.Block
): Token {
  return getOrCreateToken(Address.fromString(tokenAddress), block);
}

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function calculateAverage(prices: BigDecimal[]): BigDecimal {
  let sum = BigDecimal.fromString("0");
  for (let i = 0; i < prices.length; i++) {
    sum = sum.plus(prices[i]);
  }

  return sum.div(
    BigDecimal.fromString(BigInt.fromI32(prices.length).toString())
  );
}

export function isPoolRegistered(poolAddress: Address): boolean {
  const pool = LiquidityPool.load(poolAddress.toHexString());

  if (!pool) return false;
  return true;
}

export function getLpTokenFromPool(
  poolAddress: Address,
  block: ethereum.Block
): Token {
  const poolContract = LiquidityPoolContract.bind(poolAddress);

  let lpToken = readValue<Address>(
    poolContract.try_lp_token(),
    constants.NULL.TYPE_ADDRESS
  );
  if (lpToken.notEqual(constants.NULL.TYPE_ADDRESS)) {
    return getOrCreateToken(lpToken, block);
  }

  lpToken = readValue<Address>(
    poolContract.try_token(),
    constants.NULL.TYPE_ADDRESS
  );
  if (lpToken.notEqual(constants.NULL.TYPE_ADDRESS)) {
    return getOrCreateToken(lpToken, block);
  }

  return getOrCreateToken(poolAddress, block);
}

export function getLpTokenFromRegistry(
  poolAddress: Address,
  registryAddress: Address,
  block: ethereum.Block
): Token | null {
  const registryContract = RegistryContract.bind(registryAddress);

  let lpToken = readValue<Address>(
    registryContract.try_get_lp_token(poolAddress),
    constants.NULL.TYPE_ADDRESS
  );
  if (lpToken.equals(constants.NULL.TYPE_ADDRESS)) return null;

  return getOrCreateToken(lpToken, block);
}

export function getPoolFromCoins(
  registryAddress: Address,
  coins: Address[]
): Address {
  const registryContract = RegistryContract.bind(registryAddress);

  if (coins.length < 2) return constants.NULL.TYPE_ADDRESS;

  for (let idx = 0; idx <= 8; idx++) {
    let poolAddress = readValue<Address>(
      registryContract.try_find_pool_for_coins1(
        coins.at(0),
        coins.at(1),
        BigInt.fromI32(idx)
      ),
      constants.NULL.TYPE_ADDRESS
    );

    return poolAddress;
  }

  return constants.NULL.TYPE_ADDRESS;
}

export function getPoolCoins(
  poolAddress: Address,
  block: ethereum.Block
): string[] {
  const curvePool = PoolContract.bind(poolAddress);

  let idx = 0;
  let inputTokens: string[] = [];

  while (idx >= 0) {
    let inputToken = readValue<Address>(
      curvePool.try_coins(BigInt.fromI32(idx)),
      constants.NULL.TYPE_ADDRESS
    );

    if (inputToken.equals(constants.NULL.TYPE_ADDRESS)) {
      inputToken = readValue<Address>(
        curvePool.try_coins1(BigInt.fromI32(idx)),
        constants.NULL.TYPE_ADDRESS
      );

      if (inputToken.equals(constants.NULL.TYPE_ADDRESS)) {
        return inputTokens;
      }
    }

    inputTokens.push(getOrCreateToken(inputToken, block).id);
    idx += 1;
  }

  return inputTokens;
}

export function getPoolUnderlyingCoinsFromRegistry(
  poolAddress: Address,
  registryAddress: Address
): Address[] {
  const registryContract = RegistryContract.bind(registryAddress);

  let underlyingCoins = readValue<Address[]>(
    registryContract.try_get_underlying_coins(poolAddress),
    []
  );

  return underlyingCoins;
}

export function getPoolBalances(
  poolAddress: Address,
  inputTokens: string[]
): BigInt[] {
  const curvePool = PoolContract.bind(poolAddress);

  let inputTokenBalances: BigInt[] = [];
  for (let idx = 0; idx < inputTokens.length; idx++) {
    let balance = readValue<BigInt>(
      curvePool.try_balances(BigInt.fromI32(idx)),
      constants.BIGINT_ZERO
    );

    if (balance.equals(constants.BIGINT_ZERO)) {
      balance = readValue<BigInt>(
        curvePool.try_balances1(BigInt.fromI32(idx)),
        constants.BIGINT_ZERO
      );
    }

    inputTokenBalances.push(balance);
  }

  return inputTokenBalances;
}

export function getPoolTokenWeights(
  inputTokens: string[],
  inputTokenBalances: BigInt[],
  totalValueLockedUSD: BigDecimal,
  block: ethereum.Block
): BigDecimal[] {
  let inputTokenWeights: BigDecimal[] = [];

  for (let idx = 0; idx < inputTokens.length; idx++) {
    if (totalValueLockedUSD == constants.BIGDECIMAL_ZERO) {
      inputTokenWeights.push(constants.BIGDECIMAL_ZERO);
      continue;
    }

    let balance = inputTokenBalances[idx];
    let inputToken = getOrCreateTokenFromString(inputTokens[idx], block);

    let balanceUSD = balance
      .divDecimal(
        constants.BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal()
      )
      .times(inputToken.lastPriceUSD!);
    let weight = balanceUSD
      .div(totalValueLockedUSD)
      .times(constants.BIGDECIMAL_HUNDRED);

    inputTokenWeights.push(weight);
  }

  return inputTokenWeights;
}

export function getPoolFees(poolAddress: Address): PoolFeesType {
  const curvePool = PoolContract.bind(poolAddress);

  let totalFees = readValue<BigInt>(
    curvePool.try_fee(),
    constants.DEFAULT_POOL_FEE
  ).divDecimal(constants.FEE_DENOMINATOR);
  let adminFees = readValue<BigInt>(
    curvePool.try_admin_fee(),
    constants.DEFAULT_ADMIN_FEE
  ).divDecimal(constants.FEE_DENOMINATOR);

  const tradingFeeId =
    enumToPrefix(constants.LiquidityPoolFeeType.FIXED_TRADING_FEE) +
    poolAddress.toHexString();
  let tradingFee = getOrCreateLiquidityPoolFee(
    tradingFeeId,
    constants.LiquidityPoolFeeType.FIXED_TRADING_FEE,
    totalFees.times(constants.BIGDECIMAL_HUNDRED)
  );

  const protocolFeeId =
    enumToPrefix(constants.LiquidityPoolFeeType.FIXED_PROTOCOL_FEE) +
    poolAddress.toHexString();
  let protocolFee = getOrCreateLiquidityPoolFee(
    protocolFeeId,
    constants.LiquidityPoolFeeType.FIXED_PROTOCOL_FEE,
    totalFees.times(adminFees).times(constants.BIGDECIMAL_HUNDRED)
  );

  const lpFeeId =
    enumToPrefix(constants.LiquidityPoolFeeType.FIXED_LP_FEE) +
    poolAddress.toHexString();
  let lpFee = getOrCreateLiquidityPoolFee(
    lpFeeId,
    constants.LiquidityPoolFeeType.FIXED_LP_FEE,
    totalFees
      .minus(totalFees.times(adminFees))
      .times(constants.BIGDECIMAL_HUNDRED)
  );

  return new PoolFeesType(tradingFee, protocolFee, lpFee);
}

export function getPoolFromLpToken(lpToken: Address): Address {
  const lpTokenStore = getOrCreateLpToken(lpToken);
  let poolAddress = Address.fromString(lpTokenStore.poolAddress);
  const registryAddress = Address.fromString(lpTokenStore.registryAddress);

  if (poolAddress.notEqual(constants.NULL.TYPE_ADDRESS)) return poolAddress;

  if (registryAddress.equals(constants.NULL.TYPE_ADDRESS))
    return constants.NULL.TYPE_ADDRESS;

  let registryContract = RegistryContract.bind(registryAddress);

  poolAddress = readValue<Address>(
    registryContract.try_get_pool_from_lp_token(lpToken),
    constants.NULL.TYPE_ADDRESS
  );

  return poolAddress;
}

export function getLpTokenFromGauge(gaugeAddress: Address): Address {
  let gaugeContract = LiquidityGaugeContract.bind(gaugeAddress);

  let lpToken = readValue<Address>(
    gaugeContract.try_lp_token(),
    constants.NULL.TYPE_ADDRESS
  );

  return lpToken;
}

export function getPoolTVL(
  outputToken: Token,
  outputTokenBalance: BigInt
): BigDecimal {
  let totalValueLockedUSD = outputTokenBalance
    .divDecimal(
      constants.BIGINT_TEN.pow(outputToken.decimals as u8).toBigDecimal()
    )
    .times(outputToken.lastPriceUSD!);

  return totalValueLockedUSD;
}

export function updateProtocolTotalValueLockedUSD(): void {
  const protocol = getOrCreateDexAmmProtocol();

  const poolIds = protocol._poolIds;
  let totalValueLockedUSD = constants.BIGDECIMAL_ZERO;

  for (let poolIdx = 0; poolIdx < poolIds.length; poolIdx++) {
    const pool = LiquidityPool.load(poolIds[poolIdx]);

    if (!pool) continue;
    totalValueLockedUSD = totalValueLockedUSD.plus(pool.totalValueLockedUSD);
  }

  protocol.totalValueLockedUSD = totalValueLockedUSD;
  protocol.save();
}

export function getOutputTokenSupply(
  lpTokenAddress: Address,
  oldSupply: BigInt
): BigInt {
  const lpTokenContract = ERC20Contract.bind(lpTokenAddress);

  let outputTokenSupply = readValue<BigInt>(
    lpTokenContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );
  if (outputTokenSupply.equals(constants.BIGINT_ZERO)) return oldSupply;

  return outputTokenSupply;
}

export function updateProtocolAfterNewLiquidityPool(
  poolAddress: Address
): void {
  const protocol = getOrCreateDexAmmProtocol();

  let poolIds = protocol._poolIds;
  poolIds.push(poolAddress.toHexString());
  protocol._poolIds = poolIds;

  protocol.totalPoolCount += 1;

  protocol.save();
}
