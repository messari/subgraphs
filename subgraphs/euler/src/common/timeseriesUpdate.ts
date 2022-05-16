import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { AssetStatus, Borrow, Deposit, Repay, Withdraw } from "../../generated/euler/Euler";
import { getAsset, getDailyAssetStatus, getDailyBorrow, getDailyDeposit, getDailyRepay, getDailyWithdraw, getHourlyAssetStatus, getHourlyBorrow, getHourlyDeposit, getHourlyRepay, getHourlyWithdraw, getMonthlyAssetStatus, getMonthlyBorrow, getMonthlyDeposit, getMonthlyRepay, getMonthlyWithdraw } from "../entities";
import { amountToUsd } from "./conversions";

function firstMonthlyTimestamp(timestamp: i32): string {
  const begginingOfDay = timestamp / 86400;
  let begginingOfMonth = new Date(begginingOfDay * 1000);

  begginingOfMonth.setUTCDate(1);

  return (begginingOfMonth.getTime() / 1000).toString();
}

function createUnderlyingHourlyId(timestamp: i32, underlying: Address): string {
  const uniqueHourIndex = timestamp / 3600;
  const uniqueHourId = (uniqueHourIndex * 3600).toString();

  return uniqueHourId + ':' + underlying.toHexString();
}

function createUnderlyingDailyId(timestamp: i32, underlying: Address): string {
  const uniqueDayIndex = timestamp / 86400;
  const uniqueDayId = (uniqueDayIndex * 86400).toString();

  return uniqueDayId + ':' + underlying.toHexString();
}

function createUnderlyingMonthlyId(timestamp: i32, underlying: Address): string {
  const uniqueMonthId = firstMonthlyTimestamp(timestamp);

  return uniqueMonthId + ':' + underlying.toHexString();
}

function createChangeHourlyId(timestamp: i32): string {
  const uniqueHourIndex = timestamp / 3600;
  const uniqueHourId = (uniqueHourIndex * 3600).toString();

  return uniqueHourId;
}

function createChangeDailyId(timestamp: i32): string {
  const uniqueDayIndex = timestamp / 86400;
  const uniqueDayId = (uniqueDayIndex * 86400).toString();

  return uniqueDayId;
}

function createChangeMonthlyId(timestamp: i32): string {
  return firstMonthlyTimestamp(timestamp);
}

export function updateHourlyAssetStatus(event: AssetStatus, twapPrice: BigDecimal): void {
  const timestamp = event.params.timestamp.toI32();
  const id = createUnderlyingHourlyId(timestamp, event.params.underlying);
  const roundedTimestamp = (timestamp / 3600) * 3600;

  let hourlyAssetStatus = getHourlyAssetStatus(id);

  /**
   *  " The pool this snapshot belongs to "
    market: Market!

    " Block number of this snapshot "
    blockNumber: BigInt!

    " Timestamp of this snapshot "
    timestamp: BigInt!

    ##### Quantitative Data #####

    " All interest rates / fees allowed in the market. Interest rate should be in APY percentage "
    rates: [InterestRate!]!

    " Current TVL (Total Value Locked) of this market "
    totalValueLockedUSD: BigDecimal!

    " Current balance of all deposited assets (not historical cumulative), in USD. Same as pool TVL. "
    totalDepositBalanceUSD: BigDecimal!

    " Sum of all deposits made in a given hour, in USD "
    hourlyDepositUSD: BigDecimal!

    " Sum of all historical deposits in USD (only considers deposits and not withdrawals) "
    cumulativeDepositUSD: BigDecimal!

    " Current balance of all borrowed/minted assets (not historical cumulative), in USD. "
    totalBorrowBalanceUSD: BigDecimal!

    " Sum of all borrows/mints made in a given hour, in USD "
    hourlyBorrowUSD: BigDecimal!

    " Sum of all historical borrows/mints in USD (i.e. total loan origination) "
    cumulativeBorrowUSD: BigDecimal!

    " Total assets liquidated in a given hour, in USD. "
    hourlyLiquidateUSD: BigDecimal!

    " Sum of all historical liquidations in USD "
    cumulativeLiquidateUSD: BigDecimal!

    ##### Token Balances #####

    " Amount of input token in the market. "
    inputTokenBalance: BigInt!

    " Price per share of input token in USD "
    inputTokenPriceUSD: BigDecimal!

    " Total supply of output token "
    outputTokenSupply: BigInt!

    " Price per share of output token in USD "
    outputTokenPriceUSD: BigDecimal!

    " Amount of input token per full share of output token. Only applies when the output token exists "
    exchangeRate: BigDecimal

    " Per-block reward token emission as of the current block normalized to a day (not hour), in token's native amount. This should be ideally calculated as the theoretical rate instead of the realized amount. "
    rewardTokenEmissionsAmount: [BigInt!]

    " Per-block reward token emission as of the current block normalized to a day (not hour), in USD value. This should be ideally calculated as the theoretical rate instead of the realized amount. "
    rewardTokenEmissionsUSD: [BigDecimal!]
   */
  hourlyAssetStatus.timestamp = roundedTimestamp;
  hourlyAssetStatus.totalBalances = event.params.totalBalances;
  hourlyAssetStatus.totalBorrows = event.params.totalBorrows;
  hourlyAssetStatus.reserveBalance = event.params.reserveBalance;
  hourlyAssetStatus.poolSize = event.params.poolSize;
  hourlyAssetStatus.interestAccumulator = event.params.interestAccumulator;
  hourlyAssetStatus.interestRate = event.params.interestRate;
  hourlyAssetStatus.twapPrice = twapPrice;

  hourlyAssetStatus.save();
}

