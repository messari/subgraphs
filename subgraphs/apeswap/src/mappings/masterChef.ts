import {
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  EmergencyWithdraw,
} from "../../generated/MasterChef/MasterChef";
import {
  Deposit as DepositEventV2,
  Withdraw as WithdrawEventV2,
  EmergencyWithdraw as EmergencyWithdrawV2,
} from "../../generated/MasterChef/MasterChefV2";
import { handleReward, handleRewardV2 } from "../helpers/masterChef";

export function handleDeposit(event: DepositEvent): void {
  let pid = event.params.pid;
  handleReward(event, pid);
}

export function handleDepositV2(event: DepositEventV2): void {
  let pid = event.params.pid;
  handleRewardV2(event, pid);
}

export function handleWithraw(event: WithdrawEvent): void {
  let pid = event.params.pid;
  handleReward(event, pid);
}

export function handleWithrawV2(event: WithdrawEventV2): void {
  let pid = event.params.pid;
  handleRewardV2(event, pid);
}

export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
  let pid = event.params.pid;
  handleReward(event, pid);
}

export function handleEmergencyWithdrawV2(event: EmergencyWithdrawV2): void {
  let pid = event.params.pid;
  handleRewardV2(event, pid);
}
