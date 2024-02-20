import {
  getOrCreateAccount,
  getOrCreateConnection,
  getOrCreatePool,
  getOrCreateProtocol,
  getOrCreateToken,
} from "../common/getters";
import {
  updateRevenue,
  updateShares,
  updateTVL,
  updateUsage,
  updateVolume,
} from "../common/metrics";
import { takePoolSnapshots, takeProtocolSnapshots } from "../common/snapshots";
import { createTrade } from "../common/events";

import { Trade } from "../../generated/Shares/Shares";

export function handleTrade(event: Trade): void {
  const traderAddress = event.params.trader;
  const subjectAddress = event.params.subject;
  const isBuy = event.params.isBuy;
  const shares = event.params.shareAmount;
  const supply = event.params.supply;
  const sharePriceAmount = event.params.ethAmount;
  const subjectFeeAmount = event.params.subjectEthAmount;
  const protocolFeeAmount = event.params.protocolEthAmount;
  const tradeAmount = event.params.ethAmount.plus(
    event.params.subjectEthAmount.plus(event.params.protocolEthAmount)
  );

  const token = getOrCreateToken(event);
  const protocol = getOrCreateProtocol();
  const pool = getOrCreatePool(protocol, subjectAddress, event);
  const account = getOrCreateAccount(traderAddress, event);
  const connection = getOrCreateConnection(
    traderAddress,
    subjectAddress,
    event
  );

  createTrade(
    token,
    traderAddress,
    subjectAddress,
    shares,
    sharePriceAmount,
    subjectFeeAmount,
    protocolFeeAmount,
    tradeAmount,
    isBuy,
    event
  );

  updateTVL(token, protocol, pool, sharePriceAmount, isBuy);
  updateRevenue(token, protocol, pool, subjectFeeAmount, protocolFeeAmount);
  updateVolume(token, protocol, pool, account, sharePriceAmount, isBuy);
  updateShares(token, pool, sharePriceAmount, supply);
  updateUsage(
    protocol,
    pool,
    token,
    account,
    connection,
    shares,
    sharePriceAmount,
    isBuy
  );

  takeProtocolSnapshots(protocol, event);
  takePoolSnapshots(pool, event);

  connection.save();
  account.save();
  pool.save();
  protocol.save();

  return;
}
