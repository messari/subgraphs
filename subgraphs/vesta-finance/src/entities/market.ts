import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  InterestRate,
  Market,
  MarketDailySnapshot,
  MarketHourlySnapshot,
  _AssetToStabilityPool,
} from "../../generated/schema";
import { VestaParameters } from "../../generated/VestaParameters/VestaParameters";
import {
  addProtocolMarketAssets,
  addProtocolVolume,
  decrementProtocolOpenPositionCount,
  getOrCreateLendingProtocol,
  incrementProtocolPositionCount,
  updateProtocolBorrowBalance,
  updateProtocolUSDLocked,
} from "./protocol";
import {
  getOrCreateAssetToken,
  getCurrentAssetPrice,
  getOrCreateRewardToken,
  getVSTToken,
  getVSTTokenPrice,
} from "./token";
import { getOrCreateStableBorrowerInterestRate } from "./rate";
import { EventType } from "./event";
import { bigIntToBigDecimal } from "../utils/numbers";
import {
  ACTIVE_POOL_ADDRESS,
  ACTIVE_POOL_CREATED_BLOCK,
  ACTIVE_POOL_CREATED_TIMESTAMP,
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  BONUS_TO_SP,
  INT_ONE,
  INT_ZERO,
  MAXIMUM_LTV,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  VESTA_PARAMETERS_ADDRESS,
} from "../utils/constants";

export function getOrCreateStabilityPool(
  pool: Address,
  asset: Address | null,
  event: ethereum.Event | null
): Market {
  const poolID = pool.toHexString();
  let market = Market.load(poolID);
  if (market) {
    return market;
  }

  const protocol = getOrCreateLendingProtocol();
  const VSTToken = getVSTToken();
  const VSTPriceUSD = getVSTTokenPrice(event!);
  const assetToken = getOrCreateAssetToken(asset!);
  market = new Market(poolID);
  market.protocol = protocol.id;
  market.name = `${assetToken.symbol} StabilityPool`;
  market.isActive = true;
  market.canUseAsCollateral = false;
  market.canBorrowFrom = false;
  market.maximumLTV = BIGDECIMAL_ZERO;
  market.liquidationThreshold = BIGDECIMAL_ZERO;
  market.liquidationPenalty = BIGDECIMAL_ZERO;
  market.inputToken = VSTToken.id;
  market.rewardTokens = [getOrCreateRewardToken().id];
  market.rates = [];
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
  market.inputTokenPriceUSD = VSTPriceUSD;
  market.outputTokenSupply = BIGINT_ZERO;
  market.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  market.exchangeRate = BIGDECIMAL_ZERO;
  market.rewardTokenEmissionsAmount = [];
  market.rewardTokenEmissionsUSD = [];
  market.positionCount = 0;
  market.openPositionCount = 0;
  market.closedPositionCount = 0;
  market.lendingPositionCount = 0;
  market.borrowingPositionCount = 0;

  market.createdTimestamp = event!.block.timestamp;
  market.createdBlockNumber = event!.block.number;
  market._asset = asset!.toHexString();
  market.save();

  const stabilityPools = protocol._stabilityPools!;
  stabilityPools.push(market.id);
  protocol._stabilityPools = stabilityPools;
  protocol.save();

  // map asset to stability pool
  let assetToSP = _AssetToStabilityPool.load(asset!.toHexString());
  if (!assetToSP) {
    assetToSP = new _AssetToStabilityPool(asset!.toHexString());
    assetToSP.stabilityPool = market.id;
    assetToSP.save();
  }

  return market;
}

export function getOrCreateMarket(asset: Address): Market {
  const assetAddress = asset.toHexString();
  const marketID = `${ACTIVE_POOL_ADDRESS}-${assetAddress}`;
  let market = Market.load(marketID);
  if (!market) {
    const protocol = getOrCreateLendingProtocol();
    protocol.totalPoolCount += INT_ONE;
    protocol.save();

    const inputToken = getOrCreateAssetToken(asset);
    const maxLTV = setMaxLTV(assetAddress);
    const liquidationPenalty = setLiquidationPenalty(assetAddress);
    market = new Market(marketID);
    market.protocol = protocol.id;
    market.name = inputToken.name;
    market.isActive = true;
    market.canUseAsCollateral = true;
    market.canBorrowFrom = true;
    market.maximumLTV = maxLTV;
    market.liquidationThreshold = maxLTV;
    market.liquidationPenalty = liquidationPenalty;
    market.inputToken = inputToken.id;
    market.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    market.rates = [getOrCreateStableBorrowerInterestRate(assetAddress).id];
    market.createdTimestamp = ACTIVE_POOL_CREATED_TIMESTAMP;
    market.createdBlockNumber = ACTIVE_POOL_CREATED_BLOCK;

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
    market.positionCount = INT_ZERO;
    market.openPositionCount = INT_ZERO;
    market.closedPositionCount = INT_ZERO;
    market.lendingPositionCount = INT_ZERO;
    market.borrowingPositionCount = INT_ZERO;

    market.save();

    addProtocolMarketAssets(market);
  }
  return market;
}

