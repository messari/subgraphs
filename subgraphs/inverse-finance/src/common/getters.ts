import { Address, ethereum, BigInt, BigDecimal, log } from "@graphprotocol/graph-ts";
import { Factory } from "../../generated/Factory/Factory";
import { PriceOracle } from "../../generated/Factory/PriceOracle";
import { CErc20 } from "../../generated/templates/CToken/CErc20";
import { decimalsToBigDecimal, prefixID } from "./utils";
import {
  Token,
  LendingProtocol,
  Market,
  MarketDailySnapshot,
  MarketHourlySnapshot,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  FinancialsDailySnapshot,
  InterestRate,
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
import { Versions } from "../versions";

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
  let name = "";
  let symbol = "";
  let decimals = 0;

  // underlying for cETH -> ETH
  if (cToken.toHexString() == "0x697b4acaa24430f254224eb794d2a85ba1fa1fb8") {
    name = "Ether";
    symbol = "ETH";
    decimals = 18;
  }

  //even if the underlying token is not always a CErc20,
  // it should work for the purpose of getting name, symbol, & decimals
  let cTokenContract = CErc20.bind(cToken);
  let tryUnderlyingTokenAddr = cTokenContract.try_underlying();
  if (!tryUnderlyingTokenAddr.reverted) {
    tokenId = tryUnderlyingTokenAddr.value.toHexString();
    let underlyingTokenContract = CErc20.bind(tryUnderlyingTokenAddr.value);
    name = underlyingTokenContract.name();
    symbol = underlyingTokenContract.symbol();
    decimals = underlyingTokenContract.decimals();
  } else {
    if (cToken.toHexString() != "0x697b4acaa24430f254224eb794d2a85ba1fa1fb8")
      log.warning("Failed to get underlying for market {}", [cToken.toHexString()]);
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

export function getOrCreateRewardToken(): Token {
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

export function getUnderlyingTokenPrice(cToken: Address): BigDecimal {
  let factoryContract = Factory.bind(Address.fromString(FACTORY_ADDRESS));
  let oracleAddress = factoryContract.oracle() as Address;
  let oracleContract = PriceOracle.bind(oracleAddress);
  let underlyingDecimals = getOrCreateUnderlyingToken(cToken).decimals;
  let mantissaDecimalFactor = 18 - underlyingDecimals + 18;

  let underlyingPrice = oracleContract
    .getUnderlyingPrice(cToken)
    .toBigDecimal()
    .div(decimalsToBigDecimal(mantissaDecimalFactor));

  return underlyingPrice;
}

export function getUnderlyingTokenPricePerAmount(cToken: Address): BigDecimal {
  //return price of 1 underlying token unit
  let underlyingPrice = getUnderlyingTokenPrice(cToken);
  let decimals = getOrCreateUnderlyingToken(cToken).decimals;
  let denominator = decimalsToBigDecimal(decimals);
  return underlyingPrice.div(denominator);
}

export function getOrCreateProtocol(): LendingProtocol {
  let protocol = LendingProtocol.load(FACTORY_ADDRESS);

  if (!protocol) {
    protocol = new LendingProtocol(FACTORY_ADDRESS);
    protocol.name = "Inverse Finance";
    protocol.slug = "inverse-finance";
    protocol.network = Network.ETHEREUM;
    protocol.type = ProtocolType.LENDING;
    protocol.lendingType = LendingType.CDP;
    protocol.riskType = RiskType.GLOBAL;
    protocol.mintedTokens = [];
    protocol.mintedTokenSupplies = [];
    ////// quantitative data //////
    protocol.totalPoolCount = INT_ZERO;
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

    // metrics/markets - derived and don't need to be initialized
    //protocol.usageMetrics
    //protocol.financialMetrics
    //protocol.markets
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();

  protocol.save();

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
    ];
    //inverse finance does not have stable borrow rate - default to null
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
    market.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    market.rewardTokenEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
    market.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

    //market.snapshots - derived and don't need to be initialized
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

  let market = getOrCreateMarket(marketId, event);
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
    marketMetrics.totalValueLockedUSD = market.totalValueLockedUSD;
    marketMetrics.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
    marketMetrics.dailyDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeDepositUSD = market.cumulativeDepositUSD;
    marketMetrics.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
    marketMetrics.dailyBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
    marketMetrics.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
    marketMetrics.dailyRepayUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    marketMetrics.inputTokenBalance = market.inputTokenBalance;
    marketMetrics.inputTokenPriceUSD = market.inputTokenPriceUSD;
    marketMetrics.outputTokenSupply = market.outputTokenSupply;
    marketMetrics.outputTokenPriceUSD = market.outputTokenPriceUSD;
    marketMetrics.exchangeRate = market.exchangeRate;

    marketMetrics.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    marketMetrics.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];

    marketMetrics.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD;
    marketMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD;
    marketMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
    marketMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.save();
  }

  return marketMetrics;
}

export function getOrCreateMarketHourlySnapshot(event: ethereum.Event): MarketHourlySnapshot {
  // Hours since Unix epoch time
  let hours = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  let hoursStr = hours.toString();

  let marketId = event.address.toHexString();
  let id = prefixID(marketId, hoursStr);

  let market = getOrCreateMarket(marketId, event);
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
    marketMetrics.totalValueLockedUSD = market.totalValueLockedUSD;
    marketMetrics.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
    marketMetrics.hourlyDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeDepositUSD = market.cumulativeDepositUSD;
    marketMetrics.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
    marketMetrics.hourlyBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
    marketMetrics.hourlyLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
    marketMetrics.hourlyWithdrawUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyRepayUSD = BIGDECIMAL_ZERO;
    marketMetrics.inputTokenBalance = market.inputTokenBalance;
    marketMetrics.inputTokenPriceUSD = market.inputTokenPriceUSD;
    marketMetrics.outputTokenSupply = market.outputTokenSupply;
    marketMetrics.outputTokenPriceUSD = market.outputTokenPriceUSD;
    marketMetrics.exchangeRate = market.exchangeRate;

    marketMetrics.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    marketMetrics.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];
    marketMetrics.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD;
    marketMetrics.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD;
    marketMetrics.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
    marketMetrics.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;

    marketMetrics.save();
  }

  return marketMetrics;
}

export function getOrCreateUsageMetricsDailySnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let days = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let daysStr: string = days.toString();

  let protocol = getOrCreateProtocol();
  let usageMetrics = UsageMetricsDailySnapshot.load(daysStr);
  if (usageMetrics == null) {
    usageMetrics = new UsageMetricsDailySnapshot(daysStr);

    usageMetrics.protocol = FACTORY_ADDRESS;
    usageMetrics.dailyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
    usageMetrics.dailyTransactionCount = INT_ZERO;
    usageMetrics.dailyDepositCount = INT_ZERO;
    usageMetrics.dailyWithdrawCount = INT_ZERO;
    usageMetrics.dailyBorrowCount = INT_ZERO;
    usageMetrics.dailyRepayCount = INT_ZERO;
    usageMetrics.dailyLiquidateCount = INT_ZERO;
    usageMetrics.totalPoolCount = protocol.totalPoolCount;
    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;
    usageMetrics.save();
  }
  return usageMetrics;
}

export function getOrCreateUsageMetricsHourlySnapshot(event: ethereum.Event): UsageMetricsHourlySnapshot {
  // Number of days since Unix epoch
  let hours = event.block.timestamp.toI64() / SECONDS_PER_HOUR;

  let hoursStr: string = hours.toString();
  let protocol = getOrCreateProtocol();
  let usageMetrics = UsageMetricsHourlySnapshot.load(hoursStr);
  if (usageMetrics == null) {
    usageMetrics = new UsageMetricsHourlySnapshot(hoursStr);

    usageMetrics.protocol = FACTORY_ADDRESS;
    usageMetrics.hourlyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
    usageMetrics.hourlyTransactionCount = INT_ZERO;
    usageMetrics.hourlyDepositCount = INT_ZERO;
    usageMetrics.hourlyWithdrawCount = INT_ZERO;
    usageMetrics.hourlyBorrowCount = INT_ZERO;
    usageMetrics.hourlyRepayCount = INT_ZERO;
    usageMetrics.hourlyLiquidateCount = INT_ZERO;
    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;
    usageMetrics.save();
  }
  return usageMetrics;
}

export function getOrCreateFinancialsDailySnapshot(event: ethereum.Event): FinancialsDailySnapshot {
  let daysStr: string = (event.block.timestamp.toI64() / SECONDS_PER_DAY).toString();
  let protocol = getOrCreateProtocol();
  let financialMetrics = FinancialsDailySnapshot.load(daysStr);
  if (financialMetrics == null) {
    financialMetrics = new FinancialsDailySnapshot(daysStr);

    financialMetrics.protocol = FACTORY_ADDRESS;
    financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
    financialMetrics.mintedTokenSupplies = protocol.mintedTokenSupplies;
    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
    financialMetrics.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
    financialMetrics.dailyDepositUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
    financialMetrics.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
    financialMetrics.dailyBorrowUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
    financialMetrics.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;
    financialMetrics.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyRepayUSD = BIGDECIMAL_ZERO;
    financialMetrics.blockNumber = event.block.number;
    financialMetrics.timestamp = event.block.timestamp;
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

// create seperate InterestRate Entities for each market snapshot
// this is needed to prevent snapshot rates from being pointers to the current rate
export function getSnapshotRates(rates: string[], timeSuffix: string): string[] {
  let snapshotRates: string[] = [];
  for (let i = 0; i < rates.length; i++) {
    let rate = InterestRate.load(rates[i]);
    if (!rate) {
      log.warning("[getSnapshotRates] rate {} not found, should not happen", [rates[i]]);
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
