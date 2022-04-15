import { Address } from "@graphprotocol/graph-ts";
import { _Trove } from "../../generated/schema";

export function getOrCreateTrove(owner: Address): _Trove {
  const id = owner.toHexString();
  let trove = _Trove.load(id);
  if (trove == null) {
    trove = new _Trove(id);
    trove.save();
  }
  return trove;
}
