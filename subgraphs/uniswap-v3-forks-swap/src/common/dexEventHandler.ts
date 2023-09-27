import { ethereum, BigDecimal, Address, BigInt } from "@graphprotocol/graph-ts";

import {
  INT_ONE,
  EventType,
  BIGDECIMAL_ZERO,
  BIGINT_NEG_ONE,
} from "./constants";
import { sumBigIntListByIndex } from "./utils";
import { getLiquidityPool } from "./entities/pool";
import { getOrCreateProtocol } from "./entities/protocol";
import { getOrCreateToken } from "./entities/token";
import { getOrCreateAccount } from "./entities/account";

import {
  Account,
  DexAmmProtocol,
  LiquidityPool,
  Swap,
  Token,
} from "../../generated/schema";

export class RawDeltas {
  inputTokenBalancesDeltas: BigInt[];

  constructor(inputTokenBalancesDeltas: BigInt[]) {
    this.inputTokenBalancesDeltas = inputTokenBalancesDeltas;
  }
}

export class DexEventHandler {
  event: ethereum.Event;
  eventType: i32;
  account: Account;
  protocol: DexAmmProtocol;
  pool: LiquidityPool;
  poolTokens: Token[];

  inputTokenBalances: BigInt[];
  inputTokenBalanceDeltas: BigInt[];
  inputTokenBalancesUSD: BigDecimal[];
  inputTokenBalanceDeltasUSD: BigDecimal[];

  constructor(event: ethereum.Event, pool: LiquidityPool, deltas: RawDeltas) {
    this.event = event;
    this.eventType = EventType.UNKNOWN;
    this.account = getOrCreateAccount(event.transaction.from);
    this.protocol = getOrCreateProtocol();
    this.pool = pool;
    this.poolTokens = getTokens(pool);

    // Raw Deltas
    this.inputTokenBalanceDeltas = deltas.inputTokenBalancesDeltas;

    // Pool Token Deltas and Balances
    this.inputTokenBalances = sumBigIntListByIndex([
      pool.inputTokenBalances,
      this.inputTokenBalanceDeltas,
    ]);
    this.inputTokenBalancesUSD = new Array<BigDecimal>(
      this.poolTokens.length
    ).fill(BIGDECIMAL_ZERO);
    this.inputTokenBalanceDeltasUSD = new Array<BigDecimal>(
      this.poolTokens.length
    ).fill(BIGDECIMAL_ZERO);
  }

  createSwap(
    tokensInIdx: i32,
    tokensOutIdx: i32,
    from: Address,
    tick: BigInt | null
  ): void {
    this.eventType = EventType.SWAP;
    this.pool.tick = tick;

    // create Swap event
    const swap = new Swap(
      this.event.transaction.hash.concatI32(this.event.logIndex.toI32())
    );

    swap.hash = this.event.transaction.hash;
    swap.nonce = this.event.transaction.nonce;
    swap.logIndex = this.event.logIndex.toI32();
    swap.gasLimit = this.event.transaction.gasLimit;
    swap.gasPrice = this.event.transaction.gasPrice;
    swap.protocol = this.protocol.id;
    swap.account = from;
    swap.pool = this.pool.id;
    swap.blockNumber = this.event.block.number;
    swap.timestamp = this.event.block.timestamp;
    swap.tick = tick;
    swap.tokenIn = this.pool.inputTokens[tokensInIdx];
    swap.amountIn = this.inputTokenBalanceDeltas[tokensInIdx];
    swap.amountInUSD = this.inputTokenBalanceDeltasUSD[tokensInIdx];
    swap.tokenOut = this.pool.inputTokens[tokensOutIdx];
    swap.amountOut =
      this.inputTokenBalanceDeltas[tokensOutIdx].times(BIGINT_NEG_ONE);
    swap.amountOutUSD = this.inputTokenBalanceDeltasUSD[tokensOutIdx];

    const pool = getLiquidityPool(this.event.address);
    if (pool) {
      const reserve0Amount = pool.inputTokenBalances[0];
      const reserve1Amount = pool.inputTokenBalances[1];

      swap.reserveAmounts = [reserve0Amount, reserve1Amount];
    }

    swap.save();
    this.pool.save();
  }

  updateAndSaveLiquidityPoolEntity(): void {
    this.pool.inputTokenBalances = this.inputTokenBalances;
    this.pool.inputTokenBalancesUSD = this.inputTokenBalancesUSD;

    if (this.eventType == EventType.SWAP) {
      this.pool.cumulativeSwapCount += INT_ONE;
    }

    this.pool.lastUpdateBlockNumber = this.event.block.number;
    this.pool.lastUpdateTimestamp = this.event.block.timestamp;

    this.pool.save();
  }

  updateAndSaveAccountEntity(): void {
    this.account.swapCount += INT_ONE;
    this.account.save();
  }
}

// Return all tokens given a pool
function getTokens(pool: LiquidityPool): Token[] {
  const tokens: Token[] = [];
  for (let i = 0; i < pool.inputTokens.length; i++) {
    tokens.push(getOrCreateToken(pool.inputTokens[i]));
  }
  return tokens;
}
