// generic aave-v2 handlers

import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  Borrow,
  Deposit,
  Liquidate,
  Market,
  Repay,
  Token,
  Withdraw,
} from "../generated/schema";
import { AToken } from "../generated/templates/LendingPool/AToken";
import { StableDebtToken } from "../generated/templates/LendingPool/StableDebtToken";
import { VariableDebtToken } from "../generated/templates/LendingPool/VariableDebtToken";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  bigIntToBigDecimal,
  BIGINT_ZERO,
  EventType,
  exponentToBigDecimal,
  InterestRateSide,
  InterestRateType,
  INT_FOUR,
  INT_TWO,
  rayToWad,
  RAY_OFFSET,
} from "./constants";
import {
  createInterestRate,
  getOrCreateLendingProtocol,
  getOrCreateToken,
  snapshotUsage,
  updateFinancials,
  updateMarketSnapshots,
  updateSnapshots,
} from "./helpers";

//////////////////////////
///// Helper Classes /////
//////////////////////////

export class ProtocolData {
  constructor(
    public readonly protocolAddress: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly schemaVersion: string,
    public readonly subgraphVersion: string,
    public readonly methodologyVersion: string,
    public readonly network: string
  ) {}
}

//////////////////////////////////
///// Configuration Handlers /////
//////////////////////////////////

export function _handlePriceOracleUpdated(
  newPriceOracle: Address,
  protocolData: ProtocolData
): void {
  log.info("[PriceOracleUpdated] OracleAddress: {}", [
    newPriceOracle.toHexString(),
  ]);
  let protocol = getOrCreateLendingProtocol(protocolData);
  protocol.priceOracle = newPriceOracle.toHexString();
  protocol.save();
}

export function _handleReserveInitialized(
  event: ethereum.Event,
  underlyingToken: Address,
  outputToken: Address,
  stableDebtToken: Address,
  variableDebtToken: Address,
  protocolData: ProtocolData
): void {
  // create tokens
  let underlyingTokenEntity = getOrCreateToken(underlyingToken);
  let outputTokenEntity = getOrCreateToken(outputToken);
  let stableDebtTokenEntity = getOrCreateToken(stableDebtToken);
  let variableDebtTokenEntity = getOrCreateToken(variableDebtToken);

  // get protocol
  let protocol = getOrCreateLendingProtocol(protocolData);
  protocol.totalPoolCount++;
  let markets = protocol.marketIDs;
  markets.push(underlyingToken.toHexString());
  protocol.marketIDs = markets;
  protocol.save();

  // Create a new Market
  let market = new Market(underlyingToken.toHexString());

  market.protocol = protocol.name;
  market.name = outputTokenEntity.name;
  market.isActive = false;
  market.canUseAsCollateral = false;
  market.canBorrowFrom = false;
  market.maximumLTV = BIGDECIMAL_ZERO;
  market.liquidationThreshold = BIGDECIMAL_ZERO;
  market.liquidationPenalty = BIGDECIMAL_ZERO;
  market.inputToken = underlyingTokenEntity.id;
  market.outputToken = outputTokenEntity.id;
  market.totalValueLockedUSD = BIGDECIMAL_ZERO;
  market.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  market.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  market.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
  market.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
  market.cumulativeDepositUSD = BIGDECIMAL_ZERO;
  market.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
  market.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
  market.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
  market.inputTokenBalance = BIGINT_ZERO;
  market.inputTokenPriceUSD = BIGDECIMAL_ZERO;
  market.outputTokenSupply = BIGINT_ZERO;
  market.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  market.exchangeRate = BIGDECIMAL_ONE; // this is constant
  market.reserveFactor = BIGDECIMAL_ZERO;
  market.totalStableValueLocked = BIGINT_ZERO;
  market.totalVariableValueLocked = BIGINT_ZERO;
  market.rewardTokens = []; // updated once used
  market.rewardTokenEmissionsAmount = [];
  market.rewardTokenEmissionsUSD = [];
  market.sToken = stableDebtTokenEntity.id;
  market.vToken = variableDebtTokenEntity.id;
  market.liquidityIndex = BIGINT_ZERO;
  market.createdTimestamp = event.block.timestamp;
  market.createdBlockNumber = event.block.number;
  market.inputTokenPriceUSD = BIGDECIMAL_ZERO;
  market.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  market.rates = []; // calculated in event ReserveDataUpdated

  market.save();
}

