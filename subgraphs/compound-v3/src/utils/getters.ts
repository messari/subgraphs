import {
  Address,
  Bytes,
  BigInt,
  ethereum,
  BigDecimal,
  log,
} from "@graphprotocol/graph-ts";
import {
  Borrow,
  Deposit,
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
  RewardToken,
  Token,
  TokenData,
  Transfer,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  Withdraw,
} from "../../generated/schema";
import { Versions } from "../versions";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ZERO,
  ProtocolType,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
} from "./constants";
import {
  fetchTokenDecimals,
  fetchTokenName,
  fetchTokenSymbol,
  getOrCreateToken,
} from "./token";

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

export class ProtocolData {
  constructor(
    public readonly protocolID: Bytes,
    public readonly protocol: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly network: string,
    public readonly lendingType: string,
    public readonly lenderPermissionType: string | null,
    public readonly borrowerPermissionType: string | null,
    public readonly collateralizationType: string | null,
    public readonly riskType: string | null
  ) {}
}

export class MarketClass {
  event!: ethereum.Event;

  // entities
  protocol!: LendingProtocol;
  market!: Market;

  // snapshots
  marketHourlySnapshot!: MarketHourlySnapshot;
  marketDailySnapshot!: MarketDailySnapshot;
  financialSnapshot!: FinancialsDailySnapshot;
  usageHourlySnapshot!: UsageMetricsHourlySnapshot;
  usageDailySnapshot!: UsageMetricsDailySnapshot;

  // instantiate MarketClass (create new Market if necessary)
  constructor(
    marketID: Bytes,
    event: ethereum.Event,
    protocolData: ProtocolData
  ) {
    this.protocol = this.getOrCreateLendingProtocol(protocolData);
    let _market = Market.load(marketID);

    // create new market
    if (!_market) {
      _market = new Market(marketID);
      _market.protocol = this.protocol.id;
      _market.isActive = true;
      _market.canBorrowFrom = false; // default
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
    }
    this.market = _market;
    this.event = event;

    // load snapshots
    this.getOrCreateMarketHourlySnapshot();
    this.getOrCreateMarketDailySnapshot();
    this.getOrCreateFinancials();
    this.getOrCreateUsageDailySnapshot();
    this.getOrCreateUsageHourlySnapshot();
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
    }

    protocol.schemaVersion = Versions.getSchemaVersion();
    protocol.subgraphVersion = Versions.getSubgraphVersion();
    protocol.methodologyVersion = Versions.getMethodologyVersion();
    protocol.save();

