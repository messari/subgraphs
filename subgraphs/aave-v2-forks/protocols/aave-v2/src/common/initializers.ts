import { BIGDECIMAL_ONE, BIGDECIMAL_ZERO, BIGINT_ZERO, getNetworkSpecificConstant, LendingType, Protocol, ProtocolType, RewardTokenType, RiskType, SECONDS_PER_DAY, SECONDS_PER_HOUR, ZERO_ADDRESS } from "./constants";
import {
  Token,
  Market,
  Account,
  RewardToken,
  InterestRate,
  LendingProtocol,
  MarketDailySnapshot,
  MarketHourlySnapshot,
  FinancialsDailySnapshot,
  UsageMetricsHourlySnapshot,
  UsageMetricsDailySnapshot,
} from "../../../../generated/schema";
import { getMarketRates } from "../modules/Market";
import { getAssetPriceInUSDC } from "../modules/Price";
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol } from "./tokens";
import { Address, BigDecimal, BigInt, dataSource, ethereum } from "@graphprotocol/graph-ts";
import { getCurrentRewardEmissions, getCurrentRewardEmissionsUSD } from "../modules/Rewards";
import { IPriceOracleGetter } from "../../../../generated/templates/LendingPool/IPriceOracleGetter";

// Network constants
let constants = getNetworkSpecificConstant();
let protocolId = constants.protocolAddress;
let network = constants.network;

export function getPriceOracle(): IPriceOracleGetter {
  // priceOracle is set the address of the price oracle contract of the
  // address provider contract, pulled from context
  // const protocolId = getProtocolIdFromCtx();
  const lendingProtocol = getOrCreateLendingProtocol();
  const priceOracle = lendingProtocol._protocolPriceOracle;

  return IPriceOracleGetter.bind(Address.fromString(priceOracle));
}

export function getOrCreateAccount(id: string): Account {
  let account = Account.load(id);

  if (!account) {
    account = new Account(id);
    account.save();

    const protocol = getOrCreateLendingProtocol();
    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }

  return account;
}

