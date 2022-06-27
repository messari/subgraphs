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
import { Liquidate as LiquidateEntity, Market } from "../../generated/schema";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";

export function createLiquidateEntity(
  event: ethereum.Event,
  market: Market,
  user: string,
  debtAsset: string,
  collateralAsset: string,
  liquidator: string,
  amount: BigInt
): void {
  const protocolId = getProtocolIdFromCtx();
  const protocol = getOrCreateLendingProtocol(protocolId);
  const inputToken = getOrCreateToken(Address.fromString(collateralAsset));

  const id: string = `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`;
  const liquidate = new LiquidateEntity(id);

  liquidate.to = debtAsset;
  liquidate.market = market.id;
  liquidate.from = liquidator;
  liquidate.hash = event.transaction.hash.toHexString();
  liquidate.logIndex = event.logIndex.toI32();
  liquidate.protocol = protocol.id;
  liquidate.asset = collateralAsset;
  liquidate.amount = amount;
  liquidate.liquidatee = user;

  const amountUSD = market.inputTokenPriceUSD.times(
    amount
      .toBigDecimal()
      .div(constants.BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal())
  );
  liquidate.amountUSD = amountUSD;
  liquidate.profitUSD = amountUSD
    .times(market.liquidationPenalty)
    .div(BigDecimal.fromString("100"));
  
  liquidate.timestamp = event.block.timestamp;
  liquidate.blockNumber = event.block.number;

  market.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD.minus(amountUSD);
  market.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD.plus(
    amountUSD
  );

  protocol.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD.minus(
    amountUSD
  );
  protocol.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD.plus(
    amountUSD
  );

  protocol.save();
  liquidate.save();
  market.save();

  updateSnapshotsAfterLiquidate(event, market, amountUSD);
}

export function updateSnapshotsAfterLiquidate(
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


  dailyMarketSnapshot.dailyLiquidateUSD = dailyMarketSnapshot.dailyLiquidateUSD.plus(
    amountUSD
  );
  hourlyMarketSnapshot.hourlyLiquidateUSD = hourlyMarketSnapshot.hourlyLiquidateUSD.plus(
    amountUSD
  );

  financialDailySnapshot.dailyLiquidateUSD = financialDailySnapshot.dailyLiquidateUSD.plus(
    amountUSD
  );

  usageMetricsDailySnapshot.dailyLiquidateCount += 1
  usageMetricsHourlySnapshot.hourlyLiquidateCount += 1

  usageMetricsHourlySnapshot.save();
  usageMetricsDailySnapshot.save();
  financialDailySnapshot.save();
  hourlyMarketSnapshot.save();
  dailyMarketSnapshot.save();
}
