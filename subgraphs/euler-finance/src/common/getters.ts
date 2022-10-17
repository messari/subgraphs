import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  Token,
  LendingProtocol,
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  UsageMetricsHourlySnapshot,
  Market,
  MarketDailySnapshot,
  MarketHourlySnapshot,
  Borrow,
  Withdraw,
  RewardToken,
  Deposit,
  Repay,
  Liquidate,
  InterestRate,
  _MarketUtility,
  _ProtocolUtility,
} from "../../generated/schema";
import { getAssetSymbol, getAssetName, getAssetDecimals } from "./tokens";
import {
  BIGDECIMAL_ZERO,
  Network,
  EULER_ADDRESS,
  ProtocolType,
  SECONDS_PER_DAY,
  BIGINT_ZERO,
  SECONDS_PER_HOUR,
  RewardTokenType,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  PROTOCOL_SCHEMA_VERSION,
  PROTOCOL_SUBGRAPH_VERSION,
  PROTOCOL_METHODOLOGY_VERSION,
  LendingType,
  RiskType,
  INT_ZERO,
} from "../common/constants";

export function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());
  // fetch info if null
  if (!token) {
    token = new Token(tokenAddress.toHexString());
    token.symbol = getAssetSymbol(tokenAddress);
    token.name = getAssetName(tokenAddress);
    token.decimals = getAssetDecimals(tokenAddress);
    token.lastPriceUSD = BIGDECIMAL_ZERO;
    token.lastPriceBlockNumber = BIGINT_ZERO;
    token.save();
  }
  return token as Token;
}

export function getOrCreateRewardToken(address: Address): RewardToken {
  let rewardToken = RewardToken.load(address.toHexString());
  if (rewardToken == null) {
    const token = getOrCreateToken(address);
    rewardToken = new RewardToken(address.toHexString());
    rewardToken.token = token.id;
    rewardToken.type = RewardTokenType.DEPOSIT;
    rewardToken.save();

    return rewardToken as RewardToken;
  }
  return rewardToken as RewardToken;
}

///////////////////
//// Snapshots ////
///////////////////

export function getOrCreateFinancials(timestamp: BigInt, blockNumber: BigInt): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  const id: i64 = timestamp.toI64() / SECONDS_PER_DAY;

  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = EULER_ADDRESS;
    financialMetrics.blockNumber = blockNumber;
    financialMetrics.timestamp = timestamp;
    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyDepositUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyBorrowUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyRepayUSD = BIGDECIMAL_ZERO;

    financialMetrics.save();
  }
  return financialMetrics as FinancialsDailySnapshot;
}

export function getOrCreateUsageDailySnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  const id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = EULER_ADDRESS;

    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.dailyDepositCount = 0;
    usageMetrics.dailyWithdrawCount = 0;
    usageMetrics.dailyBorrowCount = 0;
    usageMetrics.dailyRepayCount = 0;
    usageMetrics.dailyLiquidateCount = 0;
    usageMetrics.totalPoolCount = 0;
    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;
    usageMetrics.save();
  }

  return usageMetrics as UsageMetricsDailySnapshot;
}

export function getOrCreateUsageHourlySnapshot(event: ethereum.Event): UsageMetricsHourlySnapshot {
  // Number of days since Unix epoch
  const hour: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;

  // Create unique id for the day
  let usageMetrics = UsageMetricsHourlySnapshot.load(hour.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(hour.toString());
    usageMetrics.protocol = EULER_ADDRESS;

    usageMetrics.hourlyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.hourlyTransactionCount = 0;
    usageMetrics.hourlyDepositCount = 0;
    usageMetrics.hourlyWithdrawCount = 0;
    usageMetrics.hourlyBorrowCount = 0;
    usageMetrics.hourlyRepayCount = 0;
    usageMetrics.hourlyLiquidateCount = 0;
    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;
    usageMetrics.save();
  }

  return usageMetrics as UsageMetricsHourlySnapshot;
}

