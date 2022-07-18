// Helpers for the general mapping.ts file
import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  equalsIgnoreCase,
  exponentToBigDecimal,
  INT_ZERO,
  LendingType,
  Network,
  ProtocolType,
  readValue,
  RiskType,
  USDC_TOKEN_ADDRESS,
  ZERO_ADDRESS,
  ActivityType,
  EventType,
  SECONDS_PER_HOUR,
  SECONDS_PER_DAY,
} from "./constants";
import {
  Account,
  ActiveAccount,
  FinancialsDailySnapshot,
  InterestRate,
  LendingProtocol,
  Market,
  MarketDailySnapshot,
  MarketHourlySnapshot,
  RewardToken,
  Token,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
} from "../generated/schema";
import { ProtocolData } from "./mapping";
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol } from "./token";
import { IPriceOracleGetter } from "../generated/templates/LendingPool/IPriceOracleGetter";

////////////////////////
///// Initializers /////
////////////////////////

export function getOrCreateLendingProtocol(
  protocolData: ProtocolData
): LendingProtocol {
  let lendingProtocol = LendingProtocol.load(protocolData.protocolAddress);

  if (!lendingProtocol) {
    lendingProtocol = new LendingProtocol(protocolData.protocolAddress);

    lendingProtocol.name = protocolData.name;
    lendingProtocol.slug = protocolData.slug;
    lendingProtocol.schemaVersion = protocolData.schemaVersion;
    lendingProtocol.subgraphVersion = protocolData.subgraphVersion;
    lendingProtocol.methodologyVersion = protocolData.methodologyVersion;
    lendingProtocol.network = protocolData.network;
    lendingProtocol.type = ProtocolType.LENDING;
    lendingProtocol.lendingType = LendingType.POOLED;
    lendingProtocol.riskType = RiskType.ISOLATED;
    lendingProtocol.totalPoolCount = INT_ZERO;
    lendingProtocol.cumulativeUniqueUsers = INT_ZERO;
    lendingProtocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    lendingProtocol.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    lendingProtocol.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    lendingProtocol.priceOracle = ZERO_ADDRESS;
    lendingProtocol.marketIDs = [];

    lendingProtocol.save();
  }

  return lendingProtocol;
}

export function getOrCreateToken(address: Address): Token {
  let token = Token.load(address.toHexString());

  if (!token) {
    token = new Token(address.toHexString());

    token.symbol = fetchTokenSymbol(address);
    token.name = fetchTokenName(address);
    token.decimals = fetchTokenDecimals(address);

    token.save();
  }

  return token;
}

export function getOrCreateRewardToken(
  address: Address,
  type: string
): RewardToken {
  let token = getOrCreateToken(address);

  let rewardTokenId = `${token.id}-${type}`;
  let rewardToken = RewardToken.load(rewardTokenId);
  if (!rewardToken) {
    rewardToken = new RewardToken(rewardTokenId);
    rewardToken.token = token.id;
    rewardToken.type = type;
    rewardToken.save();
  }
  return rewardToken;
}

////////////////////////////
///// Helper Functions /////
////////////////////////////

export function createInterestRate(
  marketAddress: string,
  rateSide: string,
  rateType: string,
  rate: BigDecimal
): InterestRate {
  const id: string = `${rateSide}-${rateType}-${marketAddress}`;
  const interestRate = new InterestRate(id);

  interestRate.rate = rate;
  interestRate.side = rateSide;
  interestRate.type = rateType;

  interestRate.save();

  return interestRate;
}

export function getAssetPriceInUSDC(
  tokenAddress: Address,
  priceOracle: Address
): BigDecimal {
  let oracle = IPriceOracleGetter.bind(priceOracle);
  let oracleResult = readValue<BigInt>(
    oracle.try_getAssetPrice(tokenAddress),
    BIGINT_ZERO
  );

  // if the result is zero or less, try the fallback oracle
  if (!oracleResult.gt(BIGINT_ZERO)) {
    let tryFallback = oracle.try_getFallbackOracle();
    if (tryFallback) {
      let fallbackOracle = IPriceOracleGetter.bind(tryFallback.value);
      oracleResult = readValue<BigInt>(
        fallbackOracle.try_getAssetPrice(tokenAddress),
        BIGINT_ZERO
      );
    }
  }

  // Mainnet Oracles return the price in eth, must convert to USD through the following method
  if (equalsIgnoreCase(dataSource.network(), Network.MAINNET)) {
    let priceUSDCInEth = readValue<BigInt>(
      oracle.try_getAssetPrice(Address.fromString(USDC_TOKEN_ADDRESS)),
      BIGINT_ZERO
    );

    return oracleResult.toBigDecimal().div(priceUSDCInEth.toBigDecimal());
  }

  // otherwise return the output of the price oracle
  let inputToken = getOrCreateToken(tokenAddress);
  return oracleResult
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals));
}

