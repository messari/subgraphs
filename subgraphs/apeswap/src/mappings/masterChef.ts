import { log } from "@graphprotocol/graph-ts";
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
import { handleReward, handleRewardV2 } from "../common/masterChef";

export function handleDeposit(event: DepositEvent): void {
  log.warning("handleDeposit", []);

  let pid = event.params.pid;
  handleReward(event, pid);
}

export function handleDepositV2(event: DepositEventV2): void {
  log.warning("handleDepositV2", []);

  let pid = event.params.pid;
  handleRewardV2(event, pid);
}

export function handleWithraw(event: WithdrawEvent): void {
  log.warning("handleWithdraw", []);

  let pid = event.params.pid;
  handleReward(event, pid);
}

export function handleWithrawV2(event: WithdrawEventV2): void {
  log.warning("handleWithdrawV2", []);

  let pid = event.params.pid;
  handleRewardV2(event, pid);
}

export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
  log.warning("handleEmergencyWithdraw", []);

  let pid = event.params.pid;
  handleReward(event, pid);
}

export function handleEmergencyWithdrawV2(event: EmergencyWithdrawV2): void {
  log.warning("handleEmergencyWithdrawV2", []);

  let pid = event.params.pid;
  handleRewardV2(event, pid);
}
