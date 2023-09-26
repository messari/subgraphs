import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts";

import {
  getOrCreateProtocol,
  getOrCreateEthToken,
  getOrCreateAccount,
  getOrCreateTrader,
  getOrCreateSubject,
  getOrCreateTraderOfType,
  getOrCreateConnection,
} from "./getters";
import { BIGINT_TEN, ETH_DECIMALS, INT_ONE } from "./constants";
import { addToArrayAtIndex } from "./utils";

export function updateTVL(
  amountETH: BigInt,
  isBuy: boolean,
  event: ethereum.Event
): void {
  const protocol = getOrCreateProtocol();
  const eth = getOrCreateEthToken(event);

  const amountUSD = amountETH
    .toBigDecimal()
    .div(BIGINT_TEN.pow(ETH_DECIMALS as u8).toBigDecimal())
    .times(eth.lastPriceUSD!);

  if (isBuy) {
    protocol.totalValueLockedETH = protocol.totalValueLockedETH.plus(amountETH);
    protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(amountUSD);
  } else {
    protocol.totalValueLockedETH =
      protocol.totalValueLockedETH.minus(amountETH);
    protocol.totalValueLockedUSD =
      protocol.totalValueLockedUSD.minus(amountUSD);
  }

  protocol.save();
}

export function updateUsage(
  traderAddress: Address,
  subjectAddress: Address,
  isBuy: boolean,
  event: ethereum.Event
): void {
  const traderResponse = getOrCreateTrader(traderAddress, event);
  const subjectResponse = getOrCreateSubject(subjectAddress, event);

  const protocol = getOrCreateProtocol();
  const trader = traderResponse.trader;
  const subject = subjectResponse.subject;

  const isNewTrader = traderResponse.isNewTrader;
  const isNewAccountForTrader = getOrCreateAccount(traderAddress);
  const isNewTraderOfType = getOrCreateTraderOfType(traderAddress, isBuy);

  const isNewSubject = subjectResponse.isNewSubject;
  const isNewAccountForSubject = getOrCreateAccount(subjectAddress);

  if (isNewTrader) protocol.cumulativeUniqueTraders += INT_ONE;
  if (isNewAccountForTrader) protocol.cumulativeUniqueUsers += INT_ONE;
  if (isNewSubject) protocol.cumulativeUniqueSubjects += INT_ONE;
  if (isNewAccountForSubject) protocol.cumulativeUniqueUsers += INT_ONE;

  trader.cumulativeTradesCount += INT_ONE;
  subject.cumulativeTradesCount += INT_ONE;
  protocol.cumulativeTradesCount += INT_ONE;

  if (isBuy) {
    if (isNewTraderOfType) protocol.cumulativeUniqueBuyers += INT_ONE;

    trader.cumulativeBuyCount += INT_ONE;
    subject.cumulativeBuyCount += INT_ONE;
    protocol.cumulativeBuyCount += INT_ONE;
  } else {
    if (isNewTraderOfType) protocol.cumulativeUniqueSellers += INT_ONE;

    trader.cumulativeSellCount += INT_ONE;
    subject.cumulativeSellCount += INT_ONE;
    protocol.cumulativeSellCount += INT_ONE;
  }

  trader.save();
  subject.save();
  protocol.save();
}

