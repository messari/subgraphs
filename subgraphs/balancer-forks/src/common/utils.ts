import {
  BigInt,
  Address,
  ethereum,
  BigDecimal,
  Bytes,
} from "@graphprotocol/graph-ts";
import {
  getOrCreateToken,
  getOrCreateLiquidityPool,
  getOrCreateDexAmmProtocol,
  getOrCreateLiquidityPoolFee,
} from "./initializers";
import * as constants from "../common/constants";
import { PoolFeesType, PoolTokensType } from "./types";
import { Token, LiquidityPool } from "../../generated/schema";
import { Vault as VaultContract } from "../../generated/Vault/Vault";
import { ERC20 as ERC20Contract } from "../../generated/Vault/ERC20";
import { WeightedPool as WeightedPoolContract } from "../../generated/templates/WeightedPool/WeightedPool";
import { FeesCollector as FeesCollectorContract } from "../../generated/templates/WeightedPool/FeesCollector";

export function enumToPrefix(snake: string): string {
  return snake.toLowerCase().replace("_", "-") + "-";
}

export function prefixID(enumString: string, ID: string): string {
  return enumToPrefix(enumString) + ID;
}

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function getOrCreateTokenFromString(
  tokenAddress: string,
  blockNumber: BigInt
): Token {
  return getOrCreateToken(Address.fromString(tokenAddress), blockNumber);
}

export function getTokenDecimals(tokenAddr: Address): BigDecimal {
  const token = ERC20Contract.bind(tokenAddr);

  let decimals = readValue<BigInt>(
    token.try_decimals(),
    constants.DEFAULT_DECIMALS
  );

  return constants.BIGINT_TEN.pow(decimals.toI32() as u8).toBigDecimal();
}

export function getPoolTokensInfo(poolId: Bytes): PoolTokensType {
  const vaultContract = VaultContract.bind(constants.VAULT_ADDRESS);

  let poolTokens = vaultContract.try_getPoolTokens(poolId);

  if (poolTokens.reverted) return new PoolTokensType();

  return new PoolTokensType(
    poolTokens.value.getTokens(),
    poolTokens.value.getBalances()
  );
}

