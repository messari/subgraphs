// import { log } from "@graphprotocol/graph-ts"
import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { bigIntToBigDecimal, calculateAverage } from "./numbers";

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

import { DVMFactory } from "../../generated/DVMFactory/DVMFactory";
import { CrowdPoolingFactory } from "../../generated/CrowdPoolingFactory/CrowdPoolingFactory";
import { DSPFactory } from "../../generated/DSPFactory/DSPFactory";
import { DPPFactory } from "../../generated/DPPFactory/DPPFactory";
import { DVM } from "../../generated/DVM/DVM";
import { CP } from "../../generated/CP/CP";
import { DPP } from "../../generated/DPP/DPP";
import { DSP } from "../../generated/DSP/DSP";

let FACTORIES: string[] = [
  DVMFactory_ADDRESS,
  CPFactory_ADDRESS,
  DPPFactory_ADDRESS,
  DSPFactory_ADDRESS
];

export function getOrCreateRewardToken(rewardToken: Address): RewardToken {
  let token = RewardToken.load(rewardToken.toHexString());
  // fetch info if null
  if (!token) {
    token = new RewardToken(rewardToken.toHexString());
    token.symbol = fetchTokenSymbol(rewardToken);
    token.name = fetchTokenName(rewardToken);
    token.decimals = fetchTokenDecimals(rewardToken);
    token.type = RewardTokenType.DEPOSIT;
    token.save();
  }
  return token;
}

export function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());
  // fetch info if null
  if (!token) {
    token = new Token(tokenAddress.toHexString());
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.name = fetchTokenName(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress);
    token.save();
  }
  return token;
}

export function getOrCreateDexAmm(factoryAddress: Address): DexAmmProtocol {
  let proto = getProtocolFromPool(factoryAddress);
  let protocol = DexAmmProtocol.load(proto);

  if (!protocol) {
    protocol = new DexAmmProtocol(proto);
    protocol.name = "DODO V2";
    protocol.slug = "messari-dodo";
    protocol.schemaVersion = "1.0.0";
    protocol.subgraphVersion = "1.0.0";
    protocol.network = Network.ETHEREUM;
    protocol.type = ProtocolType.EXCHANGE;
    protocol.totalUniqueUsers = 0;
    protocol.totalValueLockedUSD = ZERO_BD;

    protocol.save();
  }
  return protocol;
}

export function getOrCreatePool(
  poolAddress: Address,
  baseAdd: Address,
  quoteAdd: Address,
  timestamp: BigInt,
  blockNumber: BigInt
): LiquidityPool {
  let dodo = getOrCreateDexAmm(poolAddress);
  let pool = LiquidityPool.load(poolAddress.toHex());
  let it = getOrCreateToken(baseAdd);
  let ot = getOrCreateToken(quoteAdd);
  let dodoLp = getOrCreateRewardToken(Address.fromString(DODOLpToken_ADDRESS));
  let vdodo = getOrCreateRewardToken(Address.fromString(vDODOToken_ADDRESS));
  let lpToken = getOrCreateToken(poolAddress);

  if (!pool) {
    pool = new LiquidityPool(poolAddress.toHex());
    pool.protocol = dodo.id;
    pool.inputTokens = [it.id, ot.id];
    pool.outputToken = lpToken.id;
    pool.rewardTokens = [dodoLp.id, vdodo.id];
    pool.totalValueLockedUSD = ZERO_BD;
    pool.totalVolumeUSD = ZERO_BD;
    pool.inputTokenBalances = [ZERO_BI];
    pool.outputTokenSupply = ZERO_BI;
    pool.outputTokenPriceUSD = ZERO_BD;
    pool.rewardTokenEmissionsAmount = [ZERO_BI];
    pool.rewardTokenEmissionsUSD = [ZERO_BD];
    pool.createdTimestamp = timestamp;
    pool.createdBlockNumber = blockNumber;
    pool.save();
  }
  return pool;
}

export function getOrCreateUsageMetricSnapshot(
  event: ethereum.Event
): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = getProtocolFromPool(event.address);

    usageMetrics.activeUsers = 0;
    usageMetrics.totalUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateFinancials(
  event: ethereum.Event
): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = getProtocolFromPool(event.address);

    financialMetrics.feesUSD = ZERO_BD;
    financialMetrics.totalVolumeUSD = ZERO_BD;
    financialMetrics.totalValueLockedUSD = ZERO_BD;
    financialMetrics.supplySideRevenueUSD = ZERO_BD;
    financialMetrics.protocolSideRevenueUSD = ZERO_BD;

    financialMetrics.save();
  }
  return financialMetrics;
}