export function updateRevenue(
  subjectAddress: Address,
  subjectFeeETH: BigInt,
  protocolFeeETH: BigInt,
  event: ethereum.Event
): void {
  const protocol = getOrCreateProtocol();
  const subject = getOrCreateSubject(subjectAddress, event).subject;

  const eth = getOrCreateEthToken(event);
  const subjectFeeUSD = subjectFeeETH
    .toBigDecimal()
    .div(BIGINT_TEN.pow(ETH_DECIMALS as u8).toBigDecimal())
    .times(eth.lastPriceUSD!);
  const protocolFeeUSD = protocolFeeETH
    .toBigDecimal()
    .div(BIGINT_TEN.pow(ETH_DECIMALS as u8).toBigDecimal())
    .times(eth.lastPriceUSD!);

  subject.cumulativeRevenueETH =
    subject.cumulativeRevenueETH.plus(subjectFeeETH);
  subject.cumulativeRevenueUSD =
    subject.cumulativeRevenueUSD.plus(subjectFeeUSD);

  protocol.cumulativeSupplySideRevenueETH =
    protocol.cumulativeSupplySideRevenueETH.plus(subjectFeeETH);
  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(subjectFeeUSD);
  protocol.cumulativeProtocolSideRevenueETH =
    protocol.cumulativeProtocolSideRevenueETH.plus(protocolFeeETH);
  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(protocolFeeUSD);
  protocol.cumulativeTotalRevenueETH = protocol.cumulativeTotalRevenueETH.plus(
    subjectFeeETH.plus(protocolFeeETH)
  );
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(
    subjectFeeUSD.plus(protocolFeeUSD)
  );

  subject.save();
  protocol.save();
}

export function updateVolume(
  traderAddress: Address,
  subjectAddress: Address,
  amountETH: BigInt,
  isBuy: boolean,
  event: ethereum.Event
): void {
  const protocol = getOrCreateProtocol();
  const trader = getOrCreateTrader(traderAddress, event).trader;
  const subject = getOrCreateSubject(subjectAddress, event).subject;

  const eth = getOrCreateEthToken(event);
  const amountUSD = amountETH
    .toBigDecimal()
    .div(BIGINT_TEN.pow(ETH_DECIMALS as u8).toBigDecimal())
    .times(eth.lastPriceUSD!);

  if (isBuy) {
    trader.cumulativeBuyVolumeETH =
      trader.cumulativeBuyVolumeETH.plus(amountETH);
    trader.cumulativeBuyVolumeUSD =
      trader.cumulativeBuyVolumeUSD.plus(amountUSD);

    subject.cumulativeBuyVolumeETH =
      subject.cumulativeBuyVolumeETH.plus(amountETH);
    subject.cumulativeBuyVolumeUSD =
      subject.cumulativeBuyVolumeUSD.plus(amountUSD);

    protocol.cumulativeBuyVolumeETH =
      protocol.cumulativeBuyVolumeETH.plus(amountETH);
    protocol.cumulativeBuyVolumeUSD =
      protocol.cumulativeBuyVolumeUSD.plus(amountUSD);
  } else {
    trader.cumulativeSellVolumeETH =
      trader.cumulativeSellVolumeETH.plus(amountETH);
    trader.cumulativeSellVolumeUSD =
      trader.cumulativeSellVolumeUSD.plus(amountUSD);

    subject.cumulativeSellVolumeETH =
      subject.cumulativeSellVolumeETH.plus(amountETH);
    subject.cumulativeSellVolumeUSD =
      subject.cumulativeSellVolumeUSD.plus(amountUSD);

    protocol.cumulativeSellVolumeETH =
      protocol.cumulativeSellVolumeETH.plus(amountETH);
    protocol.cumulativeSellVolumeUSD =
      protocol.cumulativeSellVolumeUSD.plus(amountUSD);
  }

  trader.cumulativeTotalVolumeETH = trader.cumulativeBuyVolumeETH.plus(
    trader.cumulativeSellVolumeETH
  );
  trader.cumulativeTotalVolumeUSD = trader.cumulativeBuyVolumeUSD.plus(
    trader.cumulativeSellVolumeUSD
  );
  trader.netVolumeETH = trader.cumulativeBuyVolumeETH.minus(
    trader.cumulativeSellVolumeETH
  );
  trader.netVolumeUSD = trader.cumulativeBuyVolumeUSD.minus(
    trader.cumulativeSellVolumeUSD
  );

  subject.cumulativeTotalVolumeETH = subject.cumulativeBuyVolumeETH.plus(
    subject.cumulativeSellVolumeETH
  );
  subject.cumulativeTotalVolumeUSD = subject.cumulativeBuyVolumeUSD.plus(
    subject.cumulativeSellVolumeUSD
  );
  subject.netVolumeETH = subject.cumulativeBuyVolumeETH.minus(
    subject.cumulativeSellVolumeETH
  );
  subject.netVolumeUSD = subject.cumulativeBuyVolumeUSD.minus(
    subject.cumulativeSellVolumeUSD
  );

  protocol.cumulativeTotalVolumeETH = protocol.cumulativeBuyVolumeETH.plus(
    protocol.cumulativeSellVolumeETH
  );
  protocol.cumulativeTotalVolumeUSD = protocol.cumulativeBuyVolumeUSD.plus(
    protocol.cumulativeSellVolumeUSD
  );
  protocol.netVolumeETH = protocol.cumulativeBuyVolumeETH.minus(
    protocol.cumulativeSellVolumeETH
  );
  protocol.netVolumeUSD = protocol.cumulativeBuyVolumeUSD.minus(
    protocol.cumulativeSellVolumeUSD
  );

  trader.save();
  subject.save();
  protocol.save();
}

