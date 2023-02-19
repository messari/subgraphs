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
  RewardToken,
} from "../../generated/schema";
import { Vault } from "../../generated/ibALPACA/Vault";
import { updateRewardTokens } from "../mappings/vault";
import { amountInUSD, getTokenPrice } from "./price";
import {
  addProtocolVolume,
  addProtocolDepositVolume,
  addProtocolSideRevenue,
  addSupplySideRevenue,
  decrementProtocolOpenPositionCount,
  getOrCreateLendingProtocol,
  incrementProtocolPositionCount,
  updateProtocolBorrowBalance,
  updateProtocolTVL,
} from "./protocol";
import { getOrCreateToken, getTokenById } from "./token";
import { incrementProtocolTotalPoolCount } from "./usage";
import { EventType } from "./event";
import { getOrCreateInterestRateIds } from "./rate";
import {
  BIGDECIMAL_NEGATIVE_ONE,
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_SECONDS_PER_DAY,
  BIGINT_ZERO,
  INT_ZERO,
  KILL_FACTOR,
  LIQUIDATION_BONUS,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
} from "../utils/constants";
import { bigIntToBigDecimal, exponentToBigDecimal } from "../utils/numbers";

export function getMarket(address: Address): Market {
  const id = address.toHexString();
  return Market.load(id)!;
}

export function getOrCreateMarket(
  event: ethereum.Event,
  reserve: Address,
  ibToken: Address
): Market {
  const id = ibToken.toHexString();
  let market = Market.load(id);
  if (!market) {
    market = createMarket(event, reserve, ibToken);
  }

  return market;
}

export function createMarket(
  event: ethereum.Event,
  reserve: Address,
  ibToken: Address
): Market {
  const id = ibToken.toHexString();
  const interestBearingToken = getOrCreateToken(ibToken, reserve.toHexString());
  const market = new Market(id);
  market.protocol = getOrCreateLendingProtocol().id;
  market.name = interestBearingToken.name;
  market.isActive = true;
  market.canUseAsCollateral = true;
  market.canBorrowFrom = true;
  market.maximumLTV = BIGDECIMAL_ONE;
  market.liquidationThreshold = KILL_FACTOR;
  market.liquidationPenalty = LIQUIDATION_BONUS;
  market.inputToken = getOrCreateToken(reserve).id;
  market.outputToken = interestBearingToken.id;
  market.rates = [];
  market.createdTimestamp = event.block.timestamp;
  market.createdBlockNumber = event.block.number;
  market.exchangeRate = BIGDECIMAL_ONE;

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
  incrementProtocolTotalPoolCount(event);

  return market;
}

export function closeMarket(market: Market): void {
  market.isActive = false;
  market.canUseAsCollateral = false;
  market.canBorrowFrom = false;
  market.save();
}

