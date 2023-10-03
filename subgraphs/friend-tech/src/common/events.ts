import { Address, Bytes, BigInt, ethereum } from "@graphprotocol/graph-ts";

import { getUsdPriceForEthAmount } from "./prices";
import { TradeType, ZERO_ADDRESS } from "./constants";
import { NetworkConfigs } from "../../configurations/configure";

import { Trade } from "../../generated/schema";

export function createEvent(
  traderAddress: Address,
  subjectAddress: Address,
  shares: BigInt,
  sharePriceETH: BigInt,
  subjectFeeETH: BigInt,
  protocolFeeETH: BigInt,
  tradeAmountETH: BigInt,
  isBuy: boolean,
  event: ethereum.Event
): void {
  const id = Bytes.empty()
    .concat(event.transaction.hash)
    .concatI32(event.logIndex.toI32());

  const tradeEvent = new Trade(id);
  tradeEvent.hash = event.transaction.hash;
  tradeEvent.logIndex = event.logIndex.toI32();
  tradeEvent.protocol = NetworkConfigs.getFactoryAddress();
  tradeEvent.to = event.transaction.to
    ? event.transaction.to!
    : Address.fromString(ZERO_ADDRESS);
  tradeEvent.from = event.transaction.from;

  tradeEvent.trader = traderAddress;
  tradeEvent.subject = subjectAddress;
  tradeEvent.type = isBuy ? TradeType.BUY : TradeType.SELL;
  tradeEvent.shares = shares;

  const sharePriceUSD = getUsdPriceForEthAmount(sharePriceETH, event);
  const protocolFeeUSD = getUsdPriceForEthAmount(protocolFeeETH, event);
  const subjectFeeUSD = getUsdPriceForEthAmount(subjectFeeETH, event);
  const tradeAmountUSD = getUsdPriceForEthAmount(tradeAmountETH, event);

  tradeEvent.sharePriceETH = sharePriceETH;
  tradeEvent.sharePriceUSD = sharePriceUSD;
  tradeEvent.protocolFeeETH = protocolFeeETH;
  tradeEvent.protocolFeeUSD = protocolFeeUSD;
  tradeEvent.subjectFeeETH = subjectFeeETH;
  tradeEvent.subjectFeeUSD = subjectFeeUSD;
  tradeEvent.amountETH = tradeAmountETH;
  tradeEvent.amountUSD = tradeAmountUSD;

  tradeEvent.blockNumber = event.block.number;
  tradeEvent.timestamp = event.block.timestamp;

  tradeEvent.save();
  return;
}