    return protocol;
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
      snapshot.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
      snapshot.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
      snapshot.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;
      snapshot.hourlyDepositUSD = BIGDECIMAL_ZERO;
      snapshot.hourlyBorrowUSD = BIGDECIMAL_ZERO;
      snapshot.hourlyLiquidateUSD = BIGDECIMAL_ZERO;
      snapshot.hourlyWithdrawUSD = BIGDECIMAL_ZERO;
      snapshot.hourlyRepayUSD = BIGDECIMAL_ZERO;
    }
    snapshot.blockNumber = this.event.block.number;
    snapshot.timestamp = this.event.block.timestamp;
    snapshot.fees = this.market.fees
      ? this.getSnapshotRates(this.market.fees!, hours.toString())
      : null;
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
    snapshot.tokens = this.market.tokens
      ? this.getSnapshotTokenData(this.market.tokens!, hours.toString())
      : null;
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
      snapshot.dailyActiveTransferers = INT_ZERO;
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
    snapshot.fees = this.market.fees
      ? this.getSnapshotRates(this.market.fees!, days.toString())
      : null;
    snapshot.totalValueLockedUSD = this.market.totalValueLockedUSD;
    snapshot.totalReservesUSD = this.market.totalReservesUSD;
    snapshot.cumulativeSupplySideRevenueUSD =
      this.market.cumulativeSupplySideRevenueUSD;
    snapshot.cumulativeProtocolSideRevenueUSD =
      this.market.cumulativeProtocolSideRevenueUSD;
    snapshot.cumulativeTotalRevenueUSD = this.market.cumulativeTotalRevenueUSD;
    // TODO get rev details snapshot
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
    snapshot.tokens = this.market.tokens
      ? this.getSnapshotTokenData(this.market.tokens!, days.toString())
      : null;
    snapshot.rewardTokenEmissionsAmount =
      this.market.rewardTokenEmissionsAmount;
    snapshot.rewardTokenEmissionsUSD = this.market.rewardTokenEmissionsUSD;

    snapshot.save();
    this.marketDailySnapshot = snapshot;
  }

  getOrCreateFinancials(): void {}

  getOrCreateUsageDailySnapshot(): void {}

  getOrCreateUsageHourlySnapshot(): void {}

  getOrCreateTokenData(inputTokenID: Address): TokenData {
    const tokenDataID = this.market.id.concat(inputTokenID);
    let tokenData = TokenData.load(tokenDataID);
    if (!tokenData) {
      const token = getOrCreateToken(inputTokenID);
      tokenData = new TokenData(tokenDataID);

      // default values
      tokenData.canUseAsCollateral = false;
      tokenData.maximumLTV = BIGDECIMAL_ZERO;
      tokenData.liquidationThreshold = BIGDECIMAL_ZERO;
      tokenData.liquidationPenalty = BIGDECIMAL_ZERO;
      tokenData.canIsolate = false;
      tokenData.inputToken = token.id;
      tokenData.inputTokenBalance = BIGINT_ZERO;
      tokenData.inputTokenPriceUSD = BIGDECIMAL_ZERO;
      tokenData.save();
    }

    return tokenData;
  }

  getOrCreateOracle(
    oracleAddress: Address,
    tokenAddress: Address,
    isUSD: boolean,
    source?: string
  ): Oracle {
    const oracleID = this.market.id.concat(tokenAddress);
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

    return oracle;
  }

  getOrCreateInterestRate(rateSide: string, rateType: string): InterestRate {
    const interestRateID = rateSide
      .concat("-")
      .concat(rateType)
      .concat("-")
      .concat(this.market.id.toHexString());
    let rate = InterestRate.load(interestRateID);
    if (!rate) {
      rate = new InterestRate(interestRateID);
      rate.rate = BIGDECIMAL_ZERO;
      rate.side = rateSide;
      rate.type = rateType;
      rate.save();
    }

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
      snapshotRate.duration = rate.duration;
      snapshotRate.maturityBlock = rate.maturityBlock;
      snapshotRate.side = rate.side;
      snapshotRate.type = rate.type;
      snapshotRate.tranche = rate.tranche;
      snapshotRate.save();
      snapshotRates.push(snapshotRateId);
    }
    return snapshotRates;
  }

  getSnapshotTokenData(tokenDatas: Bytes[], timeSuffix: string): Bytes[] {
    const snapshotTokenDatas: Bytes[] = [];
    for (let i = 0; i < tokenDatas.length; i++) {
      const tokenData = TokenData.load(tokenDatas[i]);
      if (!tokenData) {
        log.error(
          "[getSnapshotRates] TokenData {} not found, should not happen",
          [tokenDatas[i].toHexString()]
        );
        continue;
      }

      // create new snapshot tokenData
      const snapshotTokenDataId = tokenDatas[i].concat(
        Bytes.fromHexString(timeSuffix)
      );
      const snapshotTokenData = new TokenData(snapshotTokenDataId);
      snapshotTokenData.canUseAsCollateral = tokenData.canUseAsCollateral;
      snapshotTokenData.maximumLTV = tokenData.maximumLTV;
      snapshotTokenData.liquidationThreshold = tokenData.liquidationThreshold;
      snapshotTokenData.liquidationPenalty = tokenData.liquidationPenalty;
      snapshotTokenData.canIsolate = tokenData.canIsolate;
      snapshotTokenData.inputToken = tokenData.inputToken;
      snapshotTokenData.inputTokenBalance = tokenData.inputTokenBalance;
      snapshotTokenData.inputTokenPriceUSD = tokenData.inputTokenPriceUSD;
      snapshotTokenData.outputTokens = tokenData.outputTokens;
      snapshotTokenData.outputTokenSupplies = tokenData.outputTokenSupplies;
      snapshotTokenData.outputTokenPricesUSD = tokenData.outputTokenPricesUSD;
      snapshotTokenData.exchangeRates = tokenData.exchangeRates;
      snapshotTokenData.rates = tokenData.rates
        ? this.getSnapshotRates(tokenData.rates!, timeSuffix)
        : null;
      snapshotTokenData.reserves = tokenData.reserves;
      snapshotTokenData.reserveFactor = tokenData.reserveFactor;
      snapshotTokenData.borrowedToken = tokenData.borrowedToken;
      snapshotTokenData.variableBorrowedTokenBalance =
        tokenData.variableBorrowedTokenBalance;
      snapshotTokenData.stableBorrowedTokenBalance =
        tokenData.stableBorrowedTokenBalance;
      snapshotTokenData.supplyCap = tokenData.supplyCap;
      snapshotTokenData.borrowCap = tokenData.borrowCap;
      snapshotTokenData.save();
      snapshotTokenDatas.push(snapshotTokenDataId);
    }
    return snapshotTokenDatas;
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

    return deposit;

    // TODO update market values, daily values, protocol values, snapshots
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

    return withdraw;

    // TODO update market values, daily values, protocol values, snapshots
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

    return borrow;

    // TODO update market values, daily values, protocol values, snapshots
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

    return repay;

    // TODO update market values, daily values, protocol values, snapshots
  }

  createLiquidate(
    asset: Address,
    liquidator: Address,
    borrower: Address,
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
    liquidate.liquidatee = borrower;
    liquidate.market = this.market.id;
    liquidate.positions = [borrower]; // TODO add position
    liquidate.asset = asset;
    liquidate.amount = amount;
    liquidate.amountUSD = amountUSD;
    liquidate.profitUSD = profitUSD;
    liquidate.save();

    return liquidate;

    // TODO update market values, daily values, protocol values, snapshots
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

    return transfer;

    // TODO update market values, daily values, protocol values, snapshots
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

    return flashloan;
  }

  //////////////////
  //// Updaters ////
  //////////////////

  updateRevenue(
    newTotalRevenueUSD: BigDecimal,
    newProtocolRevenueUSD: BigDecimal,
    newSupplySideRevenueUSD: BigDecimal
  ): void {
    // update market
    this.market.cumulativeTotalRevenueUSD =
      this.market.cumulativeTotalRevenueUSD.plus(newTotalRevenueUSD);
    this.market.cumulativeProtocolSideRevenueUSD =
      this.market.cumulativeProtocolSideRevenueUSD.plus(newProtocolRevenueUSD);
    this.market.cumulativeSupplySideRevenueUSD =
      this.market.cumulativeSupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
    this.market.save();

    // update protcol
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

    // update snapshots
  }
}

