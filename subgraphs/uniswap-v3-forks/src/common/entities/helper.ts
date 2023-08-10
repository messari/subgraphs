import { Address, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { _HelperStore } from "../../../generated/schema";
import { HelperStoreType, BIGDECIMAL_ZERO } from "../constants";

export function getFeeTier(event: ethereum.Event): _HelperStore {
  return _HelperStore.load(
    event.address.concat(Bytes.fromHexString("-FeeTier"))
  )!;
}

export function getOrCreateUsersHelper(): _HelperStore {
  let uniqueUsersTotal = _HelperStore.load(HelperStoreType.USERS);
  if (uniqueUsersTotal === null) {
    uniqueUsersTotal = new _HelperStore(HelperStoreType.USERS);
    uniqueUsersTotal.valueDecimal = BIGDECIMAL_ZERO;
    uniqueUsersTotal.save();
  }
  return uniqueUsersTotal;
}

export function getOrCreateTokenPricesHelper(
  poolAddress: Address
): _HelperStore {
  const id = poolAddress.concat(Bytes.fromHexString("-TokenPrices"));
  let tokenPrices = _HelperStore.load(id);
  if (tokenPrices === null) {
    tokenPrices = new _HelperStore(id);
    tokenPrices.valueDecimalList = [];
    tokenPrices.save();
  }
  return tokenPrices;
}
