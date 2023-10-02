import {
  AcceleratingDistributor,
  Stake,
  Unstake,
} from "../../generated/AcceleratingDistributor/AcceleratingDistributor";
import { SDK } from "../sdk/protocols/bridge";
import {
  ACROSS_ACCELERATING_DISTRIBUTOR_CONTRACT,
  ACROSS_REWARD_TOKEN,
  MAINNET_BRIDGE_CONFIG,
  Pricer,
  TokenInit,
} from "../util";
import { _OutputTokenToPool } from "../../generated/schema";
import {
  BIGINT_MINUS_ONE,
  RewardTokenType,
  SECONDS_PER_DAY_BI,
} from "../sdk/util/constants";
import { Address, BigInt, log } from "@graphprotocol/graph-ts";

export function handleStake(event: Stake): void {
  const sdk = SDK.initializeFromEvent(
    MAINNET_BRIDGE_CONFIG,
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
      const amount = baseEmissionRate!.times(SECONDS_PER_DAY_BI);
      pool.setRewardEmissions(RewardTokenType.DEPOSIT, rewardToken, amount);
    }
  }
}

export function handleUnstake(event: Unstake): void {
  const sdk = SDK.initializeFromEvent(
    MAINNET_BRIDGE_CONFIG,
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
