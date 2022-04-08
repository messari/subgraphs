import { Address } from "@graphprotocol/graph-ts";
import { _Trove } from "../../generated/schema";
import { incrementProtocolUniqueUsers } from "./protocol";

// This is also used to keep track of liquidators/redeemers that have not opened a trove
export function getOrCreateTrove(owner: Address): _Trove {
  const id = owner.toHexString();
  let trove = _Trove.load(id);
  if (trove == null) {
    trove = new _Trove(id);
    trove.save();
    incrementProtocolUniqueUsers();
  }
  return trove;
}