export function updateDailyAssetStatus(event: AssetStatus, twapPrice: BigDecimal): void {
  const timestamp = event.params.timestamp.toI32();
  const id = createUnderlyingDailyId(timestamp, event.params.underlying);
  const roundedTimestamp = (timestamp / 86400) * 86400;

  let dailyAssetStatus = getDailyAssetStatus(id);

  /**
   * " The pool this snapshot belongs to "
    market: Market!

    " Block number of this snapshot "
    blockNumber: BigInt!

    " Timestamp of this snapshot "
    timestamp: BigInt!

    ##### Quantitative Data #####

    " All interest rates / fees allowed in the market. Interest rate should be in APY percentage "
    rates: [InterestRate!]!

    " Current TVL (Total Value Locked) of this market "
    totalValueLockedUSD: BigDecimal!

    " Current balance of all deposited assets (not historical cumulative), in USD. Same as pool TVL. "
    totalDepositBalanceUSD: BigDecimal!

    " Sum of all deposits made on a given day, in USD "
    dailyDepositUSD: BigDecimal!

    " Sum of all historical deposits in USD (only considers deposits and not withdrawals) "
    cumulativeDepositUSD: BigDecimal!

    " Current balance of all borrowed/minted assets (not historical cumulative), in USD. "
    totalBorrowBalanceUSD: BigDecimal!

    " Sum of all borrows/mints made on a given day, in USD "
    dailyBorrowUSD: BigDecimal!

    " Sum of all historical borrows/mints in USD (i.e. total loan origination) "
    cumulativeBorrowUSD: BigDecimal!

    " Total assets liquidated on a given day, in USD. "
    dailyLiquidateUSD: BigDecimal!

    " Sum of all historical liquidations in USD "
    cumulativeLiquidateUSD: BigDecimal!

    ##### Token Balances #####

    " Amount of input token in the market. "
    inputTokenBalance: BigInt!

    " Price per share of input token in USD "
    inputTokenPriceUSD: BigDecimal!

    " Total supply of output token "
    outputTokenSupply: BigInt!

    " Price per share of output token in USD "
    outputTokenPriceUSD: BigDecimal!

    " Amount of input token per full share of output token. Only applies when the output token exists "
    exchangeRate: BigDecimal

    " Per-block reward token emission as of the current block normalized to a day, in token's native amount. This should be ideally calculated as the theoretical rate instead of the realized amount. "
    rewardTokenEmissionsAmount: [BigInt!]

    " Per-block reward token emission as of the current block normalized to a day, in USD value. This should be ideally calculated as the theoretical rate instead of the realized amount. "
    rewardTokenEmissionsUSD: [BigDecimal!]

   */
  dailyAssetStatus.timestamp = roundedTimestamp;
  dailyAssetStatus.totalBalances = event.params.totalBalances;
  dailyAssetStatus.totalBorrows = event.params.totalBorrows;
  dailyAssetStatus.reserveBalance = event.params.reserveBalance;
  dailyAssetStatus.poolSize = event.params.poolSize;
  dailyAssetStatus.interestAccumulator = event.params.interestAccumulator;
  dailyAssetStatus.interestRate = event.params.interestRate;
  dailyAssetStatus.twapPrice = twapPrice;

  dailyAssetStatus.save();
}