export function _handleCollateralConfigurationChanged(
  marketId: Address,
  liquidationPenalty: BigInt,
  liquidationThreshold: BigInt,
  maximumLTV: BigInt
): void {
  // Adjust market LTV, liquidation, and collateral data when a reserve's collateral configuration has changed
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.error("[CollateralConfigurationChanged] Market not found: {}", [
      marketId.toHexString(),
    ]);
    return;
  }

  market.maximumLTV = maximumLTV.toBigDecimal().div(BIGDECIMAL_HUNDRED);
  market.liquidationThreshold = liquidationThreshold
    .toBigDecimal()
    .div(BIGDECIMAL_HUNDRED);

  // The liquidation bonus value is equal to the liquidation penalty, the naming is a matter of which side of the liquidation a user is on
  // The liquidationBonus parameter comes out as above 100%, represented by a 5 digit integer over 10000 (100%).
  // To extract the expected value in the liquidationPenalty field: convert to BigDecimal, subtract by 10000 and divide by 100
  market.liquidationPenalty = liquidationPenalty.toBigDecimal();
  if (market.liquidationPenalty.gt(BIGDECIMAL_ZERO)) {
    market.liquidationPenalty = market.liquidationPenalty
      .minus(exponentToBigDecimal(INT_FOUR))
      .div(BIGDECIMAL_HUNDRED);
  }

  market.save();
}

export function _handleBorrowingEnabledOnReserve(marketId: Address): void {
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.error("[BorrowingEnabledOnReserve] Market not found: {}", [
      marketId.toHexString(),
    ]);
    return;
  }

  market.canBorrowFrom = true;
  market.save();
}

export function _handleBorrowingDisabledOnReserve(marketId: Address): void {
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.error("[BorrowingDisabledOnReserve] Market not found: {}", [
      marketId.toHexString(),
    ]);
    return;
  }

  market.canBorrowFrom = false;
  market.save();
}

export function _handleReserveActivated(marketId: Address): void {
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.error("[ReserveActivated] Market not found: {}", [
      marketId.toHexString(),
    ]);
    return;
  }

  market.isActive = true;
  market.save();
}

export function _handleReserveDeactivated(marketId: Address): void {
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.error("[ReserveDeactivated] Market not found: {}", [
      marketId.toHexString(),
    ]);
    return;
  }

  market.isActive = false;
  market.save();
}

export function _handleReserveFactorChanged(
  marketId: Address,
  reserveFactor: BigInt
): void {
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.error("[ReserveFactorChanged] Market not found: {}", [
      marketId.toHexString(),
    ]);
    return;
  }

  market.reserveFactor = reserveFactor
    .toBigDecimal()
    .div(exponentToBigDecimal(INT_TWO));
  market.save();
}

export function _handleReserveUsedAsCollateralEnabled(marketId: Address): void {
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.error("[ReserveUsedAsCollateralEnabled] Market not found: {}", [
      marketId.toHexString(),
    ]);
    return;
  }

  market.canUseAsCollateral = true;
  market.save();
}

export function _handleReserveUsedAsCollateralDisabled(
  marketId: Address
): void {
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.error("[ReserveUsedAsCollateralDisabled] Market not found: {}", [
      marketId.toHexString(),
    ]);
    return;
  }

  market.canUseAsCollateral = false;
  market.save();
}

////////////////////////////////
///// Transaction Handlers /////
////////////////////////////////

