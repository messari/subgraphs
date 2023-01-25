import {
  BigDecimal,
  BigInt,
  Address,
  ethereum,
  dataSource,
  log,
} from "@graphprotocol/graph-ts";
import { ActiveAccount, InterestRate, Market } from "../../generated/schema";
import {
  SECONDS_PER_DAY,
  BIGDECIMAL_ZERO,
  ABRA_USER_REVENUE_SHARE,
  ABRA_PROTOCOL_REVENUE_SHARE,
  DEFAULT_DECIMALS,
  BIGDECIMAL_ONE,
  SECONDS_PER_HOUR,
  BIGINT_ZERO,
  EventType,
} from "./constants";
import {
  getOrCreateMarketDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateFinancials,
  getOrCreateLendingProtocol,
  getMarket,
  getOrCreateToken,
  getMIMAddress,
  getOrCreateMarketHourlySnapshot,
  getDegenBoxAddress,
} from "./getters";
import { bigIntToBigDecimal, exponentToBigDecimal } from "./utils/numbers";
import { DegenBox } from "../../generated/BentoBox/DegenBox";
import { readValue } from "./utils/utils";
import { getOrCreateAccount } from "../positions";
import { Cauldron } from "../../generated/templates/Cauldron/Cauldron";

// Update FinancialsDailySnapshots entity
export function updateFinancials(
  event: ethereum.Event,
  feesUSD: BigDecimal,
  marketId: string
): void {
  // feesUSD is handled in handleLogWithdrawFees
  // totalValueLockedUSD is handled in updateTVL()
  const financialsDailySnapshots = getOrCreateFinancials(event);
  const marketHourlySnapshot = getOrCreateMarketHourlySnapshot(event, marketId);
  if (!marketHourlySnapshot) {
    log.warning(
      "[updateFinancials] marketHourlySnapshot not found for market: {}",
      [marketId]
    );
    return;
  }
  const marketDailySnapshot = getOrCreateMarketDailySnapshot(event, marketId);
  if (!marketDailySnapshot) {
    log.warning(
      "[updateFinancials] marketDailySnapshot not found for market: {}",
      [marketId]
    );
    return;
  }
  const market = getMarket(marketId);
  if (!market) {
    log.warning("[updateFinancials] Market not found: {}", [marketId]);
    return;
  }

  const protocol = getOrCreateLendingProtocol();

  const totalRevenueUSD = feesUSD;
  const supplySideRevenueUSD = feesUSD.times(ABRA_USER_REVENUE_SHARE);
  const protocolSideRevenueUSD = feesUSD.times(ABRA_PROTOCOL_REVENUE_SHARE);

  // add cumulative revenues to market
  market.cumulativeTotalRevenueUSD =
    market.cumulativeTotalRevenueUSD.plus(totalRevenueUSD);
  market.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD.plus(supplySideRevenueUSD);
  market.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);
  market.save();

  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(totalRevenueUSD);
  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(supplySideRevenueUSD);
  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);

  financialsDailySnapshots.dailyTotalRevenueUSD =
    financialsDailySnapshots.dailyTotalRevenueUSD.plus(totalRevenueUSD); // feesUSD comes from logAccrue which is accounted in MIM
  financialsDailySnapshots.dailySupplySideRevenueUSD =
    financialsDailySnapshots.dailySupplySideRevenueUSD.plus(
      supplySideRevenueUSD
    );
  financialsDailySnapshots.dailyProtocolSideRevenueUSD =
    financialsDailySnapshots.dailyProtocolSideRevenueUSD.plus(
      protocolSideRevenueUSD
    );

  financialsDailySnapshots.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;
  financialsDailySnapshots.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialsDailySnapshots.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;

  marketDailySnapshot.dailyTotalRevenueUSD =
    marketDailySnapshot.dailyTotalRevenueUSD.plus(totalRevenueUSD); // feesUSD comes from logAccrue which is accounted in MIM
  marketDailySnapshot.dailySupplySideRevenueUSD =
    marketDailySnapshot.dailySupplySideRevenueUSD.plus(supplySideRevenueUSD);
  marketDailySnapshot.dailyProtocolSideRevenueUSD =
    marketDailySnapshot.dailyProtocolSideRevenueUSD.plus(
      protocolSideRevenueUSD
    );

  marketDailySnapshot.cumulativeTotalRevenueUSD =
    market.cumulativeTotalRevenueUSD;
  marketDailySnapshot.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD;
  marketDailySnapshot.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD;

  marketHourlySnapshot.hourlyTotalRevenueUSD =
    marketHourlySnapshot.hourlyTotalRevenueUSD.plus(totalRevenueUSD); // feesUSD comes from logAccrue which is accounted in MIM
  marketHourlySnapshot.hourlySupplySideRevenueUSD =
    marketHourlySnapshot.hourlySupplySideRevenueUSD.plus(supplySideRevenueUSD);
  marketHourlySnapshot.hourlyProtocolSideRevenueUSD =
    marketHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(
      protocolSideRevenueUSD
    );

  marketHourlySnapshot.cumulativeTotalRevenueUSD =
    market.cumulativeTotalRevenueUSD;
  marketHourlySnapshot.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD;
  marketHourlySnapshot.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD;

  financialsDailySnapshots.cumulativeLiquidateUSD =
    protocol.cumulativeLiquidateUSD;
  financialsDailySnapshots.save();
  marketDailySnapshot.save();
  marketHourlySnapshot.save();
  protocol.save();
}