export function updateHourlyBorrows(event: Borrow): void {
  const timestamp = event.block.timestamp.toI32();
  const id = createChangeHourlyId(timestamp);
  const roundedTimestamp = (timestamp / 3600) * 3600;
  const asset = getAsset(event.params.underlying.toHexString());
  const amountUsd = amountToUsd(event.params.amount, asset.twap, asset.twapPrice);

  let hourlyBorrows = getHourlyBorrow(id);

  hourlyBorrows.timestamp = roundedTimestamp;
  hourlyBorrows.count = hourlyBorrows.count + 1;
  hourlyBorrows.totalAmount = hourlyBorrows.totalAmount.plus(event.params.amount);
  hourlyBorrows.totalUsdAmount = hourlyBorrows.totalUsdAmount.plus(amountUsd);

  hourlyBorrows.save();
}

export function updateDailyBorrows(event: Borrow): void {
  const timestamp = event.block.timestamp.toI32();
  const id = createChangeDailyId(timestamp);
  const roundedTimestamp = (timestamp / 86400) * 86400;
  const asset = getAsset(event.params.underlying.toHexString());
  const amountUsd = amountToUsd(event.params.amount, asset.twap, asset.twapPrice);

  let dailyBorrows = getDailyBorrow(id);

  dailyBorrows.timestamp = roundedTimestamp;
  dailyBorrows.count = dailyBorrows.count + 1;
  dailyBorrows.totalAmount = dailyBorrows.totalAmount.plus(event.params.amount);
  dailyBorrows.totalUsdAmount = dailyBorrows.totalUsdAmount.plus(amountUsd);

  dailyBorrows.save();
}

export function updateMonthlyBorrows(event: Borrow): void {
  const timestamp = event.block.timestamp.toI32();
  const id = createChangeMonthlyId(timestamp);
  const asset = getAsset(event.params.underlying.toHexString());
  const amountUsd = amountToUsd(event.params.amount, asset.twap, asset.twapPrice);

  let monthlyBorrows = getMonthlyBorrow(id);

  monthlyBorrows.timestamp = timestamp;
  monthlyBorrows.count = monthlyBorrows.count + 1;
  monthlyBorrows.totalAmount = monthlyBorrows.totalAmount.plus(event.params.amount);
  monthlyBorrows.totalUsdAmount = monthlyBorrows.totalUsdAmount.plus(amountUsd);

  monthlyBorrows.save();
}

export function updateHourlyRepays(event: Repay): void {
  const timestamp = event.block.timestamp.toI32();
  const id = createChangeHourlyId(timestamp);
  const roundedTimestamp = (timestamp / 3600) * 3600;
  const asset = getAsset(event.params.underlying.toHexString());
  const amountUsd = amountToUsd(event.params.amount, asset.twap, asset.twapPrice);

  let hourlyRepays = getHourlyRepay(id);

  hourlyRepays.timestamp = roundedTimestamp;
  hourlyRepays.count = hourlyRepays.count + 1;
  hourlyRepays.totalAmount = hourlyRepays.totalAmount.plus(event.params.amount);
  hourlyRepays.totalUsdAmount = hourlyRepays.totalUsdAmount.plus(amountUsd);

  hourlyRepays.save();
}

export function updateDailyRepays(event: Repay): void {
  const timestamp = event.block.timestamp.toI32();
  const id = createChangeDailyId(timestamp);
  const roundedTimestamp = (timestamp / 86400) * 86400;
  const asset = getAsset(event.params.underlying.toHexString());
  const amountUsd = amountToUsd(event.params.amount, asset.twap, asset.twapPrice);

  let dailyRepays = getDailyRepay(id);

  dailyRepays.timestamp = roundedTimestamp;
  dailyRepays.count = dailyRepays.count + 1;
  dailyRepays.totalAmount = dailyRepays.totalAmount.plus(event.params.amount);
  dailyRepays.totalUsdAmount = dailyRepays.totalUsdAmount.plus(amountUsd);

  dailyRepays.save();
}

export function updateMonthlyRepays(event: Repay): void {
  const timestamp = event.block.timestamp.toI32();
  const id = createChangeMonthlyId(timestamp);
  const asset = getAsset(event.params.underlying.toHexString());
  const amountUsd = amountToUsd(event.params.amount, asset.twap, asset.twapPrice);

  let monthlyRepays = getMonthlyRepay(id);

  monthlyRepays.timestamp = timestamp;
  monthlyRepays.count = monthlyRepays.count + 1;
  monthlyRepays.totalAmount = monthlyRepays.totalAmount.plus(event.params.amount);
  monthlyRepays.totalUsdAmount = monthlyRepays.totalUsdAmount.plus(amountUsd);

  monthlyRepays.save();
}

