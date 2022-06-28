// generic aave-v2 handlers

import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { Market } from "../generated/schema";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  exponentToBigDecimal,
  INT_FOUR,
  INT_TWO,
} from "./constants";
import {
  getOrCreateLendingProtocol,
  getOrCreateToken,
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
  const lendingProtocol = getOrCreateLendingProtocol(protocolData);
  lendingProtocol._protocolPriceOracle = newPriceOracle.toHexString();
  lendingProtocol.save();
}

export function _handleReserveInitialized(
  event: ethereum.Event,
  underlyingToken: Address,
  outputToken: Address,
  stableDebtToken: Address,
  variableDebtToken: Address,
  protocolData: ProtocolData
): void {
  // get protocol
  let protocol = getOrCreateLendingProtocol(protocolData);
  protocol.totalPoolCount++;
  protocol.save();

  // create tokens
  let underlyingTokenEntity = getOrCreateToken(underlyingToken);
  let outputTokenEntity = getOrCreateToken(outputToken);
  let stableDebtTokenEntity = getOrCreateToken(stableDebtToken);
  let variableDebtTokenEntity = getOrCreateToken(variableDebtToken);

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

////////////////////////////////
///// Transaction Handlers /////
////////////////////////////////
