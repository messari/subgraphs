import { BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  FinancialsDailySnapshot,
  LendingProtocol,
  Market,
} from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  INT_ONE,
  INT_ZERO,
  LendingType,
  Network,
  ProtocolType,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  RiskType,
  SECONDS_PER_DAY,
  TROVE_MANAGER,
} from "../utils/constants";
import { Versions } from "../versions";
import {
  getOrCreateMarket,
  getOrCreateMarketHourlySnapshot,
  getOrCreateMarketSnapshot,
  getOrCreateStabilityPool,
} from "./market";
import { getLUSDToken, getCurrentETHPrice, getCurrentLUSDPrice } from "./token";
import { bigIntToBigDecimal } from "../utils/numbers";

export function getOrCreateLiquityProtocol(): LendingProtocol {
  let protocol = LendingProtocol.load(TROVE_MANAGER);
  if (!protocol) {
    protocol = new LendingProtocol(TROVE_MANAGER);
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.network = Network.MAINNET;
    protocol.type = ProtocolType.LENDING;
    protocol.lendingType = LendingType.CDP;
    protocol.riskType = RiskType.ISOLATED;
    protocol.mintedTokens = [getLUSDToken().id];
    protocol.totalPoolCount = INT_ONE; // Only one active pool

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
    protocol.openPositionCount = INT_ZERO;
    protocol.cumulativePositionCount = INT_ZERO;
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();

  protocol.save();

  return protocol;
}

export function getOrCreateFinancialsSnapshot(
  event: ethereum.Event,
  protocol: LendingProtocol
): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  const id = `${event.block.timestamp.toI64() / SECONDS_PER_DAY}`;
  let financialsSnapshot = FinancialsDailySnapshot.load(id);
  if (!financialsSnapshot) {
    financialsSnapshot = new FinancialsDailySnapshot(id);
    financialsSnapshot.protocol = protocol.id;
    financialsSnapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyDepositUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyBorrowUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyRepayUSD = BIGDECIMAL_ZERO;
  }
  financialsSnapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialsSnapshot.mintedTokenSupplies = protocol.mintedTokenSupplies;
  financialsSnapshot.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialsSnapshot.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialsSnapshot.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;
  financialsSnapshot.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
  financialsSnapshot.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
  financialsSnapshot.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
  financialsSnapshot.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
  financialsSnapshot.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;
  financialsSnapshot.blockNumber = event.block.number;
  financialsSnapshot.timestamp = event.block.timestamp;
  return financialsSnapshot;
}

export function addProtocolSideRevenue(
  event: ethereum.Event,
  revenueAmountUSD: BigDecimal,
  market: Market
): void {
  const protocol = getOrCreateLiquityProtocol();
  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(revenueAmountUSD);
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(revenueAmountUSD);
  protocol.save();

  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.dailyProtocolSideRevenueUSD =
    financialsSnapshot.dailyProtocolSideRevenueUSD.plus(revenueAmountUSD);
  financialsSnapshot.dailyTotalRevenueUSD =
    financialsSnapshot.dailyTotalRevenueUSD.plus(revenueAmountUSD);
  financialsSnapshot.save();

  market.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD.plus(revenueAmountUSD);
  market.cumulativeTotalRevenueUSD =
    market.cumulativeTotalRevenueUSD.plus(revenueAmountUSD);
  market.save();

  const marketDailySnapshot = getOrCreateMarketSnapshot(event, market);
  marketDailySnapshot.dailyProtocolSideRevenueUSD =
    marketDailySnapshot.dailyProtocolSideRevenueUSD.plus(revenueAmountUSD);
  marketDailySnapshot.dailyTotalRevenueUSD =
    marketDailySnapshot.dailyTotalRevenueUSD.plus(revenueAmountUSD);
  marketDailySnapshot.save();

  const marketHourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  marketHourlySnapshot.hourlyProtocolSideRevenueUSD =
    marketHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(revenueAmountUSD);
  marketHourlySnapshot.hourlyTotalRevenueUSD =
    marketHourlySnapshot.hourlyTotalRevenueUSD.plus(revenueAmountUSD);
  marketHourlySnapshot.save();
}

export function addSupplySideRevenue(
  event: ethereum.Event,
  revenueAmountUSD: BigDecimal,
  market: Market
): void {
  const protocol = getOrCreateLiquityProtocol();
  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(revenueAmountUSD);
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(revenueAmountUSD);
  protocol.save();

  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.dailySupplySideRevenueUSD =
    financialsSnapshot.dailySupplySideRevenueUSD.plus(revenueAmountUSD);
  financialsSnapshot.dailyTotalRevenueUSD =
    financialsSnapshot.dailyTotalRevenueUSD.plus(revenueAmountUSD);
  financialsSnapshot.save();

  market.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD.plus(revenueAmountUSD);
  market.cumulativeTotalRevenueUSD =
    market.cumulativeTotalRevenueUSD.plus(revenueAmountUSD);
  market.save();

  const marketDailySnapshot = getOrCreateMarketSnapshot(event, market);
  marketDailySnapshot.dailySupplySideRevenueUSD =
    marketDailySnapshot.dailySupplySideRevenueUSD.plus(revenueAmountUSD);
  marketDailySnapshot.dailyTotalRevenueUSD =
    marketDailySnapshot.dailyTotalRevenueUSD.plus(revenueAmountUSD);
  marketDailySnapshot.save();

  const marketHourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  marketHourlySnapshot.hourlySupplySideRevenueUSD =
    marketHourlySnapshot.hourlySupplySideRevenueUSD.plus(revenueAmountUSD);
  marketHourlySnapshot.hourlyTotalRevenueUSD =
    marketHourlySnapshot.hourlyTotalRevenueUSD.plus(revenueAmountUSD);
  marketHourlySnapshot.save();
}

