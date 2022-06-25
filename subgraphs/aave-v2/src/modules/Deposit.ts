import {
  getProtocolIdFromCtx,
  getOrCreateLendingProtocol,
  getOrCreateMarketDailySnapshot,
  getOrCreateMarketHourlySnapshot,
  getOrCreateFinancialsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
  getOrCreateUsageMetricsDailySnapshot,
} from "../common/initializers";
import * as constants from "../common/constants";
import { getOrCreateToken } from "../common/initializers";
import { Deposit as DepositEntity, Market } from "../../generated/schema";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";

export function createDepositEntity(
  event: ethereum.Event,
  market: Market,
  reserve: string,
  amount: BigInt
): void {
  const protocolId = getProtocolIdFromCtx();
  const protocol = getOrCreateLendingProtocol(protocolId);
  const inputToken = getOrCreateToken(Address.fromString(reserve));

  const id: string = `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`;
  const deposit = new DepositEntity(id);

  deposit.to = market.id;
  deposit.from = event.transaction.from.toHexString();
  deposit.market = market.id;
  deposit.hash = event.transaction.hash.toHexString();
  deposit.logIndex = event.logIndex.toI32();
  deposit.protocol = protocol.id;
  deposit.asset = reserve;
  deposit.amount = amount;

  const amountUSD = market.inputTokenPriceUSD.times(
    amount
      .toBigDecimal()
      .div(constants.BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal())
  );

  deposit.amountUSD = amountUSD;
  deposit.timestamp = event.block.timestamp;
  deposit.blockNumber = event.block.number;

  market.inputTokenBalance = market.inputTokenBalance.plus(amount);
  market.totalDepositBalanceUSD = market.totalDepositBalanceUSD.plus(amountUSD);
  market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(amountUSD);

  protocol.cumulativeDepositUSD = protocol.cumulativeDepositUSD.plus(amountUSD);
  protocol.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD.plus(
    amountUSD
  );

  protocol.save();
  deposit.save();
  market.save();

  updateSnapshotsAfterDeposit(event, market, amountUSD);
}

export function updateSnapshotsAfterDeposit(
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

  dailyMarketSnapshot.dailyDepositUSD = dailyMarketSnapshot.dailyDepositUSD.plus(
    amountUSD
  );
  hourlyMarketSnapshot.hourlyDepositUSD = hourlyMarketSnapshot.hourlyDepositUSD.plus(
    amountUSD
  );

  financialDailySnapshot.dailyDepositUSD = financialDailySnapshot.dailyDepositUSD.plus(
    amountUSD
  );

  usageMetricsDailySnapshot.dailyDepositCount += 1
  usageMetricsHourlySnapshot.hourlyDepositCount += 1

  usageMetricsHourlySnapshot.save();
  usageMetricsDailySnapshot.save();
  financialDailySnapshot.save();
  hourlyMarketSnapshot.save();
  dailyMarketSnapshot.save();
}
