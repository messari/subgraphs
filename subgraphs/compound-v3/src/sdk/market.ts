import {
  Address,
  Bytes,
  BigInt,
  ethereum,
  BigDecimal,
  log,
} from "@graphprotocol/graph-ts";
import {
  Account,
  ActiveAccount,
  Borrow,
  Deposit,
  Fee,
  FinancialsDailySnapshot,
  Flashloan,
  InterestRate,
  LendingProtocol,
  Liquidate,
  Market,
  MarketDailySnapshot,
  MarketHourlySnapshot,
  Oracle,
  Repay,
  RevenueDetails,
  Token,
  Transfer,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  Withdraw,
} from "../../generated/schema";
import {
  ApproveThisCall__Inputs,
  ApproveThisCall__Outputs,
} from "../../generated/templates/Comet/Comet";
import { Versions } from "../versions";
import {
  AccountActivity,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  exponentToBigDecimal,
  INT_ONE,
  INT_ZERO,
  ProtocolType,
  RevenueSource,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  TransactionType,
} from "./constants";
import { ProtocolData } from "./protocol";
import { TokenClass } from "./token";

/**
 * This file contains schema classes.
 * These classes are used to get, create, update different pieces of stored data.
 * Each class represents a different entity type
 *
 * Schema Version: 3.0.0
 * Last Updated: Nov 10, 2022
 * Author(s):
 *  - @dmelotik
 */

export class MarketClass {
  public event!: ethereum.Event;

  // entities
  public protocol!: LendingProtocol;
  private market!: Market;
  private inputToken!: TokenClass;
  private account!: Account;
  private oracle!: Oracle;

  // snapshots
  private marketHourlySnapshot!: MarketHourlySnapshot;
  private marketDailySnapshot!: MarketDailySnapshot;
  private financialSnapshot!: FinancialsDailySnapshot;
  private usageHourlySnapshot!: UsageMetricsHourlySnapshot;
  private usageDailySnapshot!: UsageMetricsDailySnapshot;

  // instantiate MarketClass (create new Market if necessary)
  constructor(
    marketID: Bytes,
    inputToken: Bytes,
    event: ethereum.Event,
    protocolData: ProtocolData
  ) {
    this.protocol = this.getOrCreateLendingProtocol(protocolData);
    this.inputToken = new TokenClass(inputToken, event);
    let _market = Market.load(marketID);

    // create new market
    if (!_market) {
      _market = new Market(marketID);
      _market.protocol = this.protocol.id;
      _market.isActive = true;
      _market.canBorrowFrom = false; // default
      _market.canUseAsCollateral = false; // default
      _market.maximumLTV = BIGDECIMAL_ZERO; // default
      _market.liquidationThreshold = BIGDECIMAL_ZERO; // default
      _market.liquidationPenalty = BIGDECIMAL_ZERO; // default
      _market.canIsolate = false; // default
      _market.inputToken = this.inputToken.getToken().id;
      _market.inputTokenBalance = BIGINT_ZERO;
      _market.inputTokenPriceUSD = BIGDECIMAL_ZERO;
      _market.totalValueLockedUSD = BIGDECIMAL_ZERO;
      _market.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
      _market.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
      _market.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
      _market.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
      _market.cumulativeDepositUSD = BIGDECIMAL_ZERO;
      _market.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
      _market.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
      _market.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
      _market.cumulativeTransferUSD = BIGDECIMAL_ZERO;
      _market.cumulativeFlashloanUSD = BIGDECIMAL_ZERO;
      _market.transactionCount = INT_ZERO;
      _market.depositCount = INT_ZERO;
      _market.withdrawalCount = INT_ZERO;
      _market.borrowCount = INT_ZERO;
      _market.repayCount = INT_ZERO;
      _market.liquidationCount = INT_ZERO;
      _market.transferCount = INT_ZERO;
      _market.flashloanCount = INT_ZERO;

      _market.cumulativeUniqueUsers = INT_ZERO;
      _market.cumulativeUniqueDepositors = INT_ZERO;
      _market.cumulativeUniqueBorrowers = INT_ZERO;
      _market.cumulativeUniqueLiquidators = INT_ZERO;
      _market.cumulativeUniqueLiquidatees = INT_ZERO;
      _market.cumulativeUniqueTransferrers = INT_ZERO;
      _market.cumulativeUniqueFlashloaners = INT_ZERO;

      _market.createdTimestamp = event.block.timestamp;
      _market.createdBlockNumber = event.block.number;

      _market.positionCount = INT_ZERO;
      _market.openPositionCount = INT_ZERO;
      _market.closedPositionCount = INT_ZERO;
      _market.lendingPositionCount = INT_ZERO;
      _market.borrowingPositionCount = INT_ZERO;
      _market.save();

      // add market to protocol
      const markets = this.protocol._markets;
      markets.push(_market.id);
      this.protocol.markets = markets;
      this.protocol.totalPoolCount += INT_ONE;
      this.protocol.save();
    }
    this.market = _market;
    this.event = event;

    // load snapshots
    this.getOrCreateMarketHourlySnapshot();
    this.getOrCreateMarketDailySnapshot();
    this.getOrCreateFinancials();
    this.getOrCreateUsageDailySnapshot();
    this.getOrCreateUsageHourlySnapshot();

    // load oracle
    if (this.market.oracle) {
      this.oracle = Oracle.load(this.market.oracle!)!;
    }
  }

  /////////////////
  //// Getters ////
  /////////////////

  getOrCreateLendingProtocol(data: ProtocolData): LendingProtocol {
    let protocol = LendingProtocol.load(data.protocolID);
    if (!protocol) {
      protocol = new LendingProtocol(data.protocolID);
      protocol.protocol = data.protocol;
      protocol.name = data.name;
      protocol.slug = data.slug;
      protocol.network = data.network;
      protocol.type = ProtocolType.LENDING;
      protocol.lendingType = data.lendingType;
      protocol.lenderPermissionType = data.lenderPermissionType;
      protocol.borrowerPermissionType = data.borrowerPermissionType;
      protocol.riskType = data.riskType;
      protocol.collateralizationType = data.collateralizationType;

      protocol.cumulativeUniqueUsers = INT_ZERO;
      protocol.cumulativeUniqueDepositors = INT_ZERO;
      protocol.cumulativeUniqueBorrowers = INT_ZERO;
      protocol.cumulativeUniqueLiquidators = INT_ZERO;
      protocol.cumulativeUniqueLiquidatees = INT_ZERO;
      protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
      protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
      protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
      protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
      protocol.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
      protocol.cumulativeDepositUSD = BIGDECIMAL_ZERO;
      protocol.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
      protocol.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
      protocol.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
      protocol.totalPoolCount = INT_ZERO;
      protocol.openPositionCount = INT_ZERO;
      protocol.cumulativePositionCount = INT_ZERO;
      protocol.transactionCount = INT_ZERO;
      protocol.depositCount = INT_ZERO;
      protocol.withdrawalCount = INT_ZERO;
      protocol.borrowCount = INT_ZERO;
      protocol.repayCount = INT_ZERO;
      protocol.liquidationCount = INT_ZERO;
      protocol.transferCount = INT_ZERO;
      protocol.flashloanCount = INT_ZERO;
      protocol._markets = [];
    }

    protocol.schemaVersion = Versions.getSchemaVersion();
    protocol.subgraphVersion = Versions.getSubgraphVersion();
    protocol.methodologyVersion = Versions.getMethodologyVersion();
    protocol.save();

    return protocol;
  }

