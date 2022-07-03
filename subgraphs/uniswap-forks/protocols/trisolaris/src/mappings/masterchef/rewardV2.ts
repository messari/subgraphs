import {
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  EmergencyWithdraw,
} from "../../../../../generated/MasterChefV3/MasterChefV3TraderJoe";
import { _HelperStore } from "../../../../../generated/schema";
import { UsageType } from "../../../../../src/common/constants";
import { handleRewardV2 } from "../../common/handlers/handleRewardV2";

export function handleDepositV2(event: DepositEvent): void {
  handleRewardV2(
    event,
    event.params.pid,
    event.params.amount,
    UsageType.DEPOSIT
  );
}

export function handleWithdrawV2(event: WithdrawEvent): void {
  handleRewardV2(
    event,
    event.params.pid,
    event.params.amount,
    UsageType.WITHDRAW
  );
}

export function handleEmergencyWithdrawV(event: EmergencyWithdraw): void {
  handleRewardV2(
    event,
    event.params.pid,
    event.params.amount,
    UsageType.WITHDRAW
  );
}
