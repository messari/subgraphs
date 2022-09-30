import {
  createDeposit,
  createWithdrawal,
  createFeeUpdated,
  createRateChanged,
  createRewardSwap,
} from "./helpers";
import {
  updateFinancials,
  updatePoolMetrics,
  updateUsageMetrics,
} from "../../../common/metrics";

import {
  Deposit,
  Withdrawal,
} from "../../../../generated/TornadoCash01/TornadoCashETH";
import { FeeUpdated } from "../../../../generated/TornadoCashFeeManager/TornadoCashFeeManager";
import { RateChanged } from "../../../../generated/TornadoCashMiner/TornadoCashMiner";
import { Swap } from "../../../../generated/TornadoCashRewardSwap/TornadoCashRewardSwap";
import {
  StakeAddedToRelayer,
  StakeBurned,
} from "../../../../generated/TornadoCashRelayerRegistry/TornadoCashRelayerRegistry";
import { RewardsClaimed } from "../../../../generated/TornadoCashStakingRewards/TornadoCashStakingRewards";

export function handleDeposit(event: Deposit): void {
  createDeposit(event.address.toHexString(), event);

  updatePoolMetrics(event.address.toHexString(), event);
  updateUsageMetrics(event);
  updateFinancials(event);
}

export function handleWithdrawal(event: Withdrawal): void {
  createWithdrawal(event.address.toHexString(), event);

  updatePoolMetrics(event.address.toHexString(), event);
  updateUsageMetrics(event);
  updateFinancials(event);
}

export function handleFeeUpdated(event: FeeUpdated): void {
  createFeeUpdated(event.params.instance.toHexString(), event);
}

export function handleRateChanged(event: RateChanged): void {
  createRateChanged(event.params.instance.toHexString(), event);

  updatePoolMetrics(event.params.instance.toHexString(), event);
}

export function handleRewardSwap(event: Swap): void {
  createRewardSwap(event);

  updateUsageMetrics(event);
}

export function handleStakeAddedToRelayer(event: StakeAddedToRelayer): void {
  updateUsageMetrics(event);
}

export function handleStakeBurned(event: StakeBurned): void {
  updateUsageMetrics(event);
}

export function handleStakingRewardsClaimed(event: RewardsClaimed): void {
  updateUsageMetrics(event);
}
