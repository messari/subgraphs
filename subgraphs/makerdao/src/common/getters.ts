import { Address, Bytes, ethereum, BigInt, log, BigDecimal } from "@graphprotocol/graph-ts";
import {
  Token,
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  MarketDailySnapshot,
  LendingProtocol,
  Market,
  _Ilk,
  InterestRate,
  MarketHourlySnapshot,
  UsageMetricsHourlySnapshot,
  Liquidate,
  _Chi,
  _Urn,
  _Proxy,
} from "../../generated/schema";
import {
  BIGINT_ONE,
  BIGDECIMAL_ZERO,
  ProtocolType,
  SECONDS_PER_DAY,
  LendingType,
  VAT_ADDRESS,
  ZERO_ADDRESS,
  BIGDECIMAL_ONE,
  DAI_ADDRESS,
  SECONDS_PER_HOUR,
  Network,
  InterestRateSide,
  InterestRateType,
  PROTOCOL_SCHEMA_VERSION,
  PROTOCOL_SUBGRAPH_VERSION,
  PROTOCOL_METHODOLOGY_VERSION,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  BIGINT_ZERO,
  BIGINT_MAX,
  BIGINT_ONE_RAY,
} from "./constants";

export function getOrCreateToken(
  tokenId: string,
  name: string = "unknown",
  symbol: string = "unknown",
  decimals: i32 = 18,
): Token {
  let token = Token.load(tokenId);
  // fetch info if null
  if (token == null) {
    token = new Token(tokenId);
    token.name = name;
    token.symbol = symbol;
    token.decimals = decimals;
    token.save();
  }
  return token;
}

///////////////////////////
///////// Metrics /////////
///////////////////////////

export function getOrCreateUsageMetricsHourlySnapshot(event: ethereum.Event): UsageMetricsHourlySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;

  // Create unique id for the day
  let usageMetrics = UsageMetricsHourlySnapshot.load(id.toString());
  let protocol = getOrCreateLendingProtocol();
  if (usageMetrics == null) {
    usageMetrics = new UsageMetricsHourlySnapshot(id.toString());
    usageMetrics.protocol = protocol.id;
    usageMetrics.hourlyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
    usageMetrics.hourlyTransactionCount = 0;
    usageMetrics.hourlyDepositCount = 0;
    usageMetrics.hourlyBorrowCount = 0;
    usageMetrics.hourlyWithdrawCount = 0;
    usageMetrics.hourlyRepayCount = 0;
    usageMetrics.hourlyLiquidateCount = 0;
    usageMetrics.blockNumber = BIGINT_ZERO;
    usageMetrics.timestamp = BIGINT_ZERO;
    usageMetrics.save();
  }
  return usageMetrics;
}

export function getOrCreateUsageMetricsDailySnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());
  let protocol = getOrCreateLendingProtocol();

  if (usageMetrics == null) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = protocol.id;
    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
    usageMetrics.totalPoolCount = protocol.totalPoolCount;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.dailyDepositCount = 0;
    usageMetrics.dailyBorrowCount = 0;
    usageMetrics.dailyWithdrawCount = 0;
    usageMetrics.dailyRepayCount = 0;
    usageMetrics.dailyLiquidateCount = 0;
    usageMetrics.blockNumber = BIGINT_ZERO;
    usageMetrics.timestamp = BIGINT_ZERO;
    usageMetrics.save();
  }
  return usageMetrics;
}

export function getOrCreateMarketHourlySnapshot(event: ethereum.Event, marketAddress: string): MarketHourlySnapshot {
  let hours: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  let snapshotID = marketAddress.concat("-").concat(hours.toString());
  let marketMetrics = MarketHourlySnapshot.load(snapshotID);
  let market = getOrCreateMarket(marketAddress);

  if (marketMetrics == null) {
    marketMetrics = new MarketHourlySnapshot(snapshotID);
    marketMetrics.protocol = getOrCreateLendingProtocol().id;
    marketMetrics.market = marketAddress;
    marketMetrics.inputTokenBalance = market.inputTokenBalance;
    marketMetrics.inputTokenPriceUSD = market.inputTokenPriceUSD;
    marketMetrics.outputTokenSupply = market.outputTokenSupply;
    marketMetrics.outputTokenPriceUSD = market.outputTokenPriceUSD;
    marketMetrics.totalValueLockedUSD = market.totalValueLockedUSD;
    marketMetrics.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
    marketMetrics.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;

    marketMetrics.cumulativeDepositUSD = market.cumulativeDepositUSD;
    marketMetrics.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
    marketMetrics.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;

    marketMetrics.rates = market.rates;
    marketMetrics.blockNumber = event.block.number;
    marketMetrics.timestamp = event.block.timestamp;

    marketMetrics.hourlyDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyWithdrawUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyRepayUSD = BIGDECIMAL_ZERO;

    marketMetrics.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD;
    marketMetrics.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD;
    marketMetrics.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;

    marketMetrics.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;

    marketMetrics.save();
  }

  return marketMetrics;
}

