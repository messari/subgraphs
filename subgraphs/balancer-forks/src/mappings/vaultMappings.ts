import {
  PoolRegistered,
  TokensRegistered,
  Swap as SwapEvent,
  PoolBalanceChanged,
} from "../../generated/Vault/Vault";
import {
  updateFinancials,
  updateUsageMetrics,
  updatePoolSnapshots,
} from "../modules/Metrics";
import {
  getOrCreateToken,
  getOrCreateLiquidityPool,
} from "../common/initializers";
import { Swap } from "../modules/Swap";
import * as utils from "../common/utils";
import { Deposit } from "../modules/Deposit";
import { Withdraw } from "../modules/Withdraw";
import * as constants from "../common/constants";
import { Address, BigInt, log } from "@graphprotocol/graph-ts";

export function handlePoolRegistered(event: PoolRegistered): void {
  const poolId = event.params.poolId;
  const poolAddress = event.params.poolAddress;
  const specialization = event.params.specialization;

  const pool = getOrCreateLiquidityPool(poolAddress, event.block);

  log.warning("[PoolRegistered] Pool: {}, poolId: {}, specialization: {}", [
    pool.id,
    poolId.toHexString(),
    specialization.toString(),
  ]);
}

export function handleTokensRegistered(event: TokensRegistered): void {
  const poolId = event.params.poolId;
  const poolAddress = Address.fromString(poolId.toHexString().substring(0, 42));
  const pool = getOrCreateLiquidityPool(poolAddress, event.block);

  const tokens = event.params.tokens;

  const inputTokens: string[] = [];
  const inputTokenLength = tokens.length;
  for (let idx = 0; idx < inputTokenLength; idx++) {
    // Exception: StablePoolFactory added poolAddress in event params token
    if (tokens.at(idx).equals(poolAddress)) continue;

    inputTokens.push(getOrCreateToken(tokens.at(idx), event.block.number).id);
  }

  pool.inputTokens = inputTokens;
  pool.inputTokenBalances = new Array<BigInt>(inputTokens.length).fill(
    constants.BIGINT_ZERO
  );
  pool.inputTokenWeights = utils.getPoolTokenWeights(
    poolAddress,
    pool.inputTokens
  );
  pool.save();
}

export function handlePoolBalanceChanged(event: PoolBalanceChanged): void {
  const poolId = event.params.poolId;
  const poolAddress = Address.fromString(poolId.toHexString().substring(0, 42));

  const deltas = event.params.deltas;
  if (deltas.length === 0) return;

  const inputTokens = event.params.tokens;
  const fees = event.params.protocolFeeAmounts;
  const provider = event.params.liquidityProvider;

  const total: BigInt = deltas.reduce<BigInt>(
    (sum, amount) => sum.plus(amount),
    new BigInt(0)
  );

  if (total.gt(constants.BIGINT_ZERO)) {
    Deposit(
      poolAddress,
      inputTokens,
      deltas,
      fees,
      provider,
      event.transaction,
      event.block
    );
  } else {
    Withdraw(
      poolAddress,
      inputTokens,
      deltas,
      fees,
      provider,
      event.transaction,
      event.block
    );
  }

  updateUsageMetrics(event.block, provider);
  updatePoolSnapshots(poolAddress, event.block);
  updateFinancials(event.block);
}

export function handleSwap(event: SwapEvent): void {
  const poolId = event.params.poolId;
  const poolAddress = Address.fromString(poolId.toHexString().substring(0, 42));

  const tokenIn = event.params.tokenIn;
  const amountIn = event.params.amountIn;

  const tokenOut = event.params.tokenOut;
  const amountOut = event.params.amountOut;

  Swap(
    poolAddress,
    tokenIn,
    amountIn,
    tokenOut,
    amountOut,
    event.transaction,
    event.block
  );

  updateUsageMetrics(event.block, event.transaction.from);
  updatePoolSnapshots(poolAddress, event.block);
  updateFinancials(event.block);
}