export function getOrCreateRewardToken(
  tokenAddress: Bytes,
  rewardTokenType: string
): RewardToken {
  const rewardTokenID = rewardTokenType.concat("-").concat(rewardTokenType);
  let rewardToken = RewardToken.load(rewardTokenID);
  if (!rewardToken) {
    rewardToken = new RewardToken(rewardTokenID);
    rewardToken.type = rewardTokenType;
    rewardToken.token = tokenAddress;
    rewardToken.save();
  }

  return rewardToken;
}

export function getOrUpdateFinancials(
  event: ethereum.Event,
  protocol: LendingProtocol
): FinancialsDailySnapshot {
  const days = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let snapshot = FinancialsDailySnapshot.load(days.toString());
  if (!snapshot) {
    snapshot = new FinancialsDailySnapshot(days.toString());
    snapshot.days = days;
    snapshot.protocol = protocol.id;

    snapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.dailyDepositUSD = BIGDECIMAL_ZERO;
    snapshot.dailyBorrowUSD = BIGDECIMAL_ZERO;
    snapshot.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    snapshot.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    snapshot.dailyTransferUSD = BIGDECIMAL_ZERO;
    snapshot.dailyFlashloanUSD = BIGDECIMAL_ZERO;
  }

  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;
  snapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  snapshot.protocolControlledValueUSD = protocol.protocolControlledValueUSD;
  snapshot.mintedTokenSupplies = protocol.mintedTokenSupplies;
  snapshot.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  snapshot.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  snapshot.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  // TODO create new entity for revenueDetails??
  snapshot.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
  snapshot.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
  snapshot.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
  snapshot.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
  snapshot.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;
  snapshot.save();

  return snapshot;
}