export function getOrCreateMarketDailySnapshot(block: ethereum.Block, marketId: string): MarketDailySnapshot {
  const id: i64 = block.timestamp.toI64() / SECONDS_PER_DAY;
  const marketAddress = marketId;
  let marketMetrics = MarketDailySnapshot.load(marketAddress.concat("-").concat(id.toString()));

  if (!marketMetrics) {
    marketMetrics = new MarketDailySnapshot(marketAddress.concat("-").concat(id.toString()));
    marketMetrics.protocol = EULER_ADDRESS;
    marketMetrics.market = marketAddress;
    marketMetrics.blockNumber = block.timestamp;
    marketMetrics.timestamp = block.timestamp;
    marketMetrics.rates = [];
    marketMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyRepayUSD = BIGDECIMAL_ZERO;
    marketMetrics.inputTokenBalance = BIGINT_ZERO;
    marketMetrics.inputTokenPriceUSD = BIGDECIMAL_ZERO;
    marketMetrics.outputTokenSupply = BIGINT_ZERO;
    marketMetrics.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    marketMetrics.exchangeRate = BIGDECIMAL_ZERO;
    marketMetrics.rewardTokenEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
    marketMetrics.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

    marketMetrics.save();
  }

  return marketMetrics as MarketDailySnapshot;
}

export function getOrCreateMarketHourlySnapshot(block: ethereum.Block, marketId: string): MarketHourlySnapshot {
  const hour: i64 = block.timestamp.toI64() / SECONDS_PER_HOUR;
  const marketAddress = marketId;
  const id = marketAddress + "-" + hour.toString();
  let marketMetrics = MarketHourlySnapshot.load(id);

  if (!marketMetrics) {
    marketMetrics = new MarketHourlySnapshot(id);
    marketMetrics.protocol = EULER_ADDRESS;
    marketMetrics.market = marketAddress;
    marketMetrics.blockNumber = block.timestamp;
    marketMetrics.timestamp = block.timestamp;
    marketMetrics.rates = [];
    marketMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyWithdrawUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyRepayUSD = BIGDECIMAL_ZERO;
    marketMetrics.inputTokenBalance = BIGINT_ZERO;
    marketMetrics.inputTokenPriceUSD = BIGDECIMAL_ZERO;
    marketMetrics.outputTokenSupply = BIGINT_ZERO;
    marketMetrics.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    marketMetrics.exchangeRate = BIGDECIMAL_ZERO;
    marketMetrics.rewardTokenEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
    marketMetrics.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

    marketMetrics.save();
  }

  return marketMetrics as MarketHourlySnapshot;
}

////////////////////////////
///// Lending Specific /////
////////////////////////////

export function getOrCreateMarket(id: string): Market {
  let market = Market.load(id);
  if (!market) {
    const protocol = getOrCreateLendingProtocol();

    market = new Market(id);
    market.protocol = protocol.id;
    market.isActive = true;
    market.canUseAsCollateral = false;
    market.canBorrowFrom = true;
    market.maximumLTV = BIGDECIMAL_ZERO;
    market.liquidationThreshold = BIGDECIMAL_ZERO;
    market.liquidationPenalty = BIGDECIMAL_ZERO;
    market.inputToken = id;
    market.rates = [];
    market.totalValueLockedUSD = BIGDECIMAL_ZERO;
    market.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    market.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    market.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    market.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    market.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    market.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    market.inputTokenBalance = BIGINT_ZERO;
    market.inputTokenPriceUSD = BIGDECIMAL_ZERO;
    market.outputTokenSupply = BIGINT_ZERO;
    market.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    market.createdTimestamp = BIGINT_ZERO;
    market.createdBlockNumber = BIGINT_ZERO;
    market.save();

    // update protocol.totalPoolCount
    protocol.totalPoolCount += 1;
    protocol.save();
  }
  return market as Market;
}

export function getOrCreateLendingProtocol(): LendingProtocol {
  let protocol = LendingProtocol.load(EULER_ADDRESS);

  if (!protocol) {
    protocol = new LendingProtocol(EULER_ADDRESS);
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.schemaVersion = PROTOCOL_SCHEMA_VERSION;
    protocol.subgraphVersion = PROTOCOL_SUBGRAPH_VERSION;
    protocol.methodologyVersion = PROTOCOL_METHODOLOGY_VERSION;
    protocol.network = Network.MAINNET;
    protocol.type = ProtocolType.LENDING;
    protocol.lendingType = LendingType.POOLED;
    protocol.riskType = RiskType.GLOBAL;
    protocol.cumulativeUniqueUsers = 0;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    protocol.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    protocol.mintedTokens = [];
    protocol.mintedTokenSupplies = [];
    protocol.totalPoolCount = INT_ZERO;
    protocol.save();
  }
  return protocol as LendingProtocol;
}