export function addProtocolBorrowVolume(
  event: ethereum.Event,
  borrowedUSD: BigDecimal
): void {
  const protocol = getOrCreateLiquityProtocol();
  protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(borrowedUSD);
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.dailyBorrowUSD =
    financialsSnapshot.dailyBorrowUSD.plus(borrowedUSD);
  financialsSnapshot.save();
}

export function addProtocolDepositVolume(
  event: ethereum.Event,
  depositedUSD: BigDecimal
): void {
  const protocol = getOrCreateLiquityProtocol();
  protocol.cumulativeDepositUSD =
    protocol.cumulativeDepositUSD.plus(depositedUSD);
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.dailyDepositUSD =
    financialsSnapshot.dailyDepositUSD.plus(depositedUSD);
  financialsSnapshot.save();
}

export function addProtocolLiquidateVolume(
  event: ethereum.Event,
  liquidatedUSD: BigDecimal
): void {
  const protocol = getOrCreateLiquityProtocol();
  protocol.cumulativeLiquidateUSD =
    protocol.cumulativeLiquidateUSD.plus(liquidatedUSD);
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.dailyLiquidateUSD =
    financialsSnapshot.dailyLiquidateUSD.plus(liquidatedUSD);
  financialsSnapshot.save();
}

export function updateProtocolUSDLocked(
  event: ethereum.Event,
  netChangeUSD: BigDecimal
): void {
  const protocol = getOrCreateLiquityProtocol();
  const totalValueLocked = protocol.totalValueLockedUSD.plus(netChangeUSD);
  protocol.totalValueLockedUSD = totalValueLocked;
  protocol.totalDepositBalanceUSD = totalValueLocked;
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.save();
}

export function updateProtocolUSDLockedStabilityPool(
  event: ethereum.Event,
  lusdAmount: BigInt,
  ethAmount: BigInt
): void {
  const lusdPrice = getCurrentLUSDPrice();
  const LUSDValue = bigIntToBigDecimal(lusdAmount).times(lusdPrice);
  const totalETHValue = bigIntToBigDecimal(ethAmount).times(
    getCurrentETHPrice()
  );
  const stabilityPoolTVL = LUSDValue.plus(totalETHValue);

  const stabilityPool = getOrCreateStabilityPool(event);
  stabilityPool.inputTokenBalance = lusdAmount;
  stabilityPool.totalValueLockedUSD = stabilityPoolTVL;
  stabilityPool.totalDepositBalanceUSD = stabilityPoolTVL;
  stabilityPool.inputTokenPriceUSD = lusdPrice;
  stabilityPool.save();

  const protocol = getOrCreateLiquityProtocol();
  const market = getOrCreateMarket();
  const totalValueLocked = market.totalValueLockedUSD.plus(stabilityPoolTVL);
  protocol.totalValueLockedUSD = totalValueLocked;
  protocol.totalDepositBalanceUSD = totalValueLocked;
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.save();
}

export function updateProtocolBorrowBalance(
  event: ethereum.Event,
  borrowedUSD: BigDecimal,
  totalLUSDSupply: BigInt
): void {
  const protocol = getOrCreateLiquityProtocol();
  protocol.totalBorrowBalanceUSD = borrowedUSD;
  protocol.mintedTokenSupplies = [totalLUSDSupply];
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.save();
}

export function incrementProtocolUniqueUsers(): void {
  const protocol = getOrCreateLiquityProtocol();
  protocol.cumulativeUniqueUsers += 1;
  protocol.save();
}

export function incrementProtocolUniqueDepositors(): void {
  const protocol = getOrCreateLiquityProtocol();
  protocol.cumulativeUniqueDepositors += 1;
  protocol.save();
}

export function incrementProtocolUniqueBorrowers(): void {
  const protocol = getOrCreateLiquityProtocol();
  protocol.cumulativeUniqueBorrowers += 1;
  protocol.save();
}

export function incrementProtocolUniqueLiquidators(): void {
  const protocol = getOrCreateLiquityProtocol();
  protocol.cumulativeUniqueLiquidators += 1;
  protocol.save();
}

export function incrementProtocolUniqueLiquidatees(): void {
  const protocol = getOrCreateLiquityProtocol();
  protocol.cumulativeUniqueLiquidatees += 1;
  protocol.save();
}

export function incrementProtocolPositionCount(): void {
  const protocol = getOrCreateLiquityProtocol();
  protocol.cumulativePositionCount += 1;
  protocol.openPositionCount += 1;
  protocol.save();
}

export function decrementProtocolOpenPositionCount(): void {
  const protocol = getOrCreateLiquityProtocol();
  protocol.openPositionCount -= 1;
  protocol.save();
}
