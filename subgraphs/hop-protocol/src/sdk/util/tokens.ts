/* eslint-disable prefer-const */
import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { Pool } from "../protocols/bridge/pool";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  BIGINT_TEN_TO_EIGHTEENTH,
} from "./constants";
import { BIGINT_TEN_TO_SIX, SIX_DECIMAL_TOKENS } from "./constants";
import { L2_Amm } from "../../../generated/HopL2Amm/L2_Amm";

export const INVALID_TOKEN_DECIMALS = 0;
export const UNKNOWN_TOKEN_VALUE = "unknown";

export function updateAMMTVE(
  ammAddress: Address,
  token: Address,
  hPool: Pool,
  pool: Pool
): void {
  const Amm = L2_Amm.bind(ammAddress);
  const inputBalanceCallA = Amm.try_getTokenBalance(BigInt.zero().toI32());
  const inputBalanceCallB = Amm.try_getTokenBalance(BIGINT_ONE.toI32());

  if (!inputBalanceCallA.reverted && !inputBalanceCallB.reverted) {
    pool.setInputTokenBalance(inputBalanceCallA.value);

    hPool.setInputTokenBalance(inputBalanceCallB.value);
    hPool.setNetValueExportedUSD(BIGDECIMAL_ZERO);

    if (SIX_DECIMAL_TOKENS.includes(token.toHexString())) {
      let poolTVE = inputBalanceCallA.value
        .plus(inputBalanceCallB.value)
        .minus(pool.pool._inputTokenLiquidityBalance!);
      pool.setNetValueExportedUSD(
        poolTVE.div(BIGINT_TEN_TO_SIX).toBigDecimal()
      );
      log.info("TVE1: {}, TVE2: {}, iTB-A: {}, iTB-B: {}, iTLB: {}", [
        poolTVE.toString(),
        poolTVE.div(BIGINT_TEN_TO_SIX).toBigDecimal().toString(),
        inputBalanceCallA.value.toString(),
        inputBalanceCallB.value.toString(),
        pool.pool._inputTokenLiquidityBalance!.toString(),
      ]);
    } else {
      let poolTVE = inputBalanceCallA.value
        .plus(inputBalanceCallB.value)
        .minus(pool.pool._inputTokenLiquidityBalance!);
      pool.setNetValueExportedUSD(
        poolTVE.div(BIGINT_TEN_TO_EIGHTEENTH).toBigDecimal()
      );
      log.info("TVE1: {}, TVE2: {}, iTB-A: {}, iTB-B: {}, iTLB: {}", [
        poolTVE.toString(),
        poolTVE.div(BIGINT_TEN_TO_EIGHTEENTH).toBigDecimal().toString(),
        inputBalanceCallA.value.toString(),
        inputBalanceCallB.value.toString(),
        pool.pool._inputTokenLiquidityBalance!.toString(),
      ]);
    }
  } else {
    log.info("InputBalanceCall Reverted", []);
  }
}
