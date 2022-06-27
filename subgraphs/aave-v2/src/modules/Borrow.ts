import {
  Market,
  Borrow as BorrowEntity,
} from "../../generated/schema";
import {
  getOrCreateToken,
  getProtocolIdFromCtx,
  getOrCreateLendingProtocol,
  getOrCreateMarketDailySnapshot,
  getOrCreateMarketHourlySnapshot,
  getOrCreateFinancialsDailySnapshot,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "../common/initializers";
import * as constants from "../common/constants";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";

export function createBorrowEntity(
  event: ethereum.Event,
  market: Market,
  reserve: string,
  amount: BigInt
): void {
  const protocolId = getProtocolIdFromCtx();
  const protocol = getOrCreateLendingProtocol(protocolId);
  const inputToken = getOrCreateToken(Address.fromString(reserve));

  const id: string = `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`;
  const borrow = new BorrowEntity(id);

  borrow.to = market.id;
  borrow.from = event.transaction.from.toHexString();
  borrow.market = market.id;
  borrow.hash = event.transaction.hash.toHexString();
  borrow.logIndex = event.logIndex.toI32();
  borrow.protocol = protocol.id;
  borrow.asset = reserve;
  borrow.amount = amount;

  const amountUSD = market.inputTokenPriceUSD.times(
    amount
      .toBigDecimal()
      .div(constants.BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal())
  );

  borrow.amountUSD = amountUSD;
  borrow.timestamp = event.block.timestamp;
  borrow.blockNumber = event.block.number;

  market.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD.plus(amountUSD);
  market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(amountUSD);

  protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(amountUSD);
  protocol.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD.plus(
    amountUSD
  );

  protocol.save();
  borrow.save();
  market.save();

  updateSnapshotsAfterBorrow(event, market, amountUSD);
}

export function updateSnapshotsAfterBorrow(
  event: ethereum.Event,
  market: Market,
  amountUSD: BigDecimal
): void {
  const dailyMarketSnapshot = getOrCreateMarketDailySnapshot(event, market);
  const hourlyMarketSnapshot = getOrCreateMarketHourlySnapshot(event, market);
  const financialDailySnapshot = getOrCreateFinancialsDailySnapshot(
    event.block
  );
  const usageMetricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(event.block);
  const usageMetricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(event.block); 

  dailyMarketSnapshot.dailyBorrowUSD = dailyMarketSnapshot.dailyBorrowUSD.plus(
    amountUSD
  );
  hourlyMarketSnapshot.hourlyBorrowUSD = hourlyMarketSnapshot.hourlyBorrowUSD.plus(
    amountUSD
  );

  financialDailySnapshot.dailyBorrowUSD = financialDailySnapshot.dailyBorrowUSD.plus(
    amountUSD
  );

  usageMetricsDailySnapshot.dailyBorrowCount += 1
  usageMetricsHourlySnapshot.hourlyBorrowCount += 1

  usageMetricsHourlySnapshot.save();
  usageMetricsDailySnapshot.save();
  financialDailySnapshot.save();
  hourlyMarketSnapshot.save();
  dailyMarketSnapshot.save();
}
