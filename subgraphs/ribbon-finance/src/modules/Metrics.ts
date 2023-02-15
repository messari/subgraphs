import { ActiveAccount, Vault as VaultStore } from "../../generated/schema";
import {
  getOrCreateVault,
  getOrCreateToken,
  getOrCreateAccount,
  getOrCreateYieldAggregator,
  getOrCreateVaultsDailySnapshots,
  getOrCreateVaultsHourlySnapshots,
  getOrCreateFinancialDailySnapshots,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "../common/initializers";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { Address, ethereum, BigInt } from "@graphprotocol/graph-ts";
import { RibbonThetaVaultWithSwap as VaultContract } from "../../generated/templates/LiquidityGauge/RibbonThetaVaultWithSwap";

export function updateUsageMetrics(block: ethereum.Block, from: Address): void {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const account = getOrCreateAccount(from.toHexString());

  const protocol = getOrCreateYieldAggregator();
  const usageMetricsDaily = getOrCreateUsageMetricsDailySnapshot(block);
  const usageMetricsHourly = getOrCreateUsageMetricsHourlySnapshot(block);

  usageMetricsDaily.blockNumber = block.number;
  usageMetricsHourly.blockNumber = block.number;

  usageMetricsDaily.timestamp = block.timestamp;
  usageMetricsHourly.timestamp = block.timestamp;

  usageMetricsDaily.dailyTransactionCount += 1;
  usageMetricsHourly.hourlyTransactionCount += 1;

  usageMetricsDaily.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetricsHourly.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  const dailyActiveAccountId = (
    block.timestamp.toI64() / constants.SECONDS_PER_DAY
  )
    .toString()
    .concat("-")
    .concat(from.toHexString());

  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);

  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();

    usageMetricsDaily.dailyActiveUsers += 1;
  }
  const hourlyActiveAccountId = (
    block.timestamp.toI64() / constants.SECONDS_PER_HOUR
  )
    .toString()
    .concat("-")
    .concat(from.toHexString());

  let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountId);

  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountId);
    hourlyActiveAccount.save();

    usageMetricsHourly.hourlyActiveUsers += 1;
  }

  usageMetricsDaily.save();
  usageMetricsHourly.save();
}

export function updateVaultSnapshots(
  vaultAddress: Address,
  block: ethereum.Block
): void {
  const vault = VaultStore.load(vaultAddress.toHexString());
  if (!vault) return;

  const vaultDailySnapshots = getOrCreateVaultsDailySnapshots(
    vaultAddress.toHexString(),
    block
  );
  const vaultHourlySnapshots = getOrCreateVaultsHourlySnapshots(
    vaultAddress.toHexString(),
    block
  );

  vaultDailySnapshots.totalValueLockedUSD = vault.totalValueLockedUSD;
  vaultHourlySnapshots.totalValueLockedUSD = vault.totalValueLockedUSD;

  vaultDailySnapshots.inputTokenBalance = vault.inputTokenBalance;
  vaultHourlySnapshots.inputTokenBalance = vault.inputTokenBalance;

  vaultDailySnapshots.outputTokenSupply = vault.outputTokenSupply!;
  vaultHourlySnapshots.outputTokenSupply = vault.outputTokenSupply!;

  vaultDailySnapshots.outputTokenPriceUSD = vault.outputTokenPriceUSD;
  vaultHourlySnapshots.outputTokenPriceUSD = vault.outputTokenPriceUSD;

  vaultDailySnapshots.pricePerShare = vault.pricePerShare;
  vaultHourlySnapshots.pricePerShare = vault.pricePerShare;

  vaultDailySnapshots.rewardTokenEmissionsAmount =
    vault.rewardTokenEmissionsAmount;
  vaultHourlySnapshots.rewardTokenEmissionsAmount =
    vault.rewardTokenEmissionsAmount;

  vaultDailySnapshots.rewardTokenEmissionsUSD = vault.rewardTokenEmissionsUSD;
  vaultHourlySnapshots.rewardTokenEmissionsUSD = vault.rewardTokenEmissionsUSD;

  vaultDailySnapshots.cumulativeProtocolSideRevenueUSD =
    vault.cumulativeProtocolSideRevenueUSD;
  vaultHourlySnapshots.cumulativeProtocolSideRevenueUSD =
    vault.cumulativeProtocolSideRevenueUSD;

  vaultDailySnapshots.cumulativeSupplySideRevenueUSD =
    vault.cumulativeSupplySideRevenueUSD;
  vaultHourlySnapshots.cumulativeSupplySideRevenueUSD =
    vault.cumulativeSupplySideRevenueUSD;

  vaultDailySnapshots.cumulativeTotalRevenueUSD =
    vault.cumulativeTotalRevenueUSD;
  vaultHourlySnapshots.cumulativeTotalRevenueUSD =
    vault.cumulativeTotalRevenueUSD;

  vaultDailySnapshots.stakedOutputTokenAmount = vault.stakedOutputTokenAmount;
  vaultHourlySnapshots.stakedOutputTokenAmount = vault.stakedOutputTokenAmount;

  vaultDailySnapshots.pricePerShare = vault.pricePerShare;
  vaultHourlySnapshots.pricePerShare = vault.pricePerShare;

  vaultDailySnapshots.blockNumber = block.number;
  vaultHourlySnapshots.blockNumber = block.number;

  vaultDailySnapshots.timestamp = block.timestamp;
  vaultHourlySnapshots.timestamp = block.timestamp;

  vaultDailySnapshots.save();
  vaultHourlySnapshots.save();
}

export function updateFinancials(block: ethereum.Block): void {
  const protocol = getOrCreateYieldAggregator();
  const financialMetrics = getOrCreateFinancialDailySnapshots(block);

  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetrics.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialMetrics.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;

  financialMetrics.blockNumber = block.number;
  financialMetrics.timestamp = block.timestamp;

  financialMetrics.save();
}

export function updateVaultTVL(
  vaultAddress: Address,
  block: ethereum.Block
): void {
  const vault = getOrCreateVault(vaultAddress, block);
  const vaultContract = VaultContract.bind(vaultAddress);

  const inputTokenAddress = Address.fromString(vault.inputToken);
  const inputToken = getOrCreateToken(inputTokenAddress, block);

  vault.outputTokenSupply = utils.getOutputTokenSupply(vaultAddress, block);

  const totalValue = utils.readValue<BigInt>(
    vaultContract.try_totalBalance(),
    constants.BIGINT_ZERO
  );

  vault.inputTokenBalance = totalValue;
  vault.totalValueLockedUSD = utils
    .bigIntToBigDecimal(vault.inputTokenBalance, vault._decimals)
    .times(inputToken.lastPriceUSD!);

  if (vault.outputToken) {
    const outputToken = getOrCreateToken(
      Address.fromString(vault.outputToken!),
      block,
      vaultAddress,
      true
    );
    vault.outputTokenPriceUSD = outputToken.lastPriceUSD;
  }
  vault.save();
}
