import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
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
  ActivityType,
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  cTokenDecimals,
  cTokenDecimalsBD,
  exponentToBigDecimal,
  InterestRateSide,
  InterestRateType,
  INT_ZERO,
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

////////////////////////
//// Custom Classes ////
////////////////////////

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
  supplyRateResult: ethereum.CallResult<BigInt>;
  borrowRateResult: ethereum.CallResult<BigInt>;
  getUnderlyingPriceResult: ethereum.CallResult<BigInt>;
  unitPerYear: i32;
  constructor(
    totalSupplyResult: ethereum.CallResult<BigInt>,
    exchangeRateStoredResult: ethereum.CallResult<BigInt>,
    supplyRateResult: ethereum.CallResult<BigInt>,
    borrowRateResult: ethereum.CallResult<BigInt>,
    getUnderlyingPriceResult: ethereum.CallResult<BigInt>,
    unitPerYear: i32
  ) {
    this.totalSupplyResult = totalSupplyResult;
    this.exchangeRateStoredResult = exchangeRateStoredResult;
    this.supplyRateResult = supplyRateResult;
    this.borrowRateResult = borrowRateResult;
    this.getUnderlyingPriceResult = getUnderlyingPriceResult;
    this.unitPerYear = unitPerYear;
  }
}

////////////////////////////////////
//// Comptroller Event Handlers ////
////////////////////////////////////

//
//
// event.params.cToken:
// event.params.oldCollateralFactorMantissa:
// event.params.newCollateralFactorMantissa:
export function _handleNewCollateralFactor(
  marketID: string,
  newCollateralFactorMantissa: BigInt
): void {
  let market = Market.load(marketID);
  if (market == null) {
    log.warning("[handleNewCollateralFactor] Market not found: {}", [marketID]);
    return;
  }
  let collateralFactor = newCollateralFactorMantissa
    .toBigDecimal()
    .div(mantissaFactorBD)
    .times(BIGDECIMAL_HUNDRED);
  market.maximumLTV = collateralFactor;
  market.liquidationThreshold = collateralFactor;

  if (market.maximumLTV == BIGDECIMAL_ZERO) {
    // when collateral factor is 0 the asset CANNOT be used as collateral
    market.canUseAsCollateral = false;
  } else {
    // ensure canUseAsCollateral can return to true
    market.canUseAsCollateral = true;
  }

  market.save();
}

//
//
// event.params.oldLiquidationIncentiveMantissa
// event.params.newLiquidationIncentiveMantissa
export function _handleNewLiquidationIncentive(
  protocol: LendingProtocol,
  newLiquidationIncentiveMantissa: BigInt
): void {
  let liquidationIncentive = newLiquidationIncentiveMantissa
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
  newPriceOracle: Address
): void {
  protocol._priceOracle = newPriceOracle.toHexString();
  protocol.save();
}

//
//
// event.params
//  - cToken: Address
//  - action: string
//  - pauseState: boolean
export function _handleActionPaused(
  marketID: string,
  action: string,
  pauseState: boolean
): void {
  let market = Market.load(marketID);
  if (!market) {
    log.warning("[handleActionPaused] Market not found: {}", [marketID]);
    return;
  }

  if (action == "Mint") {
    market.isActive = pauseState;
  } else if (action == "Borrow") {
    market.canBorrowFrom = pauseState;
  }

  market.save();
}

//
//
// event.params.cToken: The address of the market (token) to list
export function _handleMarketListed(
  marketListedData: MarketListedData,
  event: ethereum.Event
): void {
  //let cTokenAddr = event.params.cToken;
  let cTokenAddr = marketListedData.cToken.address;
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
  supplyInterestRate.rate = BIGDECIMAL_ZERO;
  supplyInterestRate.save();
  let borrowInterestRate = new InterestRate(
    InterestRateSide.BORROWER.concat("-")
      .concat(InterestRateType.VARIABLE)
      .concat("-")
      .concat(market.id)
  );
  borrowInterestRate.side = InterestRateSide.BORROWER;
  borrowInterestRate.type = InterestRateType.VARIABLE;
  borrowInterestRate.rate = BIGDECIMAL_ZERO;
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

  // add zero fields
  market.maximumLTV = BIGDECIMAL_ZERO;
  market.liquidationThreshold = BIGDECIMAL_ZERO;
  market.totalValueLockedUSD = BIGDECIMAL_ZERO;
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
  market.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  market.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  market.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

  market.save();

  //
  // update protocol
  //
  let marketIDs = marketListedData.protocol._marketIDs;
  marketIDs.push(market.id);
  marketListedData.protocol._marketIDs = marketIDs;
  marketListedData.protocol.totalPoolCount++;
  marketListedData.protocol.save();
}