export function updateHourlyDeposits(event: Deposit): void {
  const timestamp = event.block.timestamp.toI32();
  const id = createChangeHourlyId(timestamp);
  const roundedTimestamp = (timestamp / 3600) * 3600;
  const asset = getAsset(event.params.underlying.toHexString());
  const amountUsd = amountToUsd(event.params.amount, asset.twap, asset.twapPrice);

  let hourlyDeposits = getHourlyDeposit(id);

  hourlyDeposits.timestamp = roundedTimestamp;
  hourlyDeposits.count = hourlyDeposits.count + 1;
  hourlyDeposits.totalAmount = hourlyDeposits.totalAmount.plus(event.params.amount);
  hourlyDeposits.totalUsdAmount = hourlyDeposits.totalUsdAmount.plus(amountUsd);

  hourlyDeposits.save();
}

export function updateDailyDeposits(event: Deposit): void {
  const timestamp = event.block.timestamp.toI32();
  const id = createChangeDailyId(timestamp);
  const roundedTimestamp = (timestamp / 86400) * 86400;
  const asset = getAsset(event.params.underlying.toHexString());
  const amountUsd = amountToUsd(event.params.amount, asset.twap, asset.twapPrice);

  let dailyDeposits = getDailyDeposit(id);

  dailyDeposits.timestamp = roundedTimestamp;
  dailyDeposits.count = dailyDeposits.count + 1;
  dailyDeposits.totalAmount = dailyDeposits.totalAmount.plus(event.params.amount);
  dailyDeposits.totalUsdAmount = dailyDeposits.totalUsdAmount.plus(amountUsd);

  dailyDeposits.save();
}

export function updateMonthlyDeposits(event: Deposit): void {
  const timestamp = event.block.timestamp.toI32();
  const id = createChangeDailyId(timestamp);
  const asset = getAsset(event.params.underlying.toHexString());
  const amountUsd = amountToUsd(event.params.amount, asset.twap, asset.twapPrice);

  let monthlyDeposits = getMonthlyDeposit(id);

  monthlyDeposits.timestamp = timestamp;
  monthlyDeposits.count = monthlyDeposits.count + 1;
  monthlyDeposits.totalAmount = monthlyDeposits.totalAmount.plus(event.params.amount);
  monthlyDeposits.totalUsdAmount = monthlyDeposits.totalUsdAmount.plus(amountUsd);

  monthlyDeposits.save();
}

export function updateHourlyWithdraws(event: Withdraw): void {
  const timestamp = event.block.timestamp.toI32();
  const id = createChangeHourlyId(timestamp);
  const roundedTimestamp = (timestamp / 3600) * 3600;
  const asset = getAsset(event.params.underlying.toHexString());
  const amountUsd = amountToUsd(event.params.amount, asset.twap, asset.twapPrice);

  let hourlyWithdraws = getHourlyWithdraw(id);

  hourlyWithdraws.timestamp = roundedTimestamp;
  hourlyWithdraws.count = hourlyWithdraws.count + 1;
  hourlyWithdraws.totalAmount = hourlyWithdraws.totalAmount.plus(event.params.amount);
  hourlyWithdraws.totalUsdAmount = hourlyWithdraws.totalUsdAmount.plus(amountUsd);

  hourlyWithdraws.save();
}

export function updateDailyWithdraws(event: Withdraw): void {
  const timestamp = event.block.timestamp.toI32();
  const id = createChangeDailyId(timestamp);
  const roundedTimestamp = (timestamp / 86400) * 86400;
  const asset = getAsset(event.params.underlying.toHexString());
  const amountUsd = amountToUsd(event.params.amount, asset.twap, asset.twapPrice);

  let dailyWithdraws = getDailyWithdraw(id);

  dailyWithdraws.timestamp = roundedTimestamp;
  dailyWithdraws.count = dailyWithdraws.count + 1;
  dailyWithdraws.totalAmount = dailyWithdraws.totalAmount.plus(event.params.amount);
  dailyWithdraws.totalUsdAmount = dailyWithdraws.totalUsdAmount.plus(amountUsd);

  dailyWithdraws.save();
}

export function updateMonthlyWithdraws(event: Withdraw): void {
  const timestamp = event.block.timestamp.toI32();
  const id = createChangeMonthlyId(timestamp);
  const asset = getAsset(event.params.underlying.toHexString());
  const amountUsd = amountToUsd(event.params.amount, asset.twap, asset.twapPrice);

  let monthlyWithdraws = getMonthlyWithdraw(id);

  monthlyWithdraws.timestamp = timestamp;
  monthlyWithdraws.count = monthlyWithdraws.count + 1;
  monthlyWithdraws.totalAmount = monthlyWithdraws.totalAmount.plus(event.params.amount);
  monthlyWithdraws.totalUsdAmount = monthlyWithdraws.totalUsdAmount.plus(amountUsd);

  monthlyWithdraws.save();
}