export function getOrCreateDeposit(event: ethereum.Event): Deposit {
  const hash = event.transaction.hash.toHexString();
  const logIndex = event.logIndex;
  const id = `${hash}-${logIndex}`;
  let entity = Deposit.load(id);
  if (!entity) {
    entity = new Deposit(id);
    entity.protocol = EULER_ADDRESS;
    entity.hash = hash;
    entity.logIndex = logIndex.toI32();
    entity.timestamp = event.block.timestamp;
    entity.blockNumber = event.block.number;
  }
  return entity as Deposit;
}

export function getOrCreateWithdraw(event: ethereum.Event): Withdraw {
  const hash = event.transaction.hash.toHexString();
  const logIndex = event.logIndex;
  const id = `${hash}-${logIndex}`;
  let entity = Withdraw.load(id);
  if (!entity) {
    entity = new Withdraw(id);
    entity.protocol = EULER_ADDRESS;
    entity.hash = hash;
    entity.logIndex = logIndex.toI32();
    entity.timestamp = event.block.timestamp;
    entity.blockNumber = event.block.number;
  }
  return entity as Withdraw;
}

export function getOrCreateBorrow(event: ethereum.Event): Borrow {
  const hash = event.transaction.hash.toHexString();
  const logIndex = event.logIndex;
  const id = `${hash}-${logIndex}`;
  let entity = Borrow.load(id);
  if (!entity) {
    entity = new Borrow(id);
    entity.protocol = EULER_ADDRESS;
    entity.hash = hash;
    entity.logIndex = logIndex.toI32();
    entity.timestamp = event.block.timestamp;
    entity.blockNumber = event.block.number;
  }
  return entity as Borrow;
}

export function getOrCreateRepay(event: ethereum.Event): Repay {
  const hash = event.transaction.hash.toHexString();
  const logIndex = event.logIndex;
  const id = `${hash}-${logIndex}`;
  let entity = Repay.load(id);
  if (!entity) {
    entity = new Repay(id);
    entity.protocol = EULER_ADDRESS;
    entity.hash = hash;
    entity.logIndex = logIndex.toI32();
    entity.timestamp = event.block.timestamp;
    entity.blockNumber = event.block.number;
  }
  return entity as Repay;
}

export function getOrCreateLiquidate(event: ethereum.Event): Liquidate {
  const hash = event.transaction.hash.toHexString();
  const logIndex = event.logIndex;
  const id = `${hash}-${logIndex}`;
  let entity = Liquidate.load(id);
  if (!entity) {
    entity = new Liquidate(id);
    entity.protocol = EULER_ADDRESS;
    entity.hash = hash;
    entity.logIndex = logIndex.toI32();
    entity.timestamp = event.block.timestamp;
    entity.blockNumber = event.block.number;
  }
  return entity as Liquidate;
}

export function getOrCreateInterestRate(rateSide: string, rateType: string, marketId: string): InterestRate {
  const id = rateSide + "-" + rateType + "-" + marketId;
  let rate = InterestRate.load(id);
  if (rate == null) {
    rate = new InterestRate(id);
    rate.rate = BIGDECIMAL_ZERO;
    rate.side = rateSide;
    rate.type = rateType;
    rate.save();
  }
  return rate;
}

export function getDaysSinceEpoch(secondsSinceEpoch: number): string {
  return (<i32>Math.floor(secondsSinceEpoch / SECONDS_PER_DAY)).toString();
}

export function getOrCreateMarketUtility(id: string): _MarketUtility {
  let entity = _MarketUtility.load(id);
  if (!entity) {
    entity = new _MarketUtility(id);
    entity.market = id;
    entity.lastUpdateTimestamp = BIGINT_ZERO;
    entity.twapPrice = BIGDECIMAL_ZERO;
    entity.twap = BIGINT_ZERO;
    entity.twapPeriod = BIGINT_ZERO;
    entity.borrowFactor = BIGINT_ZERO;
    entity.collateralFactor = BIGINT_ZERO;
    entity.save();
  }
  return entity as _MarketUtility;
}

export function getOrCreateProtocolUtility(blockNumber: i32): _ProtocolUtility {
  let protocol = _ProtocolUtility.load(EULER_ADDRESS);

  if (!protocol) {
    protocol = new _ProtocolUtility(EULER_ADDRESS);
    protocol.lastBlockNumber = blockNumber;
    protocol.markets = [];
    protocol.save();
  }
  return protocol as _ProtocolUtility;
}