  getMarket(): Market {
    return this.market;
  }

  getInputToken(): Token {
    return this.inputToken.getToken();
  }

  getOrCreateMarketHourlySnapshot(): void {
    const hours = this.event.block.timestamp.toI32() / SECONDS_PER_HOUR;
    const id = this.market.id.concat(Bytes.fromI32(hours));
    let snapshot = MarketHourlySnapshot.load(id);

    if (!snapshot) {
      snapshot = new MarketHourlySnapshot(id);
      snapshot.hours = hours;
      snapshot.protocol = this.protocol.id;
      snapshot.market = this.market.id;
      snapshot.relation = this.market.relation;
      snapshot.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
      snapshot.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
      snapshot.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;
      snapshot.hourlyDepositUSD = BIGDECIMAL_ZERO;
      snapshot.hourlyBorrowUSD = BIGDECIMAL_ZERO;
      snapshot.hourlyLiquidateUSD = BIGDECIMAL_ZERO;
      snapshot.hourlyWithdrawUSD = BIGDECIMAL_ZERO;
      snapshot.hourlyRepayUSD = BIGDECIMAL_ZERO;
      snapshot.hourlyTransferUSD = BIGDECIMAL_ZERO;
      snapshot.hourlyFlashloanUSD = BIGDECIMAL_ZERO;
    }
    snapshot.blockNumber = this.event.block.number;
    snapshot.timestamp = this.event.block.timestamp;
    snapshot.inputTokenBalance = this.market.inputTokenBalance;
    snapshot.inputTokenPriceUSD = this.market.inputTokenPriceUSD;
    snapshot.outputTokenSupply = this.market.outputTokenSupply;
    snapshot.outputTokenPriceUSD = this.market.outputTokenPriceUSD;
    snapshot.exchangeRate = this.market.exchangeRate;
    snapshot.rates = this.market.rates
      ? this.getSnapshotRates(this.market.rates!, hours.toString())
      : null;
    snapshot.fees = this.market.fees
      ? this.getSnapshotFees(this.market.fees!, hours.toString())
      : null;
    snapshot.reserves = this.market.reserves;
    snapshot.variableBorrowedTokenBalance =
      this.market.variableBorrowedTokenBalance;
    snapshot.stableBorrowedTokenBalance =
      this.market.stableBorrowedTokenBalance;
    snapshot.totalValueLockedUSD = this.market.totalValueLockedUSD;
    snapshot.cumulativeSupplySideRevenueUSD =
      this.market.cumulativeSupplySideRevenueUSD;
    snapshot.cumulativeProtocolSideRevenueUSD =
      this.market.cumulativeProtocolSideRevenueUSD;
    snapshot.cumulativeTotalRevenueUSD = this.market.cumulativeTotalRevenueUSD;
    snapshot.totalDepositBalanceUSD = this.market.totalDepositBalanceUSD;
    snapshot.cumulativeDepositUSD = this.market.cumulativeDepositUSD;
    snapshot.totalBorrowBalanceUSD = this.market.totalBorrowBalanceUSD;
    snapshot.cumulativeBorrowUSD = this.market.cumulativeBorrowUSD;
    snapshot.cumulativeLiquidateUSD = this.market.cumulativeLiquidateUSD;
    snapshot.rewardTokenEmissionsAmount =
      this.market.rewardTokenEmissionsAmount;
    snapshot.rewardTokenEmissionsUSD = this.market.rewardTokenEmissionsUSD;
    snapshot.save();

    this.marketHourlySnapshot = snapshot;
  }

  getOrCreateMarketDailySnapshot(): void {
    const days = this.event.block.timestamp.toI32() / SECONDS_PER_DAY;
    const id = this.market.id.concat(Bytes.fromI32(days));
    let snapshot = MarketDailySnapshot.load(id);

    if (!snapshot) {
      snapshot = new MarketDailySnapshot(id);
      snapshot.days = days;
      snapshot.protocol = this.protocol.id;
      snapshot.market = this.market.id;
      snapshot.relation = this.market.relation;
      snapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
      snapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
      snapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
      snapshot.dailyDepositUSD = BIGDECIMAL_ZERO;
      snapshot.dailyNativeDeposit = BIGINT_ZERO;
      snapshot.dailyBorrowUSD = BIGDECIMAL_ZERO;
      snapshot.dailyNativeBorrow = BIGINT_ZERO;
      snapshot.dailyLiquidateUSD = BIGDECIMAL_ZERO;
      snapshot.dailyNativeLiquidate = BIGINT_ZERO;
      snapshot.dailyWithdrawUSD = BIGDECIMAL_ZERO;
      snapshot.dailyNativeWithdraw = BIGINT_ZERO;
      snapshot.dailyRepayUSD = BIGDECIMAL_ZERO;
      snapshot.dailyNativeRepay = BIGINT_ZERO;
      snapshot.dailyTransferUSD = BIGDECIMAL_ZERO;
      snapshot.dailyNativeTransfer = BIGINT_ZERO;
      snapshot.dailyFlashloanUSD = BIGDECIMAL_ZERO;
      snapshot.dailyNativeFlashloan = BIGINT_ZERO;
      snapshot.dailyActiveUsers = INT_ZERO;
      snapshot.dailyActiveDepositors = INT_ZERO;
      snapshot.dailyActiveBorrowers = INT_ZERO;
      snapshot.dailyActiveLiquidators = INT_ZERO;
      snapshot.dailyActiveLiquidatees = INT_ZERO;
      snapshot.dailyActiveTransferrers = INT_ZERO;
      snapshot.dailyActiveFlashloaners = INT_ZERO;
      snapshot.dailyDepositCount = INT_ZERO;
      snapshot.dailyWithdrawCount = INT_ZERO;
      snapshot.dailyBorrowCount = INT_ZERO;
      snapshot.dailyRepayCount = INT_ZERO;
      snapshot.dailyLiquidateCount = INT_ZERO;
      snapshot.dailyTransferCount = INT_ZERO;
      snapshot.dailyFlashloanCount = INT_ZERO;
      snapshot.dailyActiveLendingPositionCount = INT_ZERO;
      snapshot.dailyActiveBorrowingPositionCount = INT_ZERO;
    }
    snapshot.blockNumber = this.event.block.number;
    snapshot.timestamp = this.event.block.timestamp;
    snapshot.inputTokenBalance = this.market.inputTokenBalance;
    snapshot.inputTokenPriceUSD = this.market.inputTokenPriceUSD;
    snapshot.outputTokenSupply = this.market.outputTokenSupply;
    snapshot.outputTokenPriceUSD = this.market.outputTokenPriceUSD;
    snapshot.exchangeRate = this.market.exchangeRate;
    snapshot.rates = this.market.rates
      ? this.getSnapshotRates(this.market.rates!, days.toString())
      : null;
    snapshot.fees = this.market.fees
      ? this.getSnapshotFees(this.market.fees!, days.toString())
      : null;
    snapshot.reserves = this.market.reserves;
    snapshot.variableBorrowedTokenBalance =
      this.market.variableBorrowedTokenBalance;
    snapshot.stableBorrowedTokenBalance =
      this.market.stableBorrowedTokenBalance;
    snapshot.totalValueLockedUSD = this.market.totalValueLockedUSD;
    snapshot.totalReservesUSD = this.market.totalReservesUSD;
    snapshot.cumulativeSupplySideRevenueUSD =
      this.market.cumulativeSupplySideRevenueUSD;
    snapshot.cumulativeProtocolSideRevenueUSD =
      this.market.cumulativeProtocolSideRevenueUSD;
    snapshot.cumulativeTotalRevenueUSD = this.market.cumulativeTotalRevenueUSD;
    snapshot.revenueDetails = this.market.revenueDetails
      ? this.getSnapshotRevenueDetails(this.market.revenueDetails!, days)
      : null;
    snapshot.totalDepositBalanceUSD = this.market.totalDepositBalanceUSD;
    snapshot.cumulativeDepositUSD = this.market.cumulativeDepositUSD;
    snapshot.totalBorrowBalanceUSD = this.market.totalBorrowBalanceUSD;
    snapshot.cumulativeBorrowUSD = this.market.cumulativeBorrowUSD;
    snapshot.cumulativeLiquidateUSD = this.market.cumulativeLiquidateUSD;
    snapshot.cumulativeTransferUSD = this.market.cumulativeTransferUSD;
    snapshot.cumulativeFlashloanUSD = this.market.cumulativeFlashloanUSD;
    snapshot.positionCount = this.market.positionCount;
    snapshot.openPositionCount = this.market.openPositionCount;
    snapshot.closedPositionCount = this.market.closedPositionCount;
    snapshot.lendingPositionCount = this.market.lendingPositionCount;
    snapshot.borrowingPositionCount = this.market.borrowingPositionCount;
    snapshot.rewardTokenEmissionsAmount =
      this.market.rewardTokenEmissionsAmount;
    snapshot.rewardTokenEmissionsUSD = this.market.rewardTokenEmissionsUSD;

    snapshot.save();
    this.marketDailySnapshot = snapshot;
  }

