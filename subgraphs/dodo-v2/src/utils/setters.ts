// import { log } from "@graphprotocol/graph-ts"
import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { bigIntToBigDecimal, calculateAverage, safeDiv } from "./numbers";

import {
  Token,
  _TokenPrice,
  DexAmmProtocol,
  LiquidityPool,
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  PoolDailySnapshot,
  RewardToken,
  Deposit,
  Withdraw,
  Swap
} from "../../generated/schema";

import {
  getOrCreateDexAmm,
  getOrCreatePoolDailySnapshot,
  getOrCreateUsageMetricSnapshot,
  getOrCreateFinancials,
  getOrCreatePool,
  getUSDprice,
  getOrCreateToken
} from "./getters";

import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from "./tokens";

import {
  ZERO_BD,
  ZERO_BI,
  ONE_BI,
  WRAPPED_ETH,
  Network,
  ProtocolType,
  RewardTokenType,
  SECONDS_PER_DAY,
  DODOLpToken_ADDRESS,
  vDODOToken_ADDRESS,
  DVMFactory_ADDRESS,
  CPFactory_ADDRESS,
  DPPFactory_ADDRESS,
  DSPFactory_ADDRESS,
  STABLE_COINS
} from "./constants";

import { Address, BigDecimal } from "@graphprotocol/graph-ts";

import { ERC20 } from "../../generated/ERC20/ERC20";

import { DVM } from "../../generated/DVM/DVM";
import { CP } from "../../generated/CP/CP";
import { DPP } from "../../generated/DPP/DPP";
import { DSP } from "../../generated/DSP/DSP";

export function setUSDprice(
  tokenAdd: Address,
  amount: BigInt,
  stableCoin: Address,
  scAmount: BigInt
): void {
  let pricePerToken = safeDiv(
    bigIntToBigDecimal(amount),
    bigIntToBigDecimal(scAmount)
  );

  let tokenPrice = _TokenPrice.load(
    tokenAdd.toHexString() + stableCoin.toHexString()
  );

  if (!tokenPrice) {
    tokenPrice = new _TokenPrice(
      tokenAdd.toHexString() + stableCoin.toHexString()
    );

    let token = getOrCreateToken(tokenAdd);
    tokenPrice.token = token.id;
  }
  tokenPrice.currentUSDprice = pricePerToken;

  tokenPrice.save();
}

export function setUSDpriceWETH(
  tokenAdd: Address,
  trader: Address,
  amount: BigInt,
  wETHamount: BigInt
): void {
  let ethPricePerToken = amount.div(wETHamount);

  let pricePerToken = getUSDprice(
    trader,
    Address.fromString(WRAPPED_ETH),
    ethPricePerToken
  );

  let token = getOrCreateToken(tokenAdd);

  let tokenPrice1 = _TokenPrice.load(
    tokenAdd.toHexString() + Address.fromString(STABLE_COINS[0]).toHexString()
  );

  if (!tokenPrice1) {
    tokenPrice1 = new _TokenPrice(
      tokenAdd.toHexString() + Address.fromString(STABLE_COINS[0]).toHexString()
    );
    tokenPrice1.token = token.id;
  }
  tokenPrice1.currentUSDprice = pricePerToken;

  tokenPrice1.save();

  let tokenPrice2 = _TokenPrice.load(
    tokenAdd.toHexString() + Address.fromString(STABLE_COINS[1]).toHexString()
  );

  if (!tokenPrice2) {
    tokenPrice2 = new _TokenPrice(
      tokenAdd.toHexString() + Address.fromString(STABLE_COINS[1]).toHexString()
    );
    tokenPrice2.token = token.id;
  }
  tokenPrice2.currentUSDprice = pricePerToken;

  tokenPrice2.save();

  let tokenPrice3 = _TokenPrice.load(
    tokenAdd.toHexString() + Address.fromString(STABLE_COINS[2]).toHexString()
  );

  if (!tokenPrice3) {
    tokenPrice3 = new _TokenPrice(
      tokenAdd.toHexString() + Address.fromString(STABLE_COINS[2]).toHexString()
    );
    tokenPrice3.token = token.id;
  }
  tokenPrice3.currentUSDprice = pricePerToken;

  tokenPrice3.save();
}