export function getOrCreateMarketSnapshot(
  event: ethereum.Event,
  market: Market
): MarketDailySnapshot {
  const day: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  const id = `${market.id}-${day}`;
  let marketSnapshot = MarketDailySnapshot.load(id);
  if (!marketSnapshot) {
    // Update reward tokens once per day as the reward ending date has not been set yet.
    updateRewardTokens(event, market);

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
      addProtocolDepositVolume(event, amountUSD);
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

export function changeMarketBorrowBalance(
  event: ethereum.Event,
  market: Market,
  balanceChange: BigInt
): void {
  const changeUSD = amountInUSD(
    balanceChange,
    getTokenById(market.inputToken),
    event.block.number
  );
  const previousTotalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  market.totalBorrowBalanceUSD = previousTotalBorrowBalanceUSD.plus(changeUSD);
  if (market.totalBorrowBalanceUSD.lt(BIGDECIMAL_ZERO)) {
    log.warning(
      "[changeMarketBorrowBalance] totalBorrowBalanceUSD {} is negative, should not happen",
      [market.totalBorrowBalanceUSD.toString()]
    );
    market.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
  }
  market.save();

  getOrCreateMarketSnapshot(event, market);
  getOrCreateMarketHourlySnapshot(event, market);
  updateProtocolBorrowBalance(
    event,
    market.totalBorrowBalanceUSD.minus(previousTotalBorrowBalanceUSD)
  );
}

export function updateMarketRates(
  event: ethereum.Event,
  market: Market,
  borrowerInterestRate: BigDecimal,
  lenderInterestRate: BigDecimal
): void {
  const newRates = getOrCreateInterestRateIds(
    market.id,
    borrowerInterestRate,
    lenderInterestRate
  );
  market.rates = newRates;
  market.save();
  getOrCreateMarketSnapshot(event, market);
  getOrCreateMarketHourlySnapshot(event, market);
}

export function updateTokenSupply(
  event: ethereum.Event,
  market: Market,
  outputTokenChangeAmount: BigInt
): void {
  const inputToken = getTokenById(market.inputToken);
  market.inputTokenPriceUSD = getTokenPrice(inputToken, event.block.number);
  market.outputTokenSupply = market.outputTokenSupply.plus(
    outputTokenChangeAmount
  );

  market.save();
  updateMarketTVL(event, market);

  getOrCreateMarketSnapshot(event, market);
  getOrCreateMarketHourlySnapshot(event, market);
}

export function addMarketSupplySideRevenue(
  event: ethereum.Event,
  market: Market,
  revenueAmountUSD: BigDecimal
): void {
  if (revenueAmountUSD.le(BIGDECIMAL_ZERO)) {
    return;
  }

  market.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD.plus(revenueAmountUSD);
  market.cumulativeTotalRevenueUSD =
    market.cumulativeTotalRevenueUSD.plus(revenueAmountUSD);
  market.save();
  const dailySnapshot = getOrCreateMarketSnapshot(event, market);
  dailySnapshot.dailySupplySideRevenueUSD =
    dailySnapshot.dailySupplySideRevenueUSD.plus(revenueAmountUSD);
  dailySnapshot.dailyTotalRevenueUSD =
    dailySnapshot.dailyTotalRevenueUSD.plus(revenueAmountUSD);
  dailySnapshot.save();
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  hourlySnapshot.hourlySupplySideRevenueUSD =
    hourlySnapshot.hourlySupplySideRevenueUSD.plus(revenueAmountUSD);
  hourlySnapshot.hourlyTotalRevenueUSD =
    hourlySnapshot.hourlyTotalRevenueUSD.plus(revenueAmountUSD);
  hourlySnapshot.save();
  addSupplySideRevenue(event, revenueAmountUSD);
}

export function addMarketProtocolSideRevenue(
  event: ethereum.Event,
  market: Market,
  revenueAmountUSD: BigDecimal
): void {
  if (revenueAmountUSD.le(BIGDECIMAL_ZERO)) {
    return;
  }

  market.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD.plus(revenueAmountUSD);
  market.cumulativeTotalRevenueUSD =
    market.cumulativeTotalRevenueUSD.plus(revenueAmountUSD);
  market.save();
  const dailySnapshot = getOrCreateMarketSnapshot(event, market);
  dailySnapshot.dailyProtocolSideRevenueUSD =
    dailySnapshot.dailyProtocolSideRevenueUSD.plus(revenueAmountUSD);
  dailySnapshot.dailyTotalRevenueUSD =
    dailySnapshot.dailyTotalRevenueUSD.plus(revenueAmountUSD);
  dailySnapshot.save();
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  hourlySnapshot.hourlyProtocolSideRevenueUSD =
    hourlySnapshot.hourlyProtocolSideRevenueUSD.plus(revenueAmountUSD);
  hourlySnapshot.hourlyTotalRevenueUSD =
    hourlySnapshot.hourlyTotalRevenueUSD.plus(revenueAmountUSD);
  hourlySnapshot.save();
  addProtocolSideRevenue(event, revenueAmountUSD);
}

export function updateMarketRewardTokens(
  event: ethereum.Event,
  market: Market,
  rewardToken: RewardToken,
  emissionRate: BigInt
): void {
  let rewardTokens = market.rewardTokens;
  let rewardTokenEmissions = market.rewardTokenEmissionsAmount;
  let rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
  if (rewardTokens == null) {
    rewardTokens = [];
    rewardTokenEmissions = [];
    rewardTokenEmissionsUSD = [];
  }
  let rewardTokenIndex = rewardTokens.indexOf(rewardToken.id);
  if (rewardTokenIndex == -1) {
    rewardTokenIndex = rewardTokens.push(rewardToken.id) - 1;
    rewardTokenEmissions!.push(BIGINT_ZERO);
    rewardTokenEmissionsUSD!.push(BIGDECIMAL_ZERO);
  }
  rewardTokenEmissions![rewardTokenIndex] = emissionRate.times(
    BIGINT_SECONDS_PER_DAY
  );
  market.rewardTokens = rewardTokens;
  market.rewardTokenEmissionsAmount = rewardTokenEmissions;
  market.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;

  sortRewardTokens(market);

  updateMarketRewardTokenEmissions(event, market);
}

function sortRewardTokens(market: Market): void {
  if (market.rewardTokens!.length <= 1) {
    return;
  }

  const tokens = market.rewardTokens;
  const emissions = market.rewardTokenEmissionsAmount;
  const emissionsUSD = market.rewardTokenEmissionsUSD;
  multiArraySort(tokens!, emissions!, emissionsUSD!);

  market.rewardTokens = tokens;
  market.rewardTokenEmissionsAmount = emissions;
  market.rewardTokenEmissionsUSD = emissionsUSD;
}

function multiArraySort(
  ref: Array<string>,
  arr1: Array<BigInt>,
  arr2: Array<BigDecimal>
): void {
  if (ref.length != arr1.length || ref.length != arr2.length) {
    // cannot sort
    return;
  }

  const sorter: Array<Array<string>> = [];
  for (let i = 0; i < ref.length; i++) {
    sorter[i] = [ref[i], arr1[i].toString(), arr2[i].toString()];
  }

  sorter.sort(function (a: Array<string>, b: Array<string>): i32 {
    if (a[0] < b[0]) {
      return -1;
    }
    return 1;
  });

  for (let i = 0; i < sorter.length; i++) {
    ref[i] = sorter[i][0];
    arr1[i] = BigInt.fromString(sorter[i][1]);
    arr2[i] = BigDecimal.fromString(sorter[i][2]);
  }
}

function updateMarketRewardTokenEmissions(
  event: ethereum.Event,
  market: Market
): void {
  if (market.rewardTokens == null) {
    return;
  }
  const rewardTokens = market.rewardTokens!;
  const rewardTokenEmissions = market.rewardTokenEmissionsAmount!;
  const rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD!;

  for (let i = 0; i < rewardTokens.length; i++) {
    const rewardToken = getRewardTokenById(rewardTokens[i]);
    if (
      rewardToken.distributionEnd !== null &&
      event.block.timestamp.gt(rewardToken.distributionEnd!)
    ) {
      rewardTokenEmissions[i] = BIGINT_ZERO;
    }
    rewardTokenEmissionsUSD[i] = amountInUSD(
      rewardTokenEmissions[i],
      getTokenById(rewardToken.token),
      event.block.number
    );
  }
  market.rewardTokenEmissionsAmount = rewardTokenEmissions;
  market.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;

  market.save();
}

function getRewardTokenById(id: string): RewardToken {
  return RewardToken.load(id)!;
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

function updateMarketTVL(event: ethereum.Event, market: Market): void {
  const inputTokenPriceUSD = market.inputTokenPriceUSD;
  let totalValueLockedUSD: BigDecimal = BIGDECIMAL_NEGATIVE_ONE;
  const inputToken = getTokenById(market.inputToken);
  const outputToken = getTokenById(market.outputToken!);
  let marketValue: BigInt = BIGINT_ZERO;

  const contract = Vault.bind(event.address);
  const tryTotalToken = contract.try_totalToken();
  if (!tryTotalToken.reverted) {
    totalValueLockedUSD = bigIntToBigDecimal(
      tryTotalToken.value,
      inputToken.decimals
    ).times(inputTokenPriceUSD);
    marketValue = tryTotalToken.value;
  }

  if (totalValueLockedUSD.ge(BIGDECIMAL_ZERO)) {
    if (market.outputTokenSupply.gt(BIGINT_ZERO)) {
      market.outputTokenPriceUSD = totalValueLockedUSD.div(
        bigIntToBigDecimal(
          market.outputTokenSupply,
          getTokenById(market.outputToken!).decimals
        )
      );

      market.inputTokenBalance = marketValue;
      market.exchangeRate = market.inputTokenBalance
        .divDecimal(market.outputTokenSupply.toBigDecimal())
        .times(
          exponentToBigDecimal(outputToken.decimals - inputToken.decimals)
        );
    }

    const totalValueLockedUSDChange = totalValueLockedUSD.minus(
      market.totalValueLockedUSD
    );
    updateProtocolTVL(
      event,
      totalValueLockedUSDChange,
      totalValueLockedUSDChange
    );
    market.totalValueLockedUSD = totalValueLockedUSD;
    market.totalDepositBalanceUSD = totalValueLockedUSD;
  }

  market.save();
}
