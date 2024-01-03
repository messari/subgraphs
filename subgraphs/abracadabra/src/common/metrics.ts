import {
  BigDecimal,
  BigInt,
  Address,
  ethereum,
  dataSource,
  log,
} from "@graphprotocol/graph-ts";
import { ActiveAccount, Market } from "../../generated/schema";
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
  ActivityInterval,
} from "./constants";
import {
  getOrCreateLendingProtocol,
  getMarket,
  getOrCreateToken,
  getMIMAddress,
  getDegenBoxAddress,
  getOrCreateActivityHelper,
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

  protocol.save();
}

export function updateUsageMetrics(
  event: ethereum.Event,
  from: Address,
  to: Address
): void {
  // Number of days since Unix epoch
  const protocol = getOrCreateLendingProtocol();

  const hourlyId: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  const hourlyActivity = getOrCreateActivityHelper(
    ActivityInterval.HOURLY.concat("-").concat(hourlyId.toString())
  );
  const dailyId: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  const dailyActivity = getOrCreateActivityHelper(
    ActivityInterval.DAILY.concat("-").concat(dailyId.toString())
  );

  hourlyActivity.transactionCount += 1;
  dailyActivity.transactionCount += 1;

  getOrCreateAccount(from.toHexString(), protocol);
  getOrCreateAccount(to.toHexString(), protocol);

  // Combine the id and the user address to generate a unique user id for the hour/day
  const hourlyActiveAccountIdFrom =
    "hourly-" + from.toHexString() + "-" + hourlyId.toString();
  let hourlyActiveAccountFrom = ActiveAccount.load(hourlyActiveAccountIdFrom);
  if (!hourlyActiveAccountFrom) {
    hourlyActiveAccountFrom = new ActiveAccount(hourlyActiveAccountIdFrom);
    hourlyActiveAccountFrom.save();
    hourlyActivity.activeUsers += 1;
  }

  const hourlyActiveAccountIdTo =
    "hourly-" + to.toHexString() + "-" + hourlyId.toString();
  let hourlyActiveAccountTo = ActiveAccount.load(hourlyActiveAccountIdTo);
  if (!hourlyActiveAccountTo) {
    hourlyActiveAccountTo = new ActiveAccount(hourlyActiveAccountIdTo);
    hourlyActiveAccountTo.save();
    hourlyActivity.activeUsers += 1;
  }

  const dailyActiveAccountIdFrom =
    "daily-" + from.toHexString() + "-" + dailyId.toString();
  let dailyActiveAccountFrom = ActiveAccount.load(dailyActiveAccountIdFrom);
  if (!dailyActiveAccountFrom) {
    dailyActiveAccountFrom = new ActiveAccount(dailyActiveAccountIdFrom);
    dailyActiveAccountFrom.save();
    dailyActivity.activeUsers += 1;
  }

  const dailyActiveAccountIdTo =
    "daily-" + to.toHexString() + "-" + dailyId.toString();
  let dailyActiveAccountTo = ActiveAccount.load(dailyActiveAccountIdTo);
  if (!dailyActiveAccountTo) {
    dailyActiveAccountTo = new ActiveAccount(dailyActiveAccountIdTo);
    dailyActiveAccountTo.save();
    dailyActivity.activeUsers += 1;
  }
  hourlyActivity.save();
  dailyActivity.save();
}

export function updateTVL(): void {
  // new user count handled in updateUsageMetrics
  // totalBorrowUSD handled updateTotalBorrowUSD
  const protocol = getOrCreateLendingProtocol();
  const bentoBoxContract = DegenBox.bind(Address.fromString(protocol.id));
  const degenBoxContract = DegenBox.bind(
    Address.fromString(getDegenBoxAddress(dataSource.network()))
  );
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
  protocol.totalValueLockedUSD = protocolTotalValueLockedUSD;
  protocol.totalDepositBalanceUSD = protocolTotalValueLockedUSD;

  protocol.save();
}

export function updateTotalBorrows(): void {
  // new user count handled in updateUsageMetrics
  const protocol = getOrCreateLendingProtocol();
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
  protocol.mintedTokenSupplies = [protocolMintedTokenSupply];
  protocol.totalBorrowBalanceUSD = totalBorrowBalanceUSD;
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
  const hourlyId: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  const hourlyActivity = getOrCreateActivityHelper(
    ActivityInterval.HOURLY.concat("-").concat(hourlyId.toString())
  );
  const dailyId: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  const dailyActivity = getOrCreateActivityHelper(
    ActivityInterval.DAILY.concat("-").concat(dailyId.toString())
  );

  const protocol = getOrCreateLendingProtocol();
  const priceUSD = token.lastPriceUSD;
  const amountUSD = bigIntToBigDecimal(amount, token.decimals).times(priceUSD!);

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
    hourlyActivity.depositCount += 1;
    dailyActivity.depositCount += 1;
    market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(amountUSD);
    protocol.cumulativeDepositUSD =
      protocol.cumulativeDepositUSD.plus(amountUSD);
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
    hourlyActivity.withdrawCount += 1;
    dailyActivity.withdrawCount += 1;
    market.cumulativeWithdrawUSD = market.cumulativeWithdrawUSD.plus(amountUSD);
    protocol.cumulativeWithdrawUSD =
      protocol.cumulativeWithdrawUSD.plus(amountUSD);
  } else if (eventType == EventType.BORROW) {
    hourlyActivity.borrowCount += 1;
    dailyActivity.borrowCount += 1;
    market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(amountUSD);
    protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(amountUSD);
  } else if (eventType == EventType.REPAY) {
    hourlyActivity.repayCount += 1;
    dailyActivity.repayCount += 1;
    market.cumulativeRepayUSD = market.cumulativeRepayUSD.plus(amountUSD);
    protocol.cumulativeRepayUSD = protocol.cumulativeRepayUSD.plus(amountUSD);
  }
  market.inputTokenPriceUSD = getOrCreateToken(
    Address.fromString(market.inputToken)
  ).lastPriceUSD!;
  market.save();
  hourlyActivity.save();
  dailyActivity.save();
  protocol.save();
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
