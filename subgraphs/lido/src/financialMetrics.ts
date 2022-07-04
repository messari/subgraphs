import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { getOrCreateProtocol } from "./protocol";
import {
    FinancialsDailySnapshot,
    PoolDailySnapshot,
    PoolHourlySnapshot
} from "../generated/schema";
import { bigIntToBigDecimal } from "./utils/numbers";
import {
    BIGDECIMAL_ZERO,
    BIGINT_TEN_TO_EIGHTEENTH,
    BIGINT_ZERO,
    ETH_ADDRESS,
    PROTOCOL_ID,
    SECONDS_PER_DAY,
    SECONDS_PER_HOUR
} from "./utils/constants";
import { getOrCreatePool } from "./pool";
import { getUsdPrice } from "./prices";

// TODO
// 1. Update financialMetrics to USD from ETH (dependency on getUSD price)
// 2. How do we factor in slashing here? Will it be -value?
// - should TVL instead be tracked at eth2_deposit contract?

export function updateTotalValueLockedUSD(block: ethereum.Block, amount: BigInt): void {
    const protocol = getOrCreateProtocol();
    // TODO do we want to pass protocol and pool after initialization in mapping?
    const pool = getOrCreatePool(
        Address.fromString(PROTOCOL_ID),
        block.number,
        block.timestamp
    );
    const financialMetrics = getOrCreateFinancialDailyMetrics(block);

    // stETH vs ETH prices
    const amountUSD = getUsdPrice(
        Address.fromString(ETH_ADDRESS),
        bigIntToBigDecimal(amount)
    );

    protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(amountUSD);
    protocol.save();

    pool.totalValueLockedUSD = protocol.totalValueLockedUSD;
    pool.inputTokenBalances = [pool.inputTokenBalances[0].plus(amount)];
    pool.save();

    financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
    financialMetrics.save();
}

// Can we get this from from LIDO rather than LIDOOracle?
export function updateTotalRevenueMetrics(
    block: ethereum.Block,
    postTotalPooledEther: BigInt,
    preTotalPooledEther: BigInt,
    totalShares: BigInt
): void {
    const pool = getOrCreatePool(
        Address.fromString(PROTOCOL_ID),
        block.number,
        block.timestamp
    );
    const protocol = getOrCreateProtocol();
    const financialMetrics = getOrCreateFinancialDailyMetrics(block);

    const stakedRewards = postTotalPooledEther.minus(preTotalPooledEther).div(BIGINT_TEN_TO_EIGHTEENTH);  
    const stakedRewardsUSD = getUsdPrice(
        Address.fromString(ETH_ADDRESS),
        bigIntToBigDecimal(stakedRewards)
    );

    protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(stakedRewardsUSD);
    protocol.save();

    pool.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
    pool.outputTokenSupply = totalShares;
    pool.save();

    financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(stakedRewardsUSD);
    financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
    financialMetrics.save();
}

export function updateProtocolAndSupplySideRevenueMetrics(
    block: ethereum.Block,
    amount: BigInt
): void {
    const pool = getOrCreatePool(
        Address.fromString(PROTOCOL_ID),
        block.number,
        block.timestamp
    );
    const protocol = getOrCreateProtocol();
    const financialMetrics = getOrCreateFinancialDailyMetrics(block);
    
    const amountUSD = getUsdPrice(
        Address.fromString(ETH_ADDRESS),
        bigIntToBigDecimal(amount)
    );

    const updatedCumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(amountUSD);
    protocol.cumulativeProtocolSideRevenueUSD = updatedCumulativeProtocolSideRevenueUSD;
    // TODO: Buggy? since totalRevenue is coming from Oracle. Should we rely on Transfers / Transfer shares?
    protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeTotalRevenueUSD.minus(updatedCumulativeProtocolSideRevenueUSD);
    protocol.save();

    pool.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
    pool.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
    pool.save();

    const updatedDailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(amountUSD);
    financialMetrics.dailyProtocolSideRevenueUSD = updatedDailyProtocolSideRevenueUSD;
    financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
    // TODO: Buggy? since totalRevenue is coming from Oracle. Should we rely on Transfers / Transfer shares?
    financialMetrics.dailySupplySideRevenueUSD = financialMetrics.dailyTotalRevenueUSD.minus(updatedDailyProtocolSideRevenueUSD);
    financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
    financialMetrics.save();
}

export function getOrCreateFinancialDailyMetrics(
    block: ethereum.Block
  ): FinancialsDailySnapshot {
    // Number of days since Unix epoch
    const id = `${block.timestamp.toI64() / SECONDS_PER_DAY}`;
    let financialMetrics = FinancialsDailySnapshot.load(id);

    if (!financialMetrics) {
      financialMetrics = new FinancialsDailySnapshot(id);
      financialMetrics.protocol = PROTOCOL_ID;

      financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
      financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
      financialMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
      financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
      financialMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
      financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
      financialMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    }

    financialMetrics.blockNumber = block.number;
    financialMetrics.timestamp = block.timestamp;

    financialMetrics.save();
    
    return financialMetrics;
}

export function getOrCreatePoolsDailyMetrics(poolAddress: Address, block: ethereum.Block): PoolDailySnapshot {
  let dayId: string = poolAddress.toHexString().concat((block.timestamp.toI64() / SECONDS_PER_DAY).toString());
  let poolMetrics = PoolDailySnapshot.load(dayId);

  if (!poolMetrics) {
    poolMetrics = new PoolDailySnapshot(dayId);
    poolMetrics.protocol = PROTOCOL_ID;
    poolMetrics.pool = poolAddress.toHexString();

    poolMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;

    poolMetrics.inputTokenBalances = [BIGINT_ZERO];
    poolMetrics.outputTokenSupply = BIGINT_ZERO;
    poolMetrics.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    poolMetrics.stakedOutputTokenAmount = BIGINT_ZERO;

  }

  poolMetrics.blockNumber = block.number;
  poolMetrics.timestamp = block.timestamp;

  poolMetrics.save();

  return poolMetrics;
}


export function getOrCreatePoolsHourlyMetrics(poolAddress: Address, block: ethereum.Block): PoolHourlySnapshot {
  let hourId: string = poolAddress.toHexString().concat((block.timestamp.toI64() / SECONDS_PER_HOUR).toString());
  let poolMetrics = PoolHourlySnapshot.load(hourId);

  if (!poolMetrics) {
    poolMetrics = new PoolHourlySnapshot(hourId);
    poolMetrics.protocol = PROTOCOL_ID;
    poolMetrics.pool = poolAddress.toHexString();

    poolMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;

    poolMetrics.inputTokenBalances = [BIGINT_ZERO];
    poolMetrics.outputTokenSupply = BIGINT_ZERO;
    poolMetrics.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    poolMetrics.stakedOutputTokenAmount = BIGINT_ZERO;

  }

  poolMetrics.blockNumber = block.number;
  poolMetrics.timestamp = block.timestamp;

  poolMetrics.save();

  return poolMetrics;
}