import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  MarketListed,
  NewCollateralFactor,
  NewLiquidationIncentive,
  NewPriceOracle,
} from "../generated/Comptroller/Comptroller";
import {
  Mint,
  Redeem,
  Borrow as BorrowEvent,
  RepayBorrow,
  LiquidateBorrow,
  AccrueInterest,
  NewReserveFactor,
} from "../generated/templates/CToken/CToken";
import {
  Account,
  Borrow,
  ActiveAccount,
  Deposit,
  FinancialsDailySnapshot,
  LendingProtocol,
  Liquidate,
  Market,
  MarketDailySnapshot,
  Repay,
  Token,
  UsageMetricsDailySnapshot,
  Withdraw,
  InterestRate,
  MarketHourlySnapshot,
  UsageMetricsHourlySnapshot,
} from "../generated/schema";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  cTokenDecimals,
  cTokenDecimalsBD,
  exponentToBigDecimal,
  InterestRateSide,
  InterestRateType,
  LendingType,
  mantissaFactor,
  mantissaFactorBD,
  ProtocolType,
  RiskType,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
} from "./constants";

enum EventType {
  Deposit,
  Withdraw,
  Borrow,
  Repay,
  Liquidate,
}

export class ProtocolData {
  comptrollerAddr: Address;
  name: string;
  slug: string;
  schemaVersion: string;
  subgraphVersion: string;
  methodologyVersion: string;
  network: string;
  liquidationIncentiveMantissaResult: ethereum.CallResult<BigInt>;
  oracleResult: ethereum.CallResult<Address>;
  constructor(
    comptrollerAddr: Address,
    name: string,
    slug: string,
    schemaVersion: string,
    subgraphVersion: string,
    methodologyVersion: string,
    network: string,
    liquidationIncentiveMantissaResult: ethereum.CallResult<BigInt>,
    oracleResult: ethereum.CallResult<Address>
  ) {
    this.comptrollerAddr = comptrollerAddr;
    this.name = name;
    this.slug = slug;
    this.schemaVersion = schemaVersion;
    this.subgraphVersion = subgraphVersion;
    this.methodologyVersion = methodologyVersion;
    this.network = network;
    this.liquidationIncentiveMantissaResult =
      liquidationIncentiveMantissaResult;
    this.oracleResult = oracleResult;
  }
}

export class TokenData {
  address: Address;
  name: string;
  symbol: string;
  decimals: i32;
  constructor(address: Address, name: string, symbol: string, decimals: i32) {
    this.address = address;
    this.name = name;
    this.symbol = symbol;
    this.decimals = decimals;
  }
}

export class MarketListedData {
  protocol: LendingProtocol;
  token: TokenData;
  cToken: TokenData;
  cTokenReserveFactorMantissa: BigInt;
  constructor(
    protocol: LendingProtocol,
    token: TokenData,
    cToken: TokenData,
    cTokenReserveFactorMantissa: BigInt
  ) {
    this.protocol = protocol;
    this.token = token;
    this.cToken = cToken;
    this.cTokenReserveFactorMantissa = cTokenReserveFactorMantissa;
  }
}

export class UpdateMarketData {
  totalSupplyResult: ethereum.CallResult<BigInt>;
  exchangeRateStoredResult: ethereum.CallResult<BigInt>;
  totalBorrowsResult: ethereum.CallResult<BigInt>;
  supplyRateResult: ethereum.CallResult<BigInt>;
  borrowRateResult: ethereum.CallResult<BigInt>;
  getUnderlyingPriceResult: ethereum.CallResult<BigInt>;
  unitPerYear: i32;
  constructor(
    totalSupplyResult: ethereum.CallResult<BigInt>,
    exchangeRateStoredResult: ethereum.CallResult<BigInt>,
    totalBorrowsResult: ethereum.CallResult<BigInt>,
    supplyRateResult: ethereum.CallResult<BigInt>,
    borrowRateResult: ethereum.CallResult<BigInt>,
    getUnderlyingPriceResult: ethereum.CallResult<BigInt>,
    unitPerYear: i32
  ) {
    this.totalSupplyResult = totalSupplyResult;
    this.exchangeRateStoredResult = exchangeRateStoredResult;
    this.totalBorrowsResult = totalBorrowsResult;
    this.supplyRateResult = supplyRateResult;
    this.borrowRateResult = borrowRateResult;
    this.getUnderlyingPriceResult = getUnderlyingPriceResult;
    this.unitPerYear = unitPerYear;
  }
}

export function _getOrCreateProtocol(
  protocolData: ProtocolData
): LendingProtocol {
  let protocol = LendingProtocol.load(
    protocolData.comptrollerAddr.toHexString()
  );
  if (!protocol) {
    protocol = new LendingProtocol(protocolData.comptrollerAddr.toHexString());
    protocol.name = protocolData.name;
    protocol.slug = protocolData.slug;
    protocol.schemaVersion = protocolData.schemaVersion;
    protocol.subgraphVersion = protocolData.subgraphVersion;
    protocol.methodologyVersion = protocolData.methodologyVersion;
    protocol.network = protocolData.network;
    protocol.type = ProtocolType.LENDING;
    protocol.lendingType = LendingType.POOLED;
    protocol.riskType = RiskType.GLOBAL;

    if (protocolData.liquidationIncentiveMantissaResult.reverted) {
      log.warning(
        "[getOrCreateProtocol] liquidationIncentiveMantissaResult reverted",
        []
      );
    } else {
      protocol._liquidationIncentive =
        protocolData.liquidationIncentiveMantissaResult.value
          .toBigDecimal()
          .div(mantissaFactorBD)
          .times(BIGDECIMAL_HUNDRED);
    }

    if (protocolData.oracleResult.reverted) {
      log.warning("[getOrCreateProtocol] oracleResult reverted", []);
    } else {
      protocol._priceOracle = protocolData.oracleResult.value.toHexString();
    }
    protocol.save();
  }
  return protocol;
}

