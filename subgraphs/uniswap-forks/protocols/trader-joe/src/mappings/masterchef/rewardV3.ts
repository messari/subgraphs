import { Deposit as DepositEvent, Withdraw as WithdrawEvent, EmergencyWithdraw } from "../../../../../generated/MasterChefV3/MasterChefV3TraderJoe";
import { _HelperStore } from "../../../../../generated/schema";
import { UsageType } from "../../../../../src/common/constants";
import { handleRewardV3 } from "../../common/handlers/handleRewardV3";

export function handleDepositV3(event: DepositEvent): void {
  handleRewardV3(event, event.params.pid, event.params.amount, UsageType.DEPOSIT);
}

export function handleWithdrawV3(event: WithdrawEvent): void {
  handleRewardV3(event, event.params.pid, event.params.amount, UsageType.WITHDRAW);
}

export function handleEmergencyWithdrawV3(event: EmergencyWithdraw): void {
  handleRewardV3(event, event.params.pid, event.params.amount, UsageType.WITHDRAW);
}