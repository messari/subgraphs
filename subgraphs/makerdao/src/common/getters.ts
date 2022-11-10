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
  _PositionCounter,
  Position,
  Account,
} from "../../generated/schema";
import { Versions } from "../versions";
import {
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
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  BIGINT_ZERO,
  BIGINT_ONE_RAY,
  INT_ZERO,
  PositionSide,
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
  const id: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;

  // Create unique id for the day
  let usageMetrics = UsageMetricsHourlySnapshot.load(id.toString());
  const protocol = getOrCreateLendingProtocol();
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
  const id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());
  const protocol = getOrCreateLendingProtocol();

  if (usageMetrics == null) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = protocol.id;
    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.dailyActiveDepositors = 0;
    usageMetrics.dailyActiveBorrowers = 0;
    usageMetrics.dailyActiveLiquidators = 0;
    usageMetrics.dailyActiveLiquidatees = 0;
    usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
    usageMetrics.cumulativeUniqueDepositors = protocol.cumulativeUniqueDepositors;
    usageMetrics.cumulativeUniqueBorrowers = protocol.cumulativeUniqueBorrowers;
    usageMetrics.cumulativeUniqueLiquidators = protocol.cumulativeUniqueLiquidators;
    usageMetrics.cumulativeUniqueLiquidatees = protocol.cumulativeUniqueLiquidatees;
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
  const hours: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  const snapshotID = marketAddress.concat("-").concat(hours.toString());
  let marketMetrics = MarketHourlySnapshot.load(snapshotID);
  const market = getOrCreateMarket(marketAddress);

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
  const days: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  const snapshotID = marketAddress.concat("-").concat(days.toString());
  let marketMetrics = MarketDailySnapshot.load(snapshotID);
  const market = getOrCreateMarket(marketAddress);

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
  const id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  let financialMetrics = FinancialsDailySnapshot.load(id.toString());
  const protocol = getOrCreateLendingProtocol();
  if (financialMetrics == null) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = getOrCreateLendingProtocol().id;
    financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
    financialMetrics.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
    financialMetrics.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
    financialMetrics.mintedTokenSupplies = protocol.mintedTokenSupplies;

    financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
    financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
    financialMetrics._cumulativeProtocolSideStabilityFeeRevenue = protocol._cumulativeProtocolSideStabilityFeeRevenue;
    financialMetrics._cumulativeProtocolSideLiquidationRevenue = protocol._cumulativeProtocolSideLiquidationRevenue;
    financialMetrics._cumulativeProtocolSidePSMRevenue = protocol._cumulativeProtocolSidePSMRevenue;
    financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
    financialMetrics.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
    financialMetrics.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
    financialMetrics.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;

    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics._dailyProtocolSideStabilityFeeRevenue = BIGDECIMAL_ZERO;
    financialMetrics._dailyProtocolSideLiquidationRevenue = BIGDECIMAL_ZERO;
    financialMetrics._dailyProtocolSidePSMRevenue = BIGDECIMAL_ZERO;
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
    protocol.network = Network.MAINNET;
    protocol.type = ProtocolType.LENDING;
    protocol.cumulativeUniqueUsers = 0;
    protocol.cumulativeUniqueBorrowers = 0;
    protocol.cumulativeUniqueDepositors = 0;
    protocol.cumulativeUniqueLiquidatees = 0;
    protocol.cumulativeUniqueLiquidators = 0;
    protocol.openPositionCount = 0;
    protocol.cumulativePositionCount = 0;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol._cumulativeProtocolSideStabilityFeeRevenue = BIGDECIMAL_ZERO;
    protocol._cumulativeProtocolSideLiquidationRevenue = BIGDECIMAL_ZERO;
    protocol._cumulativeProtocolSidePSMRevenue = BIGDECIMAL_ZERO;
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
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();

  protocol.save();

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
    const protocol = getOrCreateLendingProtocol();
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
    market._mat = BIGINT_ONE_RAY;

    market.positionCount = INT_ZERO;
    market.openPositionCount = INT_ZERO;
    market.closedPositionCount = INT_ZERO;
    market.borrowingPositionCount = INT_ZERO;
    market.lendingPositionCount = INT_ZERO;

    market.save();

    const marketIDList = protocol.marketIDList;
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
  const interestRateID = side + "-" + type + "-" + marketAddress;
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
  const liquidate = Liquidate.load(LiquidateID);
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
    liquidate.nonce = event!.transaction.nonce;
    liquidate.liquidator = liquidator!;
    liquidate.liquidatee = liquidatee!;
    liquidate.blockNumber = event!.block.number;
    liquidate.timestamp = event!.block.timestamp;
    liquidate.market = market!.id;
    liquidate.asset = market!.inputToken;
    liquidate.amount = amount!;
    liquidate.amountUSD = amountUSD!;
    liquidate.profitUSD = profitUSD!;
    liquidate.position = "";
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
export function getOrCreateAccount(accountID: string): Account {
  let account = Account.load(accountID);
  if (account == null) {
    account = new Account(accountID);
    account.depositCount = INT_ZERO;
    account.withdrawCount = INT_ZERO;
    account.borrowCount = INT_ZERO;
    account.repayCount = INT_ZERO;
    account.liquidateCount = INT_ZERO;
    account.liquidationCount = INT_ZERO;
    account.positionCount = INT_ZERO;
    account.openPositionCount = INT_ZERO;
    account.closedPositionCount = INT_ZERO;
    account._positionIDList = [];
    account.save();
  }

  return account;
}