//
//
// event.params
// - oldReserveFactorMantissa
// - newReserveFactorMantissa
export function _handleNewReserveFactor(event: NewReserveFactor): void {
  let marketID = event.address.toHexString();
  let market = Market.load(marketID);
  if (market == null) {
    log.warning("[handleNewReserveFactor] Market not found: {}", [marketID]);
    return;
  }
  let reserveFactor = event.params.newReserveFactorMantissa
    .toBigDecimal()
    .div(mantissaFactorBD);
  market._reserveFactor = reserveFactor;
  market.save();
}

//
//
// event.params.cToken:
// event.params.oldCollateralFactorMantissa:
// event.params.newCollateralFactorMantissa:
export function _handleNewCollateralFactor(event: NewCollateralFactor): void {
  let marketID = event.params.cToken.toHexString();
  let market = Market.load(marketID);
  if (market == null) {
    log.warning("[handleNewCollateralFactor] Market not found: {}", [marketID]);
    return;
  }
  let collateralFactor = event.params.newCollateralFactorMantissa
    .toBigDecimal()
    .div(mantissaFactorBD)
    .times(BIGDECIMAL_HUNDRED);
  market.maximumLTV = collateralFactor;
  market.liquidationThreshold = collateralFactor;
  market.save();
}

//
//
// event.params.oldLiquidationIncentiveMantissa
// event.params.newLiquidationIncentiveMantissa
export function _handleNewLiquidationIncentive(
  protocol: LendingProtocol,
  event: NewLiquidationIncentive
): void {
  let liquidationIncentive = event.params.newLiquidationIncentiveMantissa
    .toBigDecimal()
    .div(mantissaFactorBD)
    .minus(BIGDECIMAL_ONE)
    .times(BIGDECIMAL_HUNDRED);
  protocol._liquidationIncentive = liquidationIncentive;
  protocol.save();

  for (let i = 0; i < protocol._marketIDs.length; i++) {
    let market = Market.load(protocol._marketIDs[i]);
    if (!market) {
      log.warning("[handleNewLiquidationIncentive] Market not found: {}", [
        protocol._marketIDs[i],
      ]);
      // best effort
      continue;
    }
    market.liquidationPenalty = liquidationIncentive;
    market.save();
  }
}

//
//
// event.params
// - oldPriceOracle
// - newPriceOracle
export function _handleNewPriceOracle(
  protocol: LendingProtocol,
  event: NewPriceOracle
): void {
  protocol._priceOracle = event.params.newPriceOracle.toHexString();
  protocol.save();
}

//
//
// event.params.cToken: The address of the market (token) to list
export function _handleMarketListed(
  marketListedData: MarketListedData,
  event: MarketListed
): void {
  let cTokenAddr = event.params.cToken;
  let cToken = Token.load(cTokenAddr.toHexString());
  if (cToken != null) {
    return;
  }
  // this is a new cToken, a new underlying token, and a new market

  //
  // create cToken
  //
  cToken = new Token(cTokenAddr.toHexString());
  cToken.name = marketListedData.cToken.name;
  cToken.symbol = marketListedData.cToken.symbol;
  cToken.decimals = marketListedData.cToken.decimals;
  cToken.save();

  //
  // create underlying token
  //
  let underlyingToken = new Token(marketListedData.token.address.toHexString());
  underlyingToken.name = marketListedData.token.name;
  underlyingToken.symbol = marketListedData.token.symbol;
  underlyingToken.decimals = marketListedData.token.decimals;
  underlyingToken.save();

  //
  // create market
  //
  let market = new Market(cTokenAddr.toHexString());
  market.name = cToken.name;
  market.protocol = marketListedData.protocol.id;
  market.inputToken = underlyingToken.id;
  market.outputToken = cToken.id;

  let supplyInterestRate = new InterestRate(
    InterestRateSide.LENDER.concat("-")
      .concat(InterestRateType.VARIABLE)
      .concat("-")
      .concat(market.id)
  );
  supplyInterestRate.side = InterestRateSide.LENDER;
  supplyInterestRate.type = InterestRateType.VARIABLE;
  supplyInterestRate.save();
  let borrowInterestRate = new InterestRate(
    InterestRateSide.BORROWER.concat("-")
      .concat(InterestRateType.VARIABLE)
      .concat("-")
      .concat(market.id)
  );
  borrowInterestRate.side = InterestRateSide.BORROWER;
  borrowInterestRate.type = InterestRateType.VARIABLE;
  borrowInterestRate.save();
  market.rates = [supplyInterestRate.id, borrowInterestRate.id];

  market.isActive = true;
  market.canUseAsCollateral = true;
  market.canBorrowFrom = true;
  market.liquidationPenalty = marketListedData.protocol._liquidationIncentive;
  market._reserveFactor = marketListedData.cTokenReserveFactorMantissa
    .toBigDecimal()
    .div(mantissaFactorBD);

  market.createdTimestamp = event.block.timestamp;
  market.createdBlockNumber = event.block.number;
  market.save();

  //
  // update protocol
  //
  let marketIDs = marketListedData.protocol._marketIDs;
  marketIDs.push(market.id);
  marketListedData.protocol._marketIDs = marketIDs;
  marketListedData.protocol.save();
}

