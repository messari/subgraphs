import {
  TransferToPool,
  TransferToUser,
} from "../../generated/MarginPool/MarginPool";
import { createDeposit, createWithdraw } from "../entities/event";

export function handleTransferToPool(event: TransferToPool): void {
  createDeposit(
    event,
    event.params.asset,
    event.params.amount,
    event.params.user
  );
}

export function handleTransferToUser(event: TransferToUser): void {
  createWithdraw(
    event,
    event.params.asset,
    event.params.amount,
    event.params.user
  );
}
