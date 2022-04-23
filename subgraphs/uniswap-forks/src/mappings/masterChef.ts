// import { log } from "@graphprotocol/graph-ts";
import { ethereum } from "@graphprotocol/graph-ts";
import { Deposit as DepositEvent, Withdraw as WithdrawEvent, EmergencyWithdraw } from "../../generated/MasterChef/MasterChef";
import { Deposit as DepositEventV2, Withdraw as WithdrawEventV2, EmergencyWithdraw as EmergencyWithdrawV2 } from "../../generated/MasterChef/MasterChefV2";
import { UsageType } from "../common/constants";
import { getLiquidityPool } from "../common/getters";
import { handleReward, handleRewardV2 } from "../common/masterChef";
import { updateStakedTokens } from "../common/updateMetrics";

export function handleDeposit(event: DepositEvent): void {
  let pid = event.params.pid;
  updateStakedTokens(event, event.params.amount, UsageType.DEPOSIT);
  handleReward(event, pid);
}

export function handleDepositV2(event: DepositEventV2): void {
  let pid = event.params.pid;
  updateStakedTokens(event, event.params.amount, UsageType.DEPOSIT);
  handleRewardV2(event, pid);
}

export function handleWithraw(event: WithdrawEvent): void {
  let pid = event.params.pid;
  updateStakedTokens(event, event.params.amount, UsageType.WITHDRAW);
  handleReward(event, pid);
}

export function handleWithrawV2(event: WithdrawEventV2): void {
  let pid = event.params.pid;
  updateStakedTokens(event, event.params.amount, UsageType.WITHDRAW);
  handleRewardV2(event, pid);
}

export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
  let pid = event.params.pid;
  updateStakedTokens(event, event.params.amount, UsageType.WITHDRAW);
  handleReward(event, pid);
}

export function handleEmergencyWithdrawV2(event: EmergencyWithdrawV2): void {
  let pid = event.params.pid;
  updateStakedTokens(event, event.params.amount, UsageType.WITHDRAW);
  handleRewardV2(event, pid);
}
