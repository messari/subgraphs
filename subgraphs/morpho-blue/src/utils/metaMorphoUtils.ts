import { BigInt } from "@graphprotocol/graph-ts";

export function toMetaMorphoAssetsUp(
  shares: BigInt,
  totalShares: BigInt,
  totalAssets: BigInt,
  underlyingDecimals: u8
): BigInt {
  const sharesOffset = underlyingDecimals > 18 ? 0 : 18 - underlyingDecimals;
  return shares
    .times(totalAssets.plus(BigInt.fromString("1")))
    .div(totalShares.plus(BigInt.fromString("10").pow(sharesOffset as u8)));
}
