import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
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
  _AssetStatus,
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
  DEFAULT_RESERVE_FEE,
  BIGDECIMAL_ONE,
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
  return token;
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
  const days = (timestamp.toI64() / SECONDS_PER_DAY).toString();

  let financialMetrics = FinancialsDailySnapshot.load(days);

  if (!financialMetrics) {
    const protocol = getOrCreateLendingProtocol();
    financialMetrics = new FinancialsDailySnapshot(days);
    financialMetrics.protocol = protocol.id;
    financialMetrics.blockNumber = blockNumber;
    financialMetrics.timestamp = timestamp;

    // update vars
    financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
    financialMetrics.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
    financialMetrics.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
    financialMetrics.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
    financialMetrics.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
    financialMetrics.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;

    // update cumul revenues
    financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
    financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
    financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;

    //updated in updateFinancials()
    financialMetrics.dailyDepositUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyBorrowUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyRepayUSD = BIGDECIMAL_ZERO;

    //daily revenues updated in updateRevenue()
    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;

    financialMetrics.save();
  }
  return financialMetrics;
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

  return usageMetrics;
}

/**
 *
 * @param block: ethereum.block
 * @param marketId: id of market
 * @returns MarketDailySnapshot
 */
export function getOrCreateMarketDailySnapshot(block: ethereum.Block, marketId: string): MarketDailySnapshot {
  const days: i64 = block.timestamp.toI64() / SECONDS_PER_DAY;
  const snapshotID = `${marketId}-${days.toString()}`;
  let marketMetrics = MarketDailySnapshot.load(snapshotID);

  if (!marketMetrics) {
    const market = getOrCreateMarket(marketId);
    marketMetrics = new MarketDailySnapshot(snapshotID);
    marketMetrics.protocol = EULER_ADDRESS;
    marketMetrics.market = marketId;
    marketMetrics.blockNumber = block.timestamp;
    marketMetrics.timestamp = block.timestamp;

    // update other vars
    marketMetrics.totalValueLockedUSD = market.totalValueLockedUSD;
    marketMetrics.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD;
    marketMetrics.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD;
    marketMetrics.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
    marketMetrics.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
    marketMetrics.cumulativeDepositUSD = market.cumulativeDepositUSD;
    marketMetrics.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
    marketMetrics.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
    marketMetrics.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
    marketMetrics.inputTokenBalance = market.inputTokenBalance;
    marketMetrics.inputTokenPriceUSD = market.inputTokenPriceUSD;
    marketMetrics.outputTokenSupply = market.outputTokenSupply;
    marketMetrics.outputTokenPriceUSD = market.outputTokenPriceUSD;
    marketMetrics.exchangeRate = market.exchangeRate;
    marketMetrics.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
    marketMetrics.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
    marketMetrics.rates = market.rates; //rates snapshoted in updateInterestRates()

    // daily revenue updated in updateRevenue
    marketMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    // updated in updateMarketSnapshots
    marketMetrics.dailyDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyRepayUSD = BIGDECIMAL_ZERO;

    marketMetrics.save();
  }

  return marketMetrics;
}

/**
 *
 * @param block: ethereum.block
 * @param marketId: id of market
 * @returns MarketHourlySnapshot
 */
