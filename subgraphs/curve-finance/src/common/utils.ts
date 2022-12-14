import {
  BigInt,
  Address,
  ethereum,
  BigDecimal,
  dataSource,
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

  const decimals = readValue<BigInt>(
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

export function sortByInputTokenOrder(
  pool: LiquidityPool,
  arr: BigInt[]
): BigInt[] {
  const ordered = new Array<BigInt>(arr.length).fill(constants.BIGINT_ZERO);

  for (let i = 0; i < arr.length; i++) {
    const newIndex = pool.inputTokens.indexOf(pool._inputTokensOrdered[i]);
    ordered[newIndex] = arr[i];
  }

  return ordered;
}

export function sortRewardTokens(pool: LiquidityPool): void {
  if (pool.rewardTokens!.length <= 1) {
    return;
  }

  const rewardTokens = pool.rewardTokens;
  const rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  const rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
  multiArraySort(
    rewardTokens!,
    rewardTokenEmissionsAmount!,
    rewardTokenEmissionsUSD!
  );

  pool.rewardTokens = rewardTokens;
  pool.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
  pool.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;
}

export function multiArraySort(
  ref: Array<string>,
  arr1: Array<BigInt>,
  arr2: Array<BigDecimal>
): void {
  if (ref.length != arr1.length || ref.length != arr2.length) {
    // cannot sort
    return;
  }

  const sorter: Array<Array<string>> = [];
  for (let i = 0; i < ref.length; i++) {
    sorter[i] = [ref[i], arr1[i].toString(), arr2[i].toString()];
  }

  sorter.sort(function (a: Array<string>, b: Array<string>): i32 {
    if (a[0] < b[0]) {
      return -1;
    }
    return 1;
  });

  for (let i = 0; i < sorter.length; i++) {
    ref[i] = sorter[i][0];
    arr1[i] = BigInt.fromString(sorter[i][1]);
    arr2[i] = BigDecimal.fromString(sorter[i][2]);
  }
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

  const lpToken = readValue<Address>(
    registryContract.try_get_lp_token(poolAddress),
    constants.NULL.TYPE_ADDRESS
  );
  if (lpToken.equals(constants.NULL.TYPE_ADDRESS)) return null;

  return getOrCreateToken(lpToken, block);
}

export function getPoolFromCoins(
  registryAddress: Address,
  coins: Address[]
): Address | null {
  const registryContract = RegistryContract.bind(registryAddress);

  if (coins.length < 2) return null;

  for (let idx = 0; idx <= 8; idx++) {
    const poolAddress = readValue<Address>(
      registryContract.try_find_pool_for_coins1(
        coins.at(0),
        coins.at(1),
        BigInt.fromI32(idx)
      ),
      constants.NULL.TYPE_ADDRESS
    );

    if (poolAddress.equals(constants.NULL.TYPE_ADDRESS)) return null;
    if (isPoolRegistered(poolAddress)) continue;

    return poolAddress;
  }

  return null;
}

export function getPoolCoins(
  poolAddress: Address,
  block: ethereum.Block
): string[] {
  const curvePool = PoolContract.bind(poolAddress);

  let idx = 0;
  const inputTokens: string[] = [];

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

export function getPoolUnderlyingCoins(poolAddress: Address): Address[] {
  let underlyingCoins: Address[] = [];

  for (let i = 0; i < constants.POOL_REGISTRIES.length; i++) {
    const registryAddress = constants.POOL_REGISTRIES[i];
    const registryContract = RegistryContract.bind(registryAddress);

    underlyingCoins = readValue<Address[]>(
      registryContract.try_get_underlying_coins(poolAddress),
      []
    );

    if (underlyingCoins.length != 0) return underlyingCoins;
  }

  return underlyingCoins;
}

export function getPoolUnderlyingCoinsFromRegistry(
  poolAddress: Address,
  registryAddress: Address
): Address[] {
  if (registryAddress.equals(constants.NULL.TYPE_ADDRESS)) {
    return getPoolUnderlyingCoins(poolAddress);
  }

  const registryContract = RegistryContract.bind(registryAddress);

  const underlyingCoins = readValue<Address[]>(
    registryContract.try_get_underlying_coins(poolAddress),
    []
  );

  return underlyingCoins;
}

export function getPoolBalances(pool: LiquidityPool): BigInt[] {
  const curvePool = PoolContract.bind(Address.fromString(pool.id));

  const inputTokenBalances: BigInt[] = [];
  for (let idx = 0; idx < pool.inputTokens.length; idx++) {
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

  return sortByInputTokenOrder(pool, inputTokenBalances);
}

export function getPoolTVLUsingInputTokens(
  inputTokens: string[],
  inputTokenBalances: BigInt[],
  block: ethereum.Block
): BigDecimal {
  let totalValueLockedUSD = constants.BIGDECIMAL_ZERO;

  for (let idx = 0; idx < inputTokens.length; idx++) {
    const balance = inputTokenBalances[idx];
    const inputToken = getOrCreateTokenFromString(inputTokens[idx], block);

    const balanceUSD = balance
      .divDecimal(
        constants.BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal()
      )
      .times(inputToken.lastPriceUSD!);

    totalValueLockedUSD = totalValueLockedUSD.plus(balanceUSD);
  }

  return totalValueLockedUSD;
}

export function getPoolTokenWeights(
  inputTokens: string[],
  inputTokenBalances: BigInt[],
  block: ethereum.Block
): BigDecimal[] {
  const totalValueLockedUSD = getPoolTVLUsingInputTokens(
    inputTokens,
    inputTokenBalances,
    block
  );

  const inputTokenWeights: BigDecimal[] = [];
  for (let idx = 0; idx < inputTokens.length; idx++) {
    if (totalValueLockedUSD == constants.BIGDECIMAL_ZERO) {
      inputTokenWeights.push(constants.BIGDECIMAL_ZERO);
      continue;
    }

    const balance = inputTokenBalances[idx];
    const inputToken = getOrCreateTokenFromString(inputTokens[idx], block);

    const balanceUSD = balance
      .divDecimal(
        constants.BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal()
      )
      .times(inputToken.lastPriceUSD!);
    const weight = balanceUSD
      .div(totalValueLockedUSD)
      .times(constants.BIGDECIMAL_HUNDRED);

    inputTokenWeights.push(weight);
  }

  return inputTokenWeights;
}

export function getPoolFees(poolAddress: Address): PoolFeesType {
  const curvePool = PoolContract.bind(poolAddress);

  const totalFees = readValue<BigInt>(
    curvePool.try_fee(),
    constants.DEFAULT_POOL_FEE
  ).divDecimal(constants.FEE_DENOMINATOR);
  const adminFees = readValue<BigInt>(
    curvePool.try_admin_fee(),
    constants.DEFAULT_ADMIN_FEE
  ).divDecimal(constants.FEE_DENOMINATOR);

  const tradingFeeId =
    enumToPrefix(constants.LiquidityPoolFeeType.FIXED_TRADING_FEE) +
    poolAddress.toHexString();
  const tradingFee = getOrCreateLiquidityPoolFee(
    tradingFeeId,
    constants.LiquidityPoolFeeType.FIXED_TRADING_FEE,
    totalFees.times(constants.BIGDECIMAL_HUNDRED)
  );

  const protocolFeeId =
    enumToPrefix(constants.LiquidityPoolFeeType.FIXED_PROTOCOL_FEE) +
    poolAddress.toHexString();
  const protocolFee = getOrCreateLiquidityPoolFee(
    protocolFeeId,
    constants.LiquidityPoolFeeType.FIXED_PROTOCOL_FEE,
    totalFees.times(adminFees).times(constants.BIGDECIMAL_HUNDRED)
  );

  const lpFeeId =
    enumToPrefix(constants.LiquidityPoolFeeType.FIXED_LP_FEE) +
    poolAddress.toHexString();
  const lpFee = getOrCreateLiquidityPoolFee(
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
  if (poolAddress.notEqual(constants.NULL.TYPE_ADDRESS)) return poolAddress;

  const registryAddress = Address.fromString(lpTokenStore.registryAddress);
  if (registryAddress.equals(constants.NULL.TYPE_ADDRESS)) return lpToken;

  const registryContract = RegistryContract.bind(registryAddress);

  poolAddress = readValue<Address>(
    registryContract.try_get_pool_from_lp_token(lpToken),
    lpToken
  );

  return poolAddress;
}

export function getLpTokenFromGauge(gaugeAddress: Address): Address {
  const gaugeContract = LiquidityGaugeContract.bind(gaugeAddress);

  const lpToken = readValue<Address>(
    gaugeContract.try_lp_token(),
    constants.NULL.TYPE_ADDRESS
  );

  return lpToken;
}

export function getPoolFromGauge(gaugeAddress: Address): Address {
  const lpToken = getLpTokenFromGauge(gaugeAddress);

  let poolAddress: Address = constants.NULL.TYPE_ADDRESS;

  for (let i = 0; i < constants.POOL_REGISTRIES.length; i++) {
    const registryAddress = constants.POOL_REGISTRIES[i];
    const registryContract = RegistryContract.bind(registryAddress);

    poolAddress = readValue<Address>(
      registryContract.try_get_pool_from_lp_token(lpToken),
      constants.NULL.TYPE_ADDRESS
    );

    if (poolAddress.notEqual(constants.NULL.TYPE_ADDRESS)) return poolAddress;
  }

  const context = dataSource.context();
  poolAddress = Address.fromString(context.getString("poolAddress"));

  return poolAddress;
}

export function getPoolTVL(
  outputToken: Token,
  outputTokenBalance: BigInt
): BigDecimal {
  const totalValueLockedUSD = outputTokenBalance
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

  const outputTokenSupply = readValue<BigInt>(
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

  const poolIds = protocol._poolIds;
  poolIds.push(poolAddress.toHexString());
  protocol._poolIds = poolIds;

  protocol.totalPoolCount += 1;

  protocol.save();
}
