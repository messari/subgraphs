import {
  Deposit,
  Withdraw,
  EmergencyWithdraw,
} from "../../generated/Staking/Staking";
import {
  Deposit as DepositV2,
  Withdraw as WithdrawV2,
  EmergencyWithdraw as EmergencyWithdrawV2,
} from "../../generated/StakingV2/StakingV2";
import { handleStakingV1, handleStakingV2 } from "../modules/Rewards";

export function handleDeposit(event: Deposit): void {
  const poolId = event.params.pid;
  handleStakingV1(poolId, event.block);
}
export function handleWithdraw(event: Withdraw): void {
  const poolId = event.params.pid;

  handleStakingV1(poolId, event.block);
}
export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
  const poolId = event.params.pid;

  handleStakingV1(poolId, event.block);
}
export function handleDepositV2(event: DepositV2): void {
  const token = event.params.token;

  handleStakingV2(token, event.block);
}
export function handleWithdrawV2(event: WithdrawV2): void {
  const token = event.params.token;

  handleStakingV2(token, event.block);
}
export function handleEmergencyWithdrawV2(event: EmergencyWithdrawV2): void {
  const token = event.params.token;

  handleStakingV2(token, event.block);
}
