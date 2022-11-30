import { Address, ethereum, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { Vault } from "../../generated/schema";
import {
  calculateDistributedRewardInUSD,
  calculateProtocolRewardInUSD,
  calculateAllDistributedRewardInUSD,
  calculateDistributedReward,
} from "../common/calculators";
import {
  getOrCreateFinancialDailySnapshots,
  getOrCreateVaultsDailySnapshots,
  getOrCreateVaultsHourlySnapshots,
  getOrCreateYieldAggregator,
} from "../common/initializers";

export function _Reinvest(
  contractAddress: Address,
  block: ethereum.Block,
  vault: Vault,
  newTotalSupply: BigInt
): void {
  const numberOfRewardTokens = vault.rewardTokens!.length;

  const distributedReward = calculateDistributedReward(
    contractAddress,
    block,
    newTotalSupply
  );
  const distributedRewardInUSD = calculateDistributedRewardInUSD(
    contractAddress,
    distributedReward
  );
  const protocolRewardInUSD = calculateProtocolRewardInUSD(
    contractAddress,
    distributedReward
  );
  const allDistributedRewardInUSD = calculateAllDistributedRewardInUSD(
    contractAddress,
    distributedReward
  );

  if (numberOfRewardTokens > 0) {
    for (let i = 0; i < numberOfRewardTokens; i++) {
      const tokenIndex = vault.rewardTokens!.indexOf(vault.rewardTokens![i]);
      vault.rewardTokenEmissionsAmount![tokenIndex] =
        vault.rewardTokenEmissionsAmount![tokenIndex].plus(distributedReward);
      vault.rewardTokenEmissionsUSD![tokenIndex] =
        vault.rewardTokenEmissionsUSD![tokenIndex].plus(distributedRewardInUSD);
    }
  }
  vault.save();

  updateFinancialsRewardAfterReinvest(
    block,
    vault,
    allDistributedRewardInUSD,
    distributedRewardInUSD,
    protocolRewardInUSD
  );
}

export function updateFinancialsRewardAfterReinvest(
  block: ethereum.Block,
  vault: Vault,
  allDistributedRewardInUSD: BigDecimal,
  distributedRewardInUSD: BigDecimal,
  protocolRewardInUSD: BigDecimal
): void {
  const financialMetrics = getOrCreateFinancialDailySnapshots(block);
  const protocol = getOrCreateYieldAggregator();
  const vaultDailySnapshots = getOrCreateVaultsDailySnapshots(vault.id, block);
  const vaultHourlySnapshots = getOrCreateVaultsHourlySnapshots(
    vault.id,
    block
  );

  vaultDailySnapshots.cumulativeSupplySideRevenueUSD =
    vault.cumulativeSupplySideRevenueUSD.plus(distributedRewardInUSD);
  vaultDailySnapshots.cumulativeProtocolSideRevenueUSD =
    vault.cumulativeProtocolSideRevenueUSD.plus(protocolRewardInUSD);
  vaultDailySnapshots.cumulativeTotalRevenueUSD =
    vault.cumulativeTotalRevenueUSD.plus(allDistributedRewardInUSD);

  vaultHourlySnapshots.cumulativeSupplySideRevenueUSD =
    vault.cumulativeSupplySideRevenueUSD.plus(distributedRewardInUSD);
  vaultHourlySnapshots.cumulativeProtocolSideRevenueUSD =
    vault.cumulativeProtocolSideRevenueUSD.plus(protocolRewardInUSD);
  vaultHourlySnapshots.cumulativeTotalRevenueUSD =
    vault.cumulativeTotalRevenueUSD.plus(allDistributedRewardInUSD);

  financialMetrics.dailyTotalRevenueUSD =
    financialMetrics.dailyTotalRevenueUSD.plus(allDistributedRewardInUSD);

  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(
    allDistributedRewardInUSD
  );

  financialMetrics.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;

  financialMetrics.dailySupplySideRevenueUSD =
    financialMetrics.dailySupplySideRevenueUSD.plus(distributedRewardInUSD);

  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(distributedRewardInUSD);

  financialMetrics.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;

  financialMetrics.dailyProtocolSideRevenueUSD =
    financialMetrics.dailyProtocolSideRevenueUSD.plus(protocolRewardInUSD);

  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(protocolRewardInUSD);

  financialMetrics.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;

  vaultDailySnapshots.dailySupplySideRevenueUSD =
    vaultDailySnapshots.dailySupplySideRevenueUSD.plus(distributedRewardInUSD);
  vaultDailySnapshots.dailyProtocolSideRevenueUSD =
    vaultDailySnapshots.dailyProtocolSideRevenueUSD.plus(protocolRewardInUSD);
  vaultDailySnapshots.dailyTotalRevenueUSD =
    vaultDailySnapshots.dailyTotalRevenueUSD.plus(allDistributedRewardInUSD);

  vaultHourlySnapshots.hourlySupplySideRevenueUSD =
    vaultHourlySnapshots.hourlySupplySideRevenueUSD.plus(
      distributedRewardInUSD
    );
  vaultHourlySnapshots.hourlyProtocolSideRevenueUSD =
    vaultHourlySnapshots.hourlyProtocolSideRevenueUSD.plus(protocolRewardInUSD);
  vaultHourlySnapshots.hourlyTotalRevenueUSD =
    vaultHourlySnapshots.hourlyTotalRevenueUSD.plus(allDistributedRewardInUSD);

  vaultDailySnapshots.save();
  vaultHourlySnapshots.save();
  financialMetrics.save();
  protocol.save();
  vault.save();
}
