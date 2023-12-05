import { Address, Bytes, BigInt, ethereum } from "@graphprotocol/graph-ts";

import { bigIntToBigDecimal } from "./utils";
import { TradeType, ZERO_ADDRESS } from "./constants";
import { NetworkConfigs } from "../../configurations/configure";

import { Token, Trade } from "../../generated/schema";

export function createTrade(
  token: Token,
  traderAddress: Address,
  subjectAddress: Address,
  shares: BigInt,
  sharePriceAmount: BigInt,
  subjectFeeAmount: BigInt,
  protocolFeeAmount: BigInt,
  tradeAmount: BigInt,
  isBuy: boolean,
  event: ethereum.Event
): Bytes {
  const sharePriceUSD = bigIntToBigDecimal(
    sharePriceAmount,
    token.decimals
  ).times(token.lastPriceUSD!);
  const protocolFeeUSD = bigIntToBigDecimal(
    protocolFeeAmount,
    token.decimals
  ).times(token.lastPriceUSD!);
  const subjectFeeUSD = bigIntToBigDecimal(
    subjectFeeAmount,
    token.decimals
  ).times(token.lastPriceUSD!);
  const tradeAmountUSD = bigIntToBigDecimal(tradeAmount, token.decimals).times(
    token.lastPriceUSD!
  );

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
  tradeEvent.sharePriceAmount = sharePriceAmount;
  tradeEvent.sharePriceUSD = sharePriceUSD;
  tradeEvent.protocolFeeAmount = protocolFeeAmount;
  tradeEvent.protocolFeeUSD = protocolFeeUSD;
  tradeEvent.subjectFeeAmount = subjectFeeAmount;
  tradeEvent.subjectFeeUSD = subjectFeeUSD;
  tradeEvent.amount = tradeAmount;
  tradeEvent.amountUSD = tradeAmountUSD;

  tradeEvent.blockNumber = event.block.number;
  tradeEvent.timestamp = event.block.timestamp;
  tradeEvent.save();

  return tradeEvent.id;
}
