import { Address, ethereum, BigInt, BigDecimal, log } from "@graphprotocol/graph-ts";
import { Factory } from "../../generated/Factory/Factory";
import { PriceOracle } from "../../generated/Factory/PriceOracle";
import { CErc20 } from "../../generated/templates/CToken/CErc20";
import { ERC20 } from "../../generated/Factory/ERC20";
import { decimalsToBigDecimal, prefixID } from "./utils";
import { InterestRate } from "../../generated/schema";
import {
  Token,
  LendingProtocol,
  Market,
  MarketDailySnapshot,
  MarketHourlySnapshot,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  FinancialsDailySnapshot,
} from "../../generated/schema";
import {
  Network,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ZERO,
  FACTORY_ADDRESS,
  INV_ADDRESS,
  ZERO_ADDRESS,
  ProtocolType,
  LendingType,
  RiskType,
  MANTISSA_DECIMALS,
  RewardTokenType,
  InterestRateType,
  InterestRateSide,
  SECONDS_PER_HOUR,
  SECONDS_PER_DAY,
} from "../common/constants";

export function getOrCreateToken(cToken: Address): Token {
  let tokenId: string = cToken.toHexString();
  let token = Token.load(tokenId);

  if (token == null) {
    token = new Token(tokenId);

    let contract = CErc20.bind(cToken);
    token.name = contract.name();
    token.symbol = contract.symbol();
    token.decimals = contract.decimals();

    token.save();
  }
  return token;
}

export function getOrCreateUnderlyingToken(cToken: Address): Token {
  // use default for cETH, which has no underlying
  let tokenId = ZERO_ADDRESS;
  let name = "Ether";
  let symbol = "ETH";
  let decimals = 18;

  //even if the underlying token is not always a CErc20,
  // it should work for the purpose of getting name, symbol, & decimals
  let cTokenContract = CErc20.bind(cToken);
  let tryUnderlyingTokenAddr = cTokenContract.try_underlying();
  if (!tryUnderlyingTokenAddr.reverted) {
    let tokenId = tryUnderlyingTokenAddr.value.toHexString();
    let underlyingTokenContract = ERC20.bind(tryUnderlyingTokenAddr.value);
    let name = underlyingTokenContract.name();
    let symbol = underlyingTokenContract.symbol();
    let decimals = underlyingTokenContract.decimals();
  }

  let token = Token.load(tokenId);

  if (token == null) {
    token = new Token(tokenId);
    token.name = name;
    token.symbol = symbol;
    token.decimals = decimals;

    token.save();
  }
  return token;
}

export function getUnderlyingTokenPrice(cToken: Address): BigDecimal {
  let factoryContract = Factory.bind(Address.fromString(FACTORY_ADDRESS));
  let oracleAddress = factoryContract.oracle() as Address;
  let oracleContract = PriceOracle.bind(oracleAddress);
  let underlyingPrice = oracleContract
    .getUnderlyingPrice(cToken)
    .toBigDecimal()
    .div(decimalsToBigDecimal(MANTISSA_DECIMALS));

  return underlyingPrice;
}

export function getUnderlyingTokenPricePerAmount(cToken: Address): BigDecimal {
  //return price of 1 underlying token
  let underlyingPrice = getUnderlyingTokenPrice(cToken);
  let decimals = getOrCreateUnderlyingToken(cToken).decimals;
  //let denominator = new BigDecimal(BigInt.fromI64(10^decimals))
  let denominator = decimalsToBigDecimal(decimals);
  return underlyingPrice.div(denominator);
}

export function getOrCreateProtocol(): LendingProtocol {
  let protocol = LendingProtocol.load(FACTORY_ADDRESS);

  if (!protocol) {
    protocol = new LendingProtocol(FACTORY_ADDRESS);
    protocol.name = "Inverse Finance v1";
    protocol.slug = "inverse-finance-v1";
    protocol.schemaVersion = "1.2.1";
    protocol.subgraphVersion = "1.2.1";
    protocol.methodologyVersion = "1.2.1";
    protocol.network = Network.ETHEREUM;
    protocol.type = ProtocolType.LENDING;
    protocol.lendingType = LendingType.CDP;
    protocol.riskType = RiskType.GLOBAL;
    protocol.mintedTokens = [];
    protocol.mintedTokenSupplies = [];
    ////// quantitative data //////
    protocol.cumulativeUniqueUsers = INT_ZERO;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    protocol.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;

    //protocol.usageMetrics
    //protocol.financialMetrics
    //protocol.markets

    protocol.save();
  }
  return protocol;
}

