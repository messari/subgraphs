import * as utils from "./utils";
import * as constants from "./constants";
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
} from "../../generated/schema";
import { getMarketRates } from "../modules/Market";
import { getAssetPriceInUSDC } from "../modules/Price";
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol } from "./tokens";
import { Address, BigDecimal, BigInt, dataSource, ethereum } from "@graphprotocol/graph-ts";
import { getCurrentRewardEmissions, getCurrentRewardEmissionsUSD } from "../modules/Rewards";
import { IPriceOracleGetter } from "../../generated/templates/LendingPool/IPriceOracleGetter";

export function getPriceOracle(): IPriceOracleGetter {
  // priceOracle is set the address of the price oracle contract of the 
  // address provider contract, pulled from context
  // const protocolId = getProtocolIdFromCtx();
  const lendingProtocol = getOrCreateLendingProtocol(constants.PROTOCOL_ADDRESS);
  const priceOracle = lendingProtocol._protocolPriceOracle;
  
  return IPriceOracleGetter.bind(Address.fromString(priceOracle));
}

export function getFallbackPriceOracle(): IPriceOracleGetter {
  // priceOracle is set the address of the price oracle contract of the 
  // address provider contract, pulled from context
  // const protocolId = getProtocolIdFromCtx();
  const lendingProtocol = getOrCreateLendingProtocol(constants.PROTOCOL_ADDRESS);
  const fallbackPriceOracle = lendingProtocol._fallbackPriceOracle;

  return IPriceOracleGetter.bind(Address.fromString(fallbackPriceOracle));
}

