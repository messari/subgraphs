import { store } from "@graphprotocol/graph-ts";
import {
  GFIDeposit,
  GFIWithdrawal,
} from "../../../generated/GFILedger/GFILedger";
import { VaultedGfi } from "../../../generated/schema";
import { createTransactionFromEvent } from "../../entities/helpers";

export function handleGfiDeposit(event: GFIDeposit): void {
  const vaultedGfi = new VaultedGfi(event.params.positionId.toString());
  vaultedGfi.amount = event.params.amount;
  vaultedGfi.user = event.params.owner.toHexString();
  vaultedGfi.vaultedAt = event.block.timestamp.toI32();
  vaultedGfi.save();

  const transaction = createTransactionFromEvent(
    event,
    "MEMBERSHIP_GFI_DEPOSIT",
    event.params.owner
  );
  transaction.sentAmount = event.params.amount;
  transaction.sentToken = "GFI";
  transaction.save();
}

export function handleGfiWithdrawal(event: GFIWithdrawal): void {
  if (event.params.remainingAmount.isZero()) {
    store.remove("VaultedGfi", event.params.positionId.toString());
  } else {
    const vaultedGfi = assert(
      VaultedGfi.load(event.params.positionId.toString())
    );
    vaultedGfi.amount = event.params.remainingAmount;
    vaultedGfi.save();
  }

  const transaction = createTransactionFromEvent(
    event,
    "MEMBERSHIP_GFI_WITHDRAWAL",
    event.params.owner
  );
  transaction.receivedAmount = event.params.withdrawnAmount;
  transaction.receivedToken = "GFI";
  transaction.save();
}
