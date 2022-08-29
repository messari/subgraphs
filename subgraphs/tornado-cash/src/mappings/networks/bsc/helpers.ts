import { Address, dataSource } from "@graphprotocol/graph-ts";

import { getOrCreatePool, getOrCreateToken } from "../../../common/getters";
import { bigIntToBigDecimal } from "../../../common/utils/numbers";
import { BIGDECIMAL_ZERO, TORN_ADDRESS } from "../../../common/constants";
import { updateRevenue } from "../../../common/metrics";

import {
  Deposit,
  Withdrawal,
} from "../../../../generated/TornadoCash01/TornadoCashETH";

export function createDeposit(poolAddress: string, event: Deposit): void {
  let pool = getOrCreatePool(poolAddress, event);
  let inputToken = getOrCreateToken(
    Address.fromString(pool.inputTokens[0]),
    event.block.number
  );

  pool.inputTokenBalances = [
    pool.inputTokenBalances[0].plus(pool._denomination),
  ];
  pool.totalValueLockedUSD = bigIntToBigDecimal(
    pool.inputTokenBalances[0],
    inputToken.decimals
  ).times(inputToken.lastPriceUSD!);
  pool.save();
}

export function createWithdrawal(poolAddress: string, event: Withdrawal): void {
  let pool = getOrCreatePool(poolAddress, event);
  let inputToken = getOrCreateToken(
    Address.fromString(pool.inputTokens[0]),
    event.block.number
  );

  pool.inputTokenBalances = [
    pool.inputTokenBalances[0].minus(pool._denomination),
  ];
  pool.totalValueLockedUSD = bigIntToBigDecimal(
    pool.inputTokenBalances[0],
    inputToken.decimals
  ).times(inputToken.lastPriceUSD!);
  pool.save();

  let relayerFeeUsd = bigIntToBigDecimal(
    event.params.fee,
    inputToken.decimals
  ).times(inputToken.lastPriceUSD!);

  if (relayerFeeUsd != BIGDECIMAL_ZERO) {
    let network = dataSource.network().toUpperCase();
    let protocolFeeToken = getOrCreateToken(
      TORN_ADDRESS.get(network)!,
      event.block.number
    );

    let protocolFeeUsd = bigIntToBigDecimal(
      pool._fee,
      protocolFeeToken.decimals
    ).times(protocolFeeToken.lastPriceUSD!);

    updateRevenue(event, poolAddress, relayerFeeUsd, protocolFeeUsd);
  }
}