export function getOutputTokenPriceUSD(
  poolAddress: Address,
  block: ethereum.Block
): BigDecimal {
  const pool = getOrCreateLiquidityPool(poolAddress, block);

  if (pool.outputTokenSupply!.equals(constants.BIGINT_ZERO))
    return constants.BIGDECIMAL_ZERO;

  let outputToken = getOrCreateToken(poolAddress, block.number);

  let outputTokenSupply = pool.outputTokenSupply!.divDecimal(
    constants.BIGINT_TEN.pow(outputToken.decimals as u8).toBigDecimal()
  );
  let outputTokenPriceUSD = pool.totalValueLockedUSD.div(outputTokenSupply);

  outputToken.lastPriceUSD = outputTokenPriceUSD;
  outputToken.save();

  return outputTokenPriceUSD;
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

export function getPoolTokenWeightsForDynamicWeightPools(
  poolAddress: Address
): BigDecimal[] {
  const poolContract = WeightedPoolContract.bind(poolAddress);

  let scales = readValue<BigInt[]>(poolContract.try_getScalingFactors(), []);
  let totalScale = scales
    .reduce<BigInt>((sum, current) => sum.plus(current), constants.BIGINT_ZERO)
    .toBigDecimal();

  let inputTokenWeights: BigDecimal[] = [];
  for (let idx = 0; idx < scales.length; idx++) {
    inputTokenWeights.push(
      scales.at(idx).divDecimal(totalScale).times(constants.BIGDECIMAL_HUNDRED)
    );
  }

  return inputTokenWeights;
}

export function getPoolTokenWeightsForNormalizedPools(
  poolAddress: Address
): BigDecimal[] {
  const poolContract = WeightedPoolContract.bind(poolAddress);

  let weights = readValue<BigInt[]>(
    poolContract.try_getNormalizedWeights(),
    []
  );

  let inputTokenWeights: BigDecimal[] = [];
  for (let idx = 0; idx < weights.length; idx++) {
    inputTokenWeights.push(
      weights
        .at(idx)
        .divDecimal(
          constants.BIGINT_TEN.pow(
            constants.DEFAULT_DECIMALS.toI32() as u8
          ).toBigDecimal()
        )
        .times(constants.BIGDECIMAL_HUNDRED)
    );
  }

  return inputTokenWeights;
}

export function getPoolTokenWeights(poolAddress: Address): BigDecimal[] {
  let inputTokenWeights = getPoolTokenWeightsForNormalizedPools(poolAddress);
  if (inputTokenWeights.length > 0) return inputTokenWeights;

  inputTokenWeights = getPoolTokenWeightsForDynamicWeightPools(poolAddress);

  return inputTokenWeights;
}

export function getPoolTVL(
  inputTokens: string[],
  inputTokenBalances: BigInt[],
  block: ethereum.Block
): BigDecimal {
  let totalValueLockedUSD = constants.BIGDECIMAL_ZERO;

  for (let idx = 0; idx < inputTokens.length; idx++) {
    let inputTokenBalance = inputTokenBalances[idx];

    let inputToken = getOrCreateTokenFromString(inputTokens[idx], block.number);

    let amountUSD = inputTokenBalance
      .divDecimal(
        constants.BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal()
      )
      .times(inputToken.lastPriceUSD!);
    totalValueLockedUSD = totalValueLockedUSD.plus(amountUSD);
  }

  return totalValueLockedUSD;
}

export function getOutputTokenSupply(
  poolAddress: Address,
  oldSupply: BigInt
): BigInt {
  let poolContract = WeightedPoolContract.bind(poolAddress);

  let totalSupply = readValue<BigInt>(
    poolContract.try_totalSupply(),
    oldSupply
  );

  if (poolAddress.equals(constants.AAVE_BOOSTED_POOL_ADDRESS)) {
    // Exception: Aave Boosted Pool
    // since this pool pre-mints all BPT, `totalSupply` * remains constant,
    // whereas`getVirtualSupply` increases as users join the pool and decreases as they exit it

    totalSupply = readValue<BigInt>(
      poolContract.try_getVirtualSupply(),
      oldSupply
    );
  }

  return totalSupply;
}

export function getPoolFees(poolAddress: Address): PoolFeesType {
  const poolContract = WeightedPoolContract.bind(poolAddress);

  let swapFee = readValue<BigInt>(
    poolContract.try_getSwapFeePercentage(),
    constants.BIGINT_ZERO
  );

  const tradingFeeId =
    enumToPrefix(constants.LiquidityPoolFeeType.FIXED_TRADING_FEE) +
    poolAddress.toHexString();
  let tradingFee = getOrCreateLiquidityPoolFee(
    tradingFeeId,
    constants.LiquidityPoolFeeType.FIXED_TRADING_FEE,
    swapFee
      .divDecimal(constants.FEE_DENOMINATOR)
      .times(constants.BIGDECIMAL_HUNDRED)
  );

  const feesCollectorContract = FeesCollectorContract.bind(
    constants.PROTOCOL_FEES_COLLECTOR_ADDRESS
  );

  let protocolFees = readValue<BigInt>(
    feesCollectorContract.try_getSwapFeePercentage(),
    constants.BIGINT_ZERO
  );

  const protocolFeeId =
    enumToPrefix(constants.LiquidityPoolFeeType.FIXED_PROTOCOL_FEE) +
    poolAddress.toHexString();
  let protocolFee = getOrCreateLiquidityPoolFee(
    protocolFeeId,
    constants.LiquidityPoolFeeType.FIXED_PROTOCOL_FEE,
    protocolFees
      .divDecimal(constants.FEE_DENOMINATOR)
      .times(constants.BIGDECIMAL_HUNDRED)
  );

  const lpFeeId =
    enumToPrefix(constants.LiquidityPoolFeeType.FIXED_LP_FEE) +
    poolAddress.toHexString();
  let lpFee = getOrCreateLiquidityPoolFee(
    lpFeeId,
    constants.LiquidityPoolFeeType.FIXED_LP_FEE,
    protocolFees
      .divDecimal(constants.FEE_DENOMINATOR)
      .times(constants.BIGDECIMAL_HUNDRED)
  );

  return new PoolFeesType(tradingFee, protocolFee, lpFee);
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

// convert decimals
export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bd = constants.BIGDECIMAL_ONE;
  for (
    let i = constants.INT_ZERO;
    i < (decimals as i32);
    i = i + constants.INT_ONE
  ) {
    bd = bd.times(constants.BIGDECIMAL_TEN);
  }
  return bd;
}

// convert emitted values to tokens count
export function convertTokenToDecimal(
  tokenAmount: BigInt,
  exchangeDecimals: i32
): BigDecimal {
  if (exchangeDecimals == constants.INT_ZERO) {
    return tokenAmount.toBigDecimal();
  }

  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals));
}

// Round BigDecimal to whole number
export function roundToWholeNumber(n: BigDecimal): BigDecimal {
  return n.truncate(0);
}
