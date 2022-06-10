import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Atoken } from "../../../generated/AddressProvider/Atoken";
import { TokenSnapshot } from "../../../generated/schema";
import { createTokenSnapshotID } from "../../services/snapshots";
import { ADDRESS_ZERO } from "../constants/index";
import { getOrCreateToken } from "../getters";
import { getUnderlyingTokenPrice } from "./underlying";

export function isAtoken(tokenAddr: Address): boolean {
  return getAtokenUnderlyingAsset(tokenAddr) == ADDRESS_ZERO ? false : true;
}

export function getAtokenUnderlyingAsset(tokenAddr: Address): Address {
  let atokenContract = Atoken.bind(tokenAddr);
  const underlyingAssetCall = atokenContract.try_underlyingAssetAddress();
  if (!underlyingAssetCall.reverted) {
    return underlyingAssetCall.value;
  }
  const underlyingAssetCallv2 = atokenContract.try_UNDERLYING_ASSET_ADDRESS();
  if (!underlyingAssetCallv2.reverted) {
    return underlyingAssetCallv2.value;
  }
  return ADDRESS_ZERO;
}

export function getAtokenPriceUSD(tokenAddr: Address, timestamp: BigInt): BigDecimal {
  let tokenSnapshot = TokenSnapshot.load(createTokenSnapshotID(tokenAddr, timestamp));
  if (tokenSnapshot) {
    return tokenSnapshot.price;
  }
  tokenSnapshot = new TokenSnapshot(createTokenSnapshotID(tokenAddr, timestamp));
  const underlyingAsset = getOrCreateToken(getAtokenUnderlyingAsset(tokenAddr));
  const priceUSD = getUnderlyingTokenPrice(Address.fromString(underlyingAsset.id), timestamp);
  tokenSnapshot.price = priceUSD;
  tokenSnapshot.save();
  return priceUSD;
}