export function getOrCreatePosition(
  event: ethereum.Event,
  address: string,
  ilk: Bytes,
  side: string,
  newPosition: bool = false,
): Position {
  const urnOwnerAddr = getOwnerAddressFromUrn(address);
  const _is_urn = urnOwnerAddr == null ? false : true;
  // urn owner may be a proxy
  const proxyOwnerAddr = getOwnerAddressFromProxy(address);
  const urnProxyOwnerAddr = urnOwnerAddr ? getOwnerAddressFromProxy(urnOwnerAddr) : null;
  const _is_proxy = proxyOwnerAddr == null && urnProxyOwnerAddr == null ? false : true;
  const accountAddress = getOwnerAddress(address);
  const marketID = getMarketAddressFromIlk(ilk)!.toHexString();
  const positionPrefix = `${address}-${marketID}-${side}`;
  const counterEnity = getOrCreatePositionCounter(address, ilk, side);
  let counter = counterEnity.nextCount;
  let positionID = `${positionPrefix}-${counter}`;
  let position = Position.load(positionID);

  if (newPosition && position != null) {
    // increase the counter to force a new position
    // this is necessary when receiving a transferred position
    counter += 1;
    positionID = `${positionPrefix}-${counter}`;
    position = Position.load(positionID);
    counterEnity.nextCount = counter;
    counterEnity.save();
  }

  if (position == null) {
    // new position
    position = new Position(positionID);
    position.market = marketID;
    position.account = accountAddress;
    position._is_urn = _is_urn;
    position._is_proxy = _is_proxy;
    position.hashOpened = event.transaction.hash.toHexString();
    position.blockNumberOpened = event.block.number;
    position.timestampOpened = event.block.timestamp;
    position.side = side;
    position.balance = BIGINT_ZERO;
    position.depositCount = INT_ZERO;
    position.withdrawCount = INT_ZERO;
    position.borrowCount = INT_ZERO;
    position.repayCount = INT_ZERO;
    position.liquidationCount = INT_ZERO;

    if (side == PositionSide.LENDER) {
      //isCollateral is always enabled for maker lender position
      position.isCollateral = true;
    }

    position.save();
  }

  log.info("[getOrCreatePosition]Get/create position positionID={}, account={}, balance={}", [
    positionID,
    accountAddress,
    position.balance.toString(),
  ]);
  return position;
}

