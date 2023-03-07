import { LiquidityPool, Token } from "../../generated/schema";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ZERO,
} from "../common/constants";
import { getOrCreateOpynProtocol } from "./protocol";

export function getOrCreatePool(token: Token): LiquidityPool {
  let pool = LiquidityPool.load(token.id);
  if (!pool) {
    pool = new LiquidityPool(token.id);
    pool.protocol = getOrCreateOpynProtocol().id;
    pool.name = token.name;
    pool.symbol = token.symbol;
    pool.inputTokens = [token.id];
    pool.outputToken = null;
    pool.rewardTokens = null;
    pool.fees = [];
    pool.oracle = null;
    pool.createdTimestamp = BIGINT_ZERO;
    pool.createdBlockNumber = BIGINT_ZERO;
    pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeEntryPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeExitPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeTotalPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeDepositPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeWithdrawPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeTotalLiquidityPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    pool.cumulativeExercisedVolumeUSD = BIGDECIMAL_ZERO;
    pool.cumulativeClosedVolumeUSD = BIGDECIMAL_ZERO;
    pool.openInterestUSD = INT_ZERO;
    pool.putsMintedCount = INT_ZERO;
    pool.callsMintedCount = INT_ZERO;
    pool.contractsMintedCount = INT_ZERO;
    pool.contractsTakenCount = INT_ZERO;
    pool.contractsExercisedCount = INT_ZERO;
    pool.contractsClosedCount = INT_ZERO;
    pool.openPositionCount = INT_ZERO;
    pool.closedPositionCount = INT_ZERO;
    pool.inputTokenBalances = [BIGINT_ZERO];
    pool.inputTokenWeights = [BIGDECIMAL_ONE];
    pool.outputTokenSupply = null;
    pool.outputTokenPriceUSD = null;
    pool.stakedOutputTokenAmount = null;
    pool.rewardTokenEmissionsAmount = null;
    pool.rewardTokenEmissionsUSD = null;
    pool.save();
  }
  return pool;
}
