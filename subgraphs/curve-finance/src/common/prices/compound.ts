import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Ctoken } from "../../../generated/AddressProvider/Ctoken";
import { TokenSnapshot } from "../../../generated/schema";
import { createTokenSnapshotID } from "../../services/snapshots";
import { BIGDECIMAL_ZERO } from "../constants";
import { CTOKEN_DECIMALS } from "../constants/index";
import { getOrCreateToken } from "../getters";
import { bigIntToBigDecimal } from "../utils/numbers";
import { getUnderlyingTokenPrice } from "./underlying";

export function isCtoken(tokenAddr: Address): boolean {
  let ctokenContract = Ctoken.bind(tokenAddr);
  const exchRateCall = ctokenContract.try_exchangeRateStored();
  if (!exchRateCall.reverted) {
    return true;
  }
  return false;
}

export function getCtokenPriceUSD(tokenAddr: Address, timestamp: BigInt): BigDecimal {
  let tokenSnapshot = TokenSnapshot.load(createTokenSnapshotID(tokenAddr, timestamp));
  if (tokenSnapshot) {
    return tokenSnapshot.price;
  }
  tokenSnapshot = new TokenSnapshot(createTokenSnapshotID(tokenAddr, timestamp));
  let ctokenContract = Ctoken.bind(tokenAddr);
  const underlyingTokenCall = ctokenContract.try_underlying();
  const exchRateCall = ctokenContract.try_exchangeRateStored();

  if (underlyingTokenCall.reverted || exchRateCall.reverted) {
    return BIGDECIMAL_ZERO;
  }
  const underlyingToken = getOrCreateToken(underlyingTokenCall.value);
  const underlyingPrice = getUnderlyingTokenPrice(Address.fromString(underlyingToken.id), timestamp);
  const exchRateMantissa = underlyingToken.decimals + CTOKEN_DECIMALS;
  const exchRate = bigIntToBigDecimal(exchRateCall.value, exchRateMantissa);
  const priceUSD = exchRate.times(underlyingPrice);
  tokenSnapshot.price = priceUSD;
  tokenSnapshot.save();
  return priceUSD;
}