export function updateUsageMetrics(
  event: ethereum.Event,
  from: Address,
  to: Address
): void {
  // Number of days since Unix epoch
  const hourlyId: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  const dailyId: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  const usageHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(event);
  const usageDailySnapshot = getOrCreateUsageMetricsDailySnapshot(event);
  const protocol = getOrCreateLendingProtocol();

  // Update the block number and timestamp to that of the last transaction of that day
  usageHourlySnapshot.blockNumber = event.block.number;
  usageHourlySnapshot.timestamp = event.block.timestamp;
  usageHourlySnapshot.hourlyTransactionCount += 1;

  usageDailySnapshot.blockNumber = event.block.number;
  usageDailySnapshot.timestamp = event.block.timestamp;
  usageDailySnapshot.dailyTransactionCount += 1;

  getOrCreateAccount(from.toHexString());
  getOrCreateAccount(to.toHexString());

  usageHourlySnapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageDailySnapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  // Combine the id and the user address to generate a unique user id for the hour/day
  const hourlyActiveAccountIdFrom =
    "hourly-" + from.toHexString() + "-" + hourlyId.toString();
  let hourlyActiveAccountFrom = ActiveAccount.load(hourlyActiveAccountIdFrom);
  if (!hourlyActiveAccountFrom) {
    hourlyActiveAccountFrom = new ActiveAccount(hourlyActiveAccountIdFrom);
    hourlyActiveAccountFrom.save();
    usageHourlySnapshot.hourlyActiveUsers += 1;
  }

  const hourlyActiveAccountIdTo =
    "hourly-" + to.toHexString() + "-" + hourlyId.toString();
  let hourlyActiveAccountTo = ActiveAccount.load(hourlyActiveAccountIdTo);
  if (!hourlyActiveAccountTo) {
    hourlyActiveAccountTo = new ActiveAccount(hourlyActiveAccountIdTo);
    hourlyActiveAccountTo.save();
    usageHourlySnapshot.hourlyActiveUsers += 1;
  }

  const dailyActiveAccountIdFrom =
    "daily-" + from.toHexString() + "-" + dailyId.toString();
  let dailyActiveAccountFrom = ActiveAccount.load(dailyActiveAccountIdFrom);
  if (!dailyActiveAccountFrom) {
    dailyActiveAccountFrom = new ActiveAccount(dailyActiveAccountIdFrom);
    dailyActiveAccountFrom.save();
    usageDailySnapshot.dailyActiveUsers += 1;
  }

  const dailyActiveAccountIdTo =
    "daily-" + to.toHexString() + "-" + dailyId.toString();
  let dailyActiveAccountTo = ActiveAccount.load(dailyActiveAccountIdTo);
  if (!dailyActiveAccountTo) {
    dailyActiveAccountTo = new ActiveAccount(dailyActiveAccountIdTo);
    dailyActiveAccountTo.save();
    usageDailySnapshot.dailyActiveUsers += 1;
  }
  usageDailySnapshot.totalPoolCount = protocol.totalPoolCount;
  usageHourlySnapshot.save();
  usageDailySnapshot.save();
}

