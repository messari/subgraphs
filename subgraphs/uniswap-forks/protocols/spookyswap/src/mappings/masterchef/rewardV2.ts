import { Deposit as DepositEventV2, Withdraw as WithdrawEventV2, EmergencyWithdraw as EmergencyWithdrawV2 } from "../../../../../generated/MasterChefV2/MasterChefV2Spookyswap";
import { _HelperStore } from "../../../../../generated/schema";
import { UsageType } from "../../../../../src/common/constants";
import { handleRewardV2 } from "../../common/handlers/handleRewardV2";


export function handleDepositV2(event: DepositEventV2): void {
  handleRewardV2(event, event.params.pid, event.params.amount, UsageType.DEPOSIT);
}

export function handleWithdrawV2(event: WithdrawEventV2): void {
  handleRewardV2(event, event.params.pid, event.params.amount, UsageType.WITHDRAW);
}

export function handleEmergencyWithdrawV2(event: EmergencyWithdrawV2): void {
  handleRewardV2(event, event.params.pid, event.params.amount, UsageType.WITHDRAW);
}
