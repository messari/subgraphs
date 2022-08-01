import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import {
  getOrCreateToken,
  getOrCreateDexAmmProtocol,
  getOrCreateLiquidityPoolFee,
} from "./initializers";
import { PoolFeesType } from "./types";
import { getUsdPricePerToken } from "../prices";
import * as constants from "../common/constants";
import { Token, LiquidityPool } from "../../generated/schema";
import { Pool as PoolContract } from "../../generated/templates/PoolTemplate/Pool";
import { ERC20 as ERC20Contract } from "../../generated/templates/PoolTemplate/ERC20";
import { Pool as LiquidityPoolContract } from "../../generated/templates/PoolTemplate/Pool";
import { PoolInfo as PoolInfoContract } from "../../generated/templates/PoolTemplate/PoolInfo";
import { Registry as RegistryContract } from "../../generated/templates/PoolTemplate/Registry";
import { Gauge as LiquidityGaugeContract } from "../../generated/templates/LiquidityGauge/Gauge";

export function enumToPrefix(snake: string): string {
  return snake.toLowerCase().replace("_", "-") + "-";
}

export function checkIfPoolExists(poolAddress: Address): boolean {
  let pool = LiquidityPool.load(poolAddress.toHexString());
  if (!pool) {
    return false;
  }
  return true;
}

export function prefixID(enumString: string, ID: string): string {
  return enumToPrefix(enumString) + ID;
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

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function getLpTokenFromPool(poolAddress: Address): Token {
  let lpToken = constants.NULL.TYPE_ADDRESS;

  if (constants.MISSING_LP_TOKENS.has(poolAddress.toHexString())) {
    return getOrCreateTokenFromString(
      constants.MISSING_LP_TOKENS.get(poolAddress.toHexString())
    );
  }

  // Method 1: Pool Info Contract
  const poolInfoContract = PoolInfoContract.bind(
    constants.Mainnet.POOL_INFO_ADDRESS
  );

  let poolInfoCall = poolInfoContract.try_get_pool_info(poolAddress);
  if (!poolInfoCall.reverted) {
    if (poolInfoCall.value.getLp_token().notEqual(constants.NULL.TYPE_ADDRESS))
      return getOrCreateToken(poolInfoCall.value.getLp_token());
  }

  // Method 2: Pool Main Registry --> get_lp_token(poolAddress)
  const registryContract = RegistryContract.bind(
    constants.Mainnet.REGISTRY_ADDRESS
  );
  lpToken = readValue<Address>(
    registryContract.try_get_lp_token(poolAddress),
    constants.NULL.TYPE_ADDRESS
  );
  if (lpToken.notEqual(constants.NULL.TYPE_ADDRESS))
    return getOrCreateToken(lpToken);

  // Method 3: Pool v2 Registry --> get_lp_token(poolAddress)
  const registryContractV2 = RegistryContract.bind(
    constants.Mainnet.REGISTRY_ADDRESS_V2
  );
  lpToken = readValue<Address>(
    registryContractV2.try_get_lp_token(poolAddress),
    constants.NULL.TYPE_ADDRESS
  );
  if (lpToken.notEqual(constants.NULL.TYPE_ADDRESS))
    return getOrCreateToken(lpToken);

  // Method 4: Pool Contract --> lp_token()
  const poolContract = LiquidityPoolContract.bind(poolAddress);
  lpToken = readValue<Address>(
    poolContract.try_lp_token(),
    constants.NULL.TYPE_ADDRESS
  );
  if (lpToken.notEqual(constants.NULL.TYPE_ADDRESS))
    return getOrCreateToken(lpToken);

  // Method 5: Pool Contract --> token()
  lpToken = readValue<Address>(
    poolContract.try_token(),
    constants.NULL.TYPE_ADDRESS
  );
  if (lpToken.notEqual(constants.NULL.TYPE_ADDRESS))
    return getOrCreateToken(lpToken);

  return getOrCreateToken(poolAddress);
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

    if (!checkIfPoolExists(poolAddress)) return poolAddress;
  }

  return constants.NULL.TYPE_ADDRESS;
}

export function getPoolCoins(poolAddress: Address): string[] {
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
        idx = -1;
        continue;
      }
    }

    inputTokens.push(getOrCreateToken(inputToken).id);
    idx += 1;
  }

  return inputTokens;
}

export function getPoolBalances(poolAddress: Address): BigInt[] {
  const curvePool = PoolContract.bind(poolAddress);

  let idx = 0;
  let inputTokenBalances: BigInt[] = [];

  while (idx >= 0) {
    let balance = readValue<BigInt>(
      curvePool.try_balances(BigInt.fromI32(idx)),
      constants.BIGINT_ZERO
    );

    if (balance.equals(constants.BIGINT_ZERO)) {
      balance = readValue<BigInt>(
        curvePool.try_balances1(BigInt.fromI32(idx)),
        constants.BIGINT_ZERO
      );

      if (balance.equals(constants.BIGINT_ZERO)) {
        idx = -1;
        continue;
      }
    }

    inputTokenBalances.push(balance);
    idx += 1;
  }

  return inputTokenBalances;
}