export function getOrCreateMarketHourlySnapshot(block: ethereum.Block, marketId: string): MarketHourlySnapshot {
  const hours: i64 = block.timestamp.toI64() / SECONDS_PER_HOUR;
  const snapshotID = `${marketId}- ${hours.toString()}`;
  let marketMetrics = MarketHourlySnapshot.load(snapshotID);

  if (!marketMetrics) {
    const market = getOrCreateMarket(marketId);
    marketMetrics = new MarketHourlySnapshot(snapshotID);
    marketMetrics.protocol = EULER_ADDRESS;
    marketMetrics.market = marketId;
    marketMetrics.blockNumber = block.timestamp;
    marketMetrics.timestamp = block.timestamp;

    // update other vars
    marketMetrics.totalValueLockedUSD = market.totalValueLockedUSD;
    marketMetrics.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD;
    marketMetrics.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD;
    marketMetrics.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
    marketMetrics.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
    marketMetrics.cumulativeDepositUSD = market.cumulativeDepositUSD;
    marketMetrics.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
    marketMetrics.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
    marketMetrics.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
    marketMetrics.inputTokenBalance = market.inputTokenBalance;
    marketMetrics.inputTokenPriceUSD = market.inputTokenPriceUSD;
    marketMetrics.outputTokenSupply = market.outputTokenSupply;
    marketMetrics.outputTokenPriceUSD = market.outputTokenPriceUSD;
    marketMetrics.exchangeRate = market.exchangeRate;
    marketMetrics.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
    marketMetrics.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
    marketMetrics.rates = market.rates; //rates snapshoted in updateInterestRates()

    // daily revenue updated in updateRevenue
    marketMetrics.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;
    // updated in updateMarketSnapshots
    marketMetrics.hourlyDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyWithdrawUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyRepayUSD = BIGDECIMAL_ZERO;
    marketMetrics.save();
  }

  return marketMetrics;
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
    market.exchangeRate = BIGDECIMAL_ONE;
    market._totalBorrowBalance = BIGINT_ZERO;
    market._dTokenExchangeRate = BIGDECIMAL_ONE;
    market.save();

    // update protocol.totalPoolCount
    protocol.totalPoolCount += 1;
    const marketIDs = protocol._marketIDs!;
    marketIDs.push(market.id);
    protocol._marketIDs = marketIDs;

    protocol.save();
  }
  return market;
}

export function getOrCreateLendingProtocol(): LendingProtocol {
  let protocol = LendingProtocol.load(EULER_ADDRESS);

  if (!protocol) {
    protocol = new LendingProtocol(EULER_ADDRESS);
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
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
    protocol._marketIDs = [];
    protocol._lastUpdateBlockNumber = BIGINT_ZERO;
  }
  // ensure to update versions with grafting
  protocol.schemaVersion = PROTOCOL_SCHEMA_VERSION;
  protocol.subgraphVersion = PROTOCOL_SUBGRAPH_VERSION;
  protocol.methodologyVersion = PROTOCOL_METHODOLOGY_VERSION;
  protocol.save();
  return protocol;
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

export function getOrCreateAssetStatus(id: string): _AssetStatus {
  let assetStatus = _AssetStatus.load(id);
  if (!assetStatus) {
    assetStatus = new _AssetStatus(id);
    assetStatus.totalBorrows = BIGINT_ZERO;
    assetStatus.totalBalances = BIGINT_ZERO;
    assetStatus.reserveFee = BigInt.fromString(DEFAULT_RESERVE_FEE.truncate(0).toString());
    assetStatus.reserveBalance = BIGINT_ZERO; // INITIAL_RESERVES
    assetStatus.interestRate = BIGINT_ZERO;
    assetStatus.timestamp = BIGINT_ZERO;
    assetStatus.save();
  }
  return assetStatus;
}

// this is needed to prevent snapshot rates from being pointers to the current rate
export function getSnapshotRates(rates: string[], timeSuffix: string): string[] {
  const snapshotRates: string[] = [];
  for (let i = 0; i < rates.length; i++) {
    const rate = InterestRate.load(rates[i]);
    if (!rate) {
      log.error("[getSnapshotRates] rate {} not found, should not happen", [rates[i]]);
      continue;
    }

    // create new snapshot rate
    const snapshotRateId = rates[i].concat("-").concat(timeSuffix);
    const snapshotRate = new InterestRate(snapshotRateId);
    snapshotRate.side = rate.side;
    snapshotRate.type = rate.type;
    snapshotRate.rate = rate.rate;
    snapshotRate.save();
    snapshotRates.push(snapshotRateId);
  }
  return snapshotRates;
}
