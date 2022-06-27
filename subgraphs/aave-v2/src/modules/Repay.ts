import {
  getProtocolIdFromCtx,
  getOrCreateLendingProtocol,
  getOrCreateMarketDailySnapshot,
  getOrCreateMarketHourlySnapshot,
  getOrCreateFinancialsDailySnapshot,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "../common/initializers";
import * as constants from "../common/constants";
import { getOrCreateToken } from "../common/initializers";
import { Repay as RepayEntity, Market } from "../../generated/schema";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";

export function createRepayEntity(
  event: ethereum.Event,
  market: Market,
  reserve: string,
  amount: BigInt
): void {
  const protocolId = getProtocolIdFromCtx();
  const protocol = getOrCreateLendingProtocol(protocolId);
  const inputToken = getOrCreateToken(Address.fromString(reserve));

  const id: string = `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`;
  const repay = new RepayEntity(id);

  repay.to = event.transaction.from.toHexString();
  repay.from = market.id;
  repay.market = market.id;
  repay.hash = event.transaction.hash.toHexString();
  repay.logIndex = event.logIndex.toI32();
  repay.protocol = protocol.id;
  repay.asset = reserve;
  repay.amount = amount;

  const amountUSD = market.inputTokenPriceUSD.times(
    amount
      .toBigDecimal()
      .div(constants.BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal())
  );

  repay.amountUSD = amountUSD;
  repay.timestamp = event.block.timestamp;
  repay.blockNumber = event.block.number;

  market.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD.minus(amountUSD);
  market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.minus(amountUSD);

  protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.minus(amountUSD);
  protocol.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD.minus(
    amountUSD
  );

  protocol.save();
  market.save();
  repay.save();

  updateSnapshotsAfterRepay(event, market, amountUSD);
}

export function updateSnapshotsAfterRepay(
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

  dailyMarketSnapshot.dailyRepayUSD = dailyMarketSnapshot.dailyRepayUSD.plus(
    amountUSD
  );
  hourlyMarketSnapshot.hourlyRepayUSD = hourlyMarketSnapshot.hourlyRepayUSD.plus(
    amountUSD
  );

  financialDailySnapshot.dailyRepayUSD = financialDailySnapshot.dailyRepayUSD.plus(
    amountUSD
  );

  usageMetricsDailySnapshot.dailyRepayCount += 1
  usageMetricsHourlySnapshot.hourlyRepayCount += 1

  usageMetricsHourlySnapshot.save();
  usageMetricsDailySnapshot.save();
  financialDailySnapshot.save();
  hourlyMarketSnapshot.save();
  dailyMarketSnapshot.save();
}
