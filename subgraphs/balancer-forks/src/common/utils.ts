import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
  Bytes,
} from "@graphprotocol/graph-ts";
import { PoolFeesType, PoolTokensType } from "./types";
import { getUsdPricePerToken } from "../prices";
import * as constants from "../common/constants";
import { Token, LiquidityPool } from "../../generated/schema";
import { Vault as VaultContract } from "../../generated/Vault/Vault";
import { ERC20 as ERC20Contract } from "../../generated/Vault/ERC20";
import {
  getOrCreateToken,
  getOrCreateDexAmmProtocol,
  getOrCreateLiquidityPoolFee,
} from "./initializers";
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

export function getOrCreateTokenFromString(tokenAddress: string): Token {
  return getOrCreateToken(Address.fromString(tokenAddress));
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

export function calculateAverage(prices: BigDecimal[]): BigDecimal {
  let sum = BigDecimal.fromString("0");
  for (let i = 0; i < prices.length; i++) {
    sum = sum.plus(prices[i]);
  }

  return sum.div(
    BigDecimal.fromString(BigInt.fromI32(prices.length).toString())
  );
}

export function getPoolTokenWeights(poolAddress: Address): BigDecimal[] {
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
