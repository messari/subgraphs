import { Address, dataSource, ethereum } from "@graphprotocol/graph-ts";
import { FeesEarned } from "../../../generated/templates/ArrakisVault/ArrakisVaultV1";
import { ArrakisVaultV1 as ArrakisVaultContract } from "../../../generated/templates/ArrakisVault/ArrakisVaultV1";
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
    let vaultContract = ArrakisVaultContract.bind(event.address);
    let totalAmounts = vaultContract.getUnderlyingBalances();
    underlyingToken.lastAmount0 = totalAmounts.getAmount0Current();
    underlyingToken.lastAmount1 = totalAmounts.getAmount1Current();
    underlyingToken.save();
  }

  // Track existing TVL for cumulative calculations
  let vault = getOrCreateVault(event.address, event.block);
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

  protocol.totalValueLockedUSD += newTvl.minus(oldTvl);

  financialsDailySnapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialsDailySnapshot.blockNumber = event.block.number;
  financialsDailySnapshot.timestamp = event.block.timestamp;

  vault.save();
  protocol.save();
  financialsDailySnapshot.save();
}

// Update revenue related fields, Only changes when rebalance is called.
export function updateRevenue(event: FeesEarned): void {
  let underlyingToken = getOrCreateUnderlyingToken(event.address);

  // Calculate revenue in USD
  let eventTotalRevenueUSD = getDualTokenUSD(
    Address.fromString(underlyingToken.token0),
    Address.fromString(underlyingToken.token1),
    event.params.feesEarned0,
    event.params.feesEarned1,
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
  let vault = getOrCreateVault(event.address, event.block);
  let vaultDailySnapshot = getOrCreateVaultDailySnapshot(event.address, event.block);
  let vaultHourlySnapshot = getOrCreateVaultHourlySnapshot(event.address, event.block);
  let financialsDailySnapshot = getOrCreateFinancialsDailySnapshot(event);

  // Update protocol cumulative revenue
  protocol.cumulativeSupplySideRevenueUSD += eventSupplySideRevenueUSD;
  protocol.cumulativeProtocolSideRevenueUSD += eventProtocolSideRevenueUSD;
  protocol.cumulativeTotalRevenueUSD += eventTotalRevenueUSD;

  // Update vault cumulative revenue
  vault.cumulativeSupplySideRevenueUSD += eventSupplySideRevenueUSD;
  vault.cumulativeProtocolSideRevenueUSD += eventProtocolSideRevenueUSD;
  vault.cumulativeTotalRevenueUSD += eventTotalRevenueUSD;

  // Increment snapshot revenues
  vaultDailySnapshot.dailySupplySideRevenueUSD += eventSupplySideRevenueUSD;
  vaultDailySnapshot.dailyProtocolSideRevenueUSD += eventProtocolSideRevenueUSD;
  vaultDailySnapshot.dailyTotalRevenueUSD += eventTotalRevenueUSD;

  vaultHourlySnapshot.hourlySupplySideRevenueUSD += eventSupplySideRevenueUSD;
  vaultHourlySnapshot.hourlyProtocolSideRevenueUSD += eventProtocolSideRevenueUSD;
  vaultHourlySnapshot.hourlyTotalRevenueUSD += eventTotalRevenueUSD;

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
  vault.save();
  vaultDailySnapshot.save();
  vaultHourlySnapshot.save();
  financialsDailySnapshot.save();
}