export function getOrCreateMarketDailySnapshot(event: ethereum.Event, marketAddress: string): MarketDailySnapshot {
  let days: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let snapshotID = marketAddress.concat("-").concat(days.toString());
  let marketMetrics = MarketDailySnapshot.load(snapshotID);
  let market = getOrCreateMarket(marketAddress);

  if (marketMetrics == null) {
    marketMetrics = new MarketDailySnapshot(snapshotID);
    marketMetrics.protocol = getOrCreateLendingProtocol().id;
    marketMetrics.market = marketAddress;
    marketMetrics.inputTokenBalance = market.inputTokenBalance;
    marketMetrics.inputTokenPriceUSD = market.inputTokenPriceUSD;
    marketMetrics.outputTokenSupply = market.outputTokenSupply;
    marketMetrics.outputTokenPriceUSD = market.outputTokenPriceUSD;
    marketMetrics.totalValueLockedUSD = market.totalValueLockedUSD;
    marketMetrics.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
    marketMetrics.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;

    marketMetrics.cumulativeDepositUSD = market.cumulativeDepositUSD;
    marketMetrics.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
    marketMetrics.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;

    marketMetrics.rates = market.rates;
    marketMetrics.blockNumber = event.block.number;
    marketMetrics.timestamp = event.block.timestamp;

    marketMetrics.dailyDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyRepayUSD = BIGDECIMAL_ZERO;

    marketMetrics.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD;
    marketMetrics.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD;
    marketMetrics.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;

    marketMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;

    marketMetrics.save();
  }

  return marketMetrics;
}

export function getOrCreateFinancials(event: ethereum.Event): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  let financialMetrics = FinancialsDailySnapshot.load(id.toString());
  let protocol = getOrCreateLendingProtocol();
  if (financialMetrics == null) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = getOrCreateLendingProtocol().id;
    financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
    financialMetrics.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
    financialMetrics.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
    financialMetrics.mintedTokenSupplies = protocol.mintedTokenSupplies;

    financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
    financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
    financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
    financialMetrics.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
    financialMetrics.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
    financialMetrics.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;

    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyBorrowUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyDepositUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyRepayUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyLiquidateUSD = BIGDECIMAL_ZERO;

    financialMetrics.blockNumber = event.block.number;
    financialMetrics.timestamp = event.block.timestamp;

    financialMetrics.save();
  }
  return financialMetrics;
}

////////////////////////////
///// Lending Specific /////
///////////////////////////

export function getOrCreateLendingProtocol(): LendingProtocol {
  let protocol = LendingProtocol.load(VAT_ADDRESS);
  if (protocol == null) {
    protocol = new LendingProtocol(VAT_ADDRESS);
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.schemaVersion = PROTOCOL_SCHEMA_VERSION;
    protocol.subgraphVersion = PROTOCOL_SUBGRAPH_VERSION;
    protocol.methodologyVersion = PROTOCOL_METHODOLOGY_VERSION;
    protocol.network = Network.MAINNET;
    protocol.type = ProtocolType.LENDING;
    protocol.cumulativeUniqueUsers = 0;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    protocol.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    protocol.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    protocol.totalPoolCount = 0;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.lendingType = LendingType.CDP;
    protocol.mintedTokens = [DAI_ADDRESS];
    protocol.marketIDList = [];
    protocol._par = BIGINT_ONE_RAY;
    protocol.save();
  }
  return protocol;
}

export function getOrCreateMarket(
  marketID: string,
  name: string = "unknown",
  inputToken: string = ZERO_ADDRESS,
  blockNumber: BigInt = BIGINT_ZERO,
  timeStamp: BigInt = BIGINT_ZERO,
): Market {
  let market = Market.load(marketID);
  if (market == null) {
    if (marketID == ZERO_ADDRESS) {
      log.warning("[getOrCreateMarket]Creating a new Market with marketID={}", [marketID]);
    }
    let protocol = getOrCreateLendingProtocol();
    market = new Market(marketID);
    market.name = name;
    market.inputToken = inputToken;
    market.createdTimestamp = timeStamp;
    market.createdBlockNumber = blockNumber;
    market.protocol = protocol.id;

    // set defaults
    market.totalValueLockedUSD = BIGDECIMAL_ZERO;
    market.inputTokenBalance = BIGINT_ZERO;
    market.inputTokenPriceUSD = BIGDECIMAL_ZERO;
    // maker has no output token
    //market.outputToken = ZERO_ADDRESS;
    market.outputTokenSupply = BIGINT_ZERO;
    market.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    market.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    market.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    market.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    market.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    market.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    market.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    market.isActive = true;
    market.canUseAsCollateral = true;
    market.canBorrowFrom = true;
    market.maximumLTV = BIGDECIMAL_ZERO;
    market.liquidationThreshold = BIGDECIMAL_ZERO;
    market.liquidationPenalty = BIGDECIMAL_ZERO;
    market.rates = [BIGDECIMAL_ZERO.toString()];
    market.debtMultiplier = BIGDECIMAL_ZERO;
    market._mat = BIGINT_ONE_RAY;

    market.save();

    let marketIDList = protocol.marketIDList;
    marketIDList.push(marketID);
    protocol.marketIDList = marketIDList;
    protocol.save();
  }

  return market;
}

