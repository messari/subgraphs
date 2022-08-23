import { Address } from "@graphprotocol/graph-ts";
import { _Trove, _TroveToken } from "../../generated/schema";
import { BIGINT_ZERO } from "../utils/constants";
import { getOrCreateToken } from "./token";

export function getOrCreateTrove(owner: Address): _Trove {
  const id = owner.toHexString();
  let trove = _Trove.load(id);
  if (trove == null) {
    trove = new _Trove(id);
    trove.debt = BIGINT_ZERO;
    trove.save();
  }
  return trove;
}

export function getOrCreateTroveToken(
  trove: _Trove,
  token: Address
): _TroveToken {
  const id = trove.id + "-" + token.toHexString();

  let troveToken = _TroveToken.load(id);
  if (troveToken == null) {
    troveToken = new _TroveToken(id);
    troveToken.trove = trove.id;
    troveToken.collateral = BIGINT_ZERO
    troveToken.collateralSurplus = BIGINT_ZERO
    troveToken.collateralSurplusChange = BIGINT_ZERO
    troveToken.token = getOrCreateToken(token).id;
    troveToken.save();
  }

  return troveToken;
}
