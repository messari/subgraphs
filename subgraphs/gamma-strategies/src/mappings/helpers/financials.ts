import { Address, dataSource, ethereum } from "@graphprotocol/graph-ts";
import { Rebalance } from "../../../generated/templates/Hypervisor/Hypervisor";
import { Hypervisor as HypervisorContract } from "../../../generated/templates/Hypervisor/Hypervisor";
import { getOrCreateUnderlyingToken, getOrCreateVault } from "./vaults";
import {
  BIGDECIMAL_HUNDRED,
  BIGINT_ZERO,
  PROTOCOL_PERFORMANCE_FEE,
  REGISTRY_ADDRESS_MAP,
} from "../../common/constants";
import {
  getOrCreateFinancialsDailySnapshot,
  getOrCreateToken,
  getOrCreateVaultDailySnapshot,
  getOrCreateVaultHourlySnapshot,
  getOrCreateYieldAggregator,
} from "../../common/getters";
import { getDualTokenUSD } from "./pricing";
import { bigIntToBigDecimal } from "../../common/utils/numbers";

// Update TVL related fields in all entities
export function updateTvl(event: ethereum.Event): void {
  let underlyingToken = getOrCreateUnderlyingToken(event.address);

  // Update underlying amounts
  if (event.block.number > underlyingToken.lastAmountBlockNumber) {
    let hypeContract = HypervisorContract.bind(event.address);
    let totalAmounts = hypeContract.getTotalAmounts();
    underlyingToken.lastAmount0 = totalAmounts.value0;
    underlyingToken.lastAmount1 = totalAmounts.value1;
    underlyingToken.save();
  }

  // Track existing TVL for cumulative calculations
  let vault = getOrCreateVault(event);
  let oldTvl = vault.totalValueLockedUSD;

  let newTvl = getDualTokenUSD(
    Address.fromString(underlyingToken.token0),
    Address.fromString(underlyingToken.token1),
    underlyingToken.lastAmount0,
    underlyingToken.lastAmount1,
    event.block.number
  );

  // Calculate price per share
  let outputToken = getOrCreateToken(Address.fromString(vault.outputToken!));
  let vaultTokenSupply = vault.outputTokenSupply!;
  let outputTokenPriceUSD = vault.outputTokenPriceUSD;
  if (vaultTokenSupply > BIGINT_ZERO) {
    let outputTokenSupplyDecimals = bigIntToBigDecimal(
      vaultTokenSupply,
      outputToken.decimals
    );
    outputTokenPriceUSD = newTvl.div(outputTokenSupplyDecimals);
  }

  // Update entities
  let protocol = getOrCreateYieldAggregator(
    REGISTRY_ADDRESS_MAP.get(dataSource.network())!
  );
  let financialsDailySnapshot = getOrCreateFinancialsDailySnapshot(event);

  vault.totalValueLockedUSD = newTvl;
  vault.outputTokenPriceUSD = outputTokenPriceUSD;

  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(
    newTvl.minus(oldTvl)
  );

  financialsDailySnapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialsDailySnapshot.blockNumber = event.block.number;
  financialsDailySnapshot.timestamp = event.block.timestamp;

  vault.save();
  protocol.save();
  financialsDailySnapshot.save();
}

// Update revenue related fields, Only changes when rebalance is called.
export function updateRevenue(event: Rebalance): void {
  let underlyingToken = getOrCreateUnderlyingToken(event.address);

  // Calculate revenue in USD
  let eventTotalRevenueUSD = getDualTokenUSD(
    Address.fromString(underlyingToken.token0),
    Address.fromString(underlyingToken.token1),
    event.params.feeAmount0,
    event.params.feeAmount1,
    event.block.number
  );

  const SupplySideShare = BIGDECIMAL_HUNDRED.minus(PROTOCOL_PERFORMANCE_FEE);

  let eventSupplySideRevenueUSD = eventTotalRevenueUSD
    .times(SupplySideShare)
    .div(BIGDECIMAL_HUNDRED);

  let eventProtocolSideRevenueUSD = eventTotalRevenueUSD
    .times(PROTOCOL_PERFORMANCE_FEE)
    .div(BIGDECIMAL_HUNDRED);

  // Update entities
  let protocol = getOrCreateYieldAggregator(
    REGISTRY_ADDRESS_MAP.get(dataSource.network())!
  );
  let financialsDailySnapshot = getOrCreateFinancialsDailySnapshot(event);
  let VaultDailySnapshot = getOrCreateVaultDailySnapshot(event);
  let VaultHourlySnapshot = getOrCreateVaultHourlySnapshot(event);
  let vault = getOrCreateVault(event);

  // Update cumulative revenue
  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(eventSupplySideRevenueUSD);
  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(eventProtocolSideRevenueUSD);
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(eventTotalRevenueUSD);

  vault.cumulativeSupplySideRevenueUSD =
    vault.cumulativeSupplySideRevenueUSD.plus(eventSupplySideRevenueUSD);
  vault.cumulativeProtocolSideRevenueUSD =
    vault.cumulativeProtocolSideRevenueUSD.plus(eventProtocolSideRevenueUSD);
  vault.cumulativeTotalRevenueUSD =
    vault.cumulativeTotalRevenueUSD.plus(eventTotalRevenueUSD);

  // Increment daily revenues
  financialsDailySnapshot.dailySupplySideRevenueUSD =
    financialsDailySnapshot.dailySupplySideRevenueUSD.plus(
      eventSupplySideRevenueUSD
    );
  financialsDailySnapshot.dailyProtocolSideRevenueUSD =
    financialsDailySnapshot.dailyProtocolSideRevenueUSD.plus(
      eventProtocolSideRevenueUSD
    );
  financialsDailySnapshot.dailyTotalRevenueUSD =
    financialsDailySnapshot.dailyTotalRevenueUSD.plus(eventTotalRevenueUSD);

  VaultDailySnapshot.dailySupplySideRevenueUSD =
    VaultDailySnapshot.dailySupplySideRevenueUSD.plus(
      eventSupplySideRevenueUSD
    );
  VaultDailySnapshot.dailyProtocolSideRevenueUSD =
    VaultDailySnapshot.dailyProtocolSideRevenueUSD.plus(
      eventProtocolSideRevenueUSD
    );
  VaultDailySnapshot.dailyTotalRevenueUSD =
    VaultDailySnapshot.dailyTotalRevenueUSD.plus(eventTotalRevenueUSD);

  // Increment hourly revenues
  VaultHourlySnapshot.hourlySupplySideRevenueUSD =
    VaultHourlySnapshot.hourlySupplySideRevenueUSD.plus(
      eventSupplySideRevenueUSD
    );
  VaultHourlySnapshot.hourlyProtocolSideRevenueUSD =
    VaultHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(
      eventProtocolSideRevenueUSD
    );
  VaultHourlySnapshot.hourlyTotalRevenueUSD =
    VaultHourlySnapshot.hourlyTotalRevenueUSD.plus(eventTotalRevenueUSD);

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