  getOrCreateFinancials(): void {
    const days = this.event.block.timestamp.toI32() / SECONDS_PER_DAY;
    const id = Bytes.fromI32(days);
    let snapshot = FinancialsDailySnapshot.load(id);

    if (!snapshot) {
      snapshot = new FinancialsDailySnapshot(id);
      snapshot.days = days;
      snapshot.protocol = this.protocol.id;
      snapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
      snapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
      snapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
      snapshot.dailyDepositUSD = BIGDECIMAL_ZERO;
      snapshot.dailyBorrowUSD = BIGDECIMAL_ZERO;
      snapshot.dailyLiquidateUSD = BIGDECIMAL_ZERO;
      snapshot.dailyWithdrawUSD = BIGDECIMAL_ZERO;
      snapshot.dailyLiquidateUSD = BIGDECIMAL_ZERO;
      snapshot.dailyWithdrawUSD = BIGDECIMAL_ZERO;
      snapshot.dailyRepayUSD = BIGDECIMAL_ZERO;
      snapshot.dailyTransferUSD = BIGDECIMAL_ZERO;
      snapshot.dailyFlashloanUSD = BIGDECIMAL_ZERO;
    }
    snapshot.blockNumber = this.event.block.number;
    snapshot.timestamp = this.event.block.timestamp;
    snapshot.totalValueLockedUSD = this.protocol.totalValueLockedUSD;
    snapshot.protocolControlledValueUSD =
      this.protocol.protocolControlledValueUSD;
    snapshot.mintedTokenSupplies = this.protocol.mintedTokenSupplies;
    snapshot.cumulativeSupplySideRevenueUSD =
      this.protocol.cumulativeSupplySideRevenueUSD;
    snapshot.cumulativeProtocolSideRevenueUSD =
      this.protocol.cumulativeProtocolSideRevenueUSD;
    snapshot.cumulativeTotalRevenueUSD =
      this.protocol.cumulativeTotalRevenueUSD;
    snapshot.revenueDetails = this.market.revenueDetails
      ? this.getSnapshotRevenueDetails(this.market.revenueDetails!, days)
      : null;
    snapshot.totalDepositBalanceUSD = this.protocol.totalDepositBalanceUSD;
    snapshot.cumulativeDepositUSD = this.protocol.cumulativeDepositUSD;
    snapshot.totalBorrowBalanceUSD = this.protocol.totalBorrowBalanceUSD;
    snapshot.cumulativeBorrowUSD = this.protocol.cumulativeBorrowUSD;
    snapshot.cumulativeLiquidateUSD = this.protocol.cumulativeLiquidateUSD;

    snapshot.save();
    this.financialSnapshot = snapshot;
  }

  getOrCreateUsageDailySnapshot(): void {
    const days = this.event.block.timestamp.toI32() / SECONDS_PER_DAY;
    const id = Bytes.fromI32(days);
    let snapshot = UsageMetricsDailySnapshot.load(id);

    if (!snapshot) {
      snapshot = new UsageMetricsDailySnapshot(id);
      snapshot.days = days;
      snapshot.protocol = this.protocol.id;
      snapshot.dailyActiveUsers = INT_ZERO;
      snapshot.dailyActiveDepositors = INT_ZERO;
      snapshot.dailyActiveBorrowers = INT_ZERO;
      snapshot.dailyActiveLiquidators = INT_ZERO;
      snapshot.dailyActiveLiquidatees = INT_ZERO;
      snapshot.dailyTransactionCount = INT_ZERO;
      snapshot.dailyDepositCount = INT_ZERO;
      snapshot.dailyWithdrawCount = INT_ZERO;
      snapshot.dailyBorrowCount = INT_ZERO;
      snapshot.dailyRepayCount = INT_ZERO;
      snapshot.dailyLiquidateCount = INT_ZERO;
      snapshot.dailyTransferCount = INT_ZERO;
      snapshot.dailyFlashloanCount = INT_ZERO;
      snapshot.dailyActivePositions = INT_ZERO;
    }
    snapshot.cumulativeUniqueUsers = this.protocol.cumulativeUniqueUsers;
    snapshot.cumulativeUniqueDepositors =
      this.protocol.cumulativeUniqueDepositors;
    snapshot.cumulativeUniqueBorrowers =
      this.protocol.cumulativeUniqueBorrowers;
    snapshot.cumulativeUniqueLiquidators =
      this.protocol.cumulativeUniqueLiquidators;
    snapshot.cumulativeUniqueLiquidatees =
      this.protocol.cumulativeUniqueLiquidatees;
    snapshot.cumulativePositionCount = this.protocol.cumulativePositionCount;
    snapshot.openPositionCount = this.protocol.openPositionCount;
    snapshot.totalPoolCount = this.protocol.totalPoolCount;
    snapshot.blockNumber = this.event.block.number;
    snapshot.timestamp = this.event.block.timestamp;

    snapshot.save();
    this.usageDailySnapshot = snapshot;
  }