export function updateMarketSnapshots(
  blockNumber: BigInt,
  timestamp: BigInt,
  market: Market,
  newTotalRevenue: BigDecimal,
  newSupplyRevenue: BigDecimal,
  newProtocolRevenue: BigDecimal
): void {
  // get and update market daily snapshot
  let marketDailySnapshot = getOrCreateMarketDailySnapshot(
    market,
    timestamp,
    blockNumber
  );
  marketDailySnapshot.rates = getSnapshotRates(
    market.rates,
    (timestamp.toI32() / SECONDS_PER_DAY).toString()
  );

  // update daily revenues
  marketDailySnapshot.dailySupplySideRevenueUSD =
    marketDailySnapshot.dailySupplySideRevenueUSD.plus(newSupplyRevenue);
  marketDailySnapshot.dailyProtocolSideRevenueUSD =
    marketDailySnapshot.dailyProtocolSideRevenueUSD.plus(newProtocolRevenue);
  marketDailySnapshot.dailyTotalRevenueUSD =
    marketDailySnapshot.dailyTotalRevenueUSD.plus(newTotalRevenue);
  marketDailySnapshot.save();

  // get and update market daily snapshot
  let marketHourlySnapshot = getOrCreateMarketHourlySnapshot(
    market,
    timestamp,
    blockNumber
  );

  // update hourly revenues
  marketHourlySnapshot.hourlySupplySideRevenueUSD =
    marketHourlySnapshot.hourlySupplySideRevenueUSD.plus(newSupplyRevenue);
  marketHourlySnapshot.hourlyProtocolSideRevenueUSD =
    marketHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(newProtocolRevenue);
  marketHourlySnapshot.hourlyTotalRevenueUSD =
    marketHourlySnapshot.hourlyTotalRevenueUSD.plus(newTotalRevenue);
  marketHourlySnapshot.save();
}

export function updateFinancials(
  event: ethereum.Event,
  protocol: LendingProtocol,
  newTotalRevenue: BigDecimal,
  newProtocolRevenue: BigDecimal,
  newSupplyRevenue: BigDecimal
): void {
  let snapshotId = (event.block.timestamp.toI32() / SECONDS_PER_DAY).toString();
  let snapshot = FinancialsDailySnapshot.load(snapshotId);

  // create new snapshot if needed
  if (!snapshot) {
    snapshot = new FinancialsDailySnapshot(snapshotId);
    snapshot.protocol = protocol.id;
    snapshot.dailyDepositUSD = BIGDECIMAL_ZERO;
    snapshot.dailyBorrowUSD = BIGDECIMAL_ZERO;
    snapshot.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    snapshot.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    snapshot.dailyRepayUSD = BIGDECIMAL_ZERO;
    snapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
  }

  // update snapshot fields
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;
  snapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  snapshot.dailySupplySideRevenueUSD =
    snapshot.dailySupplySideRevenueUSD.plus(newSupplyRevenue);
  snapshot.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  snapshot.dailyProtocolSideRevenueUSD =
    snapshot.dailyProtocolSideRevenueUSD.plus(newProtocolRevenue);
  snapshot.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  snapshot.dailyTotalRevenueUSD =
    snapshot.dailyTotalRevenueUSD.plus(newTotalRevenue);
  snapshot.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  snapshot.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
  snapshot.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
  snapshot.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
  snapshot.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
  snapshot.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;
  snapshot.save();
}