////////////////////////////////////
//// Transaction Event Handlers ////
////////////////////////////////////

//
//
// event.params
// - minter
// - mintAmount: The amount of underlying assets to mint
// - mintTokens: The amount of cTokens minted
export function _handleMint(
  comptrollerAddr: Address,
  minter: Address,
  mintAmount: BigInt,
  //mintTokens: BigInt, //not used
  event: ethereum.Event
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
  deposit.from = minter.toHexString();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.market = marketID;
  deposit.asset = market.inputToken;
  deposit.amount = mintAmount;
  let depositUSD = market.inputTokenPriceUSD.times(
    mintAmount
      .toBigDecimal()
      .div(exponentToBigDecimal(underlyingToken.decimals))
  );
  deposit.amountUSD = depositUSD;
  deposit.save();

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
    minter.toHexString(),
    EventType.Deposit
  );
}

//
//
// event.params
// - redeemer
// - redeemAmount
// - redeecTokens
export function _handleRedeem(
  comptrollerAddr: Address,
  redeemer: Address,
  redeemAmount: BigInt,
  event: ethereum.Event
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
  withdraw.to = redeemer.toHexString();
  withdraw.from = marketID;
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.market = marketID;
  withdraw.asset = market.inputToken;
  withdraw.amount = redeemAmount;
  withdraw.amountUSD = market.inputTokenPriceUSD.times(
    redeemAmount
      .toBigDecimal()
      .div(exponentToBigDecimal(underlyingToken.decimals))
  );
  withdraw.save();

  market.save();

  updateMarketSnapshots(
    marketID,
    event.block.timestamp.toI32(),
    withdraw.amountUSD,
    EventType.Withdraw
  );

  snapshotUsage(
    comptrollerAddr,
    event.block.number,
    event.block.timestamp,
    redeemer.toHexString(),
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
  borrower: Address,
  borrowAmount: BigInt,
  event: ethereum.Event
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
  borrow.to = borrower.toHexString();
  borrow.from = marketID;
  borrow.blockNumber = event.block.number;
  borrow.timestamp = event.block.timestamp;
  borrow.market = marketID;
  borrow.asset = market.inputToken;
  borrow.amount = borrowAmount;
  let borrowUSD = market.inputTokenPriceUSD.times(
    borrowAmount
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
    borrower.toHexString(),
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
  payer: Address,
  repayAmount: BigInt,
  event: ethereum.Event
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
  repay.from = payer.toHexString();
  repay.blockNumber = event.block.number;
  repay.timestamp = event.block.timestamp;
  repay.market = marketID;
  repay.asset = market.inputToken;
  repay.amount = repayAmount;
  repay.amountUSD = market.inputTokenPriceUSD.times(
    repayAmount
      .toBigDecimal()
      .div(exponentToBigDecimal(underlyingToken.decimals))
  );
  repay.save();

  updateMarketSnapshots(
    marketID,
    event.block.timestamp.toI32(),
    repay.amountUSD,
    EventType.Repay
  );

  snapshotUsage(
    comptrollerAddr,
    event.block.number,
    event.block.timestamp,
    payer.toHexString(),
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
  cTokenCollateral: Address,
  liquidator: Address,
  borrower: Address,
  seizeTokens: BigInt,
  repayAmount: BigInt,
  event: ethereum.Event
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

  let liquidatedCTokenMarketID = cTokenCollateral.toHexString();
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
  liquidate.from = liquidator.toHexString();
  liquidate.liquidatee = borrower.toHexString();
  liquidate.blockNumber = event.block.number;
  liquidate.timestamp = event.block.timestamp;
  liquidate.market = liquidatedCTokenID;
  liquidate.asset = repayTokenMarketID;
  liquidate.amount = seizeTokens;
  let gainUSD = seizeTokens
    .toBigDecimal()
    .div(cTokenDecimalsBD)
    .times(liquidatedCTokenMarket.outputTokenPriceUSD);
  let lossUSD = repayAmount
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
    liquidator.toHexString(),
    EventType.Liquidate
  );
}

///////////////////////////////
//// CToken Event Handlers ////
///////////////////////////////

// This function is called whenever mint, redeem, borrow, repay, liquidateBorrow happens
export function _handleAccrueInterest(
  updateMarketData: UpdateMarketData,
  comptrollerAddr: Address,
  interestAccumulated: BigInt,
  totalBorrows: BigInt,
  event: ethereum.Event
): void {
  let marketID = event.address.toHexString();
  let market = Market.load(marketID);
  if (!market) {
    log.warning("[handleAccrueInterest] Market not found: {}", [marketID]);
    return;
  }

  // creates and initializes market snapshots
  snapshotMarket(
    event.address.toHexString(),
    event.block.number,
    event.block.timestamp
  );

  updateMarket(
    updateMarketData,
    marketID,
    interestAccumulated,
    totalBorrows,
    event.block.number,
    event.block.timestamp
  );
  updateProtocol(comptrollerAddr);

  snapshotFinancials(
    comptrollerAddr,
    event.block.number,
    event.block.timestamp
  );
}

//
//
// event.params
// - oldReserveFactorMantissa
// - newReserveFactorMantissa
export function _handleNewReserveFactor(
  marketID: string,
  newReserveFactorMantissa: BigInt
): void {
  let market = Market.load(marketID);
  if (market == null) {
    log.warning("[handleNewReserveFactor] Market not found: {}", [marketID]);
    return;
  }
  let reserveFactor = newReserveFactorMantissa
    .toBigDecimal()
    .div(mantissaFactorBD);
  market._reserveFactor = reserveFactor;
  market.save();
}

/////////////////////////
//// Entity Updaters ////
/////////////////////////

export function snapshotMarket(
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
  dailySnapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
  dailySnapshot.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD;
  dailySnapshot.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD;
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
  dailySnapshot.blockNumber = blockNumber;
  dailySnapshot.timestamp = blockTimestamp;
  dailySnapshot.rates = getSnapshotRates(
    market.rates,
    (blockTimestamp.toI64() / SECONDS_PER_DAY).toString()
  );

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
  hourlySnapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
  hourlySnapshot.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD;
  hourlySnapshot.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD;
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
  hourlySnapshot.blockNumber = blockNumber;
  hourlySnapshot.timestamp = blockTimestamp;
  hourlySnapshot.rates = getSnapshotRates(
    market.rates,
    (blockTimestamp.toI64() / SECONDS_PER_HOUR).toString()
  );

  hourlySnapshot.save();
}

/**
 *
 * @param blockNumber
 * @param blockTimestamp
 * @returns
 */
export function snapshotFinancials(
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
  let dailyWithdrawUSD = BIGDECIMAL_ZERO;
  let dailyRepayUSD = BIGDECIMAL_ZERO;
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
      // this is okay - no MarketDailySnapshot means no transactions in that market during that day
      log.info(
        "[snapshotFinancials] MarketDailySnapshot not found (ie, no transactions in that market during this day): {}",
        [marketDailySnapshotID]
      );
      continue;
    }
    dailyDepositUSD = dailyDepositUSD.plus(marketDailySnapshot.dailyDepositUSD);
    dailyBorrowUSD = dailyBorrowUSD.plus(marketDailySnapshot.dailyBorrowUSD);
    dailyLiquidateUSD = dailyLiquidateUSD.plus(
      marketDailySnapshot.dailyLiquidateUSD
    );
    dailyWithdrawUSD = dailyWithdrawUSD.plus(
      marketDailySnapshot.dailyWithdrawUSD
    );
    dailyRepayUSD = dailyRepayUSD.plus(marketDailySnapshot.dailyRepayUSD);
    dailyTotalRevenueUSD = dailyTotalRevenueUSD.plus(
      marketDailySnapshot.dailyTotalRevenueUSD
    );
    dailyProtocolSideRevenueUSD = dailyProtocolSideRevenueUSD.plus(
      marketDailySnapshot.dailyProtocolSideRevenueUSD
    );
    dailySupplySideRevenueUSD = dailySupplySideRevenueUSD.plus(
      marketDailySnapshot.dailySupplySideRevenueUSD
    );
  }

  snapshot.dailyDepositUSD = dailyDepositUSD;
  snapshot.dailyBorrowUSD = dailyBorrowUSD;
  snapshot.dailyLiquidateUSD = dailyLiquidateUSD;
  snapshot.dailyWithdrawUSD = dailyWithdrawUSD;
  snapshot.dailyRepayUSD = dailyRepayUSD;
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
    dailySnapshot.dailyActiveUsers = INT_ZERO;
    dailySnapshot.cumulativeUniqueUsers = INT_ZERO;
    dailySnapshot.dailyTransactionCount = INT_ZERO;
    dailySnapshot.dailyDepositCount = INT_ZERO;
    dailySnapshot.dailyWithdrawCount = INT_ZERO;
    dailySnapshot.dailyBorrowCount = INT_ZERO;
    dailySnapshot.dailyRepayCount = INT_ZERO;
    dailySnapshot.dailyLiquidateCount = INT_ZERO;
    dailySnapshot.blockNumber = blockNumber;
    dailySnapshot.timestamp = blockTimestamp;
  }
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
    case EventType.Withdraw:
      marketHourlySnapshot.hourlyWithdrawUSD =
        marketHourlySnapshot.hourlyWithdrawUSD.plus(amountUSD);
      break;
    case EventType.Repay:
      marketHourlySnapshot.hourlyRepayUSD =
        marketHourlySnapshot.hourlyRepayUSD.plus(amountUSD);
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
    case EventType.Withdraw:
      marketDailySnapshot.dailyWithdrawUSD =
        marketDailySnapshot.dailyWithdrawUSD.plus(amountUSD);
      break;
    case EventType.Repay:
      marketDailySnapshot.dailyRepayUSD =
        marketDailySnapshot.dailyRepayUSD.plus(amountUSD);
      break;
    default:
      break;
  }
  marketDailySnapshot.save();
}

