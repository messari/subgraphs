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
import { Withdraw as WithdrawEntity, Market } from "../../generated/schema";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";

export function createWithdrawEntity(
  event: ethereum.Event,
  market: Market,
  reserve: string,
  amount: BigInt
): void {
  const protocolId = getProtocolIdFromCtx();
  const protocol = getOrCreateLendingProtocol(protocolId);
  const inputToken = getOrCreateToken(Address.fromString(reserve));

  const id: string = `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`;
  const withdraw = new WithdrawEntity(id);

  withdraw.to = event.transaction.from.toHexString();
  withdraw.from = market.id;
  withdraw.market = market.id;
  withdraw.hash = event.transaction.hash.toHexString();
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.protocol = protocol.id;
  withdraw.asset = reserve;
  withdraw.amount = amount;

  const amountUSD = market.inputTokenPriceUSD.times(
    amount
      .toBigDecimal()
      .div(constants.BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal())
  );

  withdraw.amountUSD = amountUSD;
  withdraw.timestamp = event.block.timestamp;
  withdraw.blockNumber = event.block.number;

  market.inputTokenBalance = market.inputTokenBalance.minus(amount);

  protocol.save();
  withdraw.save();
  market.save();

  updateSnapshotsAfterWithdraw(event, market, amountUSD);
}

export function updateSnapshotsAfterWithdraw(
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


  dailyMarketSnapshot.dailyWithdrawUSD = dailyMarketSnapshot.dailyWithdrawUSD.plus(
    amountUSD
  );
  hourlyMarketSnapshot.hourlyWithdrawUSD = hourlyMarketSnapshot.hourlyWithdrawUSD.plus(
    amountUSD
  );

  financialDailySnapshot.dailyWithdrawUSD = financialDailySnapshot.dailyWithdrawUSD.plus(
    amountUSD
  );

  usageMetricsDailySnapshot.dailyWithdrawCount += 1
  usageMetricsHourlySnapshot.hourlyWithdrawCount += 1

  usageMetricsHourlySnapshot.save();
  usageMetricsDailySnapshot.save();
  financialDailySnapshot.save();
  hourlyMarketSnapshot.save();
  dailyMarketSnapshot.save();
}