export function snapshotUsage(
  protocol: LendingProtocol,
  blockNumber: BigInt,
  blockTimestamp: BigInt,
  accountID: string,
  eventType: i32
): void {
  let account = Account.load(accountID);
  if (!account) {
    account = new Account(accountID);
    account.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }

  //
  // daily snapshot
  //
  let dailySnapshotID = (blockTimestamp.toI32() / SECONDS_PER_DAY).toString();
  let dailySnapshot = UsageMetricsDailySnapshot.load(dailySnapshotID);
  if (!dailySnapshot) {
    dailySnapshot = new UsageMetricsDailySnapshot(dailySnapshotID);
    dailySnapshot.protocol = protocol.id;
    dailySnapshot.dailyActiveUsers = INT_ZERO;
    dailySnapshot.cumulativeUniqueUsers = INT_ZERO;
    dailySnapshot.dailyTransactionCount = INT_ZERO;
    dailySnapshot.dailyDepositCount = INT_ZERO;
    dailySnapshot.dailyWithdrawCount = INT_ZERO;
    dailySnapshot.dailyBorrowCount = INT_ZERO;
    dailySnapshot.dailyRepayCount = INT_ZERO;
    dailySnapshot.dailyLiquidateCount = INT_ZERO;
    dailySnapshot.blockNumber = blockNumber;
    dailySnapshot.timestamp = blockTimestamp;
  }
  let dailyAccountID = ActivityType.DAILY.concat("-")
    .concat(accountID)
    .concat("-")
    .concat(dailySnapshotID);
  let dailyActiveAccount = ActiveAccount.load(dailyAccountID);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyAccountID);
    dailyActiveAccount.save();

    dailySnapshot.dailyActiveUsers += 1;
  }
  dailySnapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  dailySnapshot.dailyTransactionCount += 1;
  switch (eventType) {
    case EventType.DEPOSIT:
      dailySnapshot.dailyDepositCount += 1;
      break;
    case EventType.WITHDRAW:
      dailySnapshot.dailyWithdrawCount += 1;
      break;
    case EventType.BORROW:
      dailySnapshot.dailyBorrowCount += 1;
      break;
    case EventType.REPAY:
      dailySnapshot.dailyRepayCount += 1;
      break;
    case EventType.LIQUIDATE:
      dailySnapshot.dailyLiquidateCount += 1;
      break;
    default:
      break;
  }
  dailySnapshot.totalPoolCount = protocol.totalPoolCount;
  dailySnapshot.blockNumber = blockNumber;
  dailySnapshot.timestamp = blockTimestamp;
  dailySnapshot.save();

  //
  // hourly snapshot
  //
  let hourlySnapshotID = (blockTimestamp.toI32() / SECONDS_PER_HOUR).toString();
  let hourlySnapshot = UsageMetricsHourlySnapshot.load(hourlySnapshotID);
  if (!hourlySnapshot) {
    hourlySnapshot = new UsageMetricsHourlySnapshot(hourlySnapshotID);
    hourlySnapshot.protocol = protocol.id;
    hourlySnapshot.hourlyActiveUsers = INT_ZERO;
    hourlySnapshot.cumulativeUniqueUsers = INT_ZERO;
    hourlySnapshot.hourlyTransactionCount = INT_ZERO;
    hourlySnapshot.hourlyDepositCount = INT_ZERO;
    hourlySnapshot.hourlyWithdrawCount = INT_ZERO;
    hourlySnapshot.hourlyBorrowCount = INT_ZERO;
    hourlySnapshot.hourlyRepayCount = INT_ZERO;
    hourlySnapshot.hourlyLiquidateCount = INT_ZERO;
    hourlySnapshot.blockNumber = blockNumber;
    hourlySnapshot.timestamp = blockTimestamp;
  }
  let hourlyAccountID = ActivityType.HOURLY.concat("-")
    .concat(accountID)
    .concat("-")
    .concat(hourlySnapshotID);
  let hourlyActiveAccount = ActiveAccount.load(hourlyAccountID);
  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyAccountID);
    hourlyActiveAccount.save();

    hourlySnapshot.hourlyActiveUsers += 1;
  }
  hourlySnapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  hourlySnapshot.hourlyTransactionCount += 1;
  switch (eventType) {
    case EventType.DEPOSIT:
      hourlySnapshot.hourlyDepositCount += 1;
      break;
    case EventType.WITHDRAW:
      hourlySnapshot.hourlyWithdrawCount += 1;
      break;
    case EventType.BORROW:
      hourlySnapshot.hourlyBorrowCount += 1;
      break;
    case EventType.REPAY:
      hourlySnapshot.hourlyRepayCount += 1;
      break;
    case EventType.LIQUIDATE:
      hourlySnapshot.hourlyLiquidateCount += 1;
      break;
    default:
      break;
  }
  hourlySnapshot.blockNumber = blockNumber;
  hourlySnapshot.timestamp = blockTimestamp;
  hourlySnapshot.save();
}