export function getOrCreateMarketSnapshot(
  event: ethereum.Event,
  market: Market
): MarketDailySnapshot {
  const day: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  const id = `${market.id}-${day}`;
  let marketSnapshot = MarketDailySnapshot.load(id);
  if (!marketSnapshot) {
    marketSnapshot = new MarketDailySnapshot(id);
    marketSnapshot.protocol = market.protocol;
    marketSnapshot.market = market.id;

    marketSnapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyDepositUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyBorrowUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyRepayUSD = BIGDECIMAL_ZERO;
  }
  marketSnapshot.rates = getSnapshotRates(
    market.rates,
    (event.block.timestamp.toI32() / SECONDS_PER_DAY).toString()
  );
  marketSnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  marketSnapshot.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD;
  marketSnapshot.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD;
  marketSnapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
  marketSnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketSnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketSnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketSnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketSnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  marketSnapshot.inputTokenBalance = market.inputTokenBalance;
  marketSnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  marketSnapshot.outputTokenSupply = market.outputTokenSupply;
  marketSnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketSnapshot.exchangeRate = market.exchangeRate;
  marketSnapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  marketSnapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
  marketSnapshot.blockNumber = event.block.number;
  marketSnapshot.timestamp = event.block.timestamp;
  marketSnapshot.save();
  return marketSnapshot;
}

export function getOrCreateMarketHourlySnapshot(
  event: ethereum.Event,
  market: Market
): MarketHourlySnapshot {
  const timestamp = event.block.timestamp.toI64();
  const hour: i64 = timestamp / SECONDS_PER_HOUR;
  const id = `${market.id}-${hour}`;
  let marketSnapshot = MarketHourlySnapshot.load(id);
  if (!marketSnapshot) {
    marketSnapshot = new MarketHourlySnapshot(id);
    marketSnapshot.protocol = market.protocol;
    marketSnapshot.market = market.id;

    marketSnapshot.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyDepositUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyBorrowUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyLiquidateUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyWithdrawUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyRepayUSD = BIGDECIMAL_ZERO;
  }
  marketSnapshot.rates = getSnapshotRates(
    market.rates,
    (event.block.timestamp.toI32() / SECONDS_PER_DAY).toString()
  );
  marketSnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  marketSnapshot.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD;
  marketSnapshot.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD;
  marketSnapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
  marketSnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketSnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketSnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketSnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketSnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  marketSnapshot.inputTokenBalance = market.inputTokenBalance;
  marketSnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  marketSnapshot.outputTokenSupply = market.outputTokenSupply;
  marketSnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketSnapshot.exchangeRate = market.exchangeRate;
  marketSnapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  marketSnapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
  marketSnapshot.blockNumber = event.block.number;
  marketSnapshot.timestamp = event.block.timestamp;
  marketSnapshot.save();
  return marketSnapshot;
}

// create seperate InterestRate Entities for each market snapshot
// this is needed to prevent snapshot rates from being pointers to the current rate
function getSnapshotRates(rates: string[], timeSuffix: string): string[] {
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
    snapshotRate.side = rate.side;
    snapshotRate.type = rate.type;
    snapshotRate.rate = rate.rate;
    snapshotRate.save();
    snapshotRates.push(snapshotRateId);
  }
  return snapshotRates;
}

export function setMarketVSTDebt(
  event: ethereum.Event,
  asset: Address,
  debtVST: BigInt
): void {
  const debtUSD = bigIntToBigDecimal(debtVST);
  const market = getOrCreateMarket(asset);
  const debtUSDChange = debtUSD.minus(market.totalBorrowBalanceUSD);
  market.totalBorrowBalanceUSD = debtUSD;
  market.save();

  getOrCreateMarketSnapshot(event, market);
  getOrCreateMarketHourlySnapshot(event, market);
  updateProtocolBorrowBalance(event, debtUSDChange);
}

export function setMarketAssetBalance(
  event: ethereum.Event,
  asset: Address,
  balanceAsset: BigInt
): void {
  const assetPrice = getCurrentAssetPrice(asset);
  const balanceUSD = bigIntToBigDecimal(balanceAsset).times(assetPrice);
  const market = getOrCreateMarket(asset);
  const netChangeUSD = balanceUSD.minus(market.totalValueLockedUSD);
  market.totalValueLockedUSD = balanceUSD;
  market.totalDepositBalanceUSD = balanceUSD;
  market.inputToken = asset.toHexString();
  market.inputTokenBalance = balanceAsset;
  market.inputTokenPriceUSD = assetPrice;
  market.save();

  getOrCreateMarketSnapshot(event, market);
  getOrCreateMarketHourlySnapshot(event, market);
  updateProtocolUSDLocked(event, netChangeUSD);
}