//
//
// event.params
// - minter
// - mintAmount: The amount of underlying assets to mint
// - mintTokens: The amount of cTokens minted
export function _handleMint(comptrollerAddr: Address, event: Mint): void {
  let protocol = LendingProtocol.load(comptrollerAddr.toHexString());
  if (!protocol) {
    log.warning("[handleMint] protocol not found: {}", [
      comptrollerAddr.toHexString(),
    ]);
    return;
  }
  let marketID = event.address.toHexString();
  let market = Market.load(marketID);
  if (!market) {
    log.warning("[handleMint] Market not found: {}", [marketID]);
    return;
  }
  let underlyingToken = Token.load(market.inputToken);
  if (!underlyingToken) {
    log.warning("[handleMint] Failed to load underlying token: {}", [
      market.inputToken,
    ]);
    return;
  }

  let depositID = event.transaction.hash
    .toHexString()
    .concat("-")
    .concat(event.transactionLogIndex.toString());
  let deposit = new Deposit(depositID);
  deposit.hash = event.transaction.hash.toHexString();
  deposit.logIndex = event.transactionLogIndex.toI32();
  deposit.protocol = protocol.id;
  deposit.to = marketID;
  deposit.from = event.params.minter.toHexString();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.market = marketID;
  deposit.asset = market.inputToken;
  deposit.amount = event.params.mintAmount;
  let depositUSD = market.inputTokenPriceUSD.times(
    event.params.mintAmount
      .toBigDecimal()
      .div(exponentToBigDecimal(underlyingToken.decimals))
  );
  deposit.amountUSD = depositUSD;
  deposit.save();

  market.inputTokenBalance = market.inputTokenBalance.plus(
    event.params.mintAmount
  );
  market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(depositUSD);
  market.save();

  updateMarketSnapshots(
    marketID,
    event.block.timestamp.toI32(),
    depositUSD,
    EventType.Deposit
  );

  snapshotUsage(
    comptrollerAddr,
    event.block.number,
    event.block.timestamp,
    event.params.minter.toHexString(),
    EventType.Deposit
  );
}

//
//
// event.params
// - redeemer
// - redeemAmount
// - redeecTokens
export function _handleRedeem(comptrollerAddr: Address, event: Redeem): void {
  let protocol = LendingProtocol.load(comptrollerAddr.toHexString());
  if (!protocol) {
    log.warning("[handleMint] protocol not found: {}", [
      comptrollerAddr.toHexString(),
    ]);
    return;
  }
  let marketID = event.address.toHexString();
  let market = Market.load(marketID);
  if (!market) {
    log.warning("[handleRedeem] Market not found: {}", [marketID]);
    return;
  }
  let underlyingToken = Token.load(market.inputToken);
  if (!underlyingToken) {
    log.warning("[handleRedeem] Failed to load underlying token: {}", [
      market.inputToken,
    ]);
    return;
  }

  let withdrawID = event.transaction.hash
    .toHexString()
    .concat("-")
    .concat(event.transactionLogIndex.toString());
  let withdraw = new Withdraw(withdrawID);
  withdraw.hash = event.transaction.hash.toHexString();
  withdraw.logIndex = event.transactionLogIndex.toI32();
  withdraw.protocol = protocol.id;
  withdraw.to = event.params.redeemer.toHexString();
  withdraw.from = marketID;
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.market = marketID;
  withdraw.asset = market.inputToken;
  withdraw.amount = event.params.redeemAmount;
  withdraw.amountUSD = market.inputTokenPriceUSD.times(
    event.params.redeemAmount
      .toBigDecimal()
      .div(exponentToBigDecimal(underlyingToken.decimals))
  );
  withdraw.save();

  market.inputTokenBalance = market.inputTokenBalance.minus(
    event.params.redeemAmount
  );
  market.save();

  snapshotUsage(
    comptrollerAddr,
    event.block.number,
    event.block.timestamp,
    event.params.redeemer.toHexString(),
    EventType.Withdraw
  );
}

//
//
// event.params
// - borrower
// - borrowAmount
// - accountBorrows
// - totalBorrows
export function _handleBorrow(
  comptrollerAddr: Address,
  event: BorrowEvent
): void {
  let protocol = LendingProtocol.load(comptrollerAddr.toHexString());
  if (!protocol) {
    log.warning("[handleMint] protocol not found: {}", [
      comptrollerAddr.toHexString(),
    ]);
    return;
  }
  let marketID = event.address.toHexString();
  let market = Market.load(marketID);
  if (!market) {
    log.warning("[handleBorrow] Market not found: {}", [marketID]);
    return;
  }
  let underlyingToken = Token.load(market.inputToken);
  if (!underlyingToken) {
    log.warning("[handleBorrow] Failed to load underlying token: {}", [
      market.inputToken,
    ]);
    return;
  }

  let borrowID = event.transaction.hash
    .toHexString()
    .concat("-")
    .concat(event.transactionLogIndex.toString());
  let borrow = new Borrow(borrowID);
  borrow.hash = event.transaction.hash.toHexString();
  borrow.logIndex = event.transactionLogIndex.toI32();
  borrow.protocol = protocol.id;
  borrow.to = event.params.borrower.toHexString();
  borrow.from = marketID;
  borrow.blockNumber = event.block.number;
  borrow.timestamp = event.block.timestamp;
  borrow.market = marketID;
  borrow.asset = market.inputToken;
  borrow.amount = event.params.borrowAmount;
  let borrowUSD = market.inputTokenPriceUSD.times(
    event.params.borrowAmount
      .toBigDecimal()
      .div(exponentToBigDecimal(underlyingToken.decimals))
  );
  borrow.amountUSD = borrowUSD;
  borrow.save();

  market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(borrowUSD);
  market.save();

  updateMarketSnapshots(
    marketID,
    event.block.timestamp.toI32(),
    borrowUSD,
    EventType.Borrow
  );

  snapshotUsage(
    comptrollerAddr,
    event.block.number,
    event.block.timestamp,
    event.params.borrower.toHexString(),
    EventType.Borrow
  );
}

