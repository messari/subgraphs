import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts";

import {
  getOrCreateProtocol,
  getOrCreateAccount,
  getOrCreateTrader,
  getOrCreateSubject,
  getOrCreateConnection,
} from "./getters";
import { INT_ONE } from "./constants";
import { addToArrayAtIndex, getUsdPriceForEthAmount } from "./utils";

export function updateTVL(
  amountETH: BigInt,
  isBuy: boolean,
  event: ethereum.Event
): void {
  const protocol = getOrCreateProtocol();

  if (isBuy) {
    protocol.totalValueLockedETH = protocol.totalValueLockedETH.plus(amountETH);
  } else {
    protocol.totalValueLockedETH =
      protocol.totalValueLockedETH.minus(amountETH);
  }
  protocol.totalValueLockedUSD = getUsdPriceForEthAmount(
    protocol.totalValueLockedETH,
    event
  );

  protocol.save();
}

export function updateUsage(
  traderAddress: Address,
  subjectAddress: Address,
  isBuy: boolean,
  event: ethereum.Event
): void {
  const protocol = getOrCreateProtocol();
  const trader = getOrCreateTrader(traderAddress, event);
  const subject = getOrCreateSubject(subjectAddress, event);

  const subjectAccount = getOrCreateAccount(subjectAddress);
  if (subjectAccount.isNewAccount) {
    protocol.cumulativeUniqueUsers += INT_ONE;
  }
  if (!subjectAccount.account.isSubject) {
    protocol.cumulativeUniqueSubjects += INT_ONE;
    subjectAccount.account.isSubject = true;
  }
  subjectAccount.account.save();

  const traderAccount = getOrCreateAccount(traderAddress);
  if (traderAccount.isNewAccount) {
    protocol.cumulativeUniqueUsers += INT_ONE;
  }
  if (!traderAccount.account.isBuyer && !traderAccount.account.isSeller) {
    protocol.cumulativeUniqueTraders += INT_ONE;
  }
  if (isBuy) {
    if (!traderAccount.account.isBuyer) {
      protocol.cumulativeUniqueBuyers += INT_ONE;
      traderAccount.account.isBuyer = true;
    }
    trader.cumulativeBuyCount += INT_ONE;
    subject.cumulativeBuyCount += INT_ONE;
    protocol.cumulativeBuyCount += INT_ONE;
  } else {
    if (!traderAccount.account.isSeller) {
      protocol.cumulativeUniqueSellers += INT_ONE;
      traderAccount.account.isSeller = true;
    }
    trader.cumulativeSellCount += INT_ONE;
    subject.cumulativeSellCount += INT_ONE;
    protocol.cumulativeSellCount += INT_ONE;
  }
  traderAccount.account.save();

  trader.cumulativeTradesCount += INT_ONE;
  subject.cumulativeTradesCount += INT_ONE;
  protocol.cumulativeTradesCount += INT_ONE;

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
  const subject = getOrCreateSubject(subjectAddress, event);

  const subjectFeeUSD = getUsdPriceForEthAmount(subjectFeeETH, event);
  const protocolFeeUSD = getUsdPriceForEthAmount(protocolFeeETH, event);

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
  const trader = getOrCreateTrader(traderAddress, event);
  const subject = getOrCreateSubject(subjectAddress, event);
  const amountUSD = getUsdPriceForEthAmount(amountETH, event);

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
  const trader = getOrCreateTrader(traderAddress, event);
  const subject = getOrCreateSubject(subjectAddress, event);
  const connection = getOrCreateConnection(
    traderAddress,
    subjectAddress,
    event
  );
  const amountUSD = getUsdPriceForEthAmount(amountETH, event);

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
  connection.save();

  if (!trader.connections.includes(connection.id)) {
    trader.connections = addToArrayAtIndex(trader.connections, connection.id);
  }
  trader.save();

  if (!subject.connections.includes(connection.id)) {
    subject.connections = addToArrayAtIndex(subject.connections, connection.id);
  }
  subject.save();
}

export function updateSubjectPrice(
  subjectAddress: Address,
  supply: BigInt,
  amountETH: BigInt,
  event: ethereum.Event
): void {
  const subject = getOrCreateSubject(subjectAddress, event);
  const amountUSD = getUsdPriceForEthAmount(amountETH, event);

  subject.sharePriceETH = amountETH;
  subject.sharePriceUSD = amountUSD;
  subject.supply = supply;

  subject.save();
}