export function addMarketRepayVolume(
  event: ethereum.Event,
  market: Market,
  amountUSD: BigDecimal
): void {
  addMarketVolume(event, market, amountUSD, EventType.Repay);
}

export function addMarketVolume(
  event: ethereum.Event,
  market: Market,
  amountUSD: BigDecimal,
  eventType: EventType
): void {
  const dailySnapshot = getOrCreateMarketSnapshot(event, market);
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);

  switch (eventType) {
    case EventType.Deposit:
      market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(amountUSD);
      dailySnapshot.dailyDepositUSD =
        dailySnapshot.dailyDepositUSD.plus(amountUSD);
      hourlySnapshot.hourlyDepositUSD =
        hourlySnapshot.hourlyDepositUSD.plus(amountUSD);
      addProtocolVolume(event, amountUSD, EventType.Deposit);
      break;
    case EventType.Borrow:
      market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(amountUSD);
      dailySnapshot.dailyBorrowUSD =
        dailySnapshot.dailyBorrowUSD.plus(amountUSD);
      hourlySnapshot.hourlyBorrowUSD =
        hourlySnapshot.hourlyBorrowUSD.plus(amountUSD);
      addProtocolVolume(event, amountUSD, EventType.Borrow);
      break;
    case EventType.Liquidate:
      market.cumulativeLiquidateUSD =
        market.cumulativeLiquidateUSD.plus(amountUSD);
      dailySnapshot.dailyLiquidateUSD =
        dailySnapshot.dailyLiquidateUSD.plus(amountUSD);
      hourlySnapshot.hourlyLiquidateUSD =
        hourlySnapshot.hourlyLiquidateUSD.plus(amountUSD);
      addProtocolVolume(event, amountUSD, EventType.Liquidate);
      break;
    case EventType.Withdraw:
      dailySnapshot.dailyWithdrawUSD =
        dailySnapshot.dailyWithdrawUSD.plus(amountUSD);
      hourlySnapshot.hourlyWithdrawUSD =
        hourlySnapshot.hourlyWithdrawUSD.plus(amountUSD);
      addProtocolVolume(event, amountUSD, EventType.Withdraw);
      break;
    case EventType.Repay:
      dailySnapshot.dailyRepayUSD = dailySnapshot.dailyRepayUSD.plus(amountUSD);
      hourlySnapshot.hourlyRepayUSD =
        hourlySnapshot.hourlyRepayUSD.plus(amountUSD);
      addProtocolVolume(event, amountUSD, EventType.Repay);
      break;
    default:
      break;
  }

  market.save();
  dailySnapshot.save();
  hourlySnapshot.save();
}

export function openMarketBorrowerPosition(market: Market): void {
  market.openPositionCount += 1;
  market.positionCount += 1;
  market.borrowingPositionCount += 1;
  market.save();
  incrementProtocolPositionCount();
}

export function openMarketLenderPosition(market: Market): void {
  market.openPositionCount += 1;
  market.positionCount += 1;
  market.lendingPositionCount += 1;
  market.save();
  incrementProtocolPositionCount();
}

export function closeMarketPosition(market: Market): void {
  market.openPositionCount -= 1;
  market.closedPositionCount += 1;
  market.save();
  decrementProtocolOpenPositionCount();
}

function setMaxLTV(asset: string): BigDecimal {
  let MaxLTV = MAXIMUM_LTV;

  const contract = VestaParameters.bind(
    Address.fromString(VESTA_PARAMETERS_ADDRESS)
  );
  const tryMCR = contract.try_MCR(Address.fromString(asset));
  if (!tryMCR.reverted && tryMCR.value != BIGINT_ZERO) {
    const adjustedMCR = bigIntToBigDecimal(tryMCR.value);
    MaxLTV = BIGDECIMAL_HUNDRED.div(adjustedMCR);
  }

  return MaxLTV;
}

function setLiquidationPenalty(asset: string): BigDecimal {
  let adjustedBonusToSP = BONUS_TO_SP;

  const contract = VestaParameters.bind(
    Address.fromString(VESTA_PARAMETERS_ADDRESS)
  );
  const tryBonusToSP = contract.try_BonusToSP(Address.fromString(asset));
  if (!tryBonusToSP.reverted) {
    adjustedBonusToSP = bigIntToBigDecimal(tryBonusToSP.value).times(
      BIGDECIMAL_HUNDRED
    );
  }

  return adjustedBonusToSP;
}