//
//
// event.params
// - payer
// - borrower
// - repayAmount
// - accountBorrows
// - totalBorrows
export function _handleRepayBorrow(
  comptrollerAddr: Address,
  event: RepayBorrow
): void {
  let protocol = LendingProtocol.load(comptrollerAddr.toHexString());
  if (!protocol) {
    log.warning("[handleMint] protocol not found: {}", [
      comptrollerAddr.toHexString(),
    ]);
    return;
  }
  let marketID = event.address.toHexString();
  let market = Market.load(marketID);
  if (!market) {
    log.warning("[handleRepayBorrow] Market not found: {}", [marketID]);
    return;
  }
  let underlyingToken = Token.load(market.inputToken);
  if (!underlyingToken) {
    log.warning("[handleRepayBorrow] Failed to load underlying token: {}", [
      market.inputToken,
    ]);
    return;
  }

  let repayID = event.transaction.hash
    .toHexString()
    .concat("-")
    .concat(event.transactionLogIndex.toString());
  let repay = new Repay(repayID);
  repay.hash = event.transaction.hash.toHexString();
  repay.logIndex = event.transactionLogIndex.toI32();
  repay.protocol = protocol.id;
  repay.to = marketID;
  repay.from = event.params.payer.toHexString();
  repay.blockNumber = event.block.number;
  repay.timestamp = event.block.timestamp;
  repay.market = marketID;
  repay.asset = market.inputToken;
  repay.amount = event.params.repayAmount;
  repay.amountUSD = market.inputTokenPriceUSD.times(
    event.params.repayAmount
      .toBigDecimal()
      .div(exponentToBigDecimal(underlyingToken.decimals))
  );
  repay.save();

  snapshotUsage(
    comptrollerAddr,
    event.block.number,
    event.block.timestamp,
    event.params.payer.toHexString(),
    EventType.Repay
  );
}

//
//
// event.params
// - liquidator
// - borrower
// - repayAmount
// - cTokenCollateral
// - seizeTokens
export function _handleLiquidateBorrow(
  comptrollerAddr: Address,
  event: LiquidateBorrow
): void {
  let protocol = LendingProtocol.load(comptrollerAddr.toHexString());
  if (!protocol) {
    log.warning("[handleMint] protocol not found: {}", [
      comptrollerAddr.toHexString(),
    ]);
    return;
  }
  let repayTokenMarketID = event.address.toHexString();
  let repayTokenMarket = Market.load(repayTokenMarketID);
  if (!repayTokenMarket) {
    log.warning("[handleLiquidateBorrow] Repay Token Market not found: {}", [
      repayTokenMarketID,
    ]);
    return;
  }
  if (!repayTokenMarket.inputToken) {
    log.warning(
      "[handleLiquidateBorrow] Repay Token Market {} has no input token",
      [repayTokenMarketID]
    );
    return;
  }
  let repayToken = Token.load(repayTokenMarket.inputToken);
  if (!repayToken) {
    log.warning("[handleLiquidateBorrow] Failed to load repay token: {}", [
      repayTokenMarket.inputToken,
    ]);
    return;
  }

  let liquidatedCTokenMarketID = event.params.cTokenCollateral.toHexString();
  let liquidatedCTokenMarket = Market.load(liquidatedCTokenMarketID);
  if (!liquidatedCTokenMarket) {
    log.warning(
      "[handleLiquidateBorrow] Liquidated CToken Market not found: {}",
      [liquidatedCTokenMarketID]
    );
    return;
  }
  let liquidatedCTokenID = liquidatedCTokenMarket.outputToken;
  if (!liquidatedCTokenID) {
    log.warning(
      "[handleLiquidateBorrow] Liquidated CToken Market {} has no output token",
      [liquidatedCTokenMarketID]
    );
    return;
  }
  // compiler is too silly to figure out this is not null, so add a !
  let liquidatedCToken = Token.load(liquidatedCTokenID!);
  if (!liquidatedCToken) {
    log.warning(
      "[handleLiquidateBorrow] Failed to load liquidated cToken: {}",
      [liquidatedCTokenID!]
    );
    return;
  }

  let liquidateID = event.transaction.hash
    .toHexString()
    .concat("-")
    .concat(event.transactionLogIndex.toString());
  let liquidate = new Liquidate(liquidateID);
  liquidate.hash = event.transaction.hash.toHexString();
  liquidate.logIndex = event.transactionLogIndex.toI32();
  liquidate.protocol = protocol.id;
  liquidate.to = repayTokenMarketID;
  liquidate.from = event.params.liquidator.toHexString();
  liquidate.blockNumber = event.block.number;
  liquidate.timestamp = event.block.timestamp;
  liquidate.market = repayTokenMarketID;
  if (liquidatedCTokenID) {
    // this is logically redundant since nullcheck has been done before, but removing the if check will fail 'graph build'
    liquidate.asset = liquidatedCTokenID;
  }
  liquidate.amount = event.params.seizeTokens;
  let gainUSD = event.params.seizeTokens
    .toBigDecimal()
    .div(cTokenDecimalsBD)
    .times(liquidatedCTokenMarket.outputTokenPriceUSD);
  let lossUSD = event.params.repayAmount
    .toBigDecimal()
    .div(exponentToBigDecimal(repayToken.decimals))
    .times(repayTokenMarket.inputTokenPriceUSD);
  liquidate.amountUSD = gainUSD;
  liquidate.profitUSD = gainUSD.minus(lossUSD);
  liquidate.save();

  liquidatedCTokenMarket.cumulativeLiquidateUSD =
    liquidatedCTokenMarket.cumulativeLiquidateUSD.plus(gainUSD);
  liquidatedCTokenMarket.save();

  updateMarketSnapshots(
    liquidatedCTokenMarketID,
    event.block.timestamp.toI32(),
    gainUSD,
    EventType.Liquidate
  );

  snapshotUsage(
    comptrollerAddr,
    event.block.number,
    event.block.timestamp,
    event.params.liquidator.toHexString(),
    EventType.Liquidate
  );
}

