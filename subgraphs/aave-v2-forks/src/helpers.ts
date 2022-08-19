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
  PositionSide,
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
  PositionCounter,
  Position,
  ActorAccount,
  PositionSnapshot,
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
    lendingProtocol.openPositionCount = INT_ZERO;
    lendingProtocol.cumulativePositionCount = INT_ZERO;
    lendingProtocol.cumulativeUniqueUsers = INT_ZERO;
    lendingProtocol.cumulativeUniqueDepositors = INT_ZERO;
    lendingProtocol.cumulativeUniqueBorrowers = INT_ZERO;
    lendingProtocol.cumulativeUniqueLiquidators = INT_ZERO;
    lendingProtocol.cumulativeUniqueLiquidatees = INT_ZERO;
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
  eventType: i32,
  isNewTx: boolean // used for liquidations to track daily liquidat-ors/-ees
): void {
  //
  // daily snapshot
  //
  let dailySnapshotID = (blockTimestamp.toI32() / SECONDS_PER_DAY).toString();
  let dailySnapshot = UsageMetricsDailySnapshot.load(dailySnapshotID);
  if (!dailySnapshot) {
    dailySnapshot = new UsageMetricsDailySnapshot(dailySnapshotID);
    dailySnapshot.protocol = protocol.id;
    dailySnapshot.dailyActiveUsers = INT_ZERO;
    dailySnapshot.dailyTransactionCount = INT_ZERO;
    dailySnapshot.dailyDepositCount = INT_ZERO;
    dailySnapshot.dailyWithdrawCount = INT_ZERO;
    dailySnapshot.dailyBorrowCount = INT_ZERO;
    dailySnapshot.dailyRepayCount = INT_ZERO;
    dailySnapshot.dailyLiquidateCount = INT_ZERO;
    dailySnapshot.dailyActiveDepositors = INT_ZERO;
    dailySnapshot.dailyActiveBorrowers = INT_ZERO;
    dailySnapshot.dailyActiveLiquidators = INT_ZERO;
    dailySnapshot.dailyActiveLiquidatees = INT_ZERO;
  }

  //
  // Active users
  //
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

  //
  // Track users per event
  //
  let dailyActorAccountID = ActivityType.DAILY.concat("-")
    .concat(eventType.toString())
    .concat("-")
    .concat(accountID)
    .concat("-")
    .concat(dailySnapshotID);
  let dailyActiveActorAccount = ActiveAccount.load(dailyActorAccountID);
  let isNewActor = dailyActiveActorAccount == null;
  if (isNewActor) {
    dailyActiveActorAccount = new ActiveAccount(dailyActorAccountID);
    dailyActiveActorAccount.save();
  }

  dailySnapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  dailySnapshot.cumulativeUniqueDepositors =
    protocol.cumulativeUniqueDepositors;
  dailySnapshot.cumulativeUniqueBorrowers = protocol.cumulativeUniqueBorrowers;
  dailySnapshot.cumulativeUniqueLiquidators =
    protocol.cumulativeUniqueDepositors;
  dailySnapshot.cumulativeUniqueLiquidatees =
    protocol.cumulativeUniqueLiquidatees;
  if (isNewTx) {
    dailySnapshot.dailyTransactionCount += 1;
  }

  switch (eventType) {
    case EventType.DEPOSIT:
      dailySnapshot.dailyDepositCount += 1;
      if (isNewActor) {
        dailySnapshot.dailyActiveDepositors += 1;
      }
      break;
    case EventType.WITHDRAW:
      dailySnapshot.dailyWithdrawCount += 1;
      break;
    case EventType.BORROW:
      dailySnapshot.dailyBorrowCount += 1;
      if (isNewActor) {
        dailySnapshot.dailyActiveBorrowers += 1;
      }
      break;
    case EventType.REPAY:
      dailySnapshot.dailyRepayCount += 1;
      break;
    case EventType.LIQUIDATOR:
      dailySnapshot.dailyLiquidateCount += 1;
      if (isNewActor) {
        dailySnapshot.dailyActiveLiquidators += 1;
      }
      break;
    case EventType.LIQUIDATEE:
      if (isNewActor) {
        dailySnapshot.dailyActiveLiquidatees += 1;
      }
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
  if (isNewTx) {
    hourlySnapshot.hourlyTransactionCount += 1;
  }

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
    case EventType.LIQUIDATOR:
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
    case EventType.LIQUIDATOR:
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

// This function does the following in this order:
// 1- create a position if needed
// 2- update the positions data
// 3- create a snapshot of the position
export function addPosition(
  protocol: LendingProtocol,
  market: Market,
  account: Account,
  balanceResult: ethereum.CallResult<BigInt>,
  side: string,
  eventType: i32,
  event: ethereum.Event
): string {
  let counterID = account.id
    .concat("-")
    .concat(market.id)
    .concat("-")
    .concat(side);
  let positionCounter = PositionCounter.load(counterID);
  if (!positionCounter) {
    positionCounter = new PositionCounter(counterID);
    positionCounter.nextCount = 0;
    positionCounter.save();
  }
  let positionID = positionCounter.id
    .concat("-")
    .concat(positionCounter.nextCount.toString());

  let position = Position.load(positionID);
  let openPosition = position == null;
  if (openPosition) {
    position = new Position(positionID);
    position.account = account.id;
    position.market = market.id;
    position.hashOpened = event.transaction.hash.toHexString();
    position.blockNumberOpened = event.block.number;
    position.timestampOpened = event.block.timestamp;
    position.side = side;
    if (side == PositionSide.LENDER) {
      position.isCollateral =
        account.enabledCollaterals.indexOf(market.id) >= 0;
    }
    position.balance = BIGINT_ZERO;
    position.depositCount = 0;
    position.withdrawCount = 0;
    position.borrowCount = 0;
    position.repayCount = 0;
    position.liquidationCount = 0;
    position.save();
  }
  position = position!;
  if (balanceResult.reverted) {
    log.warning("[addPosition] Fetch balance of {} from {} reverted", [
      account.id,
      market.id,
    ]);
  } else {
    position.balance = balanceResult.value;
  }
  if (eventType == EventType.DEPOSIT) {
    position.depositCount += 1;
  } else if (eventType == EventType.BORROW) {
    position.borrowCount += 1;
  }
  position.save();

  if (openPosition) {
    //
    // update account position
    //
    account.positionCount += 1;
    account.openPositionCount += 1;
    account.save();

    //
    // update market position
    //
    market.positionCount += 1;
    market.openPositionCount += 1;

    if (eventType == EventType.DEPOSIT) {
      market.lendingPositionCount += 1;
    } else if (eventType == EventType.BORROW) {
      market.borrowingPositionCount += 1;
    }
    market.save();

    //
    // update protocol position
    //
    protocol.cumulativePositionCount += 1;
    protocol.openPositionCount += 1;
    if (eventType == EventType.DEPOSIT) {
      let depositorActorID = "depositor".concat("-").concat(account.id);
      let depositorActor = ActorAccount.load(depositorActorID);
      if (!depositorActor) {
        depositorActor = new ActorAccount(depositorActorID);
        depositorActor.save();

        protocol.cumulativeUniqueDepositors += 1;
      }
    } else if (eventType == EventType.BORROW) {
      let borrowerActorID = "borrower".concat("-").concat(account.id);
      let borrowerActor = ActorAccount.load(borrowerActorID);
      if (!borrowerActor) {
        borrowerActor = new ActorAccount(borrowerActorID);
        borrowerActor.save();

        protocol.cumulativeUniqueBorrowers += 1;
      }
    }
    protocol.save();
  }

  //
  // take position snapshot
  //
  snapshotPosition(position, event);

  return positionID;
}

export function subtractPosition(
  protocol: LendingProtocol,
  market: Market,
  account: Account,
  balanceResult: ethereum.CallResult<BigInt>,
  side: string,
  eventType: i32,
  event: ethereum.Event
): string | null {
  let counterID = account.id
    .concat("-")
    .concat(market.id)
    .concat("-")
    .concat(side);
  let positionCounter = PositionCounter.load(counterID);
  if (!positionCounter) {
    log.warning("[subtractPosition] position counter {} not found", [
      counterID,
    ]);
    return null;
  }
  let positionID = positionCounter.id
    .concat("-")
    .concat(positionCounter.nextCount.toString());
  let position = Position.load(positionID);
  if (!position) {
    log.warning("[subtractPosition] position {} not found", [positionID]);
    return null;
  }

  if (balanceResult.reverted) {
    log.warning("[subtractPosition] Fetch balance of {} from {} reverted", [
      account.id,
      market.id,
    ]);
  } else {
    position.balance = balanceResult.value;
  }
  if (eventType == EventType.WITHDRAW) {
    position.withdrawCount += 1;
    account.withdrawCount += 1;
  } else if (eventType == EventType.REPAY) {
    position.repayCount += 1;
    account.repayCount += 1;
  } else if (eventType == EventType.LIQUIDATEE) {
    position.liquidationCount += 1;
    account.liquidationCount += 1;
  }
  account.save();
  position.save();

  let closePosition = position.balance == BIGINT_ZERO;
  if (closePosition) {
    //
    // update position counter
    //
    positionCounter.nextCount += 1;
    positionCounter.save();

    //
    // close position
    //
    position.hashClosed = event.transaction.hash.toHexString();
    position.blockNumberClosed = event.block.number;
    position.timestampClosed = event.block.timestamp;
    position.save();

    //
    // update account position
    //
    account.openPositionCount -= 1;
    account.closedPositionCount += 1;
    account.save();

    //
    // update market position
    //
    market.openPositionCount -= 1;
    market.closedPositionCount += 1;
    market.save();

    //
    // update protocol position
    //
    protocol.openPositionCount -= 1;
    protocol.save();
  }

  //
  // update position snapshot
  //
  snapshotPosition(position, event);

  return positionID;
}

export function createAccount(accountID: string): Account {
  let account = new Account(accountID);
  account.positionCount = 0;
  account.openPositionCount = 0;
  account.closedPositionCount = 0;
  account.depositCount = 0;
  account.withdrawCount = 0;
  account.borrowCount = 0;
  account.repayCount = 0;
  account.liquidateCount = 0;
  account.liquidationCount = 0;
  account.enabledCollaterals = [];
  account.save();
  return account;
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

function snapshotPosition(position: Position, event: ethereum.Event): void {
  let snapshot = new PositionSnapshot(
    position.id
      .concat("-")
      .concat(event.transaction.hash.toHexString())
      .concat("-")
      .concat(event.logIndex.toString())
  );
  snapshot.hash = event.transaction.hash.toHexString();
  snapshot.logIndex = event.logIndex.toI32();
  snapshot.nonce = event.transaction.nonce;
  snapshot.position = position.id;
  snapshot.balance = position.balance;
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;
  snapshot.save();
}
