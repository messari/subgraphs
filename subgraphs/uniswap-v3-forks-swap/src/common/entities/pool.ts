import { Address, Bytes, ethereum } from "@graphprotocol/graph-ts";

import {
  BIGDECIMAL_ZERO,
  BIGDECIMAL_FIFTY,
  BIGINT_ZERO,
  INT_ONE,
  INT_ZERO,
  TokenType,
} from "../constants";
import { convertFeeToPercent } from "../utils";
import { getOrCreateProtocol } from "./protocol";
import { getOrCreateToken } from "./token";

import { LiquidityPool } from "../../../generated/schema";
import { Pool as PoolTemplate } from "../../../generated/templates";

// Create a liquidity pool from pairCreated event.
export function createLiquidityPool(
  event: ethereum.Event,
  poolAddress: Address,
  token0Address: Address,
  token1Address: Address,
  fees: i32
): void {
  const protocol = getOrCreateProtocol();

  // create the tokens and tokentracker
  const token0 = getOrCreateToken(token0Address);
  const token1 = getOrCreateToken(token1Address);

  const pool = new LiquidityPool(poolAddress);
  pool.protocol = protocol.id;
  pool.name =
    protocol.name +
    " " +
    token0.name +
    "/" +
    token1.name +
    " " +
    convertFeeToPercent(fees).toString() +
    "%";
  pool.symbol = token0.name + "/" + token1.name;
  pool.inputTokens = [token0.id, token1.id];
  pool.inputTokenWeights = [BIGDECIMAL_FIFTY, BIGDECIMAL_FIFTY];

  pool.fees = [];
  pool.isSingleSided = false;
  pool.createdTimestamp = event.block.timestamp;
  pool.createdBlockNumber = event.block.number;

  pool.liquidityToken = null;
  pool.liquidityTokenType = TokenType.MULTIPLE;

  pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
  pool.totalLiquidity = BIGINT_ZERO;
  pool.totalLiquidityUSD = BIGDECIMAL_ZERO;
  pool.activeLiquidity = BIGINT_ZERO;
  pool.activeLiquidityUSD = BIGDECIMAL_ZERO;

  pool.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
  pool.inputTokenBalancesUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

  pool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
  pool.cumulativeVolumeByTokenAmount = [BIGINT_ZERO, BIGINT_ZERO];
  pool.cumulativeVolumeByTokenUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

  pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

  pool.uncollectedProtocolSideTokenAmounts = [BIGINT_ZERO, BIGINT_ZERO];
  pool.uncollectedProtocolSideValuesUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
  pool.uncollectedSupplySideTokenAmounts = [BIGINT_ZERO, BIGINT_ZERO];
  pool.uncollectedSupplySideValuesUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

  pool.cumulativeDepositCount = INT_ZERO;
  pool.cumulativeWithdrawCount = INT_ZERO;
  pool.cumulativeSwapCount = INT_ZERO;

  pool.positionCount = INT_ZERO;
  pool.openPositionCount = INT_ZERO;
  pool.closedPositionCount = INT_ZERO;

  pool.lastSnapshotDayID = INT_ZERO;
  pool.lastSnapshotHourID = INT_ZERO;
  pool.lastUpdateBlockNumber = event.block.number;
  pool.lastUpdateTimestamp = event.block.timestamp;

  protocol.totalPoolCount = protocol.totalPoolCount + INT_ONE;

  // Create and track the newly created pool contract based on the template specified in the subgraph.yaml file.
  PoolTemplate.create(poolAddress);

  protocol.save();
  pool.save();
}

export function getLiquidityPool(poolAddress: Bytes): LiquidityPool | null {
  return LiquidityPool.load(poolAddress);
}
