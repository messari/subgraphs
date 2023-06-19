import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Token } from "../../generated/schema";
import { BTC_ADDRESS, EBTC_ADDRESS, STETH_ADDRESS } from "../constants";
import { BIGDECIMAL_ONE } from "../sdk/constants";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import { getUsdPrice } from "../prices";

export function getBtcToken(): Token {
  const token = new Token(BTC_ADDRESS);
  token.name = "Bitcoin";
  token.symbol = "BTC";
  token.decimals = 8;
  token.save();
  return token;
}

export function getCollToken(): Token {
  const token = new Token(STETH_ADDRESS);
  token.name = "Staked Ether";
  token.symbol = "stETH";
  token.decimals = 18;
  token.save();
  return token;
}

export function getEbtcToken(): Token {
  const token = new Token(EBTC_ADDRESS);
  token.name = "EBTC Stablecoin";
  token.symbol = "EBTC";
  token.decimals = 18;
  token.save();
  return token;
}

export function setCurrentBtcPrice(block: ethereum.Block): void {
  const btc = getBtcToken();
  btc.lastPriceUSD = getUsdPrice(
    Address.fromBytes(BTC_ADDRESS),
    BIGDECIMAL_ONE
  );
  btc.lastPriceBlockNumber = block.number;
  btc.save();
}

export function getCurrentBtcPrice(): BigDecimal {
  const btcToken = Token.load(BTC_ADDRESS);
  return btcToken!.lastPriceUSD!;
}

export function setCurrentCollPrice(
  block: ethereum.Block,
  stethBtcRatio: BigInt
): void {
  const coll = getCollToken();
  const btcPrice = getCurrentBtcPrice();
  coll.lastPriceUSD = btcPrice.times(bigIntToBigDecimal(stethBtcRatio));
  coll.lastPriceBlockNumber = block.number;
  coll.save();
}

export function getCurrentCollPrice(): BigDecimal {
  const stethToken = Token.load(STETH_ADDRESS);
  return stethToken!.lastPriceUSD!;
}
