// import { log } from "@graphprotocol/graph-ts";
import {
  Deposit,
  Withdraw,
  EmergencyWithdraw,
} from "../../../../../generated/MasterChef/MasterChefSushiswap";
import { _HelperStore } from "../../../../../generated/schema";
import { UsageType } from "../../../../../src/common/constants";
import { handleReward } from "../../common/handlers/handleReward";

// A deposit or stake for the pool specific MasterChef.
export function handleDeposit(event: Deposit): void {
  handleReward(event, event.params.pid, event.params.amount, UsageType.DEPOSIT);
}

// A withdraw or unstaking for the pool specific MasterChef.
export function handleWithdraw(event: Withdraw): void {
  handleReward(
    event,
    event.params.pid,
    event.params.amount,
    UsageType.WITHDRAW
  );
}

// A withdraw or unstaking for the pool specific MasterChef.
export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
  handleReward(
    event,
    event.params.pid,
    event.params.amount,
    UsageType.WITHDRAW
  );
}