  getOrCreateUsageHourlySnapshot(): void {
    const hours = this.event.block.timestamp.toI32() / SECONDS_PER_HOUR;
    const id = Bytes.fromI32(hours);
    let snapshot = UsageMetricsHourlySnapshot.load(id);

    if (!snapshot) {
      snapshot = new UsageMetricsHourlySnapshot(id);
      snapshot.hours = hours;
      snapshot.protocol = this.protocol.id;
      snapshot.hourlyActiveUsers = INT_ZERO;
      snapshot.hourlyTransactionCount = INT_ZERO;
      snapshot.hourlyDepositCount = INT_ZERO;
      snapshot.hourlyWithdrawCount = INT_ZERO;
      snapshot.hourlyBorrowCount = INT_ZERO;
      snapshot.hourlyRepayCount = INT_ZERO;
      snapshot.hourlyLiquidateCount = INT_ZERO;
    }
    snapshot.cumulativeUniqueUsers = this.protocol.cumulativeUniqueUsers;
    snapshot.blockNumber = this.event.block.number;
    snapshot.timestamp = this.event.block.timestamp;

    snapshot.save();
    this.usageHourlySnapshot = snapshot;
  }

  getOrCreateOracle(
    oracleAddress: Address,
    isUSD: boolean,
    source?: string
  ): Oracle {
    const oracleID = this.market.id.concat(this.market.inputToken);
    let oracle = Oracle.load(oracleID);
    if (!oracle) {
      oracle = new Oracle(oracleID);
      oracle.market = this.market.id;
      oracle.blockCreated = this.event.block.number;
      oracle.timestampCreated = this.event.block.timestamp;
      oracle.isActive = true;
    }
    oracle.oracleAddress = oracleAddress;
    oracle.isUSD = isUSD;
    if (source) {
      oracle.oracleSource = source;
    }
    oracle.save();
    this.oracle = oracle;

    return oracle;
  }

  getOracleAddress(): Address {
    return Address.fromBytes(this.oracle.oracleAddress);
  }

  getOrUpdateRate(
    rateSide: string,
    rateType: string,
    interestRate: BigDecimal
  ): InterestRate {
    const interestRateID = rateSide
      .concat("-")
      .concat(rateType)
      .concat("-")
      .concat(this.market.id.toHexString());
    let rate = InterestRate.load(interestRateID);
    if (!rate) {
      rate = new InterestRate(interestRateID);
      rate.side = rateSide;
      rate.type = rateType;
    }
    rate.rate = interestRate;
    rate.save();

    if (!this.market.rates) {
      this.market.rates = [];
    }

    if (this.market.rates!.indexOf(interestRateID) == -1) {
      this.market.rates!.push(interestRateID);
    }
    this.market.save();

    return rate;
  }

  getAddress(): Address {
    return Address.fromBytes(this.market.id);
  }

  getSnapshotRates(rates: string[], timeSuffix: string): string[] {
    const snapshotRates: string[] = [];
    for (let i = 0; i < rates.length; i++) {
      const rate = InterestRate.load(rates[i]);
      if (!rate) {
        log.warning("[getSnapshotRates] rate {} not found, should not happen", [
          rates[i],
        ]);
        continue;
      }

      // create new snapshot rate
      const snapshotRateId = rates[i].concat("-").concat(timeSuffix);
      const snapshotRate = new InterestRate(snapshotRateId);
      snapshotRate.rate = rate.rate;
      if (rate.maturityBlock) snapshotRate.maturityBlock = rate.maturityBlock;
      snapshotRate.side = rate.side;
      snapshotRate.type = rate.type;
      if (rate.tranche) snapshotRate.tranche = rate.tranche;
      snapshotRate.save();
      snapshotRates.push(snapshotRateId);
    }
    return snapshotRates;
  }

  getSnapshotFees(fees: string[], timeSuffix: string): string[] {
    const snapshotFees: string[] = [];
    for (let i = 0; i < fees.length; i++) {
      const rate = InterestRate.load(fees[i]);
      if (!rate) {
        log.error("[getSnapshotFees] fee {} not found, should not happen", [
          fees[i],
        ]);
        continue;
      }

      // create new snapshot rate
      const snapshotFeeID = fees[i].concat("-").concat(timeSuffix);
      const snapshotFee = new Fee(snapshotFeeID);
      snapshotFee.rate = rate.rate;
      snapshotFee.type = rate.type;
      snapshotFee.save();
      snapshotFees.push(snapshotFee.id);
    }
    return snapshotFees;
  }

  getSnapshotRevenueDetails(currID: Bytes, timeSuffix: i32): Bytes | null {
    const currDetails = RevenueDetails.load(currID);
    if (!currDetails) {
      log.error(
        "[getRevenueDetailsSnapshot] Cannot find revenue details id: {}",
        [currID.toHexString()]
      );
      return null;
    }

    const newDetails = new RevenueDetails(
      currDetails.id.concat(Bytes.fromI32(timeSuffix))
    );
    newDetails.sources = currDetails.sources;
    newDetails.amountsUSD = currDetails.amountsUSD;
    newDetails.save();

    return newDetails.id;
  }

  getOrCreateRevenueDetails(id: Bytes): RevenueDetails {
    let details = RevenueDetails.load(id);
    if (!details) {
      details = new RevenueDetails(id);
      details.sources = [
        RevenueSource.BORROW_INTEREST,
        RevenueSource.FLASHLOAN_FEE,
        RevenueSource.LIQUIDATION_FEE,
      ];
      details.amountsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
      details.save();
    }

    return details;
  }

  getOrCreateAccount(address: Address): Account {
    const account = new Account(address);
    account.positionCount = INT_ZERO;
    account.openPositionCount = INT_ZERO;
    account.closedPositionCount = INT_ZERO;
    account.depositCount = INT_ZERO;
    account.withdrawCount = INT_ZERO;
    account.borrowCount = INT_ZERO;
    account.repayCount = INT_ZERO;
    account.liquidateCount = INT_ZERO;
    account.liquidationCount = INT_ZERO;
    account.transferredCount = INT_ZERO;
    account.receivedCount = INT_ZERO;
    account.flashloanCount = INT_ZERO;
    account.save();
    return account;
  }

  //////////////////
  //// Creators ////
  //////////////////

  createDeposit(
    asset: Address,
    account: Address,
    amount: BigInt,
    amountUSD: BigDecimal
  ): Deposit {
    const deposit = new Deposit(
      this.event.transaction.hash.concatI32(this.event.logIndex.toI32())
    );
    deposit.hash = this.event.transaction.hash;
    deposit.nonce = this.event.transaction.nonce;
    deposit.logIndex = this.event.logIndex.toI32();
    deposit.gasPrice = this.event.transaction.gasPrice;
    deposit.gasUsed = this.event.receipt ? this.event.receipt!.gasUsed : null;
    deposit.gasLimit = this.event.transaction.gasLimit;
    deposit.blockNumber = this.event.block.number;
    deposit.timestamp = this.event.block.timestamp;
    deposit.account = account;
    deposit.market = this.market.id;
    deposit.position = account; // TODO add position
    deposit.asset = asset;
    deposit.amount = amount;
    deposit.amountUSD = amountUSD;
    deposit.save();

    this.updateTransactionData(TransactionType.DEPOSIT, amount, amountUSD);
    this.updateSnapshotUsage(TransactionType.DEPOSIT, account);

    return deposit;
  }