export function createDeposit(
  event: ethereum.Event,
  to: Address,
  poolAdd: Address,
  shareAmount: BigInt
): void {
  let deposit = new Deposit(
    event.transaction.hash
      .toHexString()
      .concat("-")
      .concat(event.logIndex.toString())
  );

  let pool = getOrCreatePool(
    poolAdd,
    poolAdd,
    poolAdd,
    event.block.number,
    event.block.timestamp
  );

  let priorBalance = pool.inputTokenBalances;
  let tokens = pool.inputTokens;

  let token1 = ERC20.bind(Address.fromString(tokens[0]));
  let token2 = ERC20.bind(Address.fromString(tokens[1]));

  let tokenBal1 = token1.try_balanceOf(poolAdd);
  if (tokenBal1.reverted) {
    return;
  }

  let tokenBal2 = token2.try_balanceOf(poolAdd);
  if (tokenBal2.reverted) {
    return;
  }

  let difToken1 = tokenBal1.value - priorBalance[0];

  let difToken2 = tokenBal2.value - priorBalance[1];

  let priceUSDtoken1 = BigDecimal.fromString("0");
  let priceUSDtoken2 = BigDecimal.fromString("0");

  let tokenAdd1 = Address.fromString(tokens[0]);
  let tokenAdd2 = Address.fromString(tokens[1]);

  if (difToken1 > BigInt.fromI32(0)) {
    priceUSDtoken1 = getUSDprice(to, tokenAdd1, difToken1);
  }

  if (difToken2 > BigInt.fromI32(0)) {
    priceUSDtoken2 = getUSDprice(to, tokenAdd2, difToken2);
  }
  let usdTotal = priceUSDtoken1 + priceUSDtoken2;

  deposit.hash = event.transaction.hash.toHexString();
  deposit.logIndex = event.logIndex.toI32();
  deposit.protocol = pool.protocol;
  deposit.to = poolAdd.toHexString();
  deposit.from = to.toHexString();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.inputTokenAmounts = [difToken1, difToken2];
  deposit.amountUSD = usdTotal;
  deposit.pool = pool.id;

  pool.inputTokenBalances = [tokenBal1.value, tokenBal2.value];

  deposit.save();
  pool.save();
}

export function createWithdraw(
  event: ethereum.Event,
  to: Address,
  poolAdd: Address,
  shareAmount: BigInt
): void {
  let withdraw = new Withdraw(
    event.transaction.hash
      .toHexString()
      .concat("-")
      .concat(event.logIndex.toHexString())
  );
  let pool = getOrCreatePool(
    poolAdd,
    poolAdd,
    poolAdd,
    event.block.number,
    event.block.timestamp
  );
  //
  let priorBalance = pool.inputTokenBalances;
  let tokens = pool.inputTokens;
  let token1 = ERC20.bind(Address.fromString(tokens[0]));
  let token2 = ERC20.bind(Address.fromString(tokens[1]));

  let tokenBal1 = token1.try_balanceOf(poolAdd);
  if (tokenBal1.reverted) {
    return;
  }

  let tokenBal2 = token2.try_balanceOf(poolAdd);
  if (tokenBal2.reverted) {
    return;
  }

  let pB1 = priorBalance[0];
  let pB2 = priorBalance[1];

  let tB1 = tokenBal1.value;
  let tB2 = tokenBal2.value;

  let difToken1 = pB1 - tB1;
  let difToken2 = pB2 - tB2;

  let priceUSDtoken1 = BigDecimal.fromString("0");
  let priceUSDtoken2 = BigDecimal.fromString("0");

  let tokenAdd1 = Address.fromString(tokens[0]);
  let tokenAdd2 = Address.fromString(tokens[1]);

  if (difToken1 > BigInt.fromI32(0)) {
    priceUSDtoken1 = getUSDprice(to, tokenAdd1, difToken1);
  }

  if (difToken2 > BigInt.fromI32(0)) {
    priceUSDtoken2 = getUSDprice(to, tokenAdd2, difToken2);
  }

  let usdTotal = priceUSDtoken1 + priceUSDtoken2;

  withdraw.hash = event.transaction.hash.toHexString();
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.protocol = pool.protocol;
  withdraw.to = poolAdd.toHexString();
  withdraw.from = to.toHexString();
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.inputTokenAmounts = [difToken1, difToken2];
  withdraw.amountUSD = usdTotal;
  withdraw.pool = pool.id;

  pool.inputTokenBalances = [tokenBal1.value, tokenBal2.value];

  withdraw.save();
  pool.save();
}

export function createSwap(
  event: ethereum.Event,
  trader: Address,
  poolAdd: Address,
  tokenIn: Address,
  tokenOut: Address,
  amountIn: BigInt,
  amountOut: BigInt
): void {
  let swap = new Swap(
    event.transaction.hash
      .toHexString()
      .concat("-")
      .concat(event.logIndex.toString())
  );

  let pool = getOrCreatePool(
    poolAdd,
    poolAdd,
    poolAdd,
    event.block.number,
    event.block.timestamp
  );
  let inToken = getOrCreateToken(tokenIn);
  let outToken = getOrCreateToken(tokenOut);

  let priceUSDtoken1 = getUSDprice(trader, tokenIn, amountIn);

  let priceUSDtoken2 = getUSDprice(trader, tokenOut, amountOut);

  swap.hash = event.transaction.hash.toHexString();
  swap.logIndex = event.logIndex.toI32();
  swap.protocol = pool.protocol;
  swap.to = trader.toHexString();
  swap.from = poolAdd.toHexString();
  swap.blockNumber = event.block.number;
  swap.timestamp = event.block.timestamp;
  swap.tokenIn = inToken.id;
  swap.amountIn = amountIn;
  swap.amountInUSD = priceUSDtoken1;
  swap.tokenOut = outToken.id;
  swap.amountOut = amountOut;
  swap.amountOutUSD = priceUSDtoken2;
  swap.pool = pool.id;

  swap.save();
}