// This function is called whenever mint, redeem, borrow, repay, liquidateBorrow happens
export function _handleAccrueInterest(
  updateMarketData: UpdateMarketData,
  comptrollerAddr: Address,
  event: AccrueInterest
): void {
  let marketID = event.address.toHexString();
  let market = Market.load(marketID);
  if (!market) {
    log.warning("[handleAccrueInterest] Market not found: {}", [marketID]);
    return;
  }

  updateMarket(
    updateMarketData,
    marketID,
    event.params.interestAccumulated,
    event.block.number,
    event.block.timestamp
  );
  updateProtocol(comptrollerAddr);
  snapshotMarket(
    event.address.toHexString(),
    event.block.number,
    event.block.timestamp
  );
  snapshotFinancials(
    comptrollerAddr,
    event.block.number,
    event.block.timestamp
  );
}

function snapshotMarket(
  marketID: string,
  blockNumber: BigInt,
  blockTimestamp: BigInt
): void {
  let market = Market.load(marketID);
  if (!market) {
    log.warning("[snapshotMarket] Market not found: {}", [marketID]);
    return;
  }

  //
  // daily snapshot
  //
  let dailySnapshot = getOrCreateMarketDailySnapshot(
    marketID,
    blockTimestamp.toI32()
  );
  dailySnapshot.protocol = market.protocol;
  dailySnapshot.market = marketID;
  dailySnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  dailySnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  dailySnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  dailySnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  dailySnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  dailySnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  dailySnapshot.inputTokenBalance = market.inputTokenBalance;
  dailySnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  dailySnapshot.outputTokenSupply = market.outputTokenSupply;
  dailySnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
  dailySnapshot.exchangeRate = market.exchangeRate;
  dailySnapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  dailySnapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
  dailySnapshot.rates = market.rates;
  dailySnapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  dailySnapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
  dailySnapshot.blockNumber = blockNumber;
  dailySnapshot.timestamp = blockTimestamp;
  dailySnapshot.save();

  //
  // hourly snapshot
  //
  let hourlySnapshot = getOrCreateMarketHourlySnapshot(
    marketID,
    blockTimestamp.toI32()
  );
  hourlySnapshot.protocol = market.protocol;
  hourlySnapshot.market = marketID;
  hourlySnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  hourlySnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  hourlySnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  hourlySnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  hourlySnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  hourlySnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  hourlySnapshot.inputTokenBalance = market.inputTokenBalance;
  hourlySnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  hourlySnapshot.outputTokenSupply = market.outputTokenSupply;
  hourlySnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
  hourlySnapshot.exchangeRate = market.exchangeRate;
  hourlySnapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  hourlySnapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
  hourlySnapshot.rates = market.rates;
  hourlySnapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  hourlySnapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
  hourlySnapshot.blockNumber = blockNumber;
  hourlySnapshot.timestamp = blockTimestamp;
  hourlySnapshot.save();
}

/**
 *
 * @param blockNumber
 * @param blockTimestamp
 * @returns
 */
function snapshotFinancials(
  comptrollerAddr: Address,
  blockNumber: BigInt,
  blockTimestamp: BigInt
): void {
  let protocol = LendingProtocol.load(comptrollerAddr.toHexString());
  if (!protocol) {
    log.error(
      "[snapshotFinancials] Protocol not found, this SHOULD NOT happen",
      []
    );
    return;
  }
  let snapshotID = (blockTimestamp.toI32() / SECONDS_PER_DAY).toString();
  let snapshot = new FinancialsDailySnapshot(snapshotID);

  snapshot.protocol = protocol.id;
  snapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  snapshot.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
  snapshot.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
  snapshot.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
  snapshot.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
  snapshot.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;
  snapshot.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  snapshot.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  snapshot.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;

  let dailyDepositUSD = BIGDECIMAL_ZERO;
  let dailyBorrowUSD = BIGDECIMAL_ZERO;
  let dailyLiquidateUSD = BIGDECIMAL_ZERO;
  let dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
  let dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  let dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;

  for (let i = 0; i < protocol._marketIDs.length; i++) {
    let market = Market.load(protocol._marketIDs[i]);
    if (!market) {
      log.warning("[snapshotFinancials] Market not found: {}", [
        protocol._marketIDs[i],
      ]);
      // best effort
      continue;
    }

    let marketDailySnapshotID = getMarketDailySnapshotID(
      market.id,
      blockTimestamp.toI32()
    );
    let marketDailySnapshot = MarketDailySnapshot.load(marketDailySnapshotID);
    if (!marketDailySnapshot) {
      log.warning("[snapshotFinancials] MarketDailySnapshot not found: {}", [
        marketDailySnapshotID,
      ]);
      continue;
    }
    dailyDepositUSD = dailyDepositUSD.plus(marketDailySnapshot.dailyDepositUSD);
    dailyBorrowUSD = dailyBorrowUSD.plus(marketDailySnapshot.dailyBorrowUSD);
    dailyLiquidateUSD = dailyLiquidateUSD.plus(
      marketDailySnapshot.dailyLiquidateUSD
    );
    dailyTotalRevenueUSD = dailyTotalRevenueUSD.plus(
      marketDailySnapshot._dailyTotalRevenueUSD
    );
    dailyProtocolSideRevenueUSD = dailyProtocolSideRevenueUSD.plus(
      marketDailySnapshot._dailyProtocolSideRevenueUSD
    );
    dailySupplySideRevenueUSD = dailySupplySideRevenueUSD.plus(
      marketDailySnapshot._dailySupplySideRevenueUSD
    );
  }

  snapshot.dailyDepositUSD = dailyDepositUSD;
  snapshot.dailyBorrowUSD = dailyBorrowUSD;
  snapshot.dailyLiquidateUSD = dailyLiquidateUSD;
  snapshot.dailyTotalRevenueUSD = dailyTotalRevenueUSD;
  snapshot.dailyProtocolSideRevenueUSD = dailyProtocolSideRevenueUSD;
  snapshot.dailySupplySideRevenueUSD = dailySupplySideRevenueUSD;
  snapshot.blockNumber = blockNumber;
  snapshot.timestamp = blockTimestamp;
  snapshot.save();
}

