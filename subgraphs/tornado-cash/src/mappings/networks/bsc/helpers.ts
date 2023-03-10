import { Address } from "@graphprotocol/graph-ts";

import { getOrCreatePool, getOrCreateToken } from "../../../common/getters";
import { bigIntToBigDecimal } from "../../../common/utils/numbers";
import { BIGDECIMAL_ZERO } from "../../../common/constants";
import { updateRevenue } from "../../../common/metrics";

import {
  Deposit,
  Withdrawal,
} from "../../../../generated/TornadoCash01/TornadoCashETH";

export function createDeposit(poolAddress: string, event: Deposit): void {
  const pool = getOrCreatePool(poolAddress, event);
  const inputToken = getOrCreateToken(
    Address.fromString(pool.inputTokens[0]),
    event.block.number
  );

  pool.inputTokenBalances = [
    pool.inputTokenBalances[0].plus(pool._denomination),
  ];

  const inputTokenBalanceUSD = bigIntToBigDecimal(
    pool.inputTokenBalances[0],
    inputToken.decimals
  ).times(inputToken.lastPriceUSD!);
  pool.inputTokenBalancesUSD = [inputTokenBalanceUSD];
  pool.totalValueLockedUSD = inputTokenBalanceUSD;
  pool.save();
}

export function createWithdrawal(poolAddress: string, event: Withdrawal): void {
  const pool = getOrCreatePool(poolAddress, event);
  const inputToken = getOrCreateToken(
    Address.fromString(pool.inputTokens[0]),
    event.block.number
  );

  pool.inputTokenBalances = [
    pool.inputTokenBalances[0].minus(pool._denomination),
  ];

  const inputTOkenBalanceUSD = bigIntToBigDecimal(
    pool.inputTokenBalances[0],
    inputToken.decimals
  ).times(inputToken.lastPriceUSD!);
  pool.inputTokenBalancesUSD = [inputTOkenBalanceUSD];
  pool.totalValueLockedUSD = inputTOkenBalanceUSD;
  pool.save();

  const relayerFeeUsd = bigIntToBigDecimal(
    event.params.fee,
    inputToken.decimals
  ).times(inputToken.lastPriceUSD!);

  if (relayerFeeUsd != BIGDECIMAL_ZERO) {
    const protocolFeeUsd = BIGDECIMAL_ZERO;

    updateRevenue(event, poolAddress, relayerFeeUsd, protocolFeeUsd);
  }
}