export function updateMarket(
  updateMarketData: UpdateMarketData,
  marketID: string,
  interestAccumulatedMantissa: BigInt,
  newTotalBorrow: BigInt,
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

  // get correct outputTokenDecimals for generic exchangeRate calculation
  let outputTokenDecimals = cTokenDecimals;
  if (market.outputToken) {
    let outputToken = Token.load(market.outputToken!);
    if (!outputToken) {
      log.warning("[updateMarket] Output token not found: {}", [
        market.outputToken!,
      ]);
    } else {
      outputTokenDecimals = outputToken.decimals;
    }
  }

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
          mantissaFactor + underlyingToken.decimals - outputTokenDecimals
        )
      );
    market.exchangeRate = oneCTokenInUnderlying;
    market.outputTokenPriceUSD = oneCTokenInUnderlying.times(
      underlyingTokenPriceUSD
    );

    // calculate inputTokenBalance only if exchangeRate is updated properly
    // mantissaFactor = (inputTokenDecimals - outputTokenDecimals)  (Note: can be negative)
    // inputTokenBalance = (outputSupply * exchangeRate) * (10 ^ mantissaFactor)
    if (underlyingToken.decimals > outputTokenDecimals) {
      // we want to multiply out the difference to expand BD
      let mantissaFactorBD = exponentToBigDecimal(
        underlyingToken.decimals - outputTokenDecimals
      );
      let inputTokenBalanceBD = market.outputTokenSupply
        .toBigDecimal()
        .times(market.exchangeRate!)
        .times(mantissaFactorBD)
        .truncate(0);
      market.inputTokenBalance = BigInt.fromString(
        inputTokenBalanceBD.toString()
      );
    } else {
      // we want to divide back the difference to decrease the BD
      let mantissaFactorBD = exponentToBigDecimal(
        outputTokenDecimals - underlyingToken.decimals
      );
      let inputTokenBalanceBD = market.outputTokenSupply
        .toBigDecimal()
        .times(market.exchangeRate!)
        .div(mantissaFactorBD)
        .truncate(0);
      market.inputTokenBalance = BigInt.fromString(
        inputTokenBalanceBD.toString()
      );
    }
  }

  let underlyingSupplyUSD = market.inputTokenBalance
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingToken.decimals))
    .times(underlyingTokenPriceUSD);
  market.totalValueLockedUSD = underlyingSupplyUSD;
  market.totalDepositBalanceUSD = underlyingSupplyUSD;

  market.totalBorrowBalanceUSD = newTotalBorrow
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingToken.decimals))
    .times(underlyingTokenPriceUSD);

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

  market.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD.plus(
    interestAccumulatedUSD
  );
  market.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenueUSDDelta);
  market.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD.plus(supplySideRevenueUSDDelta);
  market.save();

  // update daily fields in marketDailySnapshot
  let dailySnapshot = getOrCreateMarketDailySnapshot(
    market.id,
    blockTimestamp.toI32()
  );
  dailySnapshot.dailyTotalRevenueUSD = dailySnapshot.dailyTotalRevenueUSD.plus(
    interestAccumulatedUSD
  );
  dailySnapshot.dailyProtocolSideRevenueUSD =
    dailySnapshot.dailyProtocolSideRevenueUSD.plus(protocolSideRevenueUSDDelta);
  dailySnapshot.dailySupplySideRevenueUSD =
    dailySnapshot.dailySupplySideRevenueUSD.plus(supplySideRevenueUSDDelta);
  dailySnapshot.save();

  // update hourly fields in marketHourlySnapshot
  let hourlySnapshot = getOrCreateMarketHourlySnapshot(
    market.id,
    blockTimestamp.toI32()
  );
  hourlySnapshot.hourlyTotalRevenueUSD =
    hourlySnapshot.hourlyTotalRevenueUSD.plus(interestAccumulatedUSD);
  hourlySnapshot.hourlyProtocolSideRevenueUSD =
    hourlySnapshot.hourlyProtocolSideRevenueUSD.plus(
      protocolSideRevenueUSDDelta
    );
  hourlySnapshot.hourlySupplySideRevenueUSD =
    hourlySnapshot.hourlySupplySideRevenueUSD.plus(supplySideRevenueUSDDelta);
  hourlySnapshot.save();
}