/**
 * Snapshot usage.
 * It has to happen in handleMint, handleRedeem, handleBorrow, handleRepayBorrow and handleLiquidate,
 * because handleAccrueInterest doesn't have access to the accountID
 * @param blockNumber
 * @param blockTimestamp
 * @param accountID
 */
function snapshotUsage(
  comptrollerAddr: Address,
  blockNumber: BigInt,
  blockTimestamp: BigInt,
  accountID: string,
  eventType: EventType
): void {
  let protocol = LendingProtocol.load(comptrollerAddr.toHexString());
  if (!protocol) {
    log.error("[snapshotUsage] Protocol not found, this SHOULD NOT happen", []);
    return;
  }
  let account = Account.load(accountID);
  if (!account) {
    account = new Account(accountID);
    account.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }

  //
  // daily snapshot
  //
  let dailySnapshotID = (blockTimestamp.toI32() / SECONDS_PER_DAY).toString();
  let dailySnapshot = UsageMetricsDailySnapshot.load(dailySnapshotID);
  if (!dailySnapshot) {
    dailySnapshot = new UsageMetricsDailySnapshot(dailySnapshotID);
    dailySnapshot.protocol = protocol.id;
  }
  let dailyAccountID = accountID.concat("-").concat(dailySnapshotID);
  let dailyActiveAccount = ActiveAccount.load(dailyAccountID);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyAccountID);
    dailyActiveAccount.save();

    dailySnapshot.dailyActiveUsers += 1;
  }
  dailySnapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  dailySnapshot.dailyTransactionCount += 1;
  switch (eventType) {
    case EventType.Deposit:
      dailySnapshot.dailyDepositCount += 1;
      break;
    case EventType.Withdraw:
      dailySnapshot.dailyWithdrawCount += 1;
      break;
    case EventType.Borrow:
      dailySnapshot.dailyBorrowCount += 1;
      break;
    case EventType.Repay:
      dailySnapshot.dailyRepayCount += 1;
      break;
    case EventType.Liquidate:
      dailySnapshot.dailyLiquidateCount += 1;
      break;
    default:
      break;
  }
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
  }
  let hourlyAccountID = accountID.concat("-").concat(hourlySnapshotID);
  let hourlyActiveAccount = ActiveAccount.load(hourlyAccountID);
  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyAccountID);
    hourlyActiveAccount.save();

    hourlySnapshot.hourlyActiveUsers += 1;
  }
  hourlySnapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  hourlySnapshot.hourlyTransactionCount += 1;
  switch (eventType) {
    case EventType.Deposit:
      hourlySnapshot.hourlyDepositCount += 1;
      break;
    case EventType.Withdraw:
      hourlySnapshot.hourlyWithdrawCount += 1;
      break;
    case EventType.Borrow:
      hourlySnapshot.hourlyBorrowCount += 1;
      break;
    case EventType.Repay:
      hourlySnapshot.hourlyRepayCount += 1;
      break;
    case EventType.Liquidate:
      hourlySnapshot.hourlyLiquidateCount += 1;
      break;
    default:
      break;
  }
  hourlySnapshot.blockNumber = blockNumber;
  hourlySnapshot.timestamp = blockTimestamp;
  hourlySnapshot.save();
}

function updateMarketSnapshots(
  marketID: string,
  timestamp: i32,
  amountUSD: BigDecimal,
  eventType: EventType
): void {
  let marketHourlySnapshot = getOrCreateMarketHourlySnapshot(
    marketID,
    timestamp
  );
  switch (eventType) {
    case EventType.Deposit:
      marketHourlySnapshot.hourlyDepositUSD =
        marketHourlySnapshot.hourlyDepositUSD.plus(amountUSD);
      break;
    case EventType.Borrow:
      marketHourlySnapshot.hourlyBorrowUSD =
        marketHourlySnapshot.hourlyBorrowUSD.plus(amountUSD);
      break;
    case EventType.Liquidate:
      marketHourlySnapshot.hourlyLiquidateUSD =
        marketHourlySnapshot.hourlyLiquidateUSD.plus(amountUSD);
      break;
    default:
      break;
  }
  marketHourlySnapshot.save();

  let marketDailySnapshot = getOrCreateMarketDailySnapshot(marketID, timestamp);
  switch (eventType) {
    case EventType.Deposit:
      marketDailySnapshot.dailyDepositUSD =
        marketDailySnapshot.dailyDepositUSD.plus(amountUSD);
      break;
    case EventType.Borrow:
      marketDailySnapshot.dailyBorrowUSD =
        marketDailySnapshot.dailyBorrowUSD.plus(amountUSD);
      break;
    case EventType.Liquidate:
      marketDailySnapshot.dailyLiquidateUSD =
        marketDailySnapshot.dailyLiquidateUSD.plus(amountUSD);
      break;
    default:
      break;
  }
  marketDailySnapshot.save();
}

