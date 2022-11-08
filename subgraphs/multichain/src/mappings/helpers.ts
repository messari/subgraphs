import { Address, log } from "@graphprotocol/graph-ts";

import { getOrCreatePool, getOrCreateToken } from "../common/getters";

import { LogAnySwapIn, LogAnySwapOut } from "../../generated/RouterV6/Router";
import { addToArrayAtIndex, updateArrayAtIndex } from "../common/utils/arrays";
import { bigIntToBigDecimal, exponentToBigInt } from "../common/utils/numbers";
import { BIGINT_ZERO } from "../common/constants";

export function createSwapOut(poolAddress: string, event: LogAnySwapOut): void {
  // log.warning("[SwapOut] {} {} {} {} {} {}", [
  //   event.params.token.toHexString(),
  //   event.params.from.toHexString(),
  //   event.params.to.toHexString(),
  //   event.params.amount.toString(),
  //   event.params.fromChainID.toString(),
  //   event.params.toChainID.toString(),
  // ]);

  let pool = getOrCreatePool(poolAddress, event);
  // let inputToken = getOrCreateToken(event.params.token, event.block.number);

  // let idx = pool.inputTokens.indexOf(inputToken.id);
  // if (idx == -1) {
  //   pool.inputTokens = addToArrayAtIndex(pool.inputTokens, inputToken.id);
  //   pool.inputTokenBalances = addToArrayAtIndex(
  //     pool.inputTokenBalances,
  //     BIGINT_ZERO
  //   );
  //   idx = pool.inputTokens.length - 1;
  // }
  // pool.inputTokenBalances = updateArrayAtIndex(
  //   pool.inputTokenBalances,
  //   pool.inputTokenBalances[idx].plus(
  //     event.params.amount.div(exponentToBigInt(inputToken.decimals))
  //   ),
  //   idx
  // );
  // pool.totalValueLockedUSD = pool.totalValueLockedUSD.plus(
  //   bigIntToBigDecimal(event.params.amount, inputToken.decimals).times(
  //     inputToken.lastPriceUSD!
  //   )
  // );

  let inputToken = getOrCreateToken(
    Address.fromString(pool.inputTokens[0]),
    event.block.number
  );

  pool.inputTokenBalances = [
    pool.inputTokenBalances[0].plus(event.params.amount),
  ];
  pool.totalValueLockedUSD = bigIntToBigDecimal(
    pool.inputTokenBalances[0],
    inputToken.decimals
  ).times(inputToken.lastPriceUSD!);

  pool.save();
}

export function createSwapIn(poolAddress: string, event: LogAnySwapIn): void {
  // log.warning("[SwapIn] {} {} {} {} {} {}", [
  //   event.params.txhash.toHexString(),
  //   event.params.token.toHexString(),
  //   event.params.to.toHexString(),
  //   event.params.amount.toString(),
  //   event.params.fromChainID.toString(),
  //   event.params.toChainID.toString(),
  // ]);

  let pool = getOrCreatePool(poolAddress, event);
  // let inputToken = getOrCreateToken(event.params.token, event.block.number);

  // let idx = pool.inputTokens.indexOf(inputToken.id);
  // if (idx == -1) {
  //   pool.inputTokens = addToArrayAtIndex(pool.inputTokens, inputToken.id);
  //   pool.inputTokenBalances = addToArrayAtIndex(
  //     pool.inputTokenBalances,
  //     BIGINT_ZERO
  //   );
  //   idx = pool.inputTokens.length - 1;
  // }
  // pool.inputTokenBalances = updateArrayAtIndex(
  //   pool.inputTokenBalances,
  //   pool.inputTokenBalances[idx].minus(
  //     event.params.amount.div(exponentToBigInt(inputToken.decimals))
  //   ),
  //   idx
  // );
  // pool.totalValueLockedUSD = pool.totalValueLockedUSD.minus(
  //   bigIntToBigDecimal(event.params.amount, inputToken.decimals).times(
  //     inputToken.lastPriceUSD!
  //   )
  // );

  let inputToken = getOrCreateToken(
    Address.fromString(pool.inputTokens[0]),
    event.block.number
  );

  pool.inputTokenBalances = [
    pool.inputTokenBalances[0].minus(event.params.amount),
  ];
  pool.totalValueLockedUSD = bigIntToBigDecimal(
    pool.inputTokenBalances[0],
    inputToken.decimals
  ).times(inputToken.lastPriceUSD!);

  pool.save();
}
