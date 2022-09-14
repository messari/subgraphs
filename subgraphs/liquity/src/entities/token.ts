import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Token } from "../../generated/schema";
import {
  ETH_ADDRESS,
  ETH_NAME,
  ETH_SYMBOL,
  LUSD_ADDRESS,
} from "../utils/constants";
import { bigIntToBigDecimal } from "../utils/numbers";

export function getETHToken(): Token {
  const token = new Token(ETH_ADDRESS);
  token.name = ETH_NAME;
  token.symbol = ETH_SYMBOL;
  token.decimals = 18;
  token.save();
  return token;
}

export function getLUSDToken(): Token {
  const token = new Token(LUSD_ADDRESS);
  token.name = "Liquity USD";
  token.symbol = "LUSD";
  token.decimals = 18;
  token.save();
  return token;
}

export function setCurrentETHPrice(blockNumber: BigInt, price: BigInt): void {
  const token = getETHToken();
  token.lastPriceUSD = bigIntToBigDecimal(price);
  token.lastPriceBlockNumber = blockNumber;
  token.save();
}

export function getCurrentETHPrice(): BigDecimal {
  const ethToken = Token.load(ETH_ADDRESS);
  return ethToken!.lastPriceUSD!;
}
