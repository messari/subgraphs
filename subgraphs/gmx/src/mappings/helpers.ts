import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Token } from "../../generated/schema";
import {
  getOrCreateFinancialsDailySnapshot,
  getOrCreatePool,
  getOrCreatePoolDailySnapshot,
  getOrCreatePoolHourlySnapshot,
  getOrCreateProtocol,
  getOrCreateToken,
} from "../common/getters";
import { getUsdPricePerToken } from "../prices";
import { exponentToBigDecimal } from "../common/utils/numbers";
import { FEES_PROTOCOL_SHARE, FEES_SUPPLY_SHARE } from "../common/constants";

export function updatePoolAmounts(
  poolAddress: Address,
  amount: BigInt,
  block: ethereum.Block
): void {
  const pool = getOrCreatePool(poolAddress, block);
  pool.inputTokenBalances = [pool.inputTokenBalances[0].plus(amount)];
  pool.save();
}

export function updateGlpAmounts(
  poolAddress: Address,
  amount: BigInt,
  block: ethereum.Block
): void {
  const pool = getOrCreatePool(poolAddress, block);
  const poolDaily = getOrCreatePoolDailySnapshot(poolAddress, block);
  const poolHourly = getOrCreatePoolHourlySnapshot(poolAddress, block);

  pool.outputTokenSupply = pool.outputTokenSupply!.plus(amount);
  poolDaily.outputTokenSupply = pool.outputTokenSupply;
  poolHourly.outputTokenSupply = pool.outputTokenSupply;

  pool.save();
  poolDaily.save();
  poolHourly.save();
}

export function updateTvl(poolAddress: Address, block: ethereum.Block): void {
  const pool = getOrCreatePool(poolAddress, block);
  const protocol = getOrCreateProtocol();
  const financialsDaily = getOrCreateFinancialsDailySnapshot(block);
  const poolDaily = getOrCreatePoolDailySnapshot(poolAddress, block);
  const poolHourly = getOrCreatePoolHourlySnapshot(poolAddress, block);

  const token = updateTokenPrice(poolAddress, block);

  const poolOldTvl = pool.totalValueLockedUSD;

  pool.totalValueLockedUSD = pool.inputTokenBalances[0]
    .toBigDecimal()
    .times(token.lastPriceUSD!)
    .div(exponentToBigDecimal(token.decimals));

  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD
    .minus(poolOldTvl)
    .plus(pool.totalValueLockedUSD);

  financialsDaily.totalValueLockedUSD = protocol.totalValueLockedUSD;
  poolDaily.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolHourly.totalValueLockedUSD = pool.totalValueLockedUSD;

  pool.save();
  protocol.save();
  financialsDaily.save();
  poolDaily.save();
  poolHourly.save();
}

export function updateTokenPrice(
  tokenAddress: Address,
  block: ethereum.Block
): Token {
  const token = getOrCreateToken(tokenAddress);
  if (token.lastPriceBlockNumber! < block.number) {
    const tokenPrice = getUsdPricePerToken(tokenAddress);

    token.lastPriceUSD = tokenPrice.usdPrice.div(tokenPrice.decimalsBaseTen);
    token.lastPriceBlockNumber = block.number;
    token.save();
  }
  return token;
}

export function updateRevenue(
  poolAddress: Address,
  totalFeesUSD: BigDecimal,
  block: ethereum.Block
): void {
  const protocolFeesUSD = totalFeesUSD.times(FEES_PROTOCOL_SHARE);
  const supplyFeesUSD = totalFeesUSD.times(FEES_SUPPLY_SHARE);

  const protocol = getOrCreateProtocol();
  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(protocolFeesUSD);
  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(supplyFeesUSD);
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(totalFeesUSD);

  const pool = getOrCreatePool(poolAddress, block);
  pool.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD.plus(protocolFeesUSD);
  pool.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD.plus(supplyFeesUSD);
  pool.cumulativeTotalRevenueUSD =
    pool.cumulativeTotalRevenueUSD.plus(totalFeesUSD);

  const financialsDaily = getOrCreateFinancialsDailySnapshot(block);
  financialsDaily.dailyProtocolSideRevenueUSD =
    financialsDaily.dailyProtocolSideRevenueUSD.plus(protocolFeesUSD);
  financialsDaily.dailySupplySideRevenueUSD =
    financialsDaily.dailySupplySideRevenueUSD.plus(supplyFeesUSD);
  financialsDaily.dailyTotalRevenueUSD =
    financialsDaily.dailyTotalRevenueUSD.plus(totalFeesUSD);

  financialsDaily.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialsDaily.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialsDaily.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;

  const poolDaily = getOrCreatePoolDailySnapshot(poolAddress, block);
  poolDaily.dailyProtocolSideRevenueUSD =
    poolDaily.dailyProtocolSideRevenueUSD.plus(protocolFeesUSD);
  poolDaily.dailySupplySideRevenueUSD =
    poolDaily.dailySupplySideRevenueUSD.plus(supplyFeesUSD);
  poolDaily.dailyTotalRevenueUSD =
    poolDaily.dailyTotalRevenueUSD.plus(totalFeesUSD);

  poolDaily.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  poolDaily.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolDaily.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;

  const poolHourly = getOrCreatePoolHourlySnapshot(poolAddress, block);
  poolHourly.hourlyProtocolSideRevenueUSD =
    poolHourly.hourlyProtocolSideRevenueUSD.plus(protocolFeesUSD);
  poolHourly.hourlySupplySideRevenueUSD =
    poolHourly.hourlySupplySideRevenueUSD.plus(supplyFeesUSD);
  poolHourly.hourlyTotalRevenueUSD =
    poolHourly.hourlyTotalRevenueUSD.plus(totalFeesUSD);

  poolHourly.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  poolHourly.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolHourly.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;

  protocol.save();
  pool.save();
  financialsDaily.save();
  poolDaily.save();
  poolHourly.save();
}