export function _handleReserveDataUpdated(
  event: ethereum.Event,
  liquidityRate: BigInt, // deposit rate in ray
  liquidityIndex: BigInt,
  variableBorrowRate: BigInt,
  stableBorrowRate: BigInt,
  protocolData: ProtocolData,
  marketId: Address,
  assetPriceUSD: BigDecimal
): void {
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.error("[ReserveDataUpdated] Market not found: {}", [
      marketId.toHexString(),
    ]);
    return;
  }
  let protocol = getOrCreateLendingProtocol(protocolData);

  // get input token and decimals
  let inputToken = getOrCreateToken(Address.fromString(market.inputToken));

  // update market prices
  market.inputTokenPriceUSD = assetPriceUSD;
  market.outputTokenPriceUSD = assetPriceUSD;

  // get current borrow balance
  let stableDebtContract = StableDebtToken.bind(
    Address.fromString(market.sToken)
  );
  let variableDebtContract = VariableDebtToken.bind(
    Address.fromString(market.vToken)
  );
  let trySBorrowBalance = stableDebtContract.try_totalSupply();
  let tryVBorrowBalance = variableDebtContract.try_totalSupply();
  let sBorrowBalance = BIGINT_ZERO;
  let vBorrowBalance = BIGINT_ZERO;

  if (!trySBorrowBalance.reverted) {
    sBorrowBalance = trySBorrowBalance.value;
  }
  if (!tryVBorrowBalance.reverted) {
    vBorrowBalance = tryVBorrowBalance.value;
  }

  // broken is both revert
  if (trySBorrowBalance.reverted && tryVBorrowBalance.reverted) {
    log.warning("[ReserveDataUpdated] No borrow balance found", []);
    return;
  }

  let totalBorrowBalance = sBorrowBalance
    .plus(vBorrowBalance)
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals));
  market.totalBorrowBalanceUSD = totalBorrowBalance.times(assetPriceUSD);

  // update total supply balance
  let aTokenContract = AToken.bind(Address.fromString(market.outputToken!));
  let tryTotalSupply = aTokenContract.try_totalSupply();
  if (tryTotalSupply.reverted) {
    log.warning(
      "[ReserveDataUpdated] Error getting total supply on market: {}",
      [marketId.toHexString()]
    );
    return;
  }
  let tryScaledSupply = aTokenContract.try_scaledTotalSupply();
  if (tryScaledSupply.reverted) {
    log.warning(
      "[ReserveDataUpdated] Error getting scaled total supply on market: {}",
      [marketId.toHexString()]
    );
    return;
  }

  market.inputTokenBalance = tryTotalSupply.value;
  market.outputTokenSupply = tryTotalSupply.value;
  market.totalDepositBalanceUSD = market.inputTokenBalance
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals))
    .times(assetPriceUSD);
  market.totalValueLockedUSD = market.totalDepositBalanceUSD;

  // calculate new revenue
  // New Interest = totalScaledSupply * (difference in liquidity index)
  let liquidityIndexDiff = liquidityIndex
    .minus(market.liquidityIndex)
    .toBigDecimal()
    .div(exponentToBigDecimal(RAY_OFFSET));
  market.liquidityIndex = liquidityIndex; // must update to current liquidity index
  let newRevenueBD = tryScaledSupply.value
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals))
    .times(liquidityIndexDiff);
  let totalRevenueDeltaUSD = newRevenueBD.times(assetPriceUSD);
  let protocolSideRevenueDeltaUSD = totalRevenueDeltaUSD.times(
    market.reserveFactor.div(exponentToBigDecimal(INT_TWO))
  );
  let supplySideRevenueDeltaUSD = totalRevenueDeltaUSD.minus(
    protocolSideRevenueDeltaUSD
  );

  market.cumulativeTotalRevenueUSD =
    market.cumulativeTotalRevenueUSD.plus(totalRevenueDeltaUSD);
  market.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenueDeltaUSD);
  market.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD.plus(supplySideRevenueDeltaUSD);

  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(totalRevenueDeltaUSD);
  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenueDeltaUSD);
  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(supplySideRevenueDeltaUSD);

  log.info("[ReserveDataUpdated] New revenue: {}", [
    totalRevenueDeltaUSD.toString(),
  ]);

  // update rates
  let sBorrowRate = createInterestRate(
    market.id,
    InterestRateSide.BORROWER,
    InterestRateType.STABLE,
    bigIntToBigDecimal(rayToWad(stableBorrowRate))
  );

  let vBorrowRate = createInterestRate(
    market.id,
    InterestRateSide.BORROWER,
    InterestRateType.VARIABLE,
    bigIntToBigDecimal(rayToWad(variableBorrowRate))
  );

  let depositRate = createInterestRate(
    market.id,
    InterestRateSide.LENDER,
    InterestRateType.VARIABLE,
    bigIntToBigDecimal(rayToWad(liquidityRate))
  );

  market.rates = [depositRate.id, vBorrowRate.id, sBorrowRate.id];
  market.save();

  // update protocol TVL / BorrowUSD / SupplyUSD
  let tvl = BIGDECIMAL_ZERO;
  let depositUSD = BIGDECIMAL_ZERO;
  let borrowUSD = BIGDECIMAL_ZERO;
  for (let i = 0; i < protocol.marketIDs.length; i++) {
    let thisMarket = Market.load(protocol.marketIDs[i])!;
    tvl = tvl.plus(thisMarket.totalValueLockedUSD);
    depositUSD = depositUSD.plus(thisMarket.totalDepositBalanceUSD);
    borrowUSD = borrowUSD.plus(thisMarket.totalBorrowBalanceUSD);
  }
  protocol.totalValueLockedUSD = tvl;
  protocol.totalDepositBalanceUSD = depositUSD;
  protocol.totalBorrowBalanceUSD = borrowUSD;
  protocol.save();

  // update financial snapshot
  updateFinancials(
    event,
    protocol,
    totalRevenueDeltaUSD,
    protocolSideRevenueDeltaUSD,
    supplySideRevenueDeltaUSD
  );

  // update revenue in market snapshots
  updateMarketSnapshots(
    event.block.number,
    event.block.timestamp,
    market,
    totalRevenueDeltaUSD,
    supplySideRevenueDeltaUSD,
    protocolSideRevenueDeltaUSD
  );
}

