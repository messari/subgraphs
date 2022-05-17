import {
  Address,
  BigInt,
  BigDecimal,
  dataSource,
  ethereum,
} from "@graphprotocol/graph-ts";
import { getUsdPrice, getUsdPricePerToken } from "../../prices";
import { Rebalance } from "../../../generated/templates/Hypervisor/Hypervisor";
import { Hypervisor as HypervisorContract } from "../../../generated/templates/Hypervisor/Hypervisor";
import { getOrCreateUnderlyingToken, getOrCreateVault } from "./vaults";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ONE,
  ProtocolType,
  PROTOCOL_PERFORMANCE_FEE,
  REGISTRY_ADDRESS,
} from "../../common/constants";
import {
  getOrCreateFinancialsDailySnapshot,
  getOrCreateToken,
  getOrCreateVaultDailySnapshot,
  getOrCreateVaultHourlySnapshot,
  getOrCreateYieldAggregator,
} from "../../common/getters";
import { VaultDailySnapshot } from "../../../generated/schema";
import { BIGINT_TEN } from "../../prices/common/constants";

export function updateTvl(event: ethereum.Event): void {
  let underlyingToken = getOrCreateUnderlyingToken(event.address);

  // Update underlying amounts
  if (event.block.number > underlyingToken.lastAmountBlockNumber) {
    let hypeContract = HypervisorContract.bind(event.address);
    let totalAmounts = hypeContract.getTotalAmounts();
    underlyingToken.lastAmount0 = totalAmounts.value0
    underlyingToken.lastAmount1 = totalAmounts.value1
    underlyingToken.save()
  }

  let vault = getOrCreateVault(event.address, event.block);
  let oldTvl = vault.totalValueLockedUSD;

  let newTvl = getDualTokenUSD(
    Address.fromString(underlyingToken.token0),
    Address.fromString(underlyingToken.token1),
    underlyingToken.lastAmount0,
    underlyingToken.lastAmount1,
    event.block.number
  );

  // Update entities
  let vaultDailySnapshot = getOrCreateVaultDailySnapshot(event);
  let vaultHourlySnapshot = getOrCreateVaultHourlySnapshot(event);
  let protocol = getOrCreateYieldAggregator(
    Address.fromString(REGISTRY_ADDRESS.mustGet(dataSource.network()))
  );

  vault.totalValueLockedUSD = newTvl;

  vaultDailySnapshot.totalValueLockedUSD = newTvl;
  vaultDailySnapshot.blockNumber = event.block.number;
  vaultDailySnapshot.timestamp = event.block.timestamp;

  vaultHourlySnapshot.totalValueLockedUSD = newTvl;
  vaultHourlySnapshot.blockNumber = event.block.number;
  vaultHourlySnapshot.timestamp = event.block.timestamp;

  protocol.totalValueLockedUSD += newTvl.minus(oldTvl);

  vault.save();
  vaultDailySnapshot.save();
  vaultHourlySnapshot.save();
  protocol.save();
}

export function updateRevenue(event: Rebalance): void {
  let underlyingToken = getOrCreateUnderlyingToken(event.address);

  // Calculate revenue in USD
  let eventProtocolSideRevenueUSD = getDualTokenUSD(
    Address.fromString(underlyingToken.token0),
    Address.fromString(underlyingToken.token1),
    event.params.feeAmount0,
    event.params.feeAmount1,
    event.block.number
  );

  const protocolToSupplyFeeRatio = BIGDECIMAL_HUNDRED.div(
    PROTOCOL_PERFORMANCE_FEE
  ).minus(BIGDECIMAL_ONE);
  let eventSupplySideRevenueUSD = eventProtocolSideRevenueUSD.times(
    protocolToSupplyFeeRatio
  );

  let eventTotalRevenueUSD = eventProtocolSideRevenueUSD.plus(
    eventSupplySideRevenueUSD
  );

  // Update entities
  let protocol = getOrCreateYieldAggregator(
    Address.fromString(REGISTRY_ADDRESS.mustGet(dataSource.network()))
  );
  let financialsDailySnapshot = getOrCreateFinancialsDailySnapshot(event);

  // Update protocol cumulative revenue
  protocol.cumulativeSupplySideRevenueUSD += eventSupplySideRevenueUSD;
  protocol.cumulativeProtocolSideRevenueUSD += eventProtocolSideRevenueUSD;
  protocol.cumulativeTotalRevenueUSD += eventTotalRevenueUSD;

  // Increment daily revenues
  financialsDailySnapshot.dailySupplySideRevenueUSD += eventSupplySideRevenueUSD;
  financialsDailySnapshot.dailyProtocolSideRevenueUSD += eventProtocolSideRevenueUSD;
  financialsDailySnapshot.dailyTotalRevenueUSD += eventTotalRevenueUSD;

  // Update cumulative revenue from protocol
  financialsDailySnapshot.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialsDailySnapshot.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialsDailySnapshot.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;

  financialsDailySnapshot.blockNumber = event.block.number;
  financialsDailySnapshot.timestamp = event.block.timestamp;

  protocol.save();
  financialsDailySnapshot.save();
}

export function getDualTokenUSD(
  token0Address: Address,
  token1Address: Address,
  amount0: BigInt,
  amount1: BigInt,
  blockNumber: BigInt
): BigDecimal {
  // Update token prices
  let token0 = getOrCreateToken(token0Address);
  if (blockNumber > token0.lastPriceBlockNumber!) {
    let fetchPrice = getUsdPricePerToken(token0Address);
    token0.lastPriceUSD = fetchPrice.usdPrice;
    token0.lastPriceBlockNumber = blockNumber;
    token0.save();
  }

  let token1 = getOrCreateToken(token0Address);
  if (blockNumber > token1.lastPriceBlockNumber!) {
    let fetchPrice = getUsdPricePerToken(token0Address);
    token1.lastPriceUSD = fetchPrice.usdPrice;
    token1.lastPriceBlockNumber = blockNumber;
    token1.save();
  }

  let amount0Usd = token0.lastPriceUSD!
    .times(amount0.toBigDecimal())
    .div(BIGINT_TEN.pow(token0.decimals as u8).toBigDecimal());
  let amount1Usd = token1.lastPriceUSD!
    .times(amount1.toBigDecimal())
    .div(BIGINT_TEN.pow(token1.decimals as u8).toBigDecimal());

  return amount0Usd.plus(amount1Usd);
}