  createWithdraw(
    asset: Address,
    account: Address,
    amount: BigInt,
    amountUSD: BigDecimal
  ): Withdraw {
    const withdraw = new Withdraw(
      this.event.transaction.hash.concatI32(this.event.logIndex.toI32())
    );
    withdraw.hash = this.event.transaction.hash;
    withdraw.nonce = this.event.transaction.nonce;
    withdraw.logIndex = this.event.logIndex.toI32();
    withdraw.gasPrice = this.event.transaction.gasPrice;
    withdraw.gasUsed = this.event.receipt ? this.event.receipt!.gasUsed : null;
    withdraw.gasLimit = this.event.transaction.gasLimit;
    withdraw.blockNumber = this.event.block.number;
    withdraw.timestamp = this.event.block.timestamp;
    withdraw.account = account;
    withdraw.market = this.market.id;
    withdraw.position = account; // TODO add position
    withdraw.asset = asset;
    withdraw.amount = amount;
    withdraw.amountUSD = amountUSD;
    withdraw.save();

    this.updateTransactionData(TransactionType.WITHDRAW, amount, amountUSD);
    this.updateSnapshotUsage(TransactionType.WITHDRAW, account);

    return withdraw;
  }

  createBorrow(
    asset: Address,
    account: Address,
    amount: BigInt,
    amountUSD: BigDecimal
  ): Borrow {
    const borrow = new Borrow(
      this.event.transaction.hash.concatI32(this.event.logIndex.toI32())
    );
    borrow.hash = this.event.transaction.hash;
    borrow.nonce = this.event.transaction.nonce;
    borrow.logIndex = this.event.logIndex.toI32();
    borrow.gasPrice = this.event.transaction.gasPrice;
    borrow.gasUsed = this.event.receipt ? this.event.receipt!.gasUsed : null;
    borrow.gasLimit = this.event.transaction.gasLimit;
    borrow.blockNumber = this.event.block.number;
    borrow.timestamp = this.event.block.timestamp;
    borrow.account = account;
    borrow.market = this.market.id;
    borrow.position = account; // TODO add position
    borrow.asset = asset;
    borrow.amount = amount;
    borrow.amountUSD = amountUSD;
    borrow.save();

    this.updateTransactionData(TransactionType.BORROW, amount, amountUSD);
    this.updateSnapshotUsage(TransactionType.BORROW, account);

    return borrow;
  }

  createRepay(
    asset: Address,
    account: Address,
    amount: BigInt,
    amountUSD: BigDecimal
  ): Repay {
    const repay = new Repay(
      this.event.transaction.hash.concatI32(this.event.logIndex.toI32())
    );
    repay.hash = this.event.transaction.hash;
    repay.nonce = this.event.transaction.nonce;
    repay.logIndex = this.event.logIndex.toI32();
    repay.gasPrice = this.event.transaction.gasPrice;
    repay.gasUsed = this.event.receipt ? this.event.receipt!.gasUsed : null;
    repay.gasLimit = this.event.transaction.gasLimit;
    repay.blockNumber = this.event.block.number;
    repay.timestamp = this.event.block.timestamp;
    repay.account = account;
    repay.market = this.market.id;
    repay.position = account; // TODO add position
    repay.asset = asset;
    repay.amount = amount;
    repay.amountUSD = amountUSD;
    repay.save();

    this.updateTransactionData(TransactionType.REPAY, amount, amountUSD);
    this.updateSnapshotUsage(TransactionType.REPAY, account);

    return repay;
  }

  createLiquidate(
    asset: Address,
    liquidator: Address,
    liquidatee: Address,
    amount: BigInt,
    amountUSD: BigDecimal,
    profitUSD: BigDecimal
  ): Liquidate {
    const liquidate = new Liquidate(
      this.event.transaction.hash.concatI32(this.event.logIndex.toI32())
    );
    liquidate.hash = this.event.transaction.hash;
    liquidate.nonce = this.event.transaction.nonce;
    liquidate.logIndex = this.event.logIndex.toI32();
    liquidate.gasPrice = this.event.transaction.gasPrice;
    liquidate.gasUsed = this.event.receipt ? this.event.receipt!.gasUsed : null;
    liquidate.gasLimit = this.event.transaction.gasLimit;
    liquidate.blockNumber = this.event.block.number;
    liquidate.timestamp = this.event.block.timestamp;
    liquidate.liquidator = liquidator;
    liquidate.liquidatee = liquidatee;
    liquidate.market = this.market.id;
    liquidate.positions = [liquidatee]; // TODO add position
    liquidate.asset = asset;
    liquidate.amount = amount;
    liquidate.amountUSD = amountUSD;
    liquidate.profitUSD = profitUSD;
    liquidate.save();

    this.updateTransactionData(TransactionType.LIQUIDATE, amount, amountUSD);
    this.updateSnapshotUsage(TransactionType.LIQUIDATEE, liquidatee);
    this.updateSnapshotUsage(TransactionType.LIQUIDATOR, liquidator);

    return liquidate;
  }

  createTransfer(
    asset: Address,
    sender: Address,
    receiver: Address,
    amount: BigInt,
    amountUSD: BigDecimal
  ): Transfer {
    const transfer = new Transfer(
      this.event.transaction.hash.concatI32(this.event.logIndex.toI32())
    );
    transfer.hash = this.event.transaction.hash;
    transfer.nonce = this.event.transaction.nonce;
    transfer.logIndex = this.event.logIndex.toI32();
    transfer.gasPrice = this.event.transaction.gasPrice;
    transfer.gasUsed = this.event.receipt ? this.event.receipt!.gasUsed : null;
    transfer.gasLimit = this.event.transaction.gasLimit;
    transfer.blockNumber = this.event.block.number;
    transfer.timestamp = this.event.block.timestamp;
    transfer.sender = sender;
    transfer.receiver = receiver;
    transfer.market = this.market.id;
    transfer.positions = [sender, receiver]; // TODO add positions
    transfer.asset = asset;
    transfer.amount = amount;
    transfer.amountUSD = amountUSD;
    transfer.save();

    this.updateTransactionData(TransactionType.TRANSFER, amount, amountUSD);
    this.updateSnapshotUsage(TransactionType.TRANSFER, sender);

    return transfer;
  }

  createFlashloan(
    asset: Address,
    account: Address,
    amount: BigInt,
    amountUSD: BigDecimal
  ): Flashloan {
    const flashloan = new Flashloan(
      this.event.transaction.hash.concatI32(this.event.logIndex.toI32())
    );
    flashloan.hash = this.event.transaction.hash;
    flashloan.nonce = this.event.transaction.nonce;
    flashloan.logIndex = this.event.logIndex.toI32();
    flashloan.gasPrice = this.event.transaction.gasPrice;
    flashloan.gasUsed = this.event.receipt ? this.event.receipt!.gasUsed : null;
    flashloan.gasLimit = this.event.transaction.gasLimit;
    flashloan.blockNumber = this.event.block.number;
    flashloan.timestamp = this.event.block.timestamp;
    flashloan.account = account;
    flashloan.market = this.market.id;
    flashloan.asset = asset;
    flashloan.amount = amount;
    flashloan.amountUSD = amountUSD;
    flashloan.save();

    this.updateTransactionData(TransactionType.FLASHLOAN, amount, amountUSD);
    this.updateSnapshotUsage(TransactionType.FLASHLOAN, account);

    return flashloan;
  }

  //////////////////
  //// Updaters ////
  //////////////////