// find the open position for the matching urn/ilk/side combination
// there should be only one or none
export function getOpenPosition(urn: string, ilk: Bytes, side: string): Position | null {
  const marketID = getMarketAddressFromIlk(ilk)!.toHexString();
  const nextCounter = getNextPositionCounter(urn, ilk, side);
  log.info("[getOpenPosition]Finding open position for urn {}/ilk {}/side {}", [urn, ilk.toString(), side]);
  for (let counter = nextCounter; counter >= 0; counter--) {
    const positionID = `${urn}-${marketID}-${side}-${counter}`;
    const position = Position.load(positionID);
    if (position) {
      const hashClosed = position.hashClosed != null ? position.hashClosed! : "null";
      const balance = position.balance.toString();
      const account = position.account;
      // position is open
      if (position.hashClosed == null) {
        log.info(
          "[getOpenPosition]found open position counter={}, position.id={}, account={}, balance={}, hashClosed={}",
          [counter.toString(), positionID, account, balance, hashClosed],
        );
        return position;
      } else {
        log.info("[getOpenPosition]iterating counter={}, position.id={}, account={}, balance={}, hashClosed={}", [
          counter.toString(),
          positionID,
          account,
          balance,
          hashClosed,
        ]);
      }
    } else {
      log.info("[getOpenPosition]iterating counter={}, position.id={} doesn't exist", [counter.toString(), positionID]);
    }
  }
  log.info("[getOpenPosition]No open position for urn {}/ilk {}/side {}", [urn, ilk.toString(), side]);

  return null;
}

export function getOrCreatePositionCounter(urn: string, ilk: Bytes, side: string): _PositionCounter {
  const marketID = getMarketAddressFromIlk(ilk)!.toHexString();
  const ID = `${urn}-${marketID}-${side}`;
  let counterEnity = _PositionCounter.load(ID);
  if (!counterEnity) {
    counterEnity = new _PositionCounter(ID);
    counterEnity.nextCount = INT_ZERO;
    counterEnity.save();
  }
  return counterEnity;
}

///////////////////////////
///////// Helpers /////////
///////////////////////////
export function getNextPositionCounter(urn: string, ilk: Bytes, side: string): i32 {
  const counterEnity = getOrCreatePositionCounter(urn, ilk, side);
  return counterEnity.nextCount;
}

export function getMarketAddressFromIlk(ilk: Bytes): Address | null {
  const _ilk = getOrCreateIlk(ilk);
  if (_ilk) return Address.fromString(_ilk.marketAddress);

  log.warning("[getMarketAddressFromIlk]MarketAddress for ilk {} not found", [ilk.toString()]);
  return null;
}

export function getMarketFromIlk(ilk: Bytes): Market | null {
  const marketAddress = getMarketAddressFromIlk(ilk);
  if (marketAddress) {
    return getOrCreateMarket(marketAddress.toHexString());
  }
  return null;
}

export function getOwnerAddressFromUrn(urn: string): string | null {
  const _urn = _Urn.load(urn);
  if (_urn) {
    return _urn.ownerAddress;
  }
  return null;
}

export function getOwnerAddressFromProxy(proxy: string): string | null {
  const _proxy = _Proxy.load(proxy);
  if (_proxy) {
    return _proxy.ownerAddress;
  }
  return null;
}

// get owner address from possible urn or proxy address
// return itself if it is not an urn or proxy
export function getOwnerAddress(address: string): string {
  const urnOwner = getOwnerAddressFromUrn(address);
  let owner = urnOwner ? urnOwner : address;
  const proxyOwner = getOwnerAddressFromProxy(owner);
  owner = proxyOwner ? proxyOwner : owner;
  return owner;
}

// this is needed to prevent snapshot rates from being pointers to the current rate
export function getSnapshotRates(rates: string[], timeSuffix: string): string[] {
  const snapshotRates: string[] = [];
  for (let i = 0; i < rates.length; i++) {
    const rate = InterestRate.load(rates[i]);
    if (!rate) {
      log.warning("[getSnapshotRates] rate {} not found, should not happen", [rates[i]]);
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
