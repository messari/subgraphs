import {
  BigInt,
  ethereum,
  Address,
  log,
} from "@graphprotocol/graph-ts";
import { getNetworkConfigurations } from "../../../../../configurations/configurations/configurations";
import { Deploy } from "../../../../../configurations/configurations/deploy";

import { PoolManager } from "../../../../../generated/PoolManager/PoolManager";
import { StakingRewards } from "../../../../../generated/templates/StakingRewards/StakingRewards";
import {
  DexAmmProtocol,
  LiquidityPool,
  _HelperStore,
  _LiquidityPoolAmount,
} from "../../../../../generated/schema";
import { StakingRewards as StakingRewardsTemplate } from "../../../../../generated/templates";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ZERO,
} from "../../../../../src/common/constants";
import { getOrCreateDex } from "../../../../../src/common/getters";
import { getOrCreatePair } from "./handleReward";

export function handleUpdatePoolWeightImpl(event: ethereum.Event): void {
  const poolManager = PoolManager.bind(event.address);
  const poolsCount = poolManager.try_poolsCount();
  if (poolsCount.reverted) {
    return
  }
  const protocol = getOrCreateDex();
  for (let index: i32 = 0; index < poolsCount.value.toI32(); index++) {
    const stackTokenAddress = poolManager.poolsByIndex(BigInt.fromI32(index));
    const poolInfo = poolManager.try_pools(stackTokenAddress);
    if (poolInfo.reverted) {
      return
    }
    // poolInfo.value.value2  is poolAddress
    getOrCreateStackPool(event, protocol, poolInfo.value.value2, stackTokenAddress);
  }
}

export function getOrCreateStackPool(
  event: ethereum.Event,
  protocol: DexAmmProtocol,
  poolAddress: Address,
  stackTokenAddress: Address
): void {
  let pool = LiquidityPool.load(poolAddress.toHexString());
  if (!pool) {
    const stakingRewards = StakingRewards.bind(poolAddress);
    pool = new LiquidityPool(poolAddress.toHexString());
    let poolAmounts = new _LiquidityPoolAmount(poolAddress.toHexString());
    pool.name = protocol.name;
    let LPtoken = getOrCreatePair(stackTokenAddress.toHexString());
    
    pool.inputTokens = [LPtoken.id];
    pool.name = protocol.name + " " + LPtoken.symbol;
    pool.symbol = LPtoken.symbol;
    poolAmounts.inputTokens = [LPtoken.id];
    
    pool.protocol = protocol.id;
    pool.outputToken = getNetworkConfigurations(Deploy.UBESWAP_CELO).getRewardToken();
    pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    pool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    pool.inputTokenBalances = [BIGINT_ZERO];
    pool.inputTokenWeights = [
      BIGDECIMAL_HUNDRED 
    ];
    pool.outputTokenSupply = BIGINT_ZERO;
    pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    pool.rewardTokens = [getNetworkConfigurations(Deploy.UBESWAP_CELO).getRewardToken()];
    pool.stakedOutputTokenAmount = BIGINT_ZERO;
    pool.rewardTokenEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
    pool.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    pool.createdTimestamp = event.block.timestamp;
    pool.createdBlockNumber = event.block.number;

    poolAmounts.inputTokenBalances = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    // Used to track the number of deposits in a liquidity pool
    let poolDeposits = new _HelperStore(poolAddress.toHexString());
    poolDeposits.valueInt = INT_ZERO;

    // create the tracked contract based on the template
    StakingRewardsTemplate.create(poolAddress);
    log.warning("StakingRewardsTemplate add : {}",[poolAddress.toHexString()])
    log.warning("getOrCreateStackPool stackTokenAddress {} LPtoken id {} name {}   symbol {}",[stackTokenAddress.toHexString(),  LPtoken.id,  LPtoken.name ,LPtoken.symbol]);
    LPtoken.save();
    pool.save();
    poolAmounts.save();
    poolDeposits.save();
  }
}