function updateMarket(
  updateMarketData: UpdateMarketData,
  marketID: string,
  interestAccumulatedMantissa: BigInt,
  blockNumber: BigInt,
  blockTimestamp: BigInt
): void {
  let market = Market.load(marketID);
  if (!market) {
    log.warning("[updateMarket] Market not found: {}", [marketID]);
    return;
  }

  let underlyingToken = Token.load(market.inputToken);
  if (!underlyingToken) {
    log.warning("[updateMarket] Underlying token not found: {}", [
      market.inputToken,
    ]);
    return;
  }

  let underlyingTokenPriceUSD = getTokenPriceUSD(
    updateMarketData.getUnderlyingPriceResult,
    underlyingToken.decimals
  );

  underlyingToken.lastPriceUSD = underlyingTokenPriceUSD;
  underlyingToken.lastPriceBlockNumber = blockNumber;
  underlyingToken.save();

  market.inputTokenPriceUSD = underlyingTokenPriceUSD;

  if (updateMarketData.totalSupplyResult.reverted) {
    log.warning("[updateMarket] Failed to get totalSupply of Market {}", [
      marketID,
    ]);
  } else {
    market.outputTokenSupply = updateMarketData.totalSupplyResult.value;
  }

  let underlyingSupplyUSD = market.inputTokenBalance
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingToken.decimals))
    .times(underlyingTokenPriceUSD);
  market.totalValueLockedUSD = underlyingSupplyUSD;
  market.totalDepositBalanceUSD = underlyingSupplyUSD;

  if (updateMarketData.exchangeRateStoredResult.reverted) {
    log.warning(
      "[updateMarket] Failed to get exchangeRateStored of Market {}",
      [marketID]
    );
  } else {
    // Formula: check out "Interpreting Exchange Rates" in https://compound.finance/docs#protocol-math
    let oneCTokenInUnderlying = updateMarketData.exchangeRateStoredResult.value
      .toBigDecimal()
      .div(
        exponentToBigDecimal(
          mantissaFactor + underlyingToken.decimals - cTokenDecimals
        )
      );
    market.exchangeRate = oneCTokenInUnderlying;
    market.outputTokenPriceUSD = oneCTokenInUnderlying.times(
      underlyingTokenPriceUSD
    );
  }

  if (updateMarketData.totalBorrowsResult.reverted) {
    log.warning("[updateMarket] Failed to get totalBorrows of Market {}", [
      marketID,
    ]);
  } else {
    market.totalBorrowBalanceUSD = updateMarketData.totalBorrowsResult.value
      .toBigDecimal()
      .div(exponentToBigDecimal(underlyingToken.decimals))
      .times(underlyingTokenPriceUSD);
  }

  if (updateMarketData.supplyRateResult.reverted) {
    log.warning("[updateMarket] Failed to get supplyRate of Market {}", [
      marketID,
    ]);
  } else {
    setSupplyInterestRate(
      marketID,
      convertRatePerUnitToAPY(
        updateMarketData.supplyRateResult.value,
        updateMarketData.unitPerYear
      )
    );
  }

  if (updateMarketData.borrowRateResult.reverted) {
    log.warning("[updateMarket] Failed to get borrowRate of Market {}", [
      marketID,
    ]);
  } else {
    setBorrowInterestRate(
      marketID,
      convertRatePerUnitToAPY(
        updateMarketData.borrowRateResult.value,
        updateMarketData.unitPerYear
      )
    );
  }

  let interestAccumulatedUSD = interestAccumulatedMantissa
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingToken.decimals))
    .times(underlyingTokenPriceUSD);
  let protocolSideRevenueUSDDelta = interestAccumulatedUSD.times(
    market._reserveFactor
  );
  let supplySideRevenueUSDDelta = interestAccumulatedUSD.minus(
    protocolSideRevenueUSDDelta
  );

  market._cumulativeTotalRevenueUSD = market._cumulativeTotalRevenueUSD.plus(
    interestAccumulatedUSD
  );
  market._cumulativeProtocolSideRevenueUSD =
    market._cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenueUSDDelta);
  market._cumulativeSupplySideRevenueUSD =
    market._cumulativeSupplySideRevenueUSD.plus(supplySideRevenueUSDDelta);
  market.save();

  // update daily fields in snapshot
  let snapshot = getOrCreateMarketDailySnapshot(
    market.id,
    blockTimestamp.toI32()
  );
  snapshot._dailyTotalRevenueUSD = snapshot._dailyTotalRevenueUSD.plus(
    interestAccumulatedUSD
  );
  snapshot._dailyProtocolSideRevenueUSD =
    snapshot._dailyProtocolSideRevenueUSD.plus(protocolSideRevenueUSDDelta);
  snapshot._dailySupplySideRevenueUSD =
    snapshot._dailySupplySideRevenueUSD.plus(supplySideRevenueUSDDelta);
  snapshot.save();
}

