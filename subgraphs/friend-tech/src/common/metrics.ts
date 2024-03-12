import { BigInt } from "@graphprotocol/graph-ts";

import { BIGDECIMAL_ZERO, INT_ONE, INT_ZERO } from "./constants";
import { bigIntToBigDecimal } from "./utils";

import {
  Account,
  Connection,
  Pool,
  Protocol,
  Token,
} from "../../generated/schema";

export function updateTVL(
  token: Token,
  protocol: Protocol,
  pool: Pool,
  amount: BigInt,
  isBuy: boolean
): void {
  if (isBuy) {
    pool.inputTokenBalances = [pool.inputTokenBalances[0].plus(amount)];
  } else {
    pool.inputTokenBalances = [pool.inputTokenBalances[0].minus(amount)];
  }
  pool.inputTokenBalancesUSD = [
    bigIntToBigDecimal(pool.inputTokenBalances[0]).times(token.lastPriceUSD!),
  ];

  const oldPoolTVL = pool.totalValueLockedUSD;
  pool.totalValueLockedUSD = pool.inputTokenBalancesUSD[0];
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(
    pool.totalValueLockedUSD.minus(oldPoolTVL)
  );
}

export function updateRevenue(
  token: Token,
  protocol: Protocol,
  pool: Pool,
  subjectFeeAmount: BigInt,
  protocolFeeAmount: BigInt
): void {
  const subjectFeeUSD = bigIntToBigDecimal(subjectFeeAmount).times(
    token.lastPriceUSD!
  );
  const protocolFeeUSD = bigIntToBigDecimal(protocolFeeAmount).times(
    token.lastPriceUSD!
  );
  const totalFeeUSD = subjectFeeUSD.plus(protocolFeeUSD);

  pool.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD.plus(subjectFeeUSD);
  pool.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD.plus(protocolFeeUSD);
  pool.cumulativeTotalRevenueUSD =
    pool.cumulativeTotalRevenueUSD.plus(totalFeeUSD);

  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(subjectFeeUSD);
  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(protocolFeeUSD);
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(totalFeeUSD);
}

export function updateVolume(
  token: Token,
  protocol: Protocol,
  pool: Pool,
  account: Account,
  amount: BigInt,
  isBuy: boolean
): void {
  const amountUSD = bigIntToBigDecimal(amount).times(token.lastPriceUSD!);

  if (isBuy) {
    account.cumulativeBuyVolumeUSD =
      account.cumulativeBuyVolumeUSD.plus(amountUSD);

    pool.cumulativeBuyVolumeAmount =
      pool.cumulativeBuyVolumeAmount.plus(amount);
    pool.cumulativeBuyVolumeUSD = pool.cumulativeBuyVolumeUSD.plus(amountUSD);

    protocol.cumulativeBuyVolumeUSD =
      protocol.cumulativeBuyVolumeUSD.plus(amountUSD);
  } else {
    account.cumulativeSellVolumeUSD =
      account.cumulativeSellVolumeUSD.plus(amountUSD);

    pool.cumulativeSellVolumeAmount =
      pool.cumulativeSellVolumeAmount.plus(amount);
    pool.cumulativeSellVolumeUSD = pool.cumulativeSellVolumeUSD.plus(amountUSD);

    protocol.cumulativeSellVolumeUSD =
      protocol.cumulativeSellVolumeUSD.plus(amountUSD);
  }

  account.cumulativeTotalVolumeUSD = account.cumulativeBuyVolumeUSD.plus(
    account.cumulativeSellVolumeUSD
  );
  account.netVolumeUSD = account.cumulativeBuyVolumeUSD.minus(
    account.cumulativeSellVolumeUSD
  );

  pool.cumulativeTotalVolumeAmount = pool.cumulativeBuyVolumeAmount.plus(
    pool.cumulativeSellVolumeAmount
  );
  pool.cumulativeTotalVolumeUSD = pool.cumulativeBuyVolumeUSD.plus(
    pool.cumulativeSellVolumeUSD
  );
  pool.netVolumeAmount = pool.cumulativeBuyVolumeAmount.minus(
    pool.cumulativeSellVolumeAmount
  );
  pool.netVolumeUSD = pool.cumulativeBuyVolumeUSD.minus(
    pool.cumulativeSellVolumeUSD
  );

  protocol.cumulativeTotalVolumeUSD = protocol.cumulativeBuyVolumeUSD.plus(
    protocol.cumulativeSellVolumeUSD
  );
  protocol.netVolumeUSD = protocol.cumulativeBuyVolumeUSD.minus(
    protocol.cumulativeSellVolumeUSD
  );
}

export function updateShares(
  token: Token,
  pool: Pool,
  amount: BigInt,
  supply: BigInt
): void {
  const amountUSD = bigIntToBigDecimal(amount).times(token.lastPriceUSD!);

  pool.supply = supply;
  pool.sharePriceAmount = amount;
  pool.sharePriceUSD = amountUSD;
}

export function updateUsage(
  protocol: Protocol,
  pool: Pool,
  token: Token,
  account: Account,
  connection: Connection,
  shares: BigInt,
  amount: BigInt,
  isBuy: boolean
): void {
  const amountUSD = bigIntToBigDecimal(amount).times(token.lastPriceUSD!);

  if (
    account.cumulativeBuyCount == INT_ZERO &&
    account.cumulativeSellCount == INT_ZERO
  ) {
    protocol.cumulativeUniqueUsers += INT_ONE;
  }
  if (
    connection.cumulativeBuyVolumeUSD == BIGDECIMAL_ZERO &&
    connection.cumulativeSellVolumeUSD == BIGDECIMAL_ZERO
  ) {
    pool.cumulativeUniqueUsers += INT_ONE;
  }

  if (isBuy) {
    if (account.cumulativeBuyCount == INT_ZERO) {
      protocol.cumulativeUniqueBuyers += INT_ONE;
    }
    connection.shares = connection.shares.plus(shares);
    connection.cumulativeBuyVolumeUSD =
      connection.cumulativeBuyVolumeUSD.plus(amountUSD);
    connection.cumulativeBuyCount += INT_ONE;
    account.cumulativeBuyCount += INT_ONE;
    pool.cumulativeBuyCount += INT_ONE;
    protocol.cumulativeBuyCount += INT_ONE;
  } else {
    if (account.cumulativeSellCount == INT_ZERO) {
      protocol.cumulativeUniqueSellers += INT_ONE;
    }
    connection.shares = connection.shares.minus(shares);
    connection.cumulativeSellVolumeUSD =
      connection.cumulativeSellVolumeUSD.plus(amountUSD);
    connection.cumulativeSellCount += INT_ONE;
    account.cumulativeSellCount += INT_ONE;
    pool.cumulativeSellCount += INT_ONE;
    protocol.cumulativeSellCount += INT_ONE;
  }
  connection.cumulativeTotalVolumeUSD = connection.cumulativeBuyVolumeUSD.plus(
    connection.cumulativeSellVolumeUSD
  );
  connection.netVolumeUSD = connection.cumulativeBuyVolumeUSD.minus(
    connection.cumulativeSellVolumeUSD
  );
  connection.cumulativeTransactionCount += INT_ONE;
  account.cumulativeTransactionCount += INT_ONE;
  pool.cumulativeTransactionCount += INT_ONE;
  protocol.cumulativeTransactionCount += INT_ONE;
}