export function updateConnections(
  traderAddress: Address,
  subjectAddress: Address,
  shares: BigInt,
  amountETH: BigInt,
  isBuy: boolean,
  event: ethereum.Event
): void {
  const trader = getOrCreateTrader(traderAddress, event).trader;
  const subject = getOrCreateSubject(subjectAddress, event).subject;
  const connection = getOrCreateConnection(
    traderAddress,
    subjectAddress,
    event
  );

  const eth = getOrCreateEthToken(event);
  const amountUSD = amountETH
    .toBigDecimal()
    .div(BIGINT_TEN.pow(ETH_DECIMALS as u8).toBigDecimal())
    .times(eth.lastPriceUSD!);

  if (isBuy) {
    connection.shares = connection.shares.plus(shares);
    connection.cumulativeBuyVolumeETH =
      connection.cumulativeBuyVolumeETH.plus(amountETH);
    connection.cumulativeBuyVolumeUSD =
      connection.cumulativeBuyVolumeUSD.plus(amountUSD);
    connection.cumulativeBuyCount += INT_ONE;
  } else {
    connection.shares = connection.shares.minus(shares);
    connection.cumulativeSellVolumeETH =
      connection.cumulativeSellVolumeETH.plus(amountETH);
    connection.cumulativeSellVolumeUSD =
      connection.cumulativeSellVolumeUSD.plus(amountUSD);
    connection.cumulativeSellCount += INT_ONE;
  }

  connection.cumulativeTotalVolumeETH = connection.cumulativeBuyVolumeETH.plus(
    connection.cumulativeSellVolumeETH
  );
  connection.cumulativeTotalVolumeUSD = connection.cumulativeBuyVolumeUSD.plus(
    connection.cumulativeSellVolumeUSD
  );
  connection.netVolumeETH = connection.cumulativeBuyVolumeETH.minus(
    connection.cumulativeSellVolumeETH
  );
  connection.netVolumeUSD = connection.cumulativeBuyVolumeUSD.minus(
    connection.cumulativeSellVolumeUSD
  );
  connection.cumulativeTradesCount += INT_ONE;

  if (!trader.connections.includes(connection.id)) {
    addToArrayAtIndex(trader.connections, connection.id);
  }
  if (!subject.connections.includes(connection.id)) {
    addToArrayAtIndex(subject.connections, connection.id);
  }

  trader.save();
  subject.save();
}

export function updateSubjectPrice(
  subjectAddress: Address,
  supply: BigInt,
  amountETH: BigInt,
  event: ethereum.Event
): void {
  const subject = getOrCreateSubject(subjectAddress, event).subject;

  const eth = getOrCreateEthToken(event);
  const amountUSD = amountETH
    .toBigDecimal()
    .div(BIGINT_TEN.pow(ETH_DECIMALS as u8).toBigDecimal())
    .times(eth.lastPriceUSD!);

  subject.sharePriceETH = amountETH;
  subject.sharePriceUSD = amountUSD;
  subject.supply = supply;

  subject.save();
}