function updateProtocol(comptrollerAddr: Address): void {
  let protocol = LendingProtocol.load(comptrollerAddr.toHexString());
  if (!protocol) {
    log.error(
      "[updateProtocol] Protocol not found, this SHOULD NOT happen",
      []
    );
    return;
  }

  let totalValueLockedUSD = BIGDECIMAL_ZERO;
  let totalDepositBalanceUSD = BIGDECIMAL_ZERO;
  let totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
  let cumulativeBorrowUSD = BIGDECIMAL_ZERO;
  let cumulativeDepositUSD = BIGDECIMAL_ZERO;
  let cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
  let cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
  let cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  let cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;

  for (let i = 0; i < protocol._marketIDs.length; i++) {
    let market = Market.load(protocol._marketIDs[i]);
    if (!market) {
      log.warning("[updateProtocol] Market not found: {}", [
        protocol._marketIDs[i],
      ]);
      // best effort
      continue;
    }
    totalValueLockedUSD = totalValueLockedUSD.plus(market.totalValueLockedUSD);
    totalDepositBalanceUSD = totalDepositBalanceUSD.plus(
      market.totalDepositBalanceUSD
    );
    totalBorrowBalanceUSD = totalBorrowBalanceUSD.plus(
      market.totalBorrowBalanceUSD
    );
    cumulativeBorrowUSD = cumulativeBorrowUSD.plus(market.cumulativeBorrowUSD);
    cumulativeDepositUSD = cumulativeDepositUSD.plus(
      market.cumulativeDepositUSD
    );
    cumulativeLiquidateUSD = cumulativeLiquidateUSD.plus(
      market.cumulativeLiquidateUSD
    );
    cumulativeTotalRevenueUSD = cumulativeTotalRevenueUSD.plus(
      market._cumulativeTotalRevenueUSD
    );
    cumulativeProtocolSideRevenueUSD = cumulativeProtocolSideRevenueUSD.plus(
      market._cumulativeProtocolSideRevenueUSD
    );
    cumulativeSupplySideRevenueUSD = cumulativeSupplySideRevenueUSD.plus(
      market._cumulativeSupplySideRevenueUSD
    );
  }
  protocol.totalValueLockedUSD = totalValueLockedUSD;
  protocol.totalDepositBalanceUSD = totalDepositBalanceUSD;
  protocol.totalBorrowBalanceUSD = totalBorrowBalanceUSD;
  protocol.cumulativeBorrowUSD = cumulativeBorrowUSD;
  protocol.cumulativeDepositUSD = cumulativeDepositUSD;
  protocol.cumulativeLiquidateUSD = cumulativeLiquidateUSD;
  protocol.cumulativeTotalRevenueUSD = cumulativeTotalRevenueUSD;
  protocol.cumulativeProtocolSideRevenueUSD = cumulativeProtocolSideRevenueUSD;
  protocol.cumulativeSupplySideRevenueUSD = cumulativeSupplySideRevenueUSD;
  protocol.save();
}

function setSupplyInterestRate(marketID: string, rate: BigDecimal): void {
  setInterestRate(marketID, rate, true);
}

function setBorrowInterestRate(marketID: string, rate: BigDecimal): void {
  setInterestRate(marketID, rate, false);
}

function setInterestRate(
  marketID: string,
  rate: BigDecimal,
  isSupply: boolean
): void {
  let market = Market.load(marketID);
  if (!market) {
    log.warning("[setInterestRate] Market not found: {}", [marketID]);
    return;
  }
  if (market.rates.length < 2) {
    log.warning("[setInterestRate] Market has less than 2 rates: {}", [
      marketID,
    ]);
    return;
  }
  let supplyInterestRateID = market.rates[0];
  let borrowInterestRateID = market.rates[1];
  let supplyInterestRate = InterestRate.load(supplyInterestRateID);
  if (!supplyInterestRate) {
    log.warning("[setInterestRate] Supply interest rate not found: {}", [
      supplyInterestRateID,
    ]);
    return;
  }
  let borrowInterestRate = InterestRate.load(borrowInterestRateID);
  if (!borrowInterestRate) {
    log.warning("[setInterestRate] Borrow interest rate not found: {}", [
      borrowInterestRateID,
    ]);
    return;
  }
  if (isSupply) {
    supplyInterestRate.rate = rate;
    supplyInterestRate.save();
  } else {
    borrowInterestRate.rate = rate;
    borrowInterestRate.save();
  }
  market.rates = [supplyInterestRateID, borrowInterestRateID];
  market.save();
}

function getOrCreateMarketDailySnapshot(
  marketID: string,
  blockTimestamp: i32
): MarketDailySnapshot {
  let snapshotID = getMarketDailySnapshotID(marketID, blockTimestamp);
  let snapshot = MarketDailySnapshot.load(snapshotID);
  if (!snapshot) {
    snapshot = new MarketDailySnapshot(snapshotID);
  }
  return snapshot;
}

function getOrCreateMarketHourlySnapshot(
  marketID: string,
  blockTimestamp: i32
): MarketHourlySnapshot {
  let snapshotID = getMarketHourlySnapshotID(marketID, blockTimestamp);
  let snapshot = MarketHourlySnapshot.load(snapshotID);
  if (!snapshot) {
    snapshot = new MarketHourlySnapshot(snapshotID);
  }
  return snapshot;
}

function getTokenPriceUSD(
  getUnderlyingPriceResult: ethereum.CallResult<BigInt>,
  underlyingDecimals: i32
): BigDecimal {
  let mantissaDecimalFactor = 18 - underlyingDecimals + 18;
  let bdFactor = exponentToBigDecimal(mantissaDecimalFactor);
  return getOrElse<BigInt>(getUnderlyingPriceResult, BIGINT_ZERO)
    .toBigDecimal()
    .div(bdFactor);
}

function getMarketHourlySnapshotID(marketID: string, timestamp: i32): string {
  return marketID.concat("-").concat((timestamp / SECONDS_PER_HOUR).toString());
}

function getMarketDailySnapshotID(marketID: string, timestamp: i32): string {
  return marketID.concat("-").concat((timestamp / SECONDS_PER_DAY).toString());
}

function convertRatePerUnitToAPY(
  ratePerUnit: BigInt,
  unitPerYear: i32
): BigDecimal {
  return ratePerUnit
    .times(BigInt.fromI32(unitPerYear))
    .toBigDecimal()
    .div(mantissaFactorBD)
    .times(BIGDECIMAL_HUNDRED);
}

export function getOrElse<T>(
  result: ethereum.CallResult<T>,
  defaultValue: T
): T {
  if (result.reverted) {
    return defaultValue;
  }
  return result.value;
}
