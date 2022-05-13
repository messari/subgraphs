// import { log } from "@graphprotocol/graph-ts";
import { Deposit as DepositEventMini, Withdraw as WithdrawEventMini, EmergencyWithdraw as EmergencyWithdrawMini } from "../../../../generated/MiniChef/MiniChefSushiswap";
import { _HelperStore } from "../../../../generated/schema";
import { UsageType } from "../../../common/constants";
import { handleRewardMini } from "../../../common/masterChef/sushiswap/handleRewardMini";

export function handleDepositMini(event: DepositEventMini): void {
  handleRewardMini(event, event.params.pid, event.params.amount, UsageType.DEPOSIT);
}

export function handleWithdrawMini(event: WithdrawEventMini): void {
  handleRewardMini(event, event.params.pid, event.params.amount, UsageType.WITHDRAW);
}

export function handleEmergencyWithdrawMini(event: EmergencyWithdrawMini): void {
  handleRewardMini(event, event.params.pid, event.params.amount, UsageType.WITHDRAW);
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