export function getOrCreateMarket(marketId: string, event: ethereum.Event): Market {
  let market = Market.load(marketId);

  if (market == null) {
    let contract = CErc20.bind(Address.fromString(marketId));

    let asset = ZERO_ADDRESS; //default
    let tryAsset = contract.try_underlying();
    if (!tryAsset.reverted) {
      asset = tryAsset.value.toHexString();
    }

    market = new Market(marketId);
    market.protocol = FACTORY_ADDRESS;
    market.name = contract.name();
    // isActive resets once Transfer is paused/unpaused
    market.isActive = true;
    market.canUseAsCollateral = false;
    market.canBorrowFrom = true; //borrowGuardianPaused is default to false
    market.maximumLTV = BIGDECIMAL_ZERO;
    market.liquidationThreshold = BIGDECIMAL_ZERO;
    market.liquidationPenalty = BIGDECIMAL_ZERO;

    market.inputToken = asset;
    market.outputToken = marketId; //Token.load(marketId).id
    market.rewardTokens = [
      prefixID(INV_ADDRESS, RewardTokenType.DEPOSIT),
      prefixID(INV_ADDRESS, RewardTokenType.BORROW),
    ];

    market.rates = [
      prefixID(marketId, InterestRateSide.LENDER, InterestRateType.VARIABLE),
      prefixID(marketId, InterestRateSide.BORROWER, InterestRateType.VARIABLE),
    ]; //TODO: use InterestRate entity
    //inverse finance does not have stable borrow rate
    //market.stableBorrowRate

    market.totalValueLockedUSD = BIGDECIMAL_ZERO;
    market.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    market.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    market.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    market.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    market.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    market.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    market.inputTokenBalance = BIGINT_ZERO;
    market.inputTokenPriceUSD = BIGDECIMAL_ZERO;
    market.outputTokenSupply = BIGINT_ZERO;
    market.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    market.exchangeRate = BIGDECIMAL_ZERO;
    market.rewardTokenEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
    market.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

    //market.snapshots
    //market.deposits
    //market.withdraws
    //market.borrows
    //market.repays
    //market.liquidates

    market.createdTimestamp = event.block.timestamp;
    market.createdBlockNumber = event.block.number;
    market.save();
  }
  return market;
}

export function getOrCreateMarketDailySnapshot(event: ethereum.Event): MarketDailySnapshot {
  let days = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let daysStr: string = days.toString();
  let marketId = event.address.toHexString();
  let id = prefixID(marketId, daysStr);

  let marketMetrics = MarketDailySnapshot.load(id);
  if (marketMetrics == null) {
    marketMetrics = new MarketDailySnapshot(id);

    marketMetrics.protocol = FACTORY_ADDRESS;
    marketMetrics.market = marketId;
    marketMetrics.blockNumber = event.block.number;
    marketMetrics.timestamp = event.block.timestamp;
    marketMetrics.rates = [
      prefixID(marketId, InterestRateSide.LENDER, InterestRateType.VARIABLE),
      prefixID(marketId, InterestRateSide.BORROWER, InterestRateType.VARIABLE),
    ];
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

    marketMetrics.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    marketMetrics.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];

    marketMetrics.save();
  }

  return marketMetrics;
}

