import {
  AcceleratingDistributor,
  Stake,
  Unstake,
} from "../../generated/AcceleratingDistributor/AcceleratingDistributor";
import { SDK } from "../sdk/protocols/bridge";
import {
  ACROSS_ACCELERATING_DISTRIBUTOR_CONTRACT,
  ACROSS_HUB_POOL_CONTRACT,
  ACROSS_PROTOCOL_NAME,
  ACROSS_REWARD_TOKEN,
  Pricer,
  TokenInit,
} from "../util";
import { BridgePermissionType } from "../sdk/protocols/bridge/enums";
import { Versions } from "../versions";
import { BridgeConfig } from "../sdk/protocols/bridge/config";
import { _OutputTokenToPool } from "../../generated/schema";
import {
  BIGINT_MINUS_ONE,
  RewardTokenType,
  SECONDS_PER_DAY_BI,
} from "../sdk/util/constants";
import { Address, BigInt, log } from "@graphprotocol/graph-ts";

// use hub pool contract as bridge conf name so that
// stakedOutputTokenAmount, rewardTokenEmissionsAmount, rewardTokenEmissionsUSD
// are tracked as part of the liquidity pools
const conf = new BridgeConfig(
  ACROSS_HUB_POOL_CONTRACT,
  ACROSS_PROTOCOL_NAME,
  ACROSS_PROTOCOL_NAME,
  BridgePermissionType.WHITELIST,
  Versions
);

// stake
export function handleStake(event: Stake): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(event.block),
    new TokenInit(),
    event
  );

  const stakedToken = event.params.token;
  const outputTokenToPool = _OutputTokenToPool.load(stakedToken);
  if (outputTokenToPool) {
    const pool = sdk.Pools.loadPool<string>(outputTokenToPool.pool);

    // Add Staked Amount
    const stakedAmount = event.params.amount;
    pool.addStakedOutputTokenAmount(stakedAmount);

    // Rewards
    // RewardToken can also be fetched from AcceleratingDistributor contract ("rewardToken" method)
    const rewardTokenAddress = Address.fromString(ACROSS_REWARD_TOKEN);
    const rewardToken = sdk.Tokens.getOrCreateToken(rewardTokenAddress);

    const acceleratingDistributorContract = AcceleratingDistributor.bind(
      Address.fromString(ACROSS_ACCELERATING_DISTRIBUTOR_CONTRACT)
    );
    const contractCall =
      acceleratingDistributorContract.try_stakingTokens(stakedToken);

    let baseEmissionRate: BigInt;
    if (contractCall.reverted) {
      log.info(
        "[AcceleratingDistributor:stakingToken()] retrieve baseEmissionRate for pools call reverted",
        []
      );
    } else {
      baseEmissionRate = contractCall.value.getBaseEmissionRate();
    }

    const amount = baseEmissionRate!
      .times(SECONDS_PER_DAY_BI)
      .div(BigInt.fromI32(rewardToken.decimals));
    pool.setRewardEmissions(RewardTokenType.DEPOSIT, rewardToken, amount);

    log.error(
      "pool: {}, rewardToken: {}, rewardToken.decimals: {}, rewardToken.lastPriceUSD: {}, baseEmissionRate: {}, SECONDS_PER_DAY_BI: {}, amount: {}, poolRewardsAmount: {}, poolRewardsUSD: {}",
      [
        pool.pool.id.toHexString(),
        rewardToken.id.toHexString(),
        rewardToken.decimals.toString(),
        rewardToken.lastPriceUSD!.toString(),
        baseEmissionRate!.toString(),
        SECONDS_PER_DAY_BI.toString(),
        amount.toString(),
        pool.pool.rewardTokenEmissionsAmount!.toString(),
        pool.pool.rewardTokenEmissionsUSD!.toString(),
      ]
    );
  }
}

// unstake
// -- use unstaked token tp get l1token (?)
// -- use l1token to get pool
// -- pool.addStakedOutputToken(amount); || pool.setStakedOutputToken(cumulativeBalance);
// -- rewards here
export function handleUnstake(event: Unstake): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(event.block),
    new TokenInit(),
    event
  );

  const unstakedToken = event.params.token;
  const outputTokenToPool = _OutputTokenToPool.load(unstakedToken);
  if (outputTokenToPool) {
    const pool = sdk.Pools.loadPool<string>(outputTokenToPool.pool);

    // Subtract Unstaked Amount
    const unstakedAmount = event.params.amount.times(BIGINT_MINUS_ONE);
    pool.addStakedOutputTokenAmount(unstakedAmount);
  }
}

// outputTokenPriceUSD
// --> added "refreshOutputTokenSupply()" to addOutputTokenSupply() to take care of this
// --> price is not available for these LP tokens