export function updateProtocol(comptrollerAddr: Address): void {
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
      market.cumulativeTotalRevenueUSD
    );
    cumulativeProtocolSideRevenueUSD = cumulativeProtocolSideRevenueUSD.plus(
      market.cumulativeProtocolSideRevenueUSD
    );
    cumulativeSupplySideRevenueUSD = cumulativeSupplySideRevenueUSD.plus(
      market.cumulativeSupplySideRevenueUSD
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

////////////////////////
//// Entity Getters ////
////////////////////////

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

    // Set quantitative data params
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
    protocol.totalPoolCount = INT_ZERO;
    protocol._marketIDs = [];

    // set liquidation incentive
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
      protocol._priceOracle = "";
    } else {
      protocol._priceOracle = protocolData.oracleResult.value.toHexString();
    }
    protocol.save();
  }
  return protocol;
}

function getOrCreateMarketHourlySnapshot(
  marketID: string,
  blockTimestamp: i32
): MarketHourlySnapshot {
  let snapshotID = getMarketHourlySnapshotID(marketID, blockTimestamp);
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
  }

  return snapshot;
}

/////////////////
//// Helpers ////
/////////////////

export function setSupplyInterestRate(
  marketID: string,
  rate: BigDecimal
): void {
  setInterestRate(marketID, rate, true);
}

export function setBorrowInterestRate(
  marketID: string,
  rate: BigDecimal
): void {
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

export function getOrCreateMarketDailySnapshot(
  marketID: string,
  blockTimestamp: i32
): MarketDailySnapshot {
  let snapshotID = getMarketDailySnapshotID(marketID, blockTimestamp);
  let snapshot = MarketDailySnapshot.load(snapshotID);
  if (!snapshot) {
    snapshot = new MarketDailySnapshot(snapshotID);

    let market = Market.load(marketID);

    // initialize zero values to ensure no null runtime errors
    snapshot.protocol = market!.protocol;
    snapshot.dailyDepositUSD = BIGDECIMAL_ZERO;
    snapshot.dailyBorrowUSD = BIGDECIMAL_ZERO;
    snapshot.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    snapshot.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    snapshot.dailyRepayUSD = BIGDECIMAL_ZERO;
    snapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
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

export function convertRatePerUnitToAPY(
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

//
//
// create seperate InterestRate Entities for each market snapshot
// this is needed to prevent snapshot rates from being pointers to the current rate
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