// Update MarketDailySnapshot entity
export function updateMarketMetrics(event: ethereum.Event): void {
  const market = getMarket(event.address.toHexString());
  if (!market) {
    return;
  }
  const marketHourlySnapshot = getOrCreateMarketHourlySnapshot(
    event,
    market.id
  );
  const marketDailySnapshot = getOrCreateMarketDailySnapshot(event, market.id);
  if (!marketHourlySnapshot || !marketDailySnapshot) {
    return;
  }
  const protocol = getOrCreateLendingProtocol();

  marketHourlySnapshot.protocol = protocol.id;
  marketHourlySnapshot.market = market.id;
  marketHourlySnapshot.rates = getSnapshotRates(
    market.rates,
    (event.block.timestamp.toI32() / SECONDS_PER_HOUR).toString()
  );
  marketHourlySnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  marketHourlySnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketHourlySnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketHourlySnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketHourlySnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketHourlySnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  marketHourlySnapshot.inputTokenBalance = market.inputTokenBalance;
  marketHourlySnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  marketHourlySnapshot.outputTokenSupply = market.outputTokenSupply;
  marketHourlySnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketHourlySnapshot.blockNumber = event.block.number;
  marketHourlySnapshot.timestamp = event.block.timestamp;

  marketDailySnapshot.protocol = protocol.id;
  marketDailySnapshot.market = market.id;
  marketHourlySnapshot.rates = getSnapshotRates(
    market.rates,
    (event.block.timestamp.toI32() / SECONDS_PER_DAY).toString()
  );
  marketDailySnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  marketDailySnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketDailySnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketDailySnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketDailySnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketDailySnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  marketDailySnapshot.inputTokenBalance = market.inputTokenBalance;
  marketDailySnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  marketDailySnapshot.outputTokenSupply = market.outputTokenSupply;
  marketDailySnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketDailySnapshot.blockNumber = event.block.number;
  marketDailySnapshot.timestamp = event.block.timestamp;

  marketHourlySnapshot.save();
  marketDailySnapshot.save();
}

export function updateTVL(event: ethereum.Event): void {
  // new user count handled in updateUsageMetrics
  // totalBorrowUSD handled updateTotalBorrowUSD
  const protocol = getOrCreateLendingProtocol();
  const bentoBoxContract = DegenBox.bind(Address.fromString(protocol.id));
  const degenBoxContract = DegenBox.bind(
    Address.fromString(getDegenBoxAddress(dataSource.network()))
  );
  const financialsDailySnapshot = getOrCreateFinancials(event);
  const marketIDList = protocol.marketIDList;
  let protocolTotalValueLockedUSD = BIGDECIMAL_ZERO;
  for (let i: i32 = 0; i < marketIDList.length; i++) {
    const marketAddress = marketIDList[i];
    const market = getMarket(marketAddress);
    if (!market) {
      return;
    }
    const inputToken = getOrCreateToken(Address.fromString(market.inputToken));
    const bentoBoxCall: BigInt = readValue<BigInt>(
      bentoBoxContract.try_balanceOf(
        Address.fromString(inputToken.id),
        Address.fromString(marketAddress)
      ),
      BIGINT_ZERO
    );
    const degenBoxCall: BigInt = readValue<BigInt>(
      degenBoxContract.try_balanceOf(
        Address.fromString(inputToken.id),
        Address.fromString(marketAddress)
      ),
      BIGINT_ZERO
    );
    const marketTVL = bigIntToBigDecimal(
      bentoBoxCall.plus(degenBoxCall),
      inputToken.decimals
    ).times(market.inputTokenPriceUSD);
    protocolTotalValueLockedUSD = protocolTotalValueLockedUSD.plus(marketTVL);
  }
  financialsDailySnapshot.totalValueLockedUSD = protocolTotalValueLockedUSD;
  financialsDailySnapshot.totalDepositBalanceUSD = protocolTotalValueLockedUSD;
  financialsDailySnapshot.blockNumber = event.block.number;
  financialsDailySnapshot.timestamp = event.block.timestamp;
  protocol.totalValueLockedUSD = protocolTotalValueLockedUSD;
  protocol.totalDepositBalanceUSD = protocolTotalValueLockedUSD;

  financialsDailySnapshot.save();
  protocol.save();
}

