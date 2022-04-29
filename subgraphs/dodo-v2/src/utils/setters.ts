// import { log } from "@graphprotocol/graph-ts"
import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { bigIntToBigDecimal, calculateAverage, safeDiv } from "./numbers";

import {
  Token,
  DexAmmProtocol,
  LiquidityPool,
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  RewardToken,
  Deposit,
  Withdraw,
  Swap
} from "../../generated/schema";

import { getOrCreatePool, getUSDprice, getOrCreateToken } from "./getters";

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

import { ERC20 } from "../../generated/CP/ERC20";

import { DVM } from "../../generated/DVM/DVM";
import { CP } from "../../generated/CP/CP";
import { DPP } from "../../generated/DPP/DPP";
import { DSP } from "../../generated/DSP/DSP";

export function setUSDprice(
  event: ethereum.Event,
  tokenAdd: Address,
  amount: BigInt,
  stableCoin: Address,
  scAmount: BigInt
): void {
  let token = getOrCreateToken(tokenAdd);

  let pricePerToken = safeDiv(
    bigIntToBigDecimal(amount),
    bigIntToBigDecimal(scAmount)
  );
  token.lastPriceUSD = pricePerToken;
  token.lastPriceBlockNumber = event.block.number;
  token.save();
}

/////////////////////////////////////////////////

export function setUSDpriceWETH(
  event: ethereum.Event,
  tokenAdd: Address,
  trader: Address,
  amount: BigInt,
  wETHamount: BigInt
): void {
  let ethPricePerToken = amount.div(wETHamount);
  let pricePerToken = getUSDprice(
    Address.fromString(WRAPPED_ETH),
    ethPricePerToken
  );

  let token = getOrCreateToken(tokenAdd);
  token.lastPriceUSD = pricePerToken;
  token.lastPriceBlockNumber = event.block.number;
  token.save();
}

/////////////////////////////////////////////////

export function setPriceLP(
  timestamp: BigInt,
  blockNumber: BigInt,
  poolAdd: Address
): void {
  let token = getOrCreateToken(poolAdd);

  let pool = getOrCreatePool(poolAdd, poolAdd, poolAdd, blockNumber, timestamp);

  let tokens = pool.inputTokens;

  let token1 = ERC20.bind(Address.fromString(tokens[0]));
  let token2 = ERC20.bind(Address.fromString(tokens[1]));
  let lpToken = ERC20.bind(poolAdd);

  let tokenBal1 = token1.try_balanceOf(poolAdd);
  if (tokenBal1.reverted) {
    return;
  }

  let tokenBal2 = token2.try_balanceOf(poolAdd);
  if (tokenBal2.reverted) {
    return;
  }

  let tokeBal1Val = getUSDprice(Address.fromString(tokens[0]), tokenBal1.value);

  let tokeBal2Val = getUSDprice(Address.fromString(tokens[1]), tokenBal2.value);

  let totalValPool = tokeBal1Val + tokeBal2Val;
  let totalSupplyLP = lpToken.totalSupply();
  let valueOfOneLP = safeDiv(totalValPool, bigIntToBigDecimal(totalSupplyLP));
  token.lastPriceUSD = valueOfOneLP;
  token.lastPriceBlockNumber = blockNumber;

  token.save();
}

/////////////////////////////////

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
    priceUSDtoken1 = getUSDprice(tokenAdd1, difToken1);
  }

  if (difToken2 > BigInt.fromI32(0)) {
    priceUSDtoken2 = getUSDprice(tokenAdd2, difToken2);
  }

  let usdTotal = priceUSDtoken1 + priceUSDtoken2;

  let lpToken = getOrCreateToken(poolAdd);

  deposit.hash = event.transaction.hash.toHexString();
  deposit.logIndex = event.logIndex.toI32();
  deposit.protocol = pool.protocol;
  deposit.to = poolAdd.toHexString();
  deposit.from = to.toHexString();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.inputTokens = tokens;
  deposit.outputToken = lpToken.id;
  deposit.inputTokenAmounts = [difToken1, difToken2];
  deposit.outputTokenAmount = shareAmount;
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
  // let withdraw = new Withdraw(
  //   event.transaction.hash
  //     .toHexString()
  //     .concat("-")
  //     .concat(event.logIndex.toHexString())
  // );
  // let pool = getOrCreatePool(
  //   poolAdd,
  //   poolAdd,
  //   poolAdd,
  //   event.block.number,
  //   event.block.timestamp
  // );
  // //
  // let priorBalance = pool.inputTokenBalances;
  // let tokens = pool.inputTokens;
  // let token1 = ERC20.bind(Address.fromString(tokens[0]));
  // let token2 = ERC20.bind(Address.fromString(tokens[1]));
  //
  // let tokenBal1 = token1.try_balanceOf(poolAdd);
  // if (tokenBal1.reverted) {
  //   return;
  // }
  //
  // let tokenBal2 = token2.try_balanceOf(poolAdd);
  // if (tokenBal2.reverted) {
  //   return;
  // }
  //
  // let difToken1 = priorBalance[0] - tokenBal1.value;
  // let difToken2 = priorBalance[1] - tokenBal2.value;
  //
  // let priceUSDtoken1 = BigDecimal.fromString("0");
  // let priceUSDtoken2 = BigDecimal.fromString("0");
  //
  // let tokenAdd1 = Address.fromString(tokens[0]);
  // let tokenAdd2 = Address.fromString(tokens[1]);
  //
  // if (difToken1 > BigInt.fromI32(0)) {
  //   priceUSDtoken1 = getUSDprice(tokenAdd1, difToken1);
  // }
  //
  // if (difToken2 > BigInt.fromI32(0)) {
  //   priceUSDtoken2 = getUSDprice(tokenAdd2, difToken2);
  // }
  //
  // let usdTotal = priceUSDtoken1 + priceUSDtoken2;
  //
  // let lpToken = getOrCreateToken(poolAdd);
  //
  // withdraw.hash = event.transaction.hash.toHexString();
  // withdraw.logIndex = event.logIndex.toI32();
  // withdraw.protocol = pool.protocol;
  // withdraw.to = poolAdd.toHexString();
  // withdraw.from = to.toHexString();
  // withdraw.blockNumber = event.block.number;
  // withdraw.timestamp = event.block.timestamp;
  // withdraw.inputTokens = tokens;
  // withdraw.outputToken = lpToken.id;
  // withdraw.inputTokenAmounts = [difToken1, difToken2];
  // withdraw.outputTokenAmount = shareAmount;
  // withdraw.amountUSD = usdTotal;
  // withdraw.pool = pool.id;
  //
  // pool.inputTokenBalances = [tokenBal1.value, tokenBal2.value];
  //
  // withdraw.save();
  // pool.save();
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

  let priceUSDtoken1 = getUSDprice(tokenIn, amountIn);

  let priceUSDtoken2 = getUSDprice(tokenOut, amountOut);

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
