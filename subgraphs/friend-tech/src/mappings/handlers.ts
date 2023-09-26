import {
  updateConnections,
  updateRevenue,
  updateSubjectPrice,
  updateTVL,
  updateUsage,
  updateVolume,
} from "../common/metrics";
import {
  updateConnectionDailySnapshot,
  updateFinancialsDailySnapshot,
  updateSubjectDailySnapshot,
  updateTraderDailySnapshot,
  updateUsageMetricsDailySnapshot,
} from "../common/snapshots";
import { createEvent } from "../common/events";

import { Trade } from "../../generated/Shares/Shares";

export function handleTrade(event: Trade): void {
  const trader = event.params.trader;
  const subject = event.params.subject;
  const isBuy = event.params.isBuy;
  const shares = event.params.shareAmount;
  const supply = event.params.supply;
  const tradeAmountETH = event.params.ethAmount;
  const subjectFeeETH = event.params.subjectEthAmount;
  const protocolFeeETH = event.params.protocolEthAmount;
  const sharePriceETH = event.params.ethAmount.minus(
    event.params.subjectEthAmount.plus(event.params.protocolEthAmount)
  );

  updateTVL(sharePriceETH, isBuy, event);
  updateUsage(trader, subject, isBuy, event);
  updateRevenue(subject, subjectFeeETH, protocolFeeETH, event);
  updateVolume(trader, subject, sharePriceETH, isBuy, event);

  updateConnections(trader, subject, shares, sharePriceETH, isBuy, event);
  updateSubjectPrice(subject, supply, tradeAmountETH, event);

  updateUsageMetricsDailySnapshot(trader, subject, isBuy, event);
  updateFinancialsDailySnapshot(
    sharePriceETH,
    subjectFeeETH,
    protocolFeeETH,
    isBuy,
    event
  );
  updateTraderDailySnapshot(trader, sharePriceETH, isBuy, event);
  updateSubjectDailySnapshot(
    subject,
    supply,
    sharePriceETH,
    subjectFeeETH,
    isBuy,
    event
  );
  updateConnectionDailySnapshot(trader, subject, sharePriceETH, isBuy, event);

  createEvent(
    trader,
    subject,
    shares,
    sharePriceETH,
    subjectFeeETH,
    protocolFeeETH,
    tradeAmountETH,
    isBuy,
    event
  );

  return;
}
