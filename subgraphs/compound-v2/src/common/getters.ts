// get or create snapshots and metrics
import {
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
} from "../../generated/schema";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  CETH_ADDRESS,
  COMPTROLLER_ADDRESS,
  COMP_ADDRESS,
  DEFAULT_DECIMALS,
  ETH_ADDRESS,
  ETH_NAME,
  ETH_SYMBOL,
  INITIAL_EXCHANGE_RATE,
  InterestRateSide,
  InterestRateType,
  LENDING_TYPE,
  METHODOLOGY_VERSION,
  NETWORK_ETHEREUM,
  PROTOCOL_NAME,
  PROTOCOL_RISK_TYPE,
  PROTOCOL_SLUG,
  PROTOCOL_TYPE,
  RewardTokenType,
  SAI_ADDRESS,
  SCHEMA_VERSION,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  SUBGRAPH_VERSION,
  ZERO_ADDRESS,
} from "./utils/constants";
import { getAssetDecimals, getAssetName, getAssetSymbol } from "./utils/tokens";
import { CTokenNew } from "../../generated/Comptroller/CTokenNew";
import { Address, ethereum } from "@graphprotocol/graph-ts";
import { exponentToBigDecimal } from "./utils/utils";
import { Comptroller } from "../../generated/Comptroller/Comptroller";

///////////////////
//// Snapshots ////
///////////////////

export function getOrCreateUsageDailySnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = COMPTROLLER_ADDRESS;

    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.dailyDepositCount = 0;
    usageMetrics.dailyWithdrawCount = 0;
    usageMetrics.dailyBorrowCount = 0;
    usageMetrics.dailyRepayCount = 0;
    usageMetrics.dailyLiquidateCount = 0;
    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;
    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateUsageHourlySnapshot(event: ethereum.Event): UsageMetricsHourlySnapshot {
  // Number of days since Unix epoch
  let hour: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;

  // Create unique id for the day
  let usageMetrics = UsageMetricsHourlySnapshot.load(hour.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(hour.toString());
    usageMetrics.protocol = COMPTROLLER_ADDRESS;

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

export function getOrCreateMarketDailySnapshot(event: ethereum.Event): MarketDailySnapshot {
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let marketAddress = event.address.toHexString();
  let marketMetrics = MarketDailySnapshot.load(marketAddress.concat("-").concat(id.toString()));

  if (!marketMetrics) {
    marketMetrics = new MarketDailySnapshot(marketAddress.concat("-").concat(id.toString()));
    marketMetrics.protocol = COMPTROLLER_ADDRESS;
    marketMetrics.market = marketAddress;
    marketMetrics.blockNumber = event.block.timestamp;
    marketMetrics.timestamp = event.block.timestamp;
    marketMetrics.rates = [];
    marketMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    marketMetrics.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.inputTokenBalance = BIGINT_ZERO;
    marketMetrics.inputTokenPriceUSD = BIGDECIMAL_ZERO;
    marketMetrics.outputTokenSupply = BIGINT_ZERO;
    marketMetrics.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    marketMetrics.exchangeRate = BIGDECIMAL_ZERO;
    marketMetrics.rewardTokenEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
    marketMetrics.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

    marketMetrics.save();
  }

  return marketMetrics;
}

export function getOrCreateMarketHourlySnapshot(event: ethereum.Event): MarketHourlySnapshot {
  let hour: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  let marketAddress = event.address.toHexString();
  let id = marketAddress + "-" + hour.toString();
  let marketMetrics = MarketHourlySnapshot.load(id);

  if (!marketMetrics) {
    marketMetrics = new MarketHourlySnapshot(id);
    marketMetrics.protocol = COMPTROLLER_ADDRESS;
    marketMetrics.market = marketAddress;
    marketMetrics.blockNumber = event.block.timestamp;
    marketMetrics.timestamp = event.block.timestamp;
    marketMetrics.rates = [];
    marketMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    marketMetrics.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.inputTokenBalance = BIGINT_ZERO;
    marketMetrics.inputTokenPriceUSD = BIGDECIMAL_ZERO;
    marketMetrics.outputTokenSupply = BIGINT_ZERO;
    marketMetrics.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    marketMetrics.exchangeRate = BIGDECIMAL_ZERO;
    marketMetrics.rewardTokenEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
    marketMetrics.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

    marketMetrics.save();
  }

  return marketMetrics;
}

export function getOrCreateFinancials(event: ethereum.Event): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = COMPTROLLER_ADDRESS;
    financialMetrics.blockNumber = event.block.number;
    financialMetrics.timestamp = event.block.timestamp;
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

    financialMetrics.save();
  }
  return financialMetrics;
}

////////////////////////////
///// Lending Specific /////
////////////////////////////

export function getOrCreateLendingProtcol(): LendingProtocol {
  let protocol = LendingProtocol.load(COMPTROLLER_ADDRESS);

  if (!protocol) {
    protocol = new LendingProtocol(COMPTROLLER_ADDRESS);
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.schemaVersion = SCHEMA_VERSION;
    protocol.subgraphVersion = SUBGRAPH_VERSION;
    protocol.methodologyVersion = METHODOLOGY_VERSION;
    protocol.network = NETWORK_ETHEREUM;
    protocol.type = PROTOCOL_TYPE;
    protocol.lendingType = LENDING_TYPE;
    protocol.riskType = PROTOCOL_RISK_TYPE;
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

    // get initial liquidation penalty
    let troller = Comptroller.bind(Address.fromString(COMPTROLLER_ADDRESS));
    let tryLiquidationPenalty = troller.try_liquidationIncentiveMantissa();
    protocol._liquidationPenalty = tryLiquidationPenalty.reverted
      ? BIGDECIMAL_ZERO
      : tryLiquidationPenalty.value.toBigDecimal().div(exponentToBigDecimal(DEFAULT_DECIMALS)).minus(BIGDECIMAL_ONE);

    protocol.save();
  }
  return protocol;
}

