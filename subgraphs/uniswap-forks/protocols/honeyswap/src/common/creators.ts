import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  _HelperStore,
  _LiquidityPoolAmount,
  LiquidityPool,
  LiquidityPoolFee,
} from "../../../../generated/schema";
import { Pair as PairTemplate } from "../../../../generated/templates";
import {
  BIGDECIMAL_ZERO,
  INT_ZERO,
  BIGINT_ZERO,
  LiquidityPoolFeeType,
  FeeSwitch,
  BIGDECIMAL_TWO,
  BIGDECIMAL_ONE,
} from "../../../../src/common/constants";
import { createPoolFees } from "../../../../src/common/creators";
import {
  getOrCreateToken,
  getOrCreateLPToken,
  getOrCreateRewardToken,
  getLiquidityPool,
  getOrCreateProtocol,
} from "../../../../src/common/getters";
import { updateTokenWhitelists } from "../../../../src/common/updateMetrics";
import { NetworkConfigs } from "../../../../configurations/configure";

// Create a liquidity pool from PairCreated contract call (for WETH pairs on Polygon)
function createHalvedPoolFees(
  poolAddress: string,
  blockNumber: BigInt
): string[] {
  const poolLpFee = new LiquidityPoolFee(poolAddress.concat("-lp-fee"));
  const poolProtocolFee = new LiquidityPoolFee(
    poolAddress.concat("-protocol-fee")
  );
  const poolTradingFee = new LiquidityPoolFee(
    poolAddress.concat("-trading-fee")
  );

  poolLpFee.feeType = LiquidityPoolFeeType.FIXED_LP_FEE;
  poolProtocolFee.feeType = LiquidityPoolFeeType.FIXED_PROTOCOL_FEE;
  poolTradingFee.feeType = LiquidityPoolFeeType.FIXED_TRADING_FEE;

  if (NetworkConfigs.getFeeOnOff() == FeeSwitch.ON) {
    poolLpFee.feePercentage =
      NetworkConfigs.getLPFeeToOn(blockNumber).div(BIGDECIMAL_TWO);
    poolProtocolFee.feePercentage =
      NetworkConfigs.getProtocolFeeToOn(blockNumber).div(BIGDECIMAL_TWO);
  } else {
    poolLpFee.feePercentage =
      NetworkConfigs.getLPFeeToOff().div(BIGDECIMAL_TWO);
    poolProtocolFee.feePercentage =
      NetworkConfigs.getProtocolFeeToOff().div(BIGDECIMAL_TWO);
  }

  poolTradingFee.feePercentage =
    NetworkConfigs.getTradeFee(blockNumber).div(BIGDECIMAL_TWO);

  poolLpFee.save();
  poolProtocolFee.save();
  poolTradingFee.save();

  return [poolLpFee.id, poolProtocolFee.id, poolTradingFee.id];
}

// Create a liquidity pool from PairCreated contract call
export function createLiquidityPool(
  event: ethereum.Event,
  poolAddress: string,
  token0Address: string,
  token1Address: string
): void {
  const protocol = getOrCreateProtocol();

  // create the tokens and tokentracker
  const token0 = getOrCreateToken(token0Address);
  const token1 = getOrCreateToken(token1Address);
  const LPtoken = getOrCreateLPToken(poolAddress, token0, token1);

  updateTokenWhitelists(token0, token1, poolAddress);

  const pool = new LiquidityPool(poolAddress);
  const poolAmounts = new _LiquidityPoolAmount(poolAddress);

  pool.protocol = protocol.id;
  pool.inputTokens = [token0.id, token1.id];
  pool.outputToken = LPtoken.id;
  pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
  pool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
  pool.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
  pool.inputTokenWeights = [
    BIGDECIMAL_ONE.div(BIGDECIMAL_TWO),
    BIGDECIMAL_ONE.div(BIGDECIMAL_TWO),
  ];
  pool.outputTokenSupply = BIGINT_ZERO;
  pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  pool.rewardTokens = [];
  pool.stakedOutputTokenAmount = BIGINT_ZERO;
  pool.rewardTokenEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
  pool.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
  pool.isSingleSided = false;
  pool.createdTimestamp = event.block.timestamp;
  pool.createdBlockNumber = event.block.number;
  pool.name = protocol.name + " " + LPtoken.symbol;
  pool.symbol = LPtoken.symbol;

  poolAmounts.inputTokens = [token0.id, token1.id];
  poolAmounts.inputTokenBalances = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

  // Halve pool fees for WETH pairs
  if (
    NetworkConfigs.getReferenceToken() == token0Address ||
    NetworkConfigs.getReferenceToken() == token1Address
  ) {
    pool.fees = createHalvedPoolFees(poolAddress, event.block.number);
  } else {
    pool.fees = createPoolFees(poolAddress, event.block.number);
  }

  // Used to track the number of deposits in a liquidity pool
  const poolDeposits = new _HelperStore(poolAddress);
  poolDeposits.valueInt = INT_ZERO;

  // update number of pools
  protocol.totalPoolCount += 1;
  protocol.save();

  // create the tracked contract based on the template
  PairTemplate.create(Address.fromString(poolAddress));

  pool.save();
  token0.save();
  token1.save();
  LPtoken.save();
  poolAmounts.save();
  poolDeposits.save();
}

// Add reward token to liquidity pool from HoneyFarm add contract call (PoolAdded event)
export function createPoolRewardToken(
  poolAddress: string,
  blockNumber: BigInt
): void {
  const pool = getLiquidityPool(poolAddress, blockNumber);

  pool.rewardTokens = [
    getOrCreateRewardToken(NetworkConfigs.getRewardToken()).id,
  ];

  pool.save();
}

// Remove reward token from liquidity pool from HoneyFarm set contract call (PoolRemoved event)
export function removePoolRewardToken(
  poolAddress: string,
  blockNumber: BigInt
): void {
  const pool = getLiquidityPool(poolAddress, blockNumber);

  pool.rewardTokens = [];

  pool.save();
}