export function getOrCreateAccount(id: string): Account {
  let account = Account.load(id);

  if (!account) {
    account = new Account(id);
    account.save();

    const protocolId = getProtocolIdFromCtx();
    const protocol = getOrCreateLendingProtocol(protocolId);
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

export function getProtocolIdFromCtx(): string {
  // Get the protocol id with context
  const context = dataSource.context();
  return context.getString("protocolId");
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
  let id: string = `${type}-${address}`
  let rewardToken = RewardToken.load(id);
  
  if (!rewardToken) {
    rewardToken = new RewardToken(id);
    rewardToken.token = getOrCreateToken(address).id;
    rewardToken.type = type;
    
    rewardToken.save();
  }

  return rewardToken;
}

export function getOrCreateLendingProtocol(lendingProtocolId: string): LendingProtocol {
  let lendingProtocol = LendingProtocol.load(lendingProtocolId);

  if (!lendingProtocol) {
    lendingProtocol = new LendingProtocol(lendingProtocolId);

    lendingProtocol.name = constants.Protocol.NAME;
    lendingProtocol.slug = constants.Protocol.SLUG;
    lendingProtocol.schemaVersion = constants.Protocol.SCHEMA_VERSION;
    lendingProtocol.subgraphVersion = constants.Protocol.SUBGRAPH_VERSION;
    lendingProtocol.methodologyVersion = constants.Protocol.METHODOLOGY_VERSION;
    lendingProtocol.network = constants.Network.MAINNET;
    lendingProtocol.type = constants.ProtocolType.LENDING;
    lendingProtocol.lendingType = constants.LendingType.POOLED;
    lendingProtocol.riskType = constants.RiskType.ISOLATED;
    lendingProtocol.totalPoolCount = 0;
    lendingProtocol.cumulativeUniqueUsers = 0;
    lendingProtocol.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeProtocolSideRevenueUSD =
      constants.BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    lendingProtocol.totalDepositBalanceUSD = constants.BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeDepositUSD = constants.BIGDECIMAL_ZERO;
    lendingProtocol.totalBorrowBalanceUSD = constants.BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeBorrowUSD = constants.BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeLiquidateUSD = constants.BIGDECIMAL_ZERO;
    lendingProtocol._protocolPriceOracle = constants.PRICE_ORACLE_ADDRESS;

    lendingProtocol.save();
  }

  return lendingProtocol;
}

export function getOrCreateFinancialsDailySnapshot(
  block: ethereum.Block
): FinancialsDailySnapshot {
  const protocolId = getProtocolIdFromCtx();
  const protocol = getOrCreateLendingProtocol(protocolId);

  const id = `${block.timestamp.toI64() / constants.SECONDS_PER_DAY}`;
  let financialsSnapshot = FinancialsDailySnapshot.load(id);

  if (!financialsSnapshot) {
    financialsSnapshot = new FinancialsDailySnapshot(id);

    financialsSnapshot.protocol = protocol.id;

    financialsSnapshot.dailySupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialsSnapshot.dailyProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialsSnapshot.dailyTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialsSnapshot.dailyDepositUSD = constants.BIGDECIMAL_ZERO;
    financialsSnapshot.dailyBorrowUSD = constants.BIGDECIMAL_ZERO;
    financialsSnapshot.dailyLiquidateUSD = constants.BIGDECIMAL_ZERO;

    financialsSnapshot.dailyWithdrawUSD = constants.BIGDECIMAL_ZERO;
    financialsSnapshot.dailyRepayUSD = constants.BIGDECIMAL_ZERO;

    financialsSnapshot.save();
  }

  financialsSnapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialsSnapshot.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
  financialsSnapshot.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
  financialsSnapshot.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
  financialsSnapshot.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
  financialsSnapshot.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;
  financialsSnapshot.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialsSnapshot.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialsSnapshot.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;
  
  financialsSnapshot.blockNumber = block.number;
  financialsSnapshot.timestamp = block.timestamp;

  return financialsSnapshot;
}

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

export function getOrCreateMarket(
  event: ethereum.Event,
  marketId: string
): Market {
  let market = Market.load(marketId);

  if (!market) {
    market = new Market(marketId);

    const protocolId = getProtocolIdFromCtx();
    const protocol = getOrCreateLendingProtocol(protocolId);
    const marketToken = getOrCreateToken(Address.fromString(marketId));

    market.protocol = protocol.name;
    market.name = marketToken.name;
    market.isActive = false;
    market.canUseAsCollateral = false;
    market.canBorrowFrom = false;
    market.maximumLTV = constants.BIGDECIMAL_ZERO;
    market.liquidationThreshold = constants.BIGDECIMAL_ZERO;
    market.liquidationPenalty = constants.BIGDECIMAL_ZERO;
    market.inputToken = marketToken.id;
    market.outputToken = constants.ZERO_ADDRESS;
    market.rates = getMarketRates(marketId, protocolId);
    market.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    market.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    market.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    market.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    market.totalDepositBalanceUSD = constants.BIGDECIMAL_ZERO;
    market.cumulativeDepositUSD = constants.BIGDECIMAL_ZERO;
    market.totalBorrowBalanceUSD = constants.BIGDECIMAL_ZERO;
    market.cumulativeBorrowUSD = constants.BIGDECIMAL_ZERO;
    market.cumulativeLiquidateUSD = constants.BIGDECIMAL_ZERO;
    market.inputTokenBalance = constants.BIGINT_ZERO;
    market.inputTokenPriceUSD = constants.BIGDECIMAL_ZERO;
    market.outputTokenSupply = constants.BIGINT_ZERO;
    market.outputTokenPriceUSD = constants.BIGDECIMAL_ZERO;
    market.exchangeRate = constants.BIGDECIMAL_ONE;
    
    const rewardTokenFromIncController = Address.fromString(
      constants.REWARD_TOKEN_ADDRESS
    );
    const depositRewardToken = getOrCreateRewardToken(
      rewardTokenFromIncController,
      constants.RewardTokenType.DEPOSIT
    );
    const borrowRewardToken = getOrCreateRewardToken(
      rewardTokenFromIncController,
      constants.RewardTokenType.BORROW
    );
    
    market.rewardTokens = [depositRewardToken.id, borrowRewardToken.id];
    market.rewardTokenEmissionsAmount = [constants.BIGINT_ZERO, constants.BIGINT_ZERO];
    market.rewardTokenEmissionsUSD = [constants.BIGDECIMAL_ZERO, constants.BIGDECIMAL_ZERO];
    market._sToken = constants.ZERO_ADDRESS;
    market._vToken = constants.ZERO_ADDRESS;
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

export function getOrCreateMarketDailySnapshot(
  event: ethereum.Event,
  market: Market
): MarketDailySnapshot {
  const id = `${market.id}-${event.block.timestamp.toI64() /
    constants.SECONDS_PER_DAY}`;
  let marketSnapshot = MarketDailySnapshot.load(id);

  if (!marketSnapshot) {
    marketSnapshot = new MarketDailySnapshot(id);
    
    marketSnapshot.dailyDepositUSD = constants.BIGDECIMAL_ZERO;
    marketSnapshot.dailyBorrowUSD = constants.BIGDECIMAL_ZERO;
    marketSnapshot.dailyLiquidateUSD = constants.BIGDECIMAL_ZERO;
    marketSnapshot.dailyWithdrawUSD = constants.BIGDECIMAL_ZERO;
    marketSnapshot.dailyRepayUSD = constants.BIGDECIMAL_ZERO;
    
    marketSnapshot.dailySupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    marketSnapshot.dailyProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    marketSnapshot.dailyTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    
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
  marketSnapshot.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD;
  marketSnapshot.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD;
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

export function getOrCreateMarketHourlySnapshot(
  event: ethereum.Event,
  market: Market
): MarketHourlySnapshot {
  const id = `${market.id}-${event.block.timestamp.toI64() /
    constants.SECONDS_PER_HOUR}`;
  let marketSnapshot = MarketHourlySnapshot.load(id);

  if (!marketSnapshot) {
    marketSnapshot = new MarketHourlySnapshot(id);

    marketSnapshot.hourlyDepositUSD = constants.BIGDECIMAL_ZERO;
    marketSnapshot.hourlyBorrowUSD = constants.BIGDECIMAL_ZERO;
    marketSnapshot.hourlyLiquidateUSD = constants.BIGDECIMAL_ZERO;
    marketSnapshot.hourlyWithdrawUSD = constants.BIGDECIMAL_ZERO;
    marketSnapshot.hourlyRepayUSD = constants.BIGDECIMAL_ZERO;

    marketSnapshot.hourlySupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    marketSnapshot.hourlyProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    marketSnapshot.hourlyTotalRevenueUSD = constants.BIGDECIMAL_ZERO;

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

  marketSnapshot.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD;
  marketSnapshot.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD;
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

export function getOrCreateUsageMetricsDailySnapshot(
  block: ethereum.Block
): UsageMetricsDailySnapshot {
  let id: string = (block.timestamp.toI64() / constants.SECONDS_PER_DAY).toString();
  let usageMetrics = UsageMetricsDailySnapshot.load(id);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id);

    const protocolId = getProtocolIdFromCtx();
    const protocol = getOrCreateLendingProtocol(protocolId);
    usageMetrics.protocol = protocolId;

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

export function getOrCreateUsageMetricsHourlySnapshot(
  block: ethereum.Block
): UsageMetricsHourlySnapshot {
  let metricsID: string = (block.timestamp.toI64() / constants.SECONDS_PER_HOUR).toString();
  let usageMetrics = UsageMetricsHourlySnapshot.load(metricsID);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(metricsID);
    
    const protocolId = getProtocolIdFromCtx();
    usageMetrics.protocol = protocolId;

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