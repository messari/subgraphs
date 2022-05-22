import {
  BigDecimal,
  BigInt,
  ethereum,
  Address,
  log,
} from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../config/configure";

import { PoolManager } from "../../../../generated/PoolManager/PoolManager";
import { StakingRewards } from "../../../../generated/templates/StakingRewards/StakingRewards";
import {
  DexAmmProtocol,
  LiquidityPool,
  _HelperStore,
  _LiquidityPoolAmount,
} from "../../../../generated/schema";
import { StakingRewards as StakingRewardsTemplate } from "../../../../generated/templates";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_TWO,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ZERO,
} from "../../constants";
import { getOrCreateDex, getOrCreateToken } from "../../getters";

export function handleUpdatePoolWeightImpl(event: ethereum.Event): void {
  const poolManager = PoolManager.bind(event.address);
  const poolsCount = poolManager.try_poolsCount();

  const protocol = getOrCreateDex();
  for (let index: i32 = 0; index < poolsCount.value.toI32(); index++) {
    const pooladdress = poolManager.poolsByIndex(BigInt.fromI32(index));
    getOrCreateStackPool(event, protocol, pooladdress);
  }
}

export function getOrCreateStackPool(
  event: ethereum.Event,
  protocol: DexAmmProtocol,
  poolAddress: Address
): void {
  let pool = LiquidityPool.load(poolAddress.toHexString());
  if (!pool) {
    const stakingRewards = StakingRewards.bind(poolAddress);
    let LPtokenAddress = stakingRewards.stakingToken();
    pool = new LiquidityPool(poolAddress.toHexString());
    let poolAmounts = new _LiquidityPoolAmount(poolAddress.toHexString());
    let LPtoken = getOrCreateToken(LPtokenAddress.toHexString());
    pool.protocol = protocol.id;
    pool.inputTokens = [LPtoken.id];
    pool.outputToken = NetworkConfigs.getRewardToken();
    pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    pool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    pool.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
    pool.inputTokenWeights = [
      BIGDECIMAL_ONE.div(BIGDECIMAL_TWO),
      BIGDECIMAL_ONE.div(BIGDECIMAL_TWO),
    ];
    pool.outputTokenSupply = BIGINT_ZERO;
    pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    pool.rewardTokens = [NetworkConfigs.getRewardToken()];
    pool.stakedOutputTokenAmount = BIGINT_ZERO;
    pool.rewardTokenEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
    pool.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    pool.createdTimestamp = event.block.timestamp;
    pool.createdBlockNumber = event.block.number;
    pool.name = protocol.name + " " + LPtoken.symbol;
    pool.symbol = LPtoken.symbol;
    poolAmounts.inputTokens = [LPtoken.id];
    poolAmounts.inputTokenBalances = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    // Used to track the number of deposits in a liquidity pool
    let poolDeposits = new _HelperStore(poolAddress.toHexString());
    poolDeposits.valueInt = INT_ZERO;

    // create the tracked contract based on the template
    StakingRewardsTemplate.create(poolAddress);

    pool.save();
    LPtoken.save();
    poolAmounts.save();
    poolDeposits.save();
  }
}