export function updateSnapshots(
  protocol: LendingProtocol,
  market: Market,
  amountUSD: BigDecimal,
  eventType: i32,
  blockTimestamp: BigInt,
  blockNumber: BigInt
): void {
  let marketHourlySnapshot = getOrCreateMarketHourlySnapshot(
    market,
    blockTimestamp,
    blockNumber
  );
  let marketDailySnapshot = getOrCreateMarketDailySnapshot(
    market,
    blockTimestamp,
    blockNumber
  );
  let financialSnapshot = FinancialsDailySnapshot.load(
    (blockTimestamp.toI32() / SECONDS_PER_DAY).toString()
  );
  if (!financialSnapshot) {
    // should NOT happen
    log.warning("[updateSnapshots] financialSnapshot not found", []);
    return;
  }

  switch (eventType) {
    case EventType.DEPOSIT:
      marketHourlySnapshot.hourlyDepositUSD =
        marketHourlySnapshot.hourlyDepositUSD.plus(amountUSD);
      marketDailySnapshot.dailyDepositUSD =
        marketDailySnapshot.dailyDepositUSD.plus(amountUSD);
      financialSnapshot.dailyDepositUSD =
        financialSnapshot.dailyDepositUSD.plus(amountUSD);
      financialSnapshot.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
      marketDailySnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
      marketHourlySnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
      break;
    case EventType.BORROW:
      marketHourlySnapshot.hourlyBorrowUSD =
        marketHourlySnapshot.hourlyBorrowUSD.plus(amountUSD);
      marketDailySnapshot.dailyBorrowUSD =
        marketDailySnapshot.dailyBorrowUSD.plus(amountUSD);
      financialSnapshot.dailyBorrowUSD =
        financialSnapshot.dailyBorrowUSD.plus(amountUSD);
      financialSnapshot.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
      marketDailySnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
      marketHourlySnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
      break;
    case EventType.LIQUIDATE:
      marketHourlySnapshot.hourlyLiquidateUSD =
        marketHourlySnapshot.hourlyLiquidateUSD.plus(amountUSD);
      marketDailySnapshot.dailyLiquidateUSD =
        marketDailySnapshot.dailyLiquidateUSD.plus(amountUSD);
      financialSnapshot.dailyLiquidateUSD =
        financialSnapshot.dailyLiquidateUSD.plus(amountUSD);
      financialSnapshot.cumulativeLiquidateUSD =
        protocol.cumulativeLiquidateUSD;
      marketDailySnapshot.cumulativeLiquidateUSD =
        market.cumulativeLiquidateUSD;
      marketHourlySnapshot.cumulativeLiquidateUSD =
        market.cumulativeLiquidateUSD;
      break;
    case EventType.WITHDRAW:
      marketHourlySnapshot.hourlyWithdrawUSD =
        marketHourlySnapshot.hourlyWithdrawUSD.plus(amountUSD);
      marketDailySnapshot.dailyWithdrawUSD =
        marketDailySnapshot.dailyWithdrawUSD.plus(amountUSD);
      financialSnapshot.dailyWithdrawUSD =
        financialSnapshot.dailyWithdrawUSD.plus(amountUSD);
      break;
    case EventType.REPAY:
      marketHourlySnapshot.hourlyRepayUSD =
        marketHourlySnapshot.hourlyRepayUSD.plus(amountUSD);
      marketDailySnapshot.dailyRepayUSD =
        marketDailySnapshot.dailyRepayUSD.plus(amountUSD);
      financialSnapshot.dailyRepayUSD =
        financialSnapshot.dailyRepayUSD.plus(amountUSD);
      break;
    default:
      break;
  }

  marketDailySnapshot.save();
  marketHourlySnapshot.save();
  financialSnapshot.save();
}

