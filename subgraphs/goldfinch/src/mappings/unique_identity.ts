/* eslint-disable @typescript-eslint/no-magic-numbers */
import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { TransferSingle } from "../../generated/UniqueIdentity/UniqueIdentity";
import { createTransactionFromEvent } from "../entities/helpers";
import { getOrInitUser } from "../entities/user";

export function handleTransferSingle(event: TransferSingle): void {
  const receivingUser = getOrInitUser(event.params.to);
  const uidType = event.params.id;
  if (uidType.equals(BigInt.fromI32(0))) {
    receivingUser.isNonUsIndividual = true;
  } else if (uidType.equals(BigInt.fromI32(1))) {
    receivingUser.isUsAccreditedIndividual = true;
  } else if (uidType.equals(BigInt.fromI32(2))) {
    receivingUser.isUsNonAccreditedIndividual = true;
  } else if (uidType.equals(BigInt.fromI32(3))) {
    receivingUser.isUsEntity = true;
  } else if (uidType.equals(BigInt.fromI32(4))) {
    receivingUser.isNonUsEntity = true;
  }
  receivingUser.save();

  if (
    event.params.from.notEqual(
      Bytes.fromHexString("0x0000000000000000000000000000000000000000")
    )
  ) {
    const sendingUser = getOrInitUser(event.params.from);
    const uidType = event.params.id;
    if (uidType.equals(BigInt.fromI32(0))) {
      sendingUser.isNonUsIndividual = false;
    } else if (uidType.equals(BigInt.fromI32(1))) {
      sendingUser.isUsAccreditedIndividual = false;
    } else if (uidType.equals(BigInt.fromI32(2))) {
      sendingUser.isUsNonAccreditedIndividual = false;
    } else if (uidType.equals(BigInt.fromI32(3))) {
      sendingUser.isUsEntity = false;
    } else if (uidType.equals(BigInt.fromI32(4))) {
      sendingUser.isNonUsEntity = false;
    }
    sendingUser.save();
  }

  const transaction = createTransactionFromEvent(
    event,
    "UID_MINTED",
    event.params.to
  );
  transaction.user = transaction.category = "UID_MINTED";
  // UID NFTs actually don't have a unique ID; they're semi-fungible.
  transaction.receivedNftId = event.params.id.toString();
  transaction.sentNftId = event.params.id.toString();
  transaction.receivedNftType = "UID";
  transaction.save();
}
