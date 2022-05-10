// import { log } from "@graphprotocol/graph-ts";
import { ethereum, log } from "@graphprotocol/graph-ts";
import { Deposit as DepositEvent, Withdraw as WithdrawEvent, EmergencyWithdraw } from "../../generated/MasterChef/MasterChef";
import { Deposit as DepositEventV2, Withdraw as WithdrawEventV2, EmergencyWithdraw as EmergencyWithdrawV2, LogPoolAddition } from "../../generated/MasterChef/MasterChefV2";
import { _HelperStore } from "../../generated/schema";
import { UsageType } from "../common/constants";
import { handleReward, handleRewardV2 } from "../common/masterChef";

export function handleDeposit(event: DepositEvent): void {
  handleReward(event, event.params.pid, event.params.amount, UsageType.DEPOSIT);
}

export function handleDepositV2(event: DepositEventV2): void {
  handleRewardV2(event, event.params.pid, event.params.amount, UsageType.DEPOSIT);
}

export function handleWithdraw(event: WithdrawEvent): void {
  handleReward(event, event.params.pid, event.params.amount, UsageType.WITHDRAW);
}

export function handleWithdrawV2(event: WithdrawEventV2): void {
  handleRewardV2(event, event.params.pid, event.params.amount, UsageType.WITHDRAW);
}

export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
  handleReward(event, event.params.pid, event.params.amount, UsageType.WITHDRAW);
}

export function handleEmergencyWithdrawV2(event: EmergencyWithdrawV2): void {
  handleRewardV2(event, event.params.pid, event.params.amount, UsageType.WITHDRAW);
}

// export function logPoolAddition(event: LogPoolAddition): void {
//   let pidPoolMapping = new _HelperStore(event.params.pid.toString());
//   pidPoolMapping.valueString = event.params.lpToken.toHexString();
//   pidPoolMapping.save();
// }
// export function logPoolAdditionV2(event: LogPoolAdditionV2): void {
//   let pidPoolMapping = new _HelperStore(event.params.pid.toString());
//   pidPoolMapping.valueString = event.params.lpToken.toHexString();
//   pidPoolMapping.save();
// }
