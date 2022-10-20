import { Address } from "@graphprotocol/graph-ts";
import { _Trove } from "../../generated/schema";
import { BIGINT_ZERO } from "../utils/constants";

export function getTrove(owner: Address, asset: Address): _Trove | null {
  const id = owner.toHexString() + "-" + asset.toHexString();
  return _Trove.load(id);
}

export function getOrCreateTrove(owner: Address, asset: Address): _Trove {
  const id = owner.toHexString() + "-" + asset.toHexString();
  let trove = _Trove.load(id);
  if (trove == null) {
    trove = new _Trove(id);
    trove.asset = asset.toHexString();
    trove.owner = owner.toHexString();
    trove.collateral = BIGINT_ZERO;
    trove.debt = BIGINT_ZERO;
    trove.collateralSurplus = BIGINT_ZERO;
    trove.collateralSurplusChange = BIGINT_ZERO;
    trove.save();
  }
  return trove;
}
