import { GrantAccepted } from "../../generated/MerkleDirectDistributor/MerkleDirectDistributor";
import { createTransactionFromEvent } from "../entities/helpers";

export function handleGrantAccepted(event: GrantAccepted): void {
  const transaction = createTransactionFromEvent(
    event,
    "COMMUNITY_REWARDS_CLAIMED",
    event.params.account
  );
  transaction.receivedAmount = event.params.amount;
  transaction.receivedToken = "GFI";
  transaction.save();
}