export function getOrCreateMarketHourlySnapshot(event: ethereum.Event): MarketHourlySnapshot {
  let days = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let daysStr: string = days.toString();
  let secondsPastMidnight = event.block.timestamp.toI64() % SECONDS_PER_DAY;
  // HH: hour of the day
  let hours = secondsPastMidnight / SECONDS_PER_HOUR;
  let hoursStr = hours.toString();

  let marketId = event.address.toHexString();
  let id = prefixID(marketId, daysStr, hoursStr);

  let marketMetrics = MarketHourlySnapshot.load(id);
  if (marketMetrics == null) {
    marketMetrics = new MarketHourlySnapshot(id);

    marketMetrics.protocol = FACTORY_ADDRESS;
    marketMetrics.market = marketId;
    marketMetrics.blockNumber = event.block.number;
    marketMetrics.timestamp = event.block.timestamp;
    marketMetrics.rates = [
      prefixID(marketId, InterestRateSide.LENDER, InterestRateType.VARIABLE),
      prefixID(marketId, InterestRateSide.BORROWER, InterestRateType.VARIABLE),
    ];
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

    marketMetrics.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    marketMetrics.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];

    marketMetrics.save();
  }

  return marketMetrics;
}

export function getOrCreateUsageMetricsDailySnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let days = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let daysStr: string = days.toString();

  let usageMetrics = UsageMetricsDailySnapshot.load(daysStr);
  if (usageMetrics == null) {
    usageMetrics = new UsageMetricsDailySnapshot(daysStr);

    usageMetrics.protocol = FACTORY_ADDRESS;
    usageMetrics.dailyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = INT_ZERO;
    usageMetrics.dailyTransactionCount = INT_ZERO;
    usageMetrics.dailyDepositCount = INT_ZERO;
    usageMetrics.dailyWithdrawCount = INT_ZERO;
    usageMetrics.dailyBorrowCount = INT_ZERO;
    usageMetrics.dailyRepayCount = INT_ZERO;
    usageMetrics.dailyLiquidateCount = INT_ZERO;
    usageMetrics.save();
  }
  return usageMetrics;
}

export function getOrCreateUsageMetricsHourlySnapshot(event: ethereum.Event): UsageMetricsHourlySnapshot {
  // Number of days since Unix epoch
  let days = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let secondsPastMidnight = event.block.timestamp.toI64() % SECONDS_PER_DAY;
  // HH: hour of the day
  let hours = secondsPastMidnight / SECONDS_PER_HOUR;

  let daysHoursStr: string = days.toString() + "-" + hours.toString();

  let usageMetrics = UsageMetricsHourlySnapshot.load(daysHoursStr);
  if (usageMetrics == null) {
    usageMetrics = new UsageMetricsHourlySnapshot(daysHoursStr);

    usageMetrics.protocol = FACTORY_ADDRESS;
    usageMetrics.hourlyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = INT_ZERO;
    usageMetrics.hourlyTransactionCount = INT_ZERO;
    usageMetrics.hourlyDepositCount = INT_ZERO;
    usageMetrics.hourlyWithdrawCount = INT_ZERO;
    usageMetrics.hourlyBorrowCount = INT_ZERO;
    usageMetrics.hourlyRepayCount = INT_ZERO;
    usageMetrics.hourlyLiquidateCount = INT_ZERO;
    usageMetrics.save();
  }
  return usageMetrics;
}

export function getOrCreateFinancialsDailySnapshot(event: ethereum.Event): FinancialsDailySnapshot {
  let daysStr: string = (event.block.timestamp.toI64() / SECONDS_PER_DAY).toString();
  let financialMetrics = FinancialsDailySnapshot.load(daysStr);
  if (financialMetrics == null) {
    financialMetrics = new FinancialsDailySnapshot(daysStr);

    financialMetrics.protocol = FACTORY_ADDRESS;
    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    financialMetrics.mintedTokenSupplies = [];
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

export function getOrCreateInterestRate(
  id: string | null = null,
  side: string = InterestRateSide.BORROWER,
  type: string = InterestRateType.VARIABLE,
  marketId: string = ZERO_ADDRESS,
): InterestRate {
  if (id == null) {
    assert(marketId != ZERO_ADDRESS, "The marketId must be specified when InterestRate id is null");
    id = prefixID(marketId, side, type);
  }

  let interestRate = InterestRate.load(id!);
  if (interestRate == null) {
    interestRate = new InterestRate(id!);
    interestRate.rate = BIGDECIMAL_ZERO;
    interestRate.side = side;
    interestRate.type = type;
  }
  return interestRate;
}
