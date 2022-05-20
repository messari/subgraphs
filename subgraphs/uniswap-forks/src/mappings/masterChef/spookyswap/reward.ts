// import { log } from "@graphprotocol/graph-ts";
import { Deposit as DepositEvent, Withdraw as WithdrawEvent, EmergencyWithdraw } from "../../../../generated/MasterChef/MasterChefApeswap";
import { _HelperStore } from "../../../../generated/schema";
import { UsageType } from "../../../common/constants";
import { handleReward } from "../../../common/masterChef/spookyswap/handleReward";

export function handleDeposit(event: DepositEvent): void {
  handleReward(event, event.params.pid, event.params.amount, UsageType.DEPOSIT);
}

export function handleWithdraw(event: WithdrawEvent): void {
  handleReward(event, event.params.pid, event.params.amount, UsageType.WITHDRAW);
}

export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
  handleReward(event, event.params.pid, event.params.amount, UsageType.WITHDRAW);
}