export function getOrCreateMarket(event: ethereum.Event, marketAddress: Address): Market {
  let market = Market.load(marketAddress.toHexString());

  if (!market) {
    market = new Market(marketAddress.toHexString());
    let cTokenContract = CTokenNew.bind(marketAddress);
    let underlyingAddress: string;
    let underlying = cTokenContract.try_underlying();
    if (marketAddress.toHexString().toLowerCase() == CETH_ADDRESS) {
      underlyingAddress = ETH_ADDRESS;
    } else if (underlying.reverted) {
      underlyingAddress = ZERO_ADDRESS;
    } else {
      underlyingAddress = underlying.value.toHexString();
    }

    // add market id to protocol
    let protocol = getOrCreateLendingProtcol();
    market.protocol = protocol.id;

    // create/add Tokens
    let inputToken = getOrCreateToken(underlyingAddress);
    let outputToken = getOrCreateCToken(marketAddress, cTokenContract);
    market.inputToken = inputToken.id;
    market.outputToken = outputToken.id;
    // COMP was not given as rewards until block 10271924
    if (event.block.number.toI32() > 10271924) {
      let rewardTokenDeposit = getOrCreateRewardToken(RewardTokenType.DEPOSIT);
      let rewardTokenBorrow = getOrCreateRewardToken(RewardTokenType.BORROW);
      market.rewardTokens = [rewardTokenDeposit.id, rewardTokenBorrow.id];
    }

    // create/add rates
    let depositRate = getOrCreateRate(InterestRateSide.LENDER, InterestRateType.VARIABLE, marketAddress.toHexString());
    let borrowRate = getOrCreateRate(InterestRateSide.BORROWER, InterestRateType.VARIABLE, marketAddress.toHexString());
    market.rates = [depositRate.id, borrowRate.id];

    // populate quantitative data
    market.totalValueLockedUSD = BIGDECIMAL_ZERO;
    market.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    market.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    market._currentBorrowBalance = BIGINT_ZERO;
    market.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    market.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    market.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    market.inputTokenBalance = BIGINT_ZERO;
    market.inputTokenPriceUSD = BIGDECIMAL_ZERO;
    market.outputTokenSupply = BIGINT_ZERO;
    market.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    market.exchangeRate = INITIAL_EXCHANGE_RATE;
    let tryReserveFactor = cTokenContract.try_reserveFactorMantissa();
    market._reserveFactor = tryReserveFactor.reverted
      ? BIGDECIMAL_ZERO
      : tryReserveFactor.value.toBigDecimal().div(exponentToBigDecimal(DEFAULT_DECIMALS));
    market.rewardTokenEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
    market.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    market.createdTimestamp = event.block.timestamp;
    market.createdBlockNumber = event.block.number;
    market._lastRateUpdateBlock = event.block.number;
    market._lastRevenueUpdateBlock = event.block.number;

    // lending-specific data
    if (underlyingAddress == SAI_ADDRESS) {
      market.name = "Dai Stablecoin v1.0 (DAI)";
    } else {
      market.name = inputToken.name;
    }
    market.isActive = true; // event MarketListed() makes a market active
    market.canUseAsCollateral = true; // initially true - if collateral factor = 0 then false
    market.canBorrowFrom = true; // initially active until event ActionPaused()

    // set liquidationPenalty
    market.liquidationPenalty = protocol._liquidationPenalty;

    market.save();
  }

  return market;
}

export function getOrCreateCToken(tokenAddress: Address, cTokenContract: CTokenNew): Token {
  let cToken = Token.load(tokenAddress.toHexString());

  if (cToken == null) {
    cToken = new Token(tokenAddress.toHexString());
    cToken.name = cTokenContract.name();
    cToken.symbol = cTokenContract.symbol();
    cToken.decimals = cTokenContract.decimals();
    cToken.save();
  }
  return cToken;
}

export function getOrCreateToken(tokenAddress: string): Token {
  let token = Token.load(tokenAddress);

  if (token == null) {
    token = new Token(tokenAddress);

    // check for ETH token - unique
    if (tokenAddress == ETH_ADDRESS) {
      token.name = ETH_NAME;
      token.symbol = ETH_SYMBOL;
      token.decimals = DEFAULT_DECIMALS;
    } else {
      token.name = getAssetName(Address.fromString(tokenAddress));
      token.symbol = getAssetSymbol(Address.fromString(tokenAddress));
      token.decimals = getAssetDecimals(Address.fromString(tokenAddress));
    }

    token.save();
  }
  return token;
}

export function getOrCreateRewardToken(type: string): RewardToken {
  let id = type + "-" + COMP_ADDRESS;
  let rewardToken = RewardToken.load(id);
  if (rewardToken == null) {
    rewardToken = new RewardToken(id);
    rewardToken.token = getOrCreateToken(COMP_ADDRESS).id;
    rewardToken.type = type;
    rewardToken.save();
  }
  return rewardToken;
}

export function getOrCreateRate(rateSide: string, rateType: string, marketId: string): InterestRate {
  let id = rateSide + "-" + rateType + "-" + marketId;
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