////////////////////////////
///// Internal Helpers /////
////////////////////////////

function getOrCreateMarketDailySnapshot(
  market: Market,
  blockTimestamp: BigInt,
  blockNumber: BigInt
): MarketDailySnapshot {
  let snapshotID = `${market.id}-${(
    blockTimestamp.toI32() / SECONDS_PER_DAY
  ).toString()}`;
  let snapshot = MarketDailySnapshot.load(snapshotID);
  if (!snapshot) {
    snapshot = new MarketDailySnapshot(snapshotID);

    // initialize zero values to ensure no null runtime errors
    snapshot.dailyDepositUSD = BIGDECIMAL_ZERO;
    snapshot.dailyBorrowUSD = BIGDECIMAL_ZERO;
    snapshot.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    snapshot.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    snapshot.dailyRepayUSD = BIGDECIMAL_ZERO;
    snapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;

    snapshot.protocol = market.protocol;
    snapshot.market = market.id;
  }

  snapshot.rates = getSnapshotRates(
    market.rates,
    (blockTimestamp.toI32() / SECONDS_PER_DAY).toString()
  );
  snapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  snapshot.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD;
  snapshot.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD;
  snapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
  snapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  snapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  snapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  snapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  snapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  snapshot.inputTokenBalance = market.inputTokenBalance;
  snapshot.outputTokenSupply = market.outputTokenSupply;
  snapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  snapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
  snapshot.exchangeRate = market.exchangeRate;
  snapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  snapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
  snapshot.blockNumber = blockNumber;
  snapshot.timestamp = blockTimestamp;
  snapshot.save();

  return snapshot;
}

export function getOrCreateMarketHourlySnapshot(
  market: Market,
  blockTimestamp: BigInt,
  blockNumber: BigInt
): MarketHourlySnapshot {
  let snapshotID = `${market.id}-${(
    blockTimestamp.toI32() / SECONDS_PER_HOUR
  ).toString()}`;
  let snapshot = MarketHourlySnapshot.load(snapshotID);
  if (!snapshot) {
    snapshot = new MarketHourlySnapshot(snapshotID);

    // initialize zero values to ensure no null runtime errors
    snapshot.hourlyDepositUSD = BIGDECIMAL_ZERO;
    snapshot.hourlyBorrowUSD = BIGDECIMAL_ZERO;
    snapshot.hourlyLiquidateUSD = BIGDECIMAL_ZERO;
    snapshot.hourlyWithdrawUSD = BIGDECIMAL_ZERO;
    snapshot.hourlyRepayUSD = BIGDECIMAL_ZERO;
    snapshot.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;

    snapshot.protocol = market.protocol;
    snapshot.market = market.id;
  }

  snapshot.blockNumber = blockNumber;
  snapshot.timestamp = blockTimestamp;
  snapshot.rates = getSnapshotRates(
    market.rates,
    (blockTimestamp.toI32() / SECONDS_PER_HOUR).toString()
  );
  snapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  snapshot.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD;
  snapshot.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD;
  snapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
  snapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  snapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  snapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  snapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  snapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  snapshot.inputTokenBalance = market.inputTokenBalance;
  snapshot.outputTokenSupply = market.outputTokenSupply;
  snapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  snapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
  snapshot.exchangeRate = market.exchangeRate;
  snapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  snapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
  snapshot.save();

  return snapshot;
}

function getSnapshotRates(rates: string[], timeSuffix: string): string[] {
  let snapshotRates: string[] = [];
  for (let i = 0; i < rates.length; i++) {
    let rate = InterestRate.load(rates[i]);
    if (!rate) {
      log.warning("[getSnapshotRates] rate {} not found, should not happen", [
        rates[i],
      ]);
      continue;
    }

    // create new snapshot rate
    let snapshotRateId = rates[i].concat("-").concat(timeSuffix);
    let snapshotRate = new InterestRate(snapshotRateId);
    snapshotRate.side = rate.side;
    snapshotRate.type = rate.type;
    snapshotRate.rate = rate.rate;
    snapshotRate.save();
    snapshotRates.push(snapshotRateId);
  }
  return snapshotRates;
}