export function _handleDeposit(
  event: ethereum.Event,
  amount: BigInt,
  marketId: Address,
  protocolData: ProtocolData
): void {
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.warning("[Deposit] Market not found on protocol: {}", [
      marketId.toHexString(),
    ]);
    return;
  }
  let inputToken = Token.load(market.inputToken);
  let protocol = getOrCreateLendingProtocol(protocolData);

  // create deposit entity
  let id = `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`;
  let deposit = new Deposit(id);

  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.to = market.id;
  deposit.from = event.transaction.from.toHexString();
  deposit.market = marketId.toHexString();
  deposit.hash = event.transaction.hash.toHexString();
  deposit.logIndex = event.logIndex.toI32();
  deposit.protocol = protocol.id;
  deposit.asset = inputToken!.id;
  deposit.amount = amount;
  deposit.amountUSD = amount
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken!.decimals))
    .times(market.inputTokenPriceUSD);
  deposit.save();

  // update metrics
  protocol.cumulativeDepositUSD = protocol.cumulativeDepositUSD.plus(
    deposit.amountUSD
  );
  protocol.save();
  market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(
    deposit.amountUSD
  );
  market.save();

  // update usage metrics
  snapshotUsage(
    protocol,
    event.block.number,
    event.block.timestamp,
    deposit.from,
    EventType.DEPOSIT
  );

  // udpate market daily / hourly snapshots / financialSnapshots
  updateSnapshots(
    protocol,
    marketId.toHexString(),
    deposit.amountUSD,
    EventType.DEPOSIT,
    event.block.timestamp
  );
}

export function _handleWithdraw(
  event: ethereum.Event,
  amount: BigInt,
  marketId: Address,
  protocolData: ProtocolData
): void {
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.warning("[Withdraw] Market not found on protocol: {}", [
      marketId.toHexString(),
    ]);
    return;
  }
  let inputToken = Token.load(market.inputToken);
  let protocol = getOrCreateLendingProtocol(protocolData);

  // create withdraw entity
  let id = `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`;
  let withdraw = new Withdraw(id);

  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.to = event.transaction.from.toHexString();
  withdraw.from = market.id;
  withdraw.market = market.id;
  withdraw.hash = event.transaction.hash.toHexString();
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.protocol = protocol.id;
  withdraw.asset = inputToken!.id;
  withdraw.amount = amount;
  withdraw.amountUSD = amount
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken!.decimals))
    .times(market.inputTokenPriceUSD);
  withdraw.save();

  // update usage metrics
  snapshotUsage(
    protocol,
    event.block.number,
    event.block.timestamp,
    withdraw.to,
    EventType.WITHDRAW
  );

  // udpate market daily / hourly snapshots / financialSnapshots
  updateSnapshots(
    protocol,
    marketId.toHexString(),
    withdraw.amountUSD,
    EventType.WITHDRAW,
    event.block.timestamp
  );
}

