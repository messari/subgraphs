import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { Token } from "../../generated/schema";
import { getOrCreateTokenFromString } from "../entities/token";
import { getUsdPrice } from "../prices";
import { WHITELIST_TOKENS_MAP } from "../prices/common/constants";
import { BIGDECIMAL_ONE, BIGDECIMAL_ZERO, BIGINT_ZERO } from "./constants";
import { bigIntToBigDecimal } from "./numbers";

const OPTIMISM = "optimism";
const WETH = "WETH";
const WBTC = "WBTC";
const SDL = "SDL";

const USD_TOKENS = new Set<string>();
USD_TOKENS.add("alUSD");
USD_TOKENS.add("FEI");
USD_TOKENS.add("FRAX");
USD_TOKENS.add("LUSD");
USD_TOKENS.add("DAI");
USD_TOKENS.add("USDC");
USD_TOKENS.add("USDT");
USD_TOKENS.add("sUSD");
USD_TOKENS.add("wCUSD");
USD_TOKENS.add("nUSD");
USD_TOKENS.add("MIM");
USD_TOKENS.add("USDs");

const ETH_TOKENS = new Set<string>();
ETH_TOKENS.add(WETH);
ETH_TOKENS.add("alETH");
ETH_TOKENS.add("sETH");
ETH_TOKENS.add("vETH2");

const BTC_TOKENS = new Set<string>();
BTC_TOKENS.add(WBTC);
BTC_TOKENS.add("tBTC");
BTC_TOKENS.add("renBTC");
BTC_TOKENS.add("sBTC");

export function getPriceUSD(token: Token, event: ethereum.Event): BigDecimal {
  const symbol = token.symbol;
  if (USD_TOKENS.has(symbol)) {
    return BIGDECIMAL_ONE;
  }
  if (token.lastPriceBlockNumber == event.block.number) {
    return token.lastPriceUSD!;
  }
  // No market for SDL yet
  if (symbol == SDL) {
    return BIGDECIMAL_ZERO;
  }
  const network = dataSource.network();
  if (network == OPTIMISM) {
    // Optimism currently has only one USD pool, should not reach this
    log.error("Failed to fetch price: network {} not implemented", [network]);
    return BIGDECIMAL_ZERO;
  }
  let price: BigDecimal;
  if (ETH_TOKENS.has(symbol)) {
    const address = WHITELIST_TOKENS_MAP.get(network)!.get(WETH)!;
    price = getUsdPrice(address);
  } else if (BTC_TOKENS.has(symbol)) {
    const address = WHITELIST_TOKENS_MAP.get(network)!.get(WBTC)!;
    price = getUsdPrice(address);
  } else {
    price = getUsdPrice(Address.fromString(token.id));
  }
  token.lastPriceBlockNumber = event.block.number;
  token.lastPriceUSD = price;
  token.save();
  return price;
}

export function getTokenAmountsSumUSD(
  event: ethereum.Event,
  tokenAmounts: BigInt[],
  tokens: string[]
): BigDecimal {
  let sum = BIGDECIMAL_ZERO;
  for (let i = 0; i < tokens.length; i++) {
    if (tokenAmounts[i] == BIGINT_ZERO) {
      continue;
    }
    const token = getOrCreateTokenFromString(tokens[i]);
    const amount = bigIntToBigDecimal(tokenAmounts[i], token.decimals);
    sum = sum.plus(amount.times(getPriceUSD(token, event)));
  }
  return sum;
}
