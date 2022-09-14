import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { TokenSnapshot } from "../../../generated/schema";
import { createTokenSnapshotID } from "../../services/snapshots";
import { getUsdRate } from "./pricing";

export function getUnderlyingTokenPrice(tokenAddr: Address, timestamp: BigInt): BigDecimal {
  let tokenSnapshot = TokenSnapshot.load(createTokenSnapshotID(tokenAddr, timestamp));
  if (tokenSnapshot) {
    return tokenSnapshot.price;
  }
  tokenSnapshot = new TokenSnapshot(createTokenSnapshotID(tokenAddr, timestamp));
  let priceUSD = getUsdRate(tokenAddr);
  tokenSnapshot.price = priceUSD;
  tokenSnapshot.save();
  return priceUSD;
}