export function updateTotalBorrows(event: ethereum.Event): void {
  // new user count handled in updateUsageMetrics
  const protocol = getOrCreateLendingProtocol();
  const financialsDailySnapshots = getOrCreateFinancials(event);
  const marketIDList = protocol.marketIDList;
  let mimPriceUSD = getOrCreateToken(
    Address.fromString(getMIMAddress(dataSource.network()))
  ).lastPriceUSD;
  mimPriceUSD = mimPriceUSD!.gt(BIGDECIMAL_ZERO) ? mimPriceUSD : BIGDECIMAL_ONE;
  let protocolMintedTokenSupply = BIGINT_ZERO;
  let totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
  for (let i: i32 = 0; i < marketIDList.length; i++) {
    const marketAddress = marketIDList[i];
    const market = getMarket(marketAddress);
    if (!market) {
      return;
    }
    protocolMintedTokenSupply = protocolMintedTokenSupply.plus(
      market.outputTokenSupply
    );
    totalBorrowBalanceUSD = totalBorrowBalanceUSD.plus(
      bigIntToBigDecimal(market.outputTokenSupply, DEFAULT_DECIMALS).times(
        mimPriceUSD!
      )
    );
  }
  financialsDailySnapshots.mintedTokenSupplies = [protocolMintedTokenSupply];
  financialsDailySnapshots.totalBorrowBalanceUSD = totalBorrowBalanceUSD;
  protocol.mintedTokenSupplies = [protocolMintedTokenSupply];
  protocol.totalBorrowBalanceUSD = totalBorrowBalanceUSD;
  financialsDailySnapshots.save();
  protocol.save();
}