export function getLendingPoolFromCtx(): string {
  // Get the lending pool/market address with context
  const context = dataSource.context();
  return context.getString("lendingPool");
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

export function getOrCreateRewardToken(address: Address, type: string): RewardToken {
  let id: string = `${type}-${address}`;
  let rewardToken = RewardToken.load(id);

  if (!rewardToken) {
    rewardToken = new RewardToken(id);
    rewardToken.token = getOrCreateToken(address).id;
    rewardToken.type = type;

    rewardToken.save();
  }

  return rewardToken;
}

export function getOrCreateLendingProtocol(): LendingProtocol {
  let lendingProtocol = LendingProtocol.load(protocolId.toHexString());

  if (!lendingProtocol) {
    lendingProtocol = new LendingProtocol(protocolId.toHexString());

    lendingProtocol.name = Protocol.NAME;
    lendingProtocol.slug = Protocol.SLUG;
    lendingProtocol.schemaVersion = Protocol.SCHEMA_VERSION;
    lendingProtocol.subgraphVersion = Protocol.SUBGRAPH_VERSION;
    lendingProtocol.methodologyVersion = Protocol.METHODOLOGY_VERSION;
    lendingProtocol.network = network;
    lendingProtocol.type = ProtocolType.LENDING;
    lendingProtocol.lendingType = LendingType.POOLED;
    lendingProtocol.riskType = RiskType.ISOLATED;
    lendingProtocol.totalPoolCount = 0;
    lendingProtocol.cumulativeUniqueUsers = 0;
    lendingProtocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    lendingProtocol.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    lendingProtocol.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    lendingProtocol._protocolPriceOracle = "";

    lendingProtocol.save();
  }

  return lendingProtocol;
}

export function getOrCreateFinancialsDailySnapshot(block: ethereum.Block): FinancialsDailySnapshot {
  const protocol = getOrCreateLendingProtocol();

  const id = `${block.timestamp.toI64() / SECONDS_PER_DAY}`;
  let financialsSnapshot = FinancialsDailySnapshot.load(id);

  if (!financialsSnapshot) {
    financialsSnapshot = new FinancialsDailySnapshot(id);

    financialsSnapshot.protocol = protocol.id;

    financialsSnapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyDepositUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyBorrowUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyLiquidateUSD = BIGDECIMAL_ZERO;

    financialsSnapshot.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyRepayUSD = BIGDECIMAL_ZERO;

    financialsSnapshot.save();
  }

  financialsSnapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialsSnapshot.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
  financialsSnapshot.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
  financialsSnapshot.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
  financialsSnapshot.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
  financialsSnapshot.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;
  financialsSnapshot.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
  financialsSnapshot.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
  financialsSnapshot.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;

  financialsSnapshot.blockNumber = block.number;
  financialsSnapshot.timestamp = block.timestamp;

  return financialsSnapshot;
}

export function createInterestRate(
  marketAddress: string,
  rateSide: string,
  rateType: string,
  rate: BigDecimal,
): InterestRate {
  const id: string = `${rateSide}-${rateType}-${marketAddress}`;
  const interestRate = new InterestRate(id);

  interestRate.rate = rate;
  interestRate.side = rateSide;
  interestRate.type = rateType;

  interestRate.save();

  return interestRate;
}

export function getOrCreateMarket(event: ethereum.Event, marketId: string): Market {
  let market = Market.load(marketId);

  if (!market) {
    market = new Market(marketId);

    const protocol = getOrCreateLendingProtocol();
    const marketToken = getOrCreateToken(Address.fromString(marketId));

    market.protocol = protocol.name;
    market.name = marketToken.name;
    market.isActive = false;
    market.canUseAsCollateral = false;
    market.canBorrowFrom = false;
    market.maximumLTV = BIGDECIMAL_ZERO;
    market.liquidationThreshold = BIGDECIMAL_ZERO;
    market.liquidationPenalty = BIGDECIMAL_ZERO;
    market.inputToken = marketToken.id;
    market.outputToken = ZERO_ADDRESS;
    market.rates = getMarketRates(marketId, protocol.id);
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
    market.exchangeRate = BIGDECIMAL_ONE; // this is constant
    market.reserveFactor = BIGINT_ZERO;
    market.totalStableValueLocked = BIGINT_ZERO;
    market.totalVariableValueLocked = BIGINT_ZERO;

    // TODO: fix this
    const rewardTokenFromIncController = Address.fromString(ZERO_ADDRESS);
    const depositRewardToken = getOrCreateRewardToken(rewardTokenFromIncController, RewardTokenType.DEPOSIT);
    const borrowRewardToken = getOrCreateRewardToken(rewardTokenFromIncController, RewardTokenType.BORROW);

    market.rewardTokens = [depositRewardToken.id, borrowRewardToken.id];
    market.rewardTokenEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
    market.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    market._sToken = ZERO_ADDRESS;
    market._vToken = ZERO_ADDRESS;
    market.createdTimestamp = event.block.timestamp;
    market.createdBlockNumber = event.block.number;

    protocol.totalPoolCount += 1;
    protocol.save();
    market.save();
  }

  const currentPrice = getAssetPriceInUSDC(Address.fromString(market.id));
  market.inputTokenPriceUSD = currentPrice;
  market.outputTokenPriceUSD = currentPrice;

  // No need to execute the below code until block 12317479 when
  // incentive controller was deployed and started calculating rewards
  if (event.block.number.gt(BigInt.fromString("12317479"))) {
    market.rewardTokenEmissionsAmount = getCurrentRewardEmissions(market);
    market.rewardTokenEmissionsUSD = getCurrentRewardEmissionsUSD(market);
  }

  return market;
}

export function getOrCreateMarketDailySnapshot(event: ethereum.Event, market: Market): MarketDailySnapshot {
  const id = `${market.id}-${event.block.timestamp.toI64() / SECONDS_PER_DAY}`;
  let marketSnapshot = MarketDailySnapshot.load(id);

  if (!marketSnapshot) {
    marketSnapshot = new MarketDailySnapshot(id);

    marketSnapshot.dailyDepositUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyBorrowUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyRepayUSD = BIGDECIMAL_ZERO;

    marketSnapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;

    marketSnapshot.save();
  }
  marketSnapshot.protocol = market.protocol;
  marketSnapshot.market = market.id;
  marketSnapshot.rates = market.rates;
  marketSnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  marketSnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketSnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketSnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketSnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketSnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  marketSnapshot.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD;
  marketSnapshot.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD;
  marketSnapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;

  marketSnapshot.inputTokenBalance = market.inputTokenBalance;
  marketSnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  marketSnapshot.outputTokenSupply = market.outputTokenSupply;
  marketSnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;

  marketSnapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  marketSnapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;

  marketSnapshot.blockNumber = event.block.number;
  marketSnapshot.timestamp = event.block.timestamp;

  return marketSnapshot;
}

export function getOrCreateMarketHourlySnapshot(event: ethereum.Event, market: Market): MarketHourlySnapshot {
  const id = `${market.id}-${event.block.timestamp.toI64() / SECONDS_PER_HOUR}`;
  let marketSnapshot = MarketHourlySnapshot.load(id);

  if (!marketSnapshot) {
    marketSnapshot = new MarketHourlySnapshot(id);

    marketSnapshot.hourlyDepositUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyBorrowUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyLiquidateUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyWithdrawUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyRepayUSD = BIGDECIMAL_ZERO;

    marketSnapshot.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;

    marketSnapshot.save();
  }
  marketSnapshot.protocol = market.protocol;
  marketSnapshot.market = market.id;
  marketSnapshot.rates = market.rates;

  marketSnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  marketSnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketSnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketSnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketSnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketSnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;

  marketSnapshot.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD;
  marketSnapshot.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD;
  marketSnapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;

  marketSnapshot.inputTokenBalance = market.inputTokenBalance;
  marketSnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  marketSnapshot.outputTokenSupply = market.outputTokenSupply;
  marketSnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;

  marketSnapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  marketSnapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;

  marketSnapshot.blockNumber = event.block.number;
  marketSnapshot.timestamp = event.block.timestamp;

  return marketSnapshot;
}

export function getOrCreateUsageMetricsDailySnapshot(block: ethereum.Block): UsageMetricsDailySnapshot {
  let id: string = (block.timestamp.toI64() / SECONDS_PER_DAY).toString();
  let usageMetrics = UsageMetricsDailySnapshot.load(id);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id);

    const protocol = getOrCreateLendingProtocol();
    usageMetrics.protocol = protocol.id;

    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.dailyDepositCount = 0;
    usageMetrics.dailyWithdrawCount = 0;
    usageMetrics.dailyRepayCount = 0;
    usageMetrics.dailyLiquidateCount = 0;
    usageMetrics.dailyBorrowCount = 0;

    usageMetrics.blockNumber = block.number;
    usageMetrics.timestamp = block.timestamp;

    usageMetrics.totalPoolCount = protocol.totalPoolCount;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateUsageMetricsHourlySnapshot(block: ethereum.Block): UsageMetricsHourlySnapshot {
  let metricsID: string = (block.timestamp.toI64() / SECONDS_PER_HOUR).toString();
  let usageMetrics = UsageMetricsHourlySnapshot.load(metricsID);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(metricsID);

    usageMetrics.protocol = protocolId.toHexString();

    usageMetrics.hourlyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.hourlyTransactionCount = 0;
    usageMetrics.hourlyDepositCount = 0;
    usageMetrics.hourlyWithdrawCount = 0;
    usageMetrics.hourlyRepayCount = 0;
    usageMetrics.hourlyLiquidateCount = 0;
    usageMetrics.hourlyBorrowCount = 0;

    usageMetrics.blockNumber = block.number;
    usageMetrics.timestamp = block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}
