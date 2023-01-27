import { Address, ethereum, BigInt, BigDecimal, log } from "@graphprotocol/graph-ts";
import { Vault } from "../../generated/schema";
import {
  getOrCreateFinancialDailySnapshots,
  getOrCreateVaultsDailySnapshots,
  getOrCreateVaultsHourlySnapshots,
  getOrCreateYieldAggregator,
} from "../common/initializers";
import { updateTokenPrice } from "../common/utils";
import { calculateDistributedReward, calculateDistributedRewardInUSD, calculateSupplyRewardInUSD, calculateProtocolRewardInUSD } from "./Price";

export function _Reinvest(
  contractAddress: Address,
  block: ethereum.Block,
  vault: Vault,
  newTotalSupply: BigInt
): void {
  const inputTokenAddress = Address.fromString(vault.inputToken);
  updateTokenPrice(inputTokenAddress, block.number);

  const distributedReward = calculateDistributedReward(
    contractAddress,
    block,
    newTotalSupply
  );

  const distributedRewardInUSD = calculateDistributedRewardInUSD(distributedReward);

  const supplySideRevenueUSD = calculateSupplyRewardInUSD(
    contractAddress,
    distributedRewardInUSD
  );

  const protocolSideRevenueUSD = calculateProtocolRewardInUSD(
    contractAddress,
    distributedRewardInUSD
  );

  updateFinancialsRewardAfterReinvest(
    block,
    vault,
    supplySideRevenueUSD,
    protocolSideRevenueUSD,
  );
}

export function updateFinancialsRewardAfterReinvest(
  block: ethereum.Block,
  vault: Vault,
  supplySideRevenueUSD: BigDecimal,
  protocolSideRevenueUSD: BigDecimal,
): void {
  const protocol = getOrCreateYieldAggregator();

  const financialMetrics = getOrCreateFinancialDailySnapshots(block);
  const vaultDailySnapshot = getOrCreateVaultsDailySnapshots(vault.id, block);
  const vaultHourlySnapshot = getOrCreateVaultsHourlySnapshots(vault.id, block);

  const totalRevenueUSD = supplySideRevenueUSD.plus(protocolSideRevenueUSD);

  // SupplySideRevenueUSD Metrics
  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(
    supplySideRevenueUSD
  );
  financialMetrics.dailySupplySideRevenueUSD = financialMetrics.dailySupplySideRevenueUSD.plus(
    supplySideRevenueUSD
  );
  financialMetrics.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;

  vault.cumulativeSupplySideRevenueUSD = vault.cumulativeSupplySideRevenueUSD.plus(
    supplySideRevenueUSD
  );
  vaultDailySnapshot.cumulativeSupplySideRevenueUSD =
    vault.cumulativeSupplySideRevenueUSD;
  vaultDailySnapshot.dailySupplySideRevenueUSD = vaultDailySnapshot.dailySupplySideRevenueUSD.plus(
    supplySideRevenueUSD
  );
  vaultHourlySnapshot.cumulativeSupplySideRevenueUSD =
    vault.cumulativeSupplySideRevenueUSD;
  vaultHourlySnapshot.hourlySupplySideRevenueUSD = vaultHourlySnapshot.hourlySupplySideRevenueUSD.plus(
    supplySideRevenueUSD
  );

  // ProtocolSideRevenueUSD Metrics
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );
  financialMetrics.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialMetrics.dailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );

  vault.cumulativeProtocolSideRevenueUSD = vault.cumulativeProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );
  vaultDailySnapshot.cumulativeProtocolSideRevenueUSD =
    vault.cumulativeProtocolSideRevenueUSD;
  vaultDailySnapshot.dailyProtocolSideRevenueUSD = vaultDailySnapshot.dailyProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );
  vaultHourlySnapshot.cumulativeProtocolSideRevenueUSD =
    vault.cumulativeProtocolSideRevenueUSD;
  vaultHourlySnapshot.hourlyProtocolSideRevenueUSD = vaultHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );

  // TotalRevenueUSD Metrics
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(
    totalRevenueUSD
  );
  financialMetrics.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;
  financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(
    totalRevenueUSD
  );

  vault.cumulativeTotalRevenueUSD = vault.cumulativeTotalRevenueUSD.plus(
    supplySideRevenueUSD
  );
  vaultDailySnapshot.cumulativeTotalRevenueUSD =
    vault.cumulativeTotalRevenueUSD;
  vaultDailySnapshot.dailyTotalRevenueUSD = vaultDailySnapshot.dailyTotalRevenueUSD.plus(
    totalRevenueUSD
  );
  vaultHourlySnapshot.cumulativeTotalRevenueUSD =
    vault.cumulativeTotalRevenueUSD;
  vaultHourlySnapshot.hourlyTotalRevenueUSD = vaultHourlySnapshot.hourlyTotalRevenueUSD.plus(
    totalRevenueUSD
  );

  vaultHourlySnapshot.save();
  vaultDailySnapshot.save();
  financialMetrics.save();
  protocol.save();
  vault.save();
}