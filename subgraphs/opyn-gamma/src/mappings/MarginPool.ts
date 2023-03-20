import {
  TransferToPool,
  TransferToUser,
} from "../../generated/MarginPool/MarginPool";
import { Option } from "../../generated/schema";
import { createDeposit, createWithdraw } from "../entities/event";

export function handleTransferToPool(event: TransferToPool): void {
  const option = Option.load(event.params.asset);
  if (option) {
    // Ignore using oTokens as collateral
    return;
  }
  createDeposit(
    event,
    event.params.asset,
    event.params.amount,
    event.params.user
  );
}

export function handleTransferToUser(event: TransferToUser): void {
  const option = Option.load(event.params.asset);
  if (option) {
    // Ignore using oTokens as collateral
    return;
  }
  createWithdraw(
    event,
    event.params.asset,
    event.params.amount,
    event.params.user
  );
}
