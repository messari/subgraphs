import { BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { LiquidityPool } from "../../../generated/schema";
import { createPoolDailySnapshot } from "../poolDailySnapshot";

export function updatePool(
    event: ethereum.Event,
    pool: LiquidityPool,
    balances: BigInt[],
    totalSupply: BigDecimal,
    // outputTokenPriceUSD: BigDecimal,
    // totalVolumeUSD: BigDecimal,
    // totalValueLockedUSD: BigDecimal
  ): LiquidityPool {
    createPoolDailySnapshot(event, pool);
  
    pool.inputTokenBalances = balances.map<BigInt>((tb) => tb);
    pool.outputTokenSupply = totalSupply;
    // pool.outputTokenPriceUSD = outputTokenPriceUSD;
    // pool.totalValueLockedUSD = totalValueLockedUSD;
    // pool.totalVolumeUSD = totalVolumeUSD;
    pool.createdTimestamp = event.block.timestamp;
    pool.createdBlockNumber = event.block.number;
  
    pool.save();
  
    return pool as LiquidityPool;
  }