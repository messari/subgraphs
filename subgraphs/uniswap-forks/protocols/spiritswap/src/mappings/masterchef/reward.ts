// import { log } from "@graphprotocol/graph-ts";
import {
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  EmergencyWithdraw,
} from "../../../../../generated/MasterChef/MasterChefSpiritSwap";
import { _HelperStore } from "../../../../../generated/schema";
import { BIGINT_NEG_ONE } from "../../../../../src/common/constants";
import { handleReward } from "../../common/handlers/handleReward";

export function handleDeposit(event: DepositEvent): void {
  handleReward(event, event.params.pid, event.params.amount);
}

export function handleWithdraw(event: WithdrawEvent): void {
  handleReward(
    event,
    event.params.pid,
    event.params.amount.times(BIGINT_NEG_ONE)
  );
}

export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
  handleReward(
    event,
    event.params.pid,
    event.params.amount.times(BIGINT_NEG_ONE)
  );
}