export function _handleBorrow(
  event: ethereum.Event,
  amount: BigInt,
  marketId: Address,
  protocolData: ProtocolData
): void {
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.warning("[Borrow] Market not found on protocol: {}", [
      marketId.toHexString(),
    ]);
    return;
  }
  let inputToken = Token.load(market.inputToken);
  let protocol = getOrCreateLendingProtocol(protocolData);

  // create borrow entity
  let id = `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`;
  let borrow = new Borrow(id);

  borrow.blockNumber = event.block.number;
  borrow.timestamp = event.block.timestamp;
  borrow.to = event.transaction.from.toHexString();
  borrow.from = market.id;
  borrow.market = market.id;
  borrow.hash = event.transaction.hash.toHexString();
  borrow.logIndex = event.logIndex.toI32();
  borrow.protocol = protocol.id;
  borrow.asset = inputToken!.id;
  borrow.amount = amount;
  borrow.amountUSD = amount
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken!.decimals))
    .times(market.inputTokenPriceUSD);
  borrow.save();

  // update metrics
  protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(
    borrow.amountUSD
  );
  protocol.save();
  market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(
    borrow.amountUSD
  );
  market.save();

  // update usage metrics
  snapshotUsage(
    protocol,
    event.block.number,
    event.block.timestamp,
    borrow.to,
    EventType.BORROW
  );

  // udpate market daily / hourly snapshots / financialSnapshots
  updateSnapshots(
    protocol,
    marketId.toHexString(),
    borrow.amountUSD,
    EventType.BORROW,
    event.block.timestamp
  );
}

export function _handleRepay(
  event: ethereum.Event,
  amount: BigInt,
  marketId: Address,
  protocolData: ProtocolData
): void {
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.warning("[Repay] Market not found on protocol: {}", [
      marketId.toHexString(),
    ]);
    return;
  }
  let inputToken = Token.load(market.inputToken);
  let protocol = getOrCreateLendingProtocol(protocolData);

  // create repay entity
  let id = `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`;
  let repay = new Repay(id);

  repay.blockNumber = event.block.number;
  repay.timestamp = event.block.timestamp;
  repay.to = market.id;
  repay.from = event.transaction.from.toHexString();
  repay.market = market.id;
  repay.hash = event.transaction.hash.toHexString();
  repay.logIndex = event.logIndex.toI32();
  repay.protocol = protocol.id;
  repay.asset = inputToken!.id;
  repay.amount = amount;
  repay.amountUSD = amount
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken!.decimals))
    .times(market.inputTokenPriceUSD);
  repay.save();

  // update usage metrics
  snapshotUsage(
    protocol,
    event.block.number,
    event.block.timestamp,
    repay.from,
    EventType.REPAY
  );

  // udpate market daily / hourly snapshots / financialSnapshots
  updateSnapshots(
    protocol,
    marketId.toHexString(),
    repay.amountUSD,
    EventType.REPAY,
    event.block.timestamp
  );
}

export function _handleLiquidate(
  event: ethereum.Event,
  amount: BigInt,
  marketId: Address, // collateral market
  protocolData: ProtocolData,
  debtAsset: Address,
  liquidator: Address,
  user: Address // account liquidated
): void {
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.warning("[Liquidate] Market not found on protocol: {}", [
      marketId.toHexString(),
    ]);
    return;
  }
  let inputToken = Token.load(market.inputToken);
  let protocol = getOrCreateLendingProtocol(protocolData);

  // create liquidate entity
  let id = `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`;
  let liquidate = new Liquidate(id);

  liquidate.blockNumber = event.block.number;
  liquidate.timestamp = event.block.timestamp;
  liquidate.to = debtAsset.toHexString();
  liquidate.from = liquidator.toHexString();
  liquidate.market = market.id;
  liquidate.hash = event.transaction.hash.toHexString();
  liquidate.logIndex = event.logIndex.toI32();
  liquidate.protocol = protocol.id;
  liquidate.asset = inputToken!.id;
  liquidate.amount = amount;
  liquidate.amountUSD = amount
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken!.decimals))
    .times(market.inputTokenPriceUSD);
  liquidate.liquidatee = user.toHexString();
  liquidate.profitUSD = liquidate.amountUSD.times(
    market.liquidationPenalty.div(BIGDECIMAL_HUNDRED)
  );
  liquidate.save();

  // update metrics
  protocol.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD.plus(
    liquidate.amountUSD
  );
  protocol.save();
  market.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD.plus(
    liquidate.amountUSD
  );
  market.save();

  // update usage metrics
  snapshotUsage(
    protocol,
    event.block.number,
    event.block.timestamp,
    liquidate.from,
    EventType.LIQUIDATE
  );

  // udpate market daily / hourly snapshots / financialSnapshots
  updateSnapshots(
    protocol,
    marketId.toHexString(),
    liquidate.amountUSD,
    EventType.LIQUIDATE,
    event.block.timestamp
  );
}