export function getOrCreatePoolDailySnapshot(
  event: ethereum.Event
): PoolDailySnapshot {
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let poolAddress = event.address.toHexString();
  let poolMetrics = PoolDailySnapshot.load(
    poolAddress.concat("-").concat(id.toString())
  );

  if (!poolMetrics) {
    poolMetrics = new PoolDailySnapshot(
      poolAddress.concat("-").concat(id.toString())
    );

    poolMetrics.protocol = getProtocolFromPool(event.address);
    poolMetrics.pool = poolAddress;
    poolMetrics.rewardTokenEmissionsAmount = [];
    poolMetrics.rewardTokenEmissionsUSD = [];

    poolMetrics.save();
  }

  return poolMetrics;
}

function getProtocolFromPool(poolAddress: Address): string {
  let pool = DVM.bind(poolAddress);
  let callResult = pool.try_version();
  let version = "";

  if (callResult.reverted) {
    log.info("pool get version reverted", []);
  } else {
    version = callResult.value;
  }

  let factoryAdd = "";
  if (version == "DVM 1.0.2") {
    factoryAdd = DVMFactory_ADDRESS;
  } else if (version == "CP 1.0.0") {
    factoryAdd = CPFactory_ADDRESS;
  } else if (version == "DPP 1.0.0") {
    factoryAdd = DPPFactory_ADDRESS;
  } else if (version == "DSP 1.0.1") {
    factoryAdd = DSPFactory_ADDRESS;
  }
  return factoryAdd;
}

export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
  if (amount1.equals(ZERO_BD)) {
    return ZERO_BD;
  } else {
    return amount0.div(amount1);
  }
}

// USD Pricing Functions

export function getUSDprice(
  trader: Address,
  tokenAddress: Address,
  amount: BigInt
): BigDecimal {
  let total = ZERO_BD;

  let sc1 = STABLE_COINS[0];
  let sc2 = STABLE_COINS[1];
  let sc3 = STABLE_COINS[2];

  let divisionCounter = 0;

  log.info("address of token whos price is being checked: {} ", [
    tokenAddress.toHexString()
  ]);
  // let scAdd = STABLE_COINS[i];
  // for whatever reason trying to access the stablecoins array
  // from within a for loop causes a weird nondescript array error
  let tokenPrice1 = _TokenPrice.load(tokenAddress.toHexString() + sc1);
  if (!tokenPrice1) {
    tokenPrice1 = new _TokenPrice(tokenAddress.toHexString() + sc1);
    let token = getOrCreateToken(tokenAddress);
    tokenPrice1.token = token.id;
  }
  if (tokenPrice1.currentUSDprice > BigDecimal.fromString("0")) {
    total = tokenPrice1.currentUSDprice;
    divisionCounter++;
  }

  let tokenPrice2 = _TokenPrice.load(tokenAddress.toHexString() + sc2);
  if (!tokenPrice2) {
    tokenPrice2 = new _TokenPrice(tokenAddress.toHexString() + sc2);
    let token = getOrCreateToken(tokenAddress);
    tokenPrice2.token = token.id;
  }

  if (tokenPrice2.currentUSDprice > BigDecimal.fromString("0")) {
    total = total + tokenPrice2.currentUSDprice;
    divisionCounter++;
  }

  let tokenPrice3 = _TokenPrice.load(tokenAddress.toHexString() + sc3);
  if (!tokenPrice3) {
    tokenPrice3 = new _TokenPrice(tokenAddress.toHexString() + sc3);
    let token = getOrCreateToken(tokenAddress);
    tokenPrice3.token = token.id;
  }
  if (tokenPrice3.currentUSDprice > BigDecimal.fromString("0")) {
    total = total + tokenPrice3.currentUSDprice;
    divisionCounter++;
  }
  if (total == ZERO_BD) {
    return ZERO_BD;
  }
  let price = safeDiv(total, BigDecimal.fromString(divisionCounter.toString()));

  return price;
}

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

  let priceUSDtoken1 = getUSDprice(
    to,
    Address.fromString(tokens[0]),
    difToken1
  );
  let priceUSDtoken2 = getUSDprice(
    to,
    Address.fromString(tokens[1]),
    difToken2
  );
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

  let difToken1 = priorBalance[0] - tokenBal1.value;

  let difToken2 = priorBalance[1] - tokenBal2.value;
  let priceUSDtoken1 = getUSDprice(
    to,
    Address.fromString(tokens[0]),
    difToken1
  );
  let priceUSDtoken2 = getUSDprice(
    to,
    Address.fromString(tokens[1]),
    difToken2
  );
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
