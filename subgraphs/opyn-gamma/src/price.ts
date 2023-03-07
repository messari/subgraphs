import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../configurations/configure";
import { Oracle } from "../generated/Oracle/Oracle";
import { OToken, Token } from "../generated/schema";
import { getOrCreateToken } from "./common/tokens";
import { bigIntToBigDecimal } from "./common/utils/numbers";

export function getTokenPrice(token: Token): BigDecimal {
  const oracle = Oracle.bind(NetworkConfigs.getOracleAddress());
  const price = oracle.getPrice(Address.fromBytes(token.id));
  return bigIntToBigDecimal(price, 8);
}

export function getUSDAmount(token: Token, amount: BigInt): BigDecimal {
  const price = getTokenPrice(token);
  return bigIntToBigDecimal(amount, token.decimals).times(price);
}

export function getUnderlyingPrice(oToken: OToken): BigDecimal {
  const underlyingPrice = getTokenPrice(
    getOrCreateToken(Address.fromBytes(oToken.underlyingAsset))
  );
  const strikeAssetPrice = getTokenPrice(
    getOrCreateToken(Address.fromBytes(oToken.strikeAsset))
  );
  return underlyingPrice.times(strikeAssetPrice);
}
