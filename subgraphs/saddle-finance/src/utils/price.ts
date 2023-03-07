import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { LiquidityPool, Token, _TokenPools } from "../../generated/schema";
import { SwapV1 as SwapContract } from "../../generated/templates/Swap/SwapV1";
import {
  getOrCreateTokenFromString,
  getTokenDecimals,
} from "../entities/token";
import { getUsdPrice } from "../prices";
import { BIGINT_TEN, WHITELIST_TOKENS_MAP } from "../prices/common/constants";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  WHITELISTED_STABLE_ADDRESSES,
  LIQUIDITY_THRESHOLD_FOR_SADDLE_PRICING,
} from "./constants";
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
  if (
    token.lastPriceBlockNumber &&
    token.lastPriceBlockNumber! == event.block.number
  ) {
    return token.lastPriceUSD!;
  }
  // No market for SDL yet
  if (symbol == SDL) {
    return BIGDECIMAL_ZERO;
  }

  if (token._pool) {
    // it is an LP token, get price from underlying
    const pool = LiquidityPool.load(token._pool!)!;
    return pool.outputTokenPriceUSD
      ? pool.outputTokenPriceUSD!
      : BIGDECIMAL_ZERO;
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

  if (!price || price.equals(BIGDECIMAL_ZERO)) {
    log.info("fetching token price from saddle: {}", [token.id]);
    price = getUSDPriceFromSaddle(Address.fromString(token.id));
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

// getUSDPriceFromSaddle will attempt to fetch a given token price from
// a saddle pool, using the highest liquidity pool that contains a whitelisted stable.
function getUSDPriceFromSaddle(token: Address): BigDecimal {
  if (!WHITELISTED_STABLE_ADDRESSES.has(dataSource.network())) {
    return BIGDECIMAL_ZERO;
  }

  const tp = _TokenPools.load(token.toHexString());
  if (!tp) {
    return BIGDECIMAL_ZERO;
  }

  const pool = getHighestLiquidityStablePool(tp.pools);
  if (!pool) {
    return BIGDECIMAL_ZERO;
  }

  const stable = pickOutputToken(pool.inputTokens);
  if (!stable) {
    log.error(
      "unable to calculate price, no route found to whitelisted stable. Token {} Pool {}",
      [token.toHexString(), pool.id]
    );
    return BIGDECIMAL_ZERO;
  }

  const inDecimals = getTokenDecimals(token.toHexString());
  const amountOne = BIGINT_TEN.pow(inDecimals as u8);
  const value = calculateSwap(pool, token, stable, amountOne);
  if (value.equals(BIGINT_ZERO)) {
    return BIGDECIMAL_ZERO;
  }

  const outDecimals = getTokenDecimals(stable.toHexString());
  return bigIntToBigDecimal(value, outDecimals);
}

function pickOutputToken(tokens: string[]): Address | null {
  const stables = WHITELISTED_STABLE_ADDRESSES.get(dataSource.network());
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (stables.has(token)) {
      return Address.fromString(token);
    }
  }

  return null;
}

function getHighestLiquidityStablePool(
  liqPools: string[] | null
): LiquidityPool | null {
  if (!liqPools) {
    return null;
  }

  let bestPool: LiquidityPool | null = null;
  let maxLiq = LIQUIDITY_THRESHOLD_FOR_SADDLE_PRICING;
  for (let i = 0; i < liqPools.length; i++) {
    const pool = LiquidityPool.load(liqPools[i])!;
    if (pool.totalValueLockedUSD.lt(maxLiq)) {
      continue;
    }

    if (!poolHasWhitelistedStable(pool)) {
      continue;
    }

    bestPool = pool;
    maxLiq = pool.totalValueLockedUSD;
  }
  return bestPool;
}

// poolHasWhitelistedStable will return true if the pool trades any of the
// whitelisted stable tokens.
function poolHasWhitelistedStable(pool: LiquidityPool): boolean {
  const stables = WHITELISTED_STABLE_ADDRESSES.get(dataSource.network());
  for (let i = 0; i < pool.inputTokens.length; i++) {
    if (stables.has(pool.inputTokens[i])) {
      return true;
    }
  }
  return false;
}

// calculateSwap returns the amount of `tokenOut` that would result from swapping
// `amount` of `tokenIn` in a given saddle pool.
function calculateSwap(
  pool: LiquidityPool,
  tokenIn: Address,
  tokenOut: Address,
  amount: BigInt
): BigInt {
  const inputIndex = pool._inputTokensOrdered.indexOf(tokenIn.toHexString());
  const outputIndex = pool._inputTokensOrdered.indexOf(tokenOut.toHexString());
  if (inputIndex == -1 || outputIndex == -1) {
    log.error(
      "error calculating price from saddle: token not found in target pool. InToken: {} OutToken: {} Pool: {}",
      [tokenIn.toHexString(), tokenOut.toHexString(), pool.id]
    );
    log.critical("", []);
    return BIGINT_ZERO;
  }

  const contract = SwapContract.bind(Address.fromString(pool.id));
  let call: ethereum.CallResult<BigInt>;
  if (!pool._basePool) {
    call = contract.try_calculateSwap(inputIndex, outputIndex, amount);
  } else {
    call = contract.try_calculateSwapUnderlying(
      inputIndex,
      outputIndex,
      amount
    );
  }
  if (call.reverted) {
    log.error(
      "unable to calculate swap from saddle pool. Pool: {}, TokenIn: {}, TokenOut: {}, Amount: {}",
      [
        pool.id,
        tokenIn.toHexString(),
        tokenOut.toHexString(),
        amount.toString(),
      ]
    );
    return BIGINT_ZERO;
  }

  return call.value;
}