  private updateSnapshotUsage(transactionType: string, account: Address): void {
    // create Account for total active accounts
    // liquidatees are not considered users since they are not spending gas for the transaction
    if (transactionType != TransactionType.LIQUIDATEE) {
      const _account = Account.load(account);
      this.account = this.getOrCreateAccount(account);
      if (!_account) {
        this.protocol.cumulativeUniqueUsers += INT_ONE;
      }
    }

    const dailyActiveAccountID = AccountActivity.DAILY.concat("-")
      .concat(account.toHexString())
      .concat("-")
      .concat(this.marketDailySnapshot.days.toString());
    const dailyActiveAccountMarketID = dailyActiveAccountID
      .concat("-")
      .concat(this.market.id.toHexString());
    const hourlyActiveAccountID = AccountActivity.HOURLY.concat("-")
      .concat(account.toHexString())
      .concat("-")
      .concat(this.marketHourlySnapshot.hours.toString());
    const activeAccountMarketID = account
      .toHexString()
      .concat("-")
      .concat(this.market.id.toHexString());
    const activeAccountTransactionID = transactionType
      .concat("-")
      .concat(account.toHexString());
    const dailyActiveAccountTransactionID = dailyActiveAccountID
      .concat("-")
      .concat(this.marketDailySnapshot.days.toString());
    const activeAccountTransactionMarketID = activeAccountTransactionID
      .concat("-")
      .concat(this.market.id.toHexString());
    const dailyActiveAccountTransactionMarketID = AccountActivity.DAILY.concat(
      "-"
    ).concat(activeAccountTransactionMarketID);
    let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountID); // usage daily
    let dailyActiveAccountMarket = ActiveAccount.load(
      dailyActiveAccountMarketID
    ); // market daily
    let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountID); // usage hourly
    let activeAccountMarket = ActiveAccount.load(activeAccountMarketID); // market
    let activeAccountTransaction = ActiveAccount.load(
      activeAccountTransactionID
    ); // lending protocol
    let dailyActiveAccountTransaction = ActiveAccount.load(
      dailyActiveAccountTransactionID
    ); // usage daily
    let activeAccountTransactionMarket = ActiveAccount.load(
      activeAccountTransactionMarketID
    ); // market
    let dailyActiveAccountTransactionMarket = ActiveAccount.load(
      dailyActiveAccountTransactionMarketID
    ); // market daily

    if (!dailyActiveAccount) {
      dailyActiveAccount = new ActiveAccount(dailyActiveAccountID);
      dailyActiveAccount.save();
      this.usageDailySnapshot.dailyActiveUsers += INT_ONE;
    }
    if (!dailyActiveAccountMarket) {
      dailyActiveAccountMarket = new ActiveAccount(dailyActiveAccountMarketID);
      dailyActiveAccountMarket.save();
      this.marketDailySnapshot.dailyActiveUsers += INT_ONE;
    }
    if (!hourlyActiveAccount) {
      hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountID);
      hourlyActiveAccount.save();
      this.usageHourlySnapshot.hourlyActiveUsers += INT_ONE;
    }
    if (!activeAccountMarket) {
      activeAccountMarket = new ActiveAccount(activeAccountMarketID);
      activeAccountMarket.save();
      this.market.cumulativeUniqueUsers += INT_ONE;
    }
    if (!activeAccountTransaction) {
      activeAccountTransaction = new ActiveAccount(activeAccountTransactionID);
      activeAccountTransaction.save();
      if (transactionType == TransactionType.DEPOSIT)
        this.protocol.cumulativeUniqueDepositors += INT_ONE;
      if (transactionType == TransactionType.BORROW)
        this.protocol.cumulativeUniqueBorrowers += INT_ONE;
      if (transactionType == TransactionType.LIQUIDATOR)
        this.protocol.cumulativeUniqueLiquidators += INT_ONE;
      if (transactionType == TransactionType.LIQUIDATEE)
        this.protocol.cumulativeUniqueLiquidatees += INT_ONE;
    }
    if (!dailyActiveAccountTransaction) {
      dailyActiveAccountTransaction = new ActiveAccount(
        dailyActiveAccountTransactionID
      );
      dailyActiveAccountTransaction.save();
      if (transactionType == TransactionType.DEPOSIT)
        this.usageDailySnapshot.dailyActiveDepositors += INT_ONE;
      if (transactionType == TransactionType.BORROW)
        this.usageDailySnapshot.dailyActiveBorrowers += INT_ONE;
      if (transactionType == TransactionType.LIQUIDATOR)
        this.usageDailySnapshot.dailyActiveLiquidators += INT_ONE;
      if (transactionType == TransactionType.LIQUIDATEE)
        this.usageDailySnapshot.dailyActiveLiquidatees += INT_ONE;
    }
    if (!activeAccountTransactionMarket) {
      activeAccountTransactionMarket = new ActiveAccount(
        activeAccountTransactionMarketID
      );
      activeAccountTransactionMarket.save();
      if (transactionType == TransactionType.DEPOSIT)
        this.market.cumulativeUniqueDepositors += INT_ONE;
      if (transactionType == TransactionType.BORROW)
        this.market.cumulativeUniqueBorrowers += INT_ONE;
      if (transactionType == TransactionType.LIQUIDATOR)
        this.market.cumulativeUniqueLiquidators += INT_ONE;
      if (transactionType == TransactionType.LIQUIDATEE)
        this.market.cumulativeUniqueLiquidatees += INT_ONE;
      if (transactionType == TransactionType.TRANSFER)
        this.market.cumulativeUniqueTransferrers += INT_ONE;
      if (transactionType == TransactionType.FLASHLOAN)
        this.market.cumulativeUniqueFlashloaners += INT_ONE;
    }
    if (!dailyActiveAccountTransactionMarket) {
      dailyActiveAccountTransactionMarket = new ActiveAccount(
        dailyActiveAccountTransactionMarketID
      );
      dailyActiveAccountTransactionMarket.save();
      if (transactionType == TransactionType.DEPOSIT)
        this.marketDailySnapshot.dailyActiveDepositors += INT_ONE;
      if (transactionType == TransactionType.BORROW)
        this.marketDailySnapshot.dailyActiveBorrowers += INT_ONE;
      if (transactionType == TransactionType.LIQUIDATOR)
        this.marketDailySnapshot.dailyActiveLiquidators += INT_ONE;
      if (transactionType == TransactionType.LIQUIDATEE)
        this.marketDailySnapshot.dailyActiveLiquidatees += INT_ONE;
      if (transactionType == TransactionType.TRANSFER)
        this.marketDailySnapshot.dailyActiveTransferrers += INT_ONE;
      if (transactionType == TransactionType.FLASHLOAN)
        this.marketDailySnapshot.dailyActiveFlashloaners += INT_ONE;
    }

    this.market.save();
    this.protocol.save();
    this.usageDailySnapshot.save();
    this.usageHourlySnapshot.save();
    this.marketDailySnapshot.save();
  }

  private updateTransactionData(
    transactionType: string,
    amount: BigInt,
    amountUSD: BigDecimal
  ): void {
    if (transactionType == TransactionType.DEPOSIT) {
      this.protocol.depositCount += INT_ONE;
      this.protocol.cumulativeDepositUSD =
        this.protocol.cumulativeDepositUSD.plus(amountUSD);
      this.market.cumulativeDepositUSD =
        this.market.cumulativeDepositUSD.plus(amountUSD);
      this.market.depositCount += INT_ONE;
      this.marketDailySnapshot.dailyDepositUSD =
        this.marketDailySnapshot.dailyDepositUSD.plus(amountUSD);
      this.marketDailySnapshot.dailyNativeDeposit =
        this.marketDailySnapshot.dailyNativeDeposit.plus(amount);
      this.marketHourlySnapshot.hourlyDepositUSD =
        this.marketHourlySnapshot.hourlyDepositUSD.plus(amountUSD);
      this.financialSnapshot.dailyDepositUSD =
        this.financialSnapshot.dailyDepositUSD.plus(amountUSD);
      this.usageDailySnapshot.dailyDepositCount += INT_ONE;
      this.usageHourlySnapshot.hourlyDepositCount += INT_ONE;
    } else if (transactionType == TransactionType.WITHDRAW) {
      this.protocol.withdrawalCount += INT_ONE;
      this.market.withdrawalCount += INT_ONE;
      this.marketDailySnapshot.dailyWithdrawUSD =
        this.marketDailySnapshot.dailyWithdrawUSD.plus(amountUSD);
      this.marketDailySnapshot.dailyNativeWithdraw =
        this.marketDailySnapshot.dailyNativeWithdraw.plus(amount);
      this.marketHourlySnapshot.hourlyWithdrawUSD =
        this.marketHourlySnapshot.hourlyWithdrawUSD.plus(amountUSD);
      this.financialSnapshot.dailyWithdrawUSD =
        this.financialSnapshot.dailyWithdrawUSD.plus(amountUSD);
      this.usageDailySnapshot.dailyWithdrawCount += INT_ONE;
      this.usageHourlySnapshot.hourlyWithdrawCount += INT_ONE;
    } else if (transactionType == TransactionType.BORROW) {
      this.protocol.borrowCount += INT_ONE;
      this.protocol.cumulativeBorrowUSD =
        this.protocol.cumulativeBorrowUSD.plus(amountUSD);
      this.market.cumulativeBorrowUSD =
        this.market.cumulativeBorrowUSD.plus(amountUSD);
      this.market.borrowCount += INT_ONE;
      this.marketDailySnapshot.dailyBorrowUSD =
        this.marketDailySnapshot.dailyBorrowUSD.plus(amountUSD);
      this.marketDailySnapshot.dailyNativeBorrow =
        this.marketDailySnapshot.dailyNativeBorrow.plus(amount);
      this.marketHourlySnapshot.hourlyBorrowUSD =
        this.marketHourlySnapshot.hourlyBorrowUSD.plus(amountUSD);
      this.financialSnapshot.dailyBorrowUSD =
        this.financialSnapshot.dailyBorrowUSD.plus(amountUSD);
      this.usageDailySnapshot.dailyBorrowCount += INT_ONE;
      this.usageHourlySnapshot.hourlyBorrowCount += INT_ONE;
    } else if (transactionType == TransactionType.REPAY) {
      this.protocol.repayCount += INT_ONE;
      this.market.repayCount += INT_ONE;
      this.marketDailySnapshot.dailyRepayUSD =
        this.marketDailySnapshot.dailyRepayUSD.plus(amountUSD);
      this.marketDailySnapshot.dailyNativeRepay =
        this.marketDailySnapshot.dailyNativeRepay.plus(amount);
      this.marketHourlySnapshot.hourlyRepayUSD =
        this.marketHourlySnapshot.hourlyRepayUSD.plus(amountUSD);
      this.financialSnapshot.dailyRepayUSD =
        this.financialSnapshot.dailyRepayUSD.plus(amountUSD);
      this.usageDailySnapshot.dailyRepayCount += INT_ONE;
      this.usageHourlySnapshot.hourlyRepayCount += INT_ONE;
    } else if (transactionType == TransactionType.LIQUIDATE) {
      this.protocol.liquidationCount += INT_ONE;
      this.protocol.cumulativeLiquidateUSD =
        this.protocol.cumulativeLiquidateUSD.plus(amountUSD);
      this.market.cumulativeLiquidateUSD =
        this.market.cumulativeLiquidateUSD.plus(amountUSD);
      this.market.liquidationCount += INT_ONE;
      this.marketDailySnapshot.dailyLiquidateUSD =
        this.marketDailySnapshot.dailyLiquidateUSD.plus(amountUSD);
      this.marketDailySnapshot.dailyNativeLiquidate =
        this.marketDailySnapshot.dailyNativeLiquidate.plus(amount);
      this.marketHourlySnapshot.hourlyLiquidateUSD =
        this.marketHourlySnapshot.hourlyLiquidateUSD.plus(amountUSD);
      this.financialSnapshot.dailyLiquidateUSD =
        this.financialSnapshot.dailyLiquidateUSD.plus(amountUSD);
      this.usageDailySnapshot.dailyLiquidateCount += INT_ONE;
      this.usageHourlySnapshot.hourlyLiquidateCount += INT_ONE;
    } else if (transactionType == TransactionType.TRANSFER) {
      this.protocol.transferCount += INT_ONE;
      this.market.cumulativeTransferUSD =
        this.market.cumulativeTransferUSD.plus(amountUSD);
      this.market.transferCount += INT_ONE;
      this.marketDailySnapshot.dailyTransferUSD =
        this.marketDailySnapshot.dailyTransferUSD.plus(amountUSD);
      this.marketDailySnapshot.dailyNativeTransfer =
        this.marketDailySnapshot.dailyNativeTransfer.plus(amount);
      this.marketHourlySnapshot.hourlyTransferUSD =
        this.marketHourlySnapshot.hourlyTransferUSD.plus(amountUSD);
      this.financialSnapshot.dailyTransferUSD =
        this.financialSnapshot.dailyTransferUSD.plus(amountUSD);
      this.usageDailySnapshot.dailyTransferCount += INT_ONE;
    } else if (transactionType == TransactionType.FLASHLOAN) {
      this.protocol.flashloanCount += INT_ONE;
      this.market.cumulativeFlashloanUSD =
        this.market.cumulativeFlashloanUSD.plus(amountUSD);
      this.market.flashloanCount += INT_ONE;
      this.marketDailySnapshot.dailyFlashloanUSD =
        this.marketDailySnapshot.dailyFlashloanUSD.plus(amountUSD);
      this.marketDailySnapshot.dailyNativeFlashloan =
        this.marketDailySnapshot.dailyNativeFlashloan.plus(amount);
      this.marketHourlySnapshot.hourlyFlashloanUSD =
        this.marketHourlySnapshot.hourlyFlashloanUSD.plus(amountUSD);
      this.financialSnapshot.dailyFlashloanUSD =
        this.financialSnapshot.dailyFlashloanUSD.plus(amountUSD);
      this.usageDailySnapshot.dailyFlashloanCount += INT_ONE;
    } else {
      log.error("[updateTransactionData] Invalid transaction type: {}", [
        transactionType,
      ]);
      return;
    }
    this.protocol.transactionCount += INT_ONE;
    this.market.transactionCount += INT_ONE;
    this.usageDailySnapshot.dailyTransactionCount += INT_ONE;
    this.usageHourlySnapshot.hourlyTransactionCount += INT_ONE;

    this.protocol.save();
    this.market.save();
    this.marketDailySnapshot.save();
    this.marketHourlySnapshot.save();
    this.financialSnapshot.save();
    this.usageDailySnapshot.save();
    this.usageHourlySnapshot.save();
  }

  // used to update tvl, borrow balance, reserves, etc. in market and protocol
  updateMarketAndProtocolData(
    inputTokenPriceUSD: BigDecimal,
    newInputTokenBalance: BigInt,
    newVariableBorrowBalance: BigInt | null = null,
    newStableBorrowBalance: BigInt | null = null,
    newReserveBalance: BigInt | null = null,
    exchangeRate: BigDecimal | null = null
  ): void {
    const mantissaFactorBD = exponentToBigDecimal(
      this.inputToken.getToken().decimals
    );
    this.inputToken.updatePrice(inputTokenPriceUSD);
    this.market.inputTokenPriceUSD = inputTokenPriceUSD;
    this.market.inputTokenBalance = newInputTokenBalance;
    if (newVariableBorrowBalance) {
      this.market.variableBorrowedTokenBalance = newVariableBorrowBalance;
    }
    if (newStableBorrowBalance) {
      this.market.stableBorrowedTokenBalance = newStableBorrowBalance;
    }
    if (newReserveBalance) {
      this.market.reserves = newReserveBalance
        .toBigDecimal()
        .div(mantissaFactorBD)
        .times(inputTokenPriceUSD);
    }
    if (exchangeRate) {
      this.market.exchangeRate = exchangeRate;
    }
    const vBorrowAmount = this.market.variableBorrowedTokenBalance
      ? this.market
          .variableBorrowedTokenBalance!.toBigDecimal()
          .div(mantissaFactorBD)
      : BIGDECIMAL_ZERO;
    const sBorrowAmount = this.market.stableBorrowedTokenBalance
      ? this.market
          .stableBorrowedTokenBalance!.toBigDecimal()
          .div(mantissaFactorBD)
      : BIGDECIMAL_ZERO;
    const totalBorrowed = vBorrowAmount.plus(sBorrowAmount);
    this.market.totalValueLockedUSD = newInputTokenBalance
      .toBigDecimal()
      .div(mantissaFactorBD)
      .times(inputTokenPriceUSD);
    this.market.totalBorrowBalanceUSD = totalBorrowed.times(inputTokenPriceUSD);
    this.market.save();

    let totalValueLockedUSD = BIGDECIMAL_ZERO;
    let totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    const marketList = this.protocol._markets;
    for (let i = 0; i < marketList.length; i++) {
      const _market = Market.load(marketList[i]);
      if (!_market) {
        log.error("[updateMarketAndProtocolData] Market not found: {}", [
          marketList[i].toHexString(),
        ]);
        continue;
      }
      log.error("asdf tvl: {}", [_market.totalValueLockedUSD.toString()]);
      totalValueLockedUSD = totalValueLockedUSD.plus(
        _market.totalValueLockedUSD
      );
      totalBorrowBalanceUSD = totalBorrowBalanceUSD.plus(
        _market.totalBorrowBalanceUSD
      );
    }
    this.protocol.totalValueLockedUSD = totalValueLockedUSD;
    this.protocol.totalBorrowBalanceUSD = totalBorrowBalanceUSD;
    this.protocol.save();
  }

  updateRevenue(
    newTotalRevenueUSD: BigDecimal,
    newProtocolRevenueUSD: BigDecimal,
    newSupplySideRevenueUSD: BigDecimal,
    revenueSource: string | null = null
  ): void {
    // update market
    this.market.cumulativeTotalRevenueUSD =
      this.market.cumulativeTotalRevenueUSD.plus(newTotalRevenueUSD);
    this.market.cumulativeProtocolSideRevenueUSD =
      this.market.cumulativeProtocolSideRevenueUSD.plus(newProtocolRevenueUSD);
    this.market.cumulativeSupplySideRevenueUSD =
      this.market.cumulativeSupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
    this.market.save();

    // update protocol
    this.protocol.cumulativeTotalRevenueUSD =
      this.protocol.cumulativeTotalRevenueUSD.plus(newTotalRevenueUSD);
    this.protocol.cumulativeProtocolSideRevenueUSD =
      this.protocol.cumulativeProtocolSideRevenueUSD.plus(
        newProtocolRevenueUSD
      );
    this.protocol.cumulativeSupplySideRevenueUSD =
      this.protocol.cumulativeSupplySideRevenueUSD.plus(
        newSupplySideRevenueUSD
      );
    this.protocol.save();

    // update market hourly snapshot
    this.marketHourlySnapshot.hourlyTotalRevenueUSD =
      this.marketHourlySnapshot.hourlyTotalRevenueUSD.plus(newTotalRevenueUSD);
    this.marketHourlySnapshot.hourlyProtocolSideRevenueUSD =
      this.marketHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(
        newProtocolRevenueUSD
      );
    this.marketHourlySnapshot.hourlySupplySideRevenueUSD =
      this.marketHourlySnapshot.hourlySupplySideRevenueUSD.plus(
        newSupplySideRevenueUSD
      );
    this.marketHourlySnapshot.save();

    // update market daily snapshot
    this.marketDailySnapshot.dailyTotalRevenueUSD =
      this.marketDailySnapshot.dailyTotalRevenueUSD.plus(newTotalRevenueUSD);
    this.marketDailySnapshot.dailyProtocolSideRevenueUSD =
      this.marketDailySnapshot.dailyProtocolSideRevenueUSD.plus(
        newProtocolRevenueUSD
      );
    this.marketDailySnapshot.dailySupplySideRevenueUSD =
      this.marketDailySnapshot.dailySupplySideRevenueUSD.plus(
        newSupplySideRevenueUSD
      );
    this.marketDailySnapshot.save();

    // update financials snapshot
    this.financialSnapshot.dailyTotalRevenueUSD =
      this.financialSnapshot.dailyTotalRevenueUSD.plus(newTotalRevenueUSD);
    this.financialSnapshot.dailyProtocolSideRevenueUSD =
      this.financialSnapshot.dailyProtocolSideRevenueUSD.plus(
        newProtocolRevenueUSD
      );
    this.financialSnapshot.dailySupplySideRevenueUSD =
      this.financialSnapshot.dailySupplySideRevenueUSD.plus(
        newSupplySideRevenueUSD
      );
    this.financialSnapshot.save();

    // update RevenueDetails
    if (revenueSource) {
      const marketDetails = this.getOrCreateRevenueDetails(this.market.id);
      let sourceIndex = marketDetails.sources.indexOf(revenueSource);
      if (sourceIndex != -1) {
        marketDetails.amountsUSD[sourceIndex] =
          marketDetails.amountsUSD[sourceIndex].plus(newTotalRevenueUSD);
        marketDetails.save();
      }
      this.market.revenueDetails = marketDetails.id;
      this.market.save();

      const protocolDetails = this.getOrCreateRevenueDetails(this.protocol.id);
      sourceIndex = protocolDetails.sources.indexOf(revenueSource);
      if (sourceIndex != -1) {
        protocolDetails.amountsUSD[sourceIndex] =
          protocolDetails.amountsUSD[sourceIndex].plus(newTotalRevenueUSD);
        protocolDetails.save();
      }
      this.protocol.revenueDetails = protocolDetails.id;
      this.protocol.save();
    }
  }
}