export function getPoolFees(poolAddress: Address): PoolFeesType {
  const curvePool = PoolContract.bind(poolAddress);

  let totalFees = readValue<BigInt>(
    curvePool.try_fee(),
    constants.DEFAULT_POOL_FEE
  );
  let adminFees = readValue<BigInt>(
    curvePool.try_admin_fee(),
    constants.DEFAULT_ADMIN_FEE
  );

  const tradingFeeId =
    enumToPrefix(constants.LiquidityPoolFeeType.FIXED_TRADING_FEE) +
    poolAddress.toHexString();
  let tradingFee = getOrCreateLiquidityPoolFee(
    tradingFeeId,
    constants.LiquidityPoolFeeType.FIXED_TRADING_FEE,
    totalFees
      .divDecimal(constants.FEE_DENOMINATOR)
      .times(constants.BIGDECIMAL_HUNDRED)
  );

  const protocolFeeId =
    enumToPrefix(constants.LiquidityPoolFeeType.FIXED_PROTOCOL_FEE) +
    poolAddress.toHexString();
  let protocolFee = getOrCreateLiquidityPoolFee(
    protocolFeeId,
    constants.LiquidityPoolFeeType.FIXED_PROTOCOL_FEE,
    totalFees
      .times(adminFees)
      .divDecimal(constants.FEE_DENOMINATOR)
      .times(constants.BIGDECIMAL_HUNDRED)
  );

  const lpFeeId =
    enumToPrefix(constants.LiquidityPoolFeeType.FIXED_LP_FEE) +
    poolAddress.toHexString();
  let lpFee = getOrCreateLiquidityPoolFee(
    lpFeeId,
    constants.LiquidityPoolFeeType.FIXED_LP_FEE,
    totalFees
      .minus(adminFees.times(totalFees))
      .divDecimal(constants.FEE_DENOMINATOR)
      .times(constants.BIGDECIMAL_HUNDRED)
  );

  return new PoolFeesType(tradingFee, protocolFee, lpFee);
}

export function getPoolFromLpToken(lpTokenAddress: Address): Address {
  let registryContract = RegistryContract.bind(
    constants.Mainnet.REGISTRY_ADDRESS
  );

  let poolAddress = readValue<Address>(
    registryContract.try_get_pool_from_lp_token(lpTokenAddress),
    constants.NULL.TYPE_ADDRESS
  );

  return poolAddress;
}

export function getOrCreateTokenFromString(tokenAddress: string): Token {
  return getOrCreateToken(Address.fromString(tokenAddress));
}

export function getPoolUnderlyingCoins(poolAddress: Address): Address[] {
  const registryContract = RegistryContract.bind(
    constants.Mainnet.REGISTRY_ADDRESS
  );

  let underlyingCoins = readValue<Address[]>(
    registryContract.try_get_underlying_coins(poolAddress),
    []
  );
  if (underlyingCoins.length != 0) {
    return underlyingCoins;
  }

  const factoryRegistryContract = RegistryContract.bind(
    constants.Mainnet.FACTORY_REGISTRY_ADDRESS
  );

  underlyingCoins = readValue<Address[]>(
    factoryRegistryContract.try_get_underlying_coins(poolAddress),
    []
  );

  return underlyingCoins;
}

export function getLpTokenFromGauge(gaugeAddress: Address): Address {
  let gaugeContract = LiquidityGaugeContract.bind(gaugeAddress);

  let lpToken = readValue<Address>(
    gaugeContract.try_lp_token(),
    constants.NULL.TYPE_ADDRESS
  );

  return lpToken;
}

export function getTokenDecimals(tokenAddr: Address): BigDecimal {
  const token = ERC20Contract.bind(tokenAddr);

  let decimals = readValue<BigInt>(
    token.try_decimals(),
    constants.DEFAULT_DECIMALS
  );

  return constants.BIGINT_TEN.pow(decimals.toI32() as u8).toBigDecimal();
}

export function getPoolTokenWeights(
  inputTokens: string[],
  inputTokenBalances: BigInt[],
  totalValueLockedUSD: BigDecimal
): BigDecimal[] {
  let inputTokenWeights: BigDecimal[] = [];

  for (let idx = 0; idx < inputTokens.length; idx++) {
    if (totalValueLockedUSD == constants.BIGDECIMAL_ZERO) {
      inputTokenWeights.push(constants.BIGDECIMAL_ZERO);
      continue;
    }

    let balance = inputTokenBalances[idx];
    let tokenAddress = Address.fromString(inputTokens[idx]);

    let tokenDecimals = getTokenDecimals(tokenAddress);
    let tokenPriceUSD = getUsdPricePerToken(tokenAddress);

    let balanceUSD = balance
      .divDecimal(tokenDecimals)
      .times(tokenPriceUSD.usdPrice)
      .div(tokenPriceUSD.decimalsBaseTen);
    let weight = balanceUSD.div(totalValueLockedUSD);

    inputTokenWeights.push(weight);
  }

  return inputTokenWeights;
}

export function getPoolTVL(
  inputTokens: string[],
  inputTokenBalances: BigInt[]
): BigDecimal {
  let totalValueLockedUSD = constants.BIGDECIMAL_ZERO;

  for (let idx = 0; idx < inputTokens.length; idx++) {
    let inputTokenBalance = inputTokenBalances[idx];

    let inputTokenAddress = Address.fromString(inputTokens[idx]);
    let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
    let inputTokenDecimals = getTokenDecimals(inputTokenAddress);

    let amountUSD = inputTokenBalance
      .divDecimal(inputTokenDecimals)
      .times(inputTokenPrice.usdPrice)
      .div(inputTokenPrice.decimalsBaseTen);

    totalValueLockedUSD = totalValueLockedUSD.plus(amountUSD);
  }

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