export function getOrCreateIlk(ilk: Bytes, marketID: string = ZERO_ADDRESS): _Ilk | null {
  let _ilk = _Ilk.load(ilk.toHexString());
  if (_ilk == null && marketID != ZERO_ADDRESS) {
    _ilk = new _Ilk(ilk.toHexString());
    _ilk.marketAddress = marketID;
    _ilk.save();
  }
  return _ilk;
}

export function getOrCreateInterestRate(marketAddress: string, side: string, type: string): InterestRate {
  let interestRateID = side + "-" + type + "-" + marketAddress;
  let interestRate = InterestRate.load(interestRateID);
  if (interestRate) {
    return interestRate;
  }

  interestRate = new InterestRate(interestRateID);
  interestRate.side = side;
  interestRate.type = type;
  interestRate.rate = BIGDECIMAL_ONE;
  interestRate.save();

  return interestRate;
}

export function getLiquidateEvent(LiquidateID: string): Liquidate | null {
  let liquidate = Liquidate.load(LiquidateID);
  if (liquidate == null) {
    log.error("[getLiquidateEvent]Liquidate entity with id {} does not exist", [LiquidateID]);
    return null;
  }
  return liquidate;
}

export function getOrCreateLiquidate(
  LiquidateID: string,
  event: ethereum.Event | null = null,
  market: Market | null = null,
  liquidatee: string | null = null,
  liquidator: string | null = null,
  amount: BigInt | null = null,
  amountUSD: BigDecimal | null = null,
  profitUSD: BigDecimal | null = null,
): Liquidate {
  let liquidate = Liquidate.load(LiquidateID);
  if (liquidate == null) {
    liquidate = new Liquidate(LiquidateID);
    liquidate.hash = event!.transaction.hash.toHexString();
    liquidate.logIndex = event!.logIndex.toI32();
    liquidate.protocol = market!.protocol;
    liquidate.to = market!.id;
    liquidate.from = liquidator!;
    liquidate.liquidatee = liquidatee!;
    liquidate.blockNumber = event!.block.number;
    liquidate.timestamp = event!.block.timestamp;
    liquidate.market = market!.id;
    liquidate.asset = market!.inputToken;
    liquidate.amount = amount!;
    liquidate.amountUSD = amountUSD!;
    liquidate.profitUSD = profitUSD!;
    liquidate.save();
  }
  return liquidate;
}

export function getOrCreateChi(chiID: string): _Chi {
  let _chi = _Chi.load(chiID);
  if (_chi == null) {
    _chi = new _Chi(chiID);
    _chi.chi = BIGINT_ONE_RAY;
    _chi.rho = BIGINT_ZERO;
    _chi.save();
  }

  return _chi;
}

///////////////////////////
///////// Helpers /////////
///////////////////////////

export function getMarketAddressFromIlk(ilk: Bytes): Address | null {
  let _ilk = getOrCreateIlk(ilk);
  if (_ilk) return Address.fromString(_ilk.marketAddress);

  log.warning("[getMarketAddressFromIlk]MarketAddress for ilk {} not found", [ilk.toString()]);
  return null;
}

export function getMarketFromIlk(ilk: Bytes): Market | null {
  const marketAddress = getMarketAddressFromIlk(ilk);
  return getOrCreateMarket(marketAddress!.toHexString());
}

export function getOwnerAddressFromCdp(urn: string): string {
  let owner = urn;
  let _urn = _Urn.load(urn);
  if (_urn) {
    owner = _urn.ownerAddress;
  }
  return owner;
}

export function getOwnerAddressFromProxy(proxy: string): string {
  let owner = proxy;
  let _proxy = _Proxy.load(proxy);
  if (_proxy) {
    owner = _proxy.ownerAddress;
  }
  return owner;
}
