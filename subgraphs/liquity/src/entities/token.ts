import { BigDecimal, BigInt, Address } from "@graphprotocol/graph-ts";
import { RewardToken, Token } from "../../generated/schema";
import {
  ETH_ADDRESS,
  ETH_NAME,
  ETH_SYMBOL,
  LUSD_ADDRESS,
  LQTY_ADDRESS,
  RewardTokenType,
  BIGDECIMAL_ONE,
} from "../utils/constants";
import { bigIntToBigDecimal } from "../utils/numbers";
import { getUsdPrice } from "../prices";

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

export function getLQTYToken(): Token {
  const token = new Token(LQTY_ADDRESS);
  token.name = "Liquity LQTY";
  token.symbol = "LQTY";
  token.decimals = 18;
  token.save();
  return token;
}

export function getRewardToken(): RewardToken {
  const token = getLQTYToken();
  const id = `${RewardTokenType.DEPOSIT}-${token.id}`;

  const rToken = new RewardToken(id);
  rToken.type = RewardTokenType.DEPOSIT;
  rToken.token = token.id;
  rToken.save();
  return rToken;
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

export function getCurrentLUSDPrice(): BigDecimal {
  let price = getUsdPrice(Address.fromString(LUSD_ADDRESS), BIGDECIMAL_ONE);
  const half = BigDecimal.fromString("0.5");
  if (price.lt(half)) {
    // default to 1USD if price lib doesn't get a price or it is too low
    // In the early times of LUSD (around may 2021) the price lib returns 0.04.
    // The lowest it's been is ~0.95, so this should be safe for now.
    price = BIGDECIMAL_ONE;
  }

  const token = Token.load(LUSD_ADDRESS)!;
  token.lastPriceUSD = price;
  token.save();
  return token.lastPriceUSD!;
}

export function getCurrentLQTYPrice(): BigDecimal {
  const price = getUsdPrice(Address.fromString(LQTY_ADDRESS), BIGDECIMAL_ONE);

  const token = Token.load(LQTY_ADDRESS)!;
  token.lastPriceUSD = price;
  token.save();
  return token.lastPriceUSD!;
}