export function updateMarketStats(
  marketId: string,
  eventType: string,
  asset: string,
  amount: BigInt,
  event: ethereum.Event
): void {
  const market = getMarket(marketId);
  if (!market) {
    return;
  }
  const token = getOrCreateToken(Address.fromString(asset));
  const usageHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(event);
  const usageDailySnapshot = getOrCreateUsageMetricsDailySnapshot(event);
  const marketHourlySnapshot = getOrCreateMarketHourlySnapshot(
    event,
    market.id
  );
  const marketDailySnapshot = getOrCreateMarketDailySnapshot(event, market.id);
  if (!marketHourlySnapshot || !marketDailySnapshot) {
    return;
  }
  const financialsDailySnapshot = getOrCreateFinancials(event);
  const protocol = getOrCreateLendingProtocol();
  const priceUSD = token.lastPriceUSD;
  const amountUSD = bigIntToBigDecimal(amount, token.decimals).times(priceUSD!);
  usageHourlySnapshot.blockNumber = event.block.number;
  usageHourlySnapshot.timestamp = event.block.timestamp;
  usageDailySnapshot.blockNumber = event.block.number;
  usageDailySnapshot.timestamp = event.block.timestamp;
  marketHourlySnapshot.blockNumber = event.block.number;
  marketHourlySnapshot.timestamp = event.block.timestamp;
  marketDailySnapshot.blockNumber = event.block.number;
  marketDailySnapshot.timestamp = event.block.timestamp;
  financialsDailySnapshot.blockNumber = event.block.number;
  financialsDailySnapshot.timestamp = event.block.timestamp;
  if (eventType == EventType.DEPOSIT) {
    const inputTokenBalance = market.inputTokenBalance.plus(amount);
    market.inputTokenBalance = inputTokenBalance;
    market.totalValueLockedUSD = bigIntToBigDecimal(
      inputTokenBalance,
      token.decimals
    ).times(priceUSD!);
    market.totalDepositBalanceUSD = bigIntToBigDecimal(
      inputTokenBalance,
      token.decimals
    ).times(priceUSD!);
    usageHourlySnapshot.hourlyDepositCount += 1;
    usageDailySnapshot.dailyDepositCount += 1;
    market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(amountUSD);
    market.save();

    marketHourlySnapshot.cumulativeDepositUSD =
      marketHourlySnapshot.cumulativeDepositUSD.plus(amountUSD);
    marketDailySnapshot.cumulativeDepositUSD =
      marketDailySnapshot.cumulativeDepositUSD.plus(amountUSD);
    financialsDailySnapshot.cumulativeDepositUSD =
      financialsDailySnapshot.cumulativeDepositUSD.plus(amountUSD);
    protocol.cumulativeDepositUSD =
      protocol.cumulativeDepositUSD.plus(amountUSD);
    marketHourlySnapshot.hourlyDepositUSD =
      marketHourlySnapshot.hourlyDepositUSD.plus(amountUSD);
    marketDailySnapshot.dailyDepositUSD =
      marketDailySnapshot.dailyDepositUSD.plus(amountUSD);
    financialsDailySnapshot.dailyDepositUSD =
      financialsDailySnapshot.dailyDepositUSD.plus(amountUSD);
  } else if (eventType == EventType.WITHDRAW) {
    const inputTokenBalance = market.inputTokenBalance.minus(amount);
    market.inputTokenBalance = inputTokenBalance;
    market.totalValueLockedUSD = bigIntToBigDecimal(
      inputTokenBalance,
      token.decimals
    ).times(priceUSD!);
    market.totalDepositBalanceUSD = bigIntToBigDecimal(
      inputTokenBalance,
      token.decimals
    ).times(priceUSD!);
    market.save();

    marketDailySnapshot.dailyWithdrawUSD =
      marketDailySnapshot.dailyWithdrawUSD.plus(amountUSD);
    usageHourlySnapshot.hourlyWithdrawCount += 1;
    usageDailySnapshot.dailyWithdrawCount += 1;
    financialsDailySnapshot.dailyWithdrawUSD =
      financialsDailySnapshot.dailyWithdrawUSD.plus(amountUSD);
  } else if (eventType == EventType.BORROW) {
    usageHourlySnapshot.hourlyBorrowCount += 1;
    usageDailySnapshot.dailyBorrowCount += 1;
    market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(amountUSD);
    market.save();

    marketHourlySnapshot.cumulativeBorrowUSD =
      marketHourlySnapshot.cumulativeBorrowUSD.plus(amountUSD);
    marketDailySnapshot.cumulativeBorrowUSD =
      marketDailySnapshot.cumulativeBorrowUSD.plus(amountUSD);
    financialsDailySnapshot.cumulativeBorrowUSD =
      financialsDailySnapshot.cumulativeBorrowUSD.plus(amountUSD);
    protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(amountUSD);
    marketHourlySnapshot.hourlyBorrowUSD =
      marketHourlySnapshot.hourlyBorrowUSD.plus(amountUSD);
    marketDailySnapshot.dailyBorrowUSD =
      marketDailySnapshot.dailyBorrowUSD.plus(amountUSD);
    financialsDailySnapshot.dailyBorrowUSD =
      financialsDailySnapshot.dailyBorrowUSD.plus(amountUSD);
  } else if (eventType == EventType.REPAY) {
    marketDailySnapshot.dailyRepayUSD =
      marketDailySnapshot.dailyRepayUSD.plus(amountUSD);
    usageHourlySnapshot.hourlyRepayCount += 1;
    usageDailySnapshot.dailyRepayCount += 1;
    financialsDailySnapshot.dailyRepayUSD =
      financialsDailySnapshot.dailyRepayUSD.plus(amountUSD);
  }
  market.inputTokenPriceUSD = getOrCreateToken(
    Address.fromString(market.inputToken)
  ).lastPriceUSD!;
  market.save();
  usageHourlySnapshot.save();
  usageDailySnapshot.save();
  marketHourlySnapshot.save();
  marketDailySnapshot.save();
  financialsDailySnapshot.save();
  protocol.save();
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

// update borrow amount for the given market
export function updateBorrowAmount(market: Market): void {
  const couldronContract = Cauldron.bind(Address.fromString(market.id));

  // get total borrows
  const tryBorrowBalance = couldronContract.try_totalBorrow();
  if (tryBorrowBalance.reverted) {
    log.warning(
      "[updateBorrowAmount] Could not get borrow balance for market {}",
      [market.id]
    );
    return;
  }

  // get mim and price since that is the only borrowable asset
  const mimToken = getOrCreateToken(
    Address.fromString(getMIMAddress(dataSource.network()))
  );
  const mimBorrowed = tryBorrowBalance.value.value0;
  market.outputTokenSupply = mimBorrowed;
  market.totalBorrowBalanceUSD = mimBorrowed
    .toBigDecimal()
    .div(exponentToBigDecimal(mimToken.decimals))
    .times(mimToken.lastPriceUSD!);
  market.save();
}
