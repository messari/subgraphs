import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import {
  getOrCreateStrategy,
  getOrCreateYieldAggregator,
  getOrCreateVaultsDailySnapshots,
  getOrCreateVaultsHourlySnapshots,
  getOrCreateFinancialDailySnapshots,
} from "../common/initializers";
import * as utils from "../common/utils";
import { RewardType } from "../common/types";
import { getUsdPricePerToken } from "../Prices";
import * as constants from "../common/constants";
import { getPriceOfOutputTokens } from "./Price";
import { Vault as VaultContract } from "../../generated/Registry_v1/Vault";
import { Token, _Strategy, Vault as VaultStore } from "../../generated/schema";
import { VaultStrategies_v1 } from "../../generated/templates/Vault/VaultStrategies_v1";
import { VaultStrategies_v2 } from "../../generated/templates/Vault/VaultStrategies_v2";
import { Strategy as StrategyContract } from "../../generated/templates/Vault/Strategy";

export function getVaultLastReport(
  vaultContract: VaultContract,
  storeLastReport: BigInt
): BigInt {
  if (
    storeLastReport.equals(constants.BIGINT_ZERO) ||
    storeLastReport.toString() == constants.MAX_UINT256_STR
  ) {
    let activation = utils.readValue<BigInt>(
      vaultContract.try_activation(),
      constants.BIGINT_ZERO
    );

    return activation;
  }
  return storeLastReport;
}

export function getStrategyLastReport(
  strategyActivation: BigInt,
  storeLastReport: BigInt
): BigInt {
  if (storeLastReport.equals(constants.BIGINT_ZERO)) {
    return strategyActivation;
  }
  return storeLastReport;
}

export function getStrategyInfo(
  vaultAddress: Address,
  strategyAddress: Address
): BigInt[] {
  let performanceFee: BigInt = constants.BIGINT_ZERO;
  let lastReport: BigInt = constants.BIGINT_ZERO;
  let activation: BigInt = constants.BIGINT_ZERO;

  const vaultContractV1 = VaultStrategies_v1.bind(vaultAddress);

  let strategyData_v1 = vaultContractV1.try_strategies(strategyAddress);
  if (strategyData_v1.reverted) {
    const vaultContractV2 = VaultStrategies_v2.bind(vaultAddress);
    let strategyData_v2 = vaultContractV2.try_strategies(strategyAddress);

    if (strategyData_v2.reverted) {
      return [
        constants.DEFAULT_PERFORMANCE_FEE,
        constants.BIGINT_ZERO,
        constants.BIGINT_ZERO,
      ];
    } else {
      performanceFee = strategyData_v2.value.value0;
      activation = strategyData_v2.value.value1;
      lastReport = strategyData_v2.value.value5;
    }
  } else {
    performanceFee = strategyData_v1.value.value0;
    activation = strategyData_v1.value.value1;
    lastReport = strategyData_v1.value.value4;
  }

  return [performanceFee, lastReport, activation];
}

export function calculateStrategistReward_v1(
  gain: BigInt,
  vaultTotalAssets: BigInt,
  vaultTotalSupply: BigInt,
  vaultManagementFee: BigInt,
  vaultPerformanceFee: BigInt,
  strategyPerformanceFee: BigInt,
  vaultLastReportTimestamp: BigInt,
  vaultCurrentReportTimestamp: BigInt
): RewardType {
  // vault version: 0.3.0
  let duration = vaultCurrentReportTimestamp.minus(vaultLastReportTimestamp);

  // Management Fee
  let reportGovernanceFee = vaultTotalAssets
    .times(duration)
    .times(vaultManagementFee)
    .div(constants.MAX_BPS)
    .div(constants.SECONDS_PER_YEAR);

  let reportStrategistFee = constants.BIGINT_ZERO;

  if (gain.gt(constants.BIGINT_ZERO)) {
    // Strategist Fee
    reportStrategistFee = gain
      .times(strategyPerformanceFee)
      .div(constants.MAX_BPS);

    // vault Performance Fee
    let reportPerformanceFee = gain
      .times(vaultPerformanceFee)
      .div(constants.MAX_BPS);

    reportGovernanceFee = reportGovernanceFee.plus(reportPerformanceFee);
  }

  let totalFee = reportGovernanceFee.plus(reportStrategistFee);

  if (totalFee.gt(constants.BIGINT_ZERO)) {
    let totalReward = vaultTotalSupply.isZero()
      ? totalFee
      : totalFee.times(vaultTotalSupply).div(vaultTotalAssets);

    let strategistReward: BigInt = constants.BIGINT_ZERO;
    if (reportStrategistFee.gt(constants.BIGINT_ZERO)) {
      strategistReward = reportStrategistFee
        .times(totalReward)
        .div(totalFee);
    }
    return new RewardType(strategistReward, totalReward, totalFee);
  }

  return new RewardType(constants.BIGINT_ZERO, constants.BIGINT_ZERO, totalFee);
}

export function calculateStrategistReward_v2(
  gain: BigInt,
  debtPaid: BigInt,
  debtAdded: BigInt,
  vaultTotalDebt: BigInt,
  vaultTotalAssets: BigInt,
  vaultTotalSupply: BigInt,
  vaultManagementFee: BigInt,
  vaultPerformanceFee: BigInt,
  strategyPerformanceFee: BigInt,
  vaultLastReportTimestamp: BigInt,
  vaultCurrentReportTimestamp: BigInt
): RewardType {
  // vault version: 0.3.1-0.3.2-0.3.3
  let duration = vaultCurrentReportTimestamp.minus(vaultLastReportTimestamp);

  vaultTotalDebt = vaultTotalDebt.plus(debtPaid).minus(debtAdded);

  // Management Fee
  let reportGovernanceFee = vaultTotalDebt
    .times(duration)
    .times(vaultManagementFee)
    .div(constants.MAX_BPS)
    .div(constants.SECONDS_PER_YEAR);

  let reportStrategistFee = constants.BIGINT_ZERO;
  let reportPerformanceFee = constants.BIGINT_ZERO;

  if (gain.gt(constants.BIGINT_ZERO)) {
    // Strategist Fee
    reportStrategistFee = gain
      .times(strategyPerformanceFee)
      .div(constants.MAX_BPS);

    // vault Performance Fee
    reportPerformanceFee = gain
      .times(vaultPerformanceFee)
      .div(constants.MAX_BPS);
  }

  let totalFee = reportGovernanceFee
    .plus(reportStrategistFee)
    .plus(reportPerformanceFee);

  if (totalFee.gt(constants.BIGINT_ZERO)) {
    let totalReward = vaultTotalSupply.isZero()
      ? totalFee
      : totalFee.times(vaultTotalSupply).div(vaultTotalAssets);

    let strategistReward: BigInt = constants.BIGINT_ZERO;
    if (reportStrategistFee.gt(constants.BIGINT_ZERO)) {
      strategistReward = reportStrategistFee
        .times(totalReward)
        .div(totalFee);
    }
    return new RewardType(strategistReward, totalReward, totalFee);
  }

  return new RewardType(constants.BIGINT_ZERO, constants.BIGINT_ZERO, totalFee);
}

export function calculateStrategistReward_v3(
  gain: BigInt,
  debtPaid: BigInt,
  debtAdded: BigInt,
  vaultTotalDebt: BigInt,
  vaultTotalAssets: BigInt,
  vaultTotalSupply: BigInt,
  vaultManagementFee: BigInt,
  vaultPerformanceFee: BigInt,
  strategyPerformanceFee: BigInt,
  strategyDelegatedAssets: BigInt,
  strategyLastReportTimestamp: BigInt,
  vaultCurrentReportTimestamp: BigInt
): RewardType {
  // vault version: 0.3.5
  let duration = vaultCurrentReportTimestamp.minus(strategyLastReportTimestamp);
  vaultTotalDebt = vaultTotalDebt
    .plus(debtPaid)
    .minus(debtAdded)
    .minus(strategyDelegatedAssets);

  // Management Fee
  let reportManagementFee = vaultTotalDebt
    .times(duration)
    .times(vaultManagementFee)
    .div(constants.MAX_BPS)
    .div(constants.SECONDS_PER_YEAR_EXACT);

  let reportStrategistFee = constants.BIGINT_ZERO;
  let reportPerformanceFee = constants.BIGINT_ZERO;

  if (gain.gt(constants.BIGINT_ZERO)) {
    // Strategist Fee
    reportStrategistFee = gain
      .times(strategyPerformanceFee)
      .div(constants.MAX_BPS);

    // Performance Fee
    reportPerformanceFee = gain
      .times(vaultPerformanceFee)
      .div(constants.MAX_BPS);
  }

  let totalFee = reportManagementFee
    .plus(reportStrategistFee)
    .plus(reportPerformanceFee);

  if (totalFee.gt(gain)) {
    totalFee = gain;
  }

  if (totalFee.gt(constants.BIGINT_ZERO)) {
    let totalReward = vaultTotalSupply.isZero()
      ? totalFee
      : totalFee.times(vaultTotalSupply).div(vaultTotalAssets);

    let strategistReward: BigInt = constants.BIGINT_ZERO;
    if (reportStrategistFee.gt(constants.BIGINT_ZERO)) {
      strategistReward = reportStrategistFee
        .times(totalReward)
        .div(totalFee);
    }
    return new RewardType(strategistReward, totalReward, totalFee);
  }

  return new RewardType(constants.BIGINT_ZERO, constants.BIGINT_ZERO, totalFee);
}

export function calculateStrategistReward_v4(
  gain: BigInt,
  debtPaid: BigInt,
  debtAdded: BigInt,
  vaultTotalSupply: BigInt,
  vaultTotalAssets: BigInt,
  vaultTotalDebt: BigInt,
  vaultManagementFee: BigInt,
  vaultPerformanceFee: BigInt,
  strategyPerformanceFee: BigInt,
  strategyDelegatedAssets: BigInt,
  strategyLastReportTimestamp: BigInt,
  vaultCurrentReportTimestamp: BigInt
): RewardType {
  // vault version: 0.4.2-0.4.3
  let duration = vaultCurrentReportTimestamp.minus(strategyLastReportTimestamp);

  vaultTotalDebt = vaultTotalDebt
    .plus(debtPaid)
    .minus(debtAdded)
    .minus(strategyDelegatedAssets);

  // Management Fee
  let reportManagementFee = vaultTotalDebt
    .times(duration)
    .times(vaultManagementFee)
    .div(constants.MAX_BPS)
    .div(constants.SECONDS_PER_YEAR_EXACT);

  let reportStrategistFee = constants.BIGINT_ZERO;
  let reportPerformanceFee = constants.BIGINT_ZERO;
  if (gain.gt(constants.BIGINT_ZERO)) {
    // Strategist Fee
    reportStrategistFee = gain
      .times(strategyPerformanceFee)
      .div(constants.MAX_BPS);

    // Performance Fee
    reportPerformanceFee = gain
      .times(vaultPerformanceFee)
      .div(constants.MAX_BPS);
  }

  let totalFee = reportManagementFee
    .plus(reportStrategistFee)
    .plus(reportPerformanceFee);

  if (totalFee.gt(gain)) {
    totalFee = gain;
  }

  if (totalFee.gt(constants.BIGINT_ZERO)) {
    let totalReward = vaultTotalSupply.isZero()
      ? totalFee
      : totalFee.times(vaultTotalSupply).div(vaultTotalAssets);

    let strategistReward: BigInt = constants.BIGINT_ZERO; 
    if (reportStrategistFee.gt(constants.BIGINT_ZERO)) {
      strategistReward = reportStrategistFee
        .times(totalReward)
        .div(totalFee);
      }
      return new RewardType(strategistReward, totalReward, totalFee);
  }

  return new RewardType(constants.BIGINT_ZERO, constants.BIGINT_ZERO, totalFee);
}

export function strategyReported(
  gain: BigInt,
  debtPaid: BigInt,
  debtAdded: BigInt,
  totalDebt: BigInt,
  event: ethereum.Event,
  vaultAddress: Address,
  strategyAddress: Address
): void {
  const vaultStore = VaultStore.load(vaultAddress.toHexString())!;
  const vaultContract = VaultContract.bind(vaultAddress);

  const vaultVersion = utils.readValue<String>(
    vaultContract.try_apiVersion(),
    constants.VaultVersions.v0_4_3
  );

  // skipping yearn vaults with version less than 0.3.0
  if (vaultVersion.split(".")[1] == "2") {
    return;
  }

  const strategyStore = getOrCreateStrategy(
    vaultAddress,
    strategyAddress,
    constants.BIGINT_ZERO
  );
  const strategyContract = StrategyContract.bind(strategyAddress);

  let vaultManagementFee = utils.readValue<BigInt>(
    vaultContract.try_managementFee(),
    constants.DEFAULT_MANAGEMENT_FEE
  );
  let vaultPerformanceFee = utils.readValue<BigInt>(
    vaultContract.try_performanceFee(),
    constants.DEFAULT_PERFORMANCE_FEE
  );

  let inputToken = Token.load(vaultStore.inputToken);
  let inputTokenAddress = Address.fromString(vaultStore.inputToken);
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);

  let inputTokenDecimals = BigInt.fromI32(10)
    .pow(inputToken!.decimals as u8)
    .toBigDecimal();

  let strategyInfo = getStrategyInfo(vaultAddress, strategyAddress);
  let strategyPerformanceFee = strategyInfo[0];
  let strategyActivation = strategyInfo[2];
  let vaultCurrentReportTimestamp = utils.readValue<BigInt>(
    vaultContract.try_lastReport(),
    constants.BIGINT_ZERO
  );

  let vaultLastReportTimestamp = getVaultLastReport(
    vaultContract,
    vaultStore.lastReport
  );
  const vaultTotalDebt = utils.readValue<BigInt>(
    vaultContract.try_totalDebt(),
    constants.BIGINT_ZERO
  );
  let vaultTotalAssets = vaultStore.totalAssets;

  let reward: RewardType;
  if (vaultVersion == constants.VaultVersions.v0_3_0) {
    reward = calculateStrategistReward_v1(
      gain,
      vaultTotalAssets,
      vaultStore.outputTokenSupply,
      vaultManagementFee,
      vaultPerformanceFee,
      strategyPerformanceFee,
      vaultLastReportTimestamp,
      vaultCurrentReportTimestamp
    );
  } else if (
    vaultVersion == constants.VaultVersions.v0_3_1 ||
    vaultVersion == constants.VaultVersions.v0_3_2 ||
    vaultVersion == constants.VaultVersions.v0_3_3
  ) {
    reward = calculateStrategistReward_v2(
      gain,
      debtPaid,
      debtAdded,
      vaultTotalDebt,
      vaultTotalAssets,
      vaultStore.outputTokenSupply,
      vaultManagementFee,
      vaultPerformanceFee,
      strategyPerformanceFee,
      vaultLastReportTimestamp,
      vaultCurrentReportTimestamp
    );
  } else if (vaultVersion == constants.VaultVersions.v0_3_5) {
    let strategyDelegatedAssets = utils.readValue<BigInt>(
      strategyContract.try_delegatedAssets(),
      constants.BIGINT_ZERO
    );
    reward = calculateStrategistReward_v3(
      gain,
      debtPaid,
      debtAdded,
      vaultTotalDebt,
      vaultTotalAssets,
      vaultStore.outputTokenSupply,
      vaultManagementFee,
      vaultPerformanceFee,
      strategyPerformanceFee,
      strategyDelegatedAssets,
      vaultLastReportTimestamp,
      vaultCurrentReportTimestamp
    );
  } else {
    let strategyDelegatedAssets = utils.readValue<BigInt>(
      strategyContract.try_delegatedAssets(),
      constants.BIGINT_ZERO
    );
    let strategyLastReportTimestamp = getStrategyLastReport(
      strategyActivation,
      strategyStore.lastReport
    );

    reward = calculateStrategistReward_v4(
      gain,
      debtPaid,
      debtAdded,
      vaultStore.outputTokenSupply,
      vaultTotalAssets,
      vaultTotalDebt,
      vaultManagementFee,
      vaultPerformanceFee,
      strategyPerformanceFee,
      strategyDelegatedAssets,
      strategyLastReportTimestamp,
      vaultCurrentReportTimestamp
    );
  }

  let gainUSD = inputTokenPrice.usdPrice
    .times(gain.toBigDecimal())
    .div(inputTokenDecimals)
    .div(inputTokenPrice.decimalsBaseTen);

  let outputTokenPriceUSD = getPriceOfOutputTokens(
    vaultAddress,
    inputTokenAddress,
    inputTokenDecimals
  );

  let protocolReward = reward.totalSharesMinted;

  let protocolSideRevenueUSD = protocolReward
    .toBigDecimal()
    .div(inputTokenDecimals)
    .times(outputTokenPriceUSD);
  let supplySideRevenueUSD = gainUSD.minus(protocolSideRevenueUSD);
  let totalRevenueUSD = supplySideRevenueUSD.plus(protocolSideRevenueUSD);

  vaultStore.outputTokenSupply = vaultStore.outputTokenSupply.plus(
    reward.totalSharesMinted
  );
  vaultStore.totalAssets = vaultStore.totalAssets.plus(debtAdded);

  vaultStore.cumulativeSupplySideRevenueUSD = vaultStore.cumulativeSupplySideRevenueUSD.plus(
    supplySideRevenueUSD
  );
  vaultStore.cumulativeProtocolSideRevenueUSD = vaultStore.cumulativeProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );
  vaultStore.cumulativeTotalRevenueUSD = vaultStore.cumulativeTotalRevenueUSD.plus(
    totalRevenueUSD
  );
  vaultStore.lastReport = vaultCurrentReportTimestamp;
  vaultStore.save();

  strategyStore.totalDebt = totalDebt;
  strategyStore.lastReport = vaultCurrentReportTimestamp;
  strategyStore.save();

  updateFinancialsAfterReport(
    event.block,
    totalRevenueUSD,
    supplySideRevenueUSD,
    protocolSideRevenueUSD
  );
  updateVaultSnapshotsAfterReport(
    vaultStore,
    event.block,
    totalRevenueUSD,
    supplySideRevenueUSD,
    protocolSideRevenueUSD
  );

  log.warning(
    "[StrategyReported] vault: {}, version: {}, strategyAddress: {}, totalFee: {}, totalSharesMinted: {}, strategistReward: {}, \
    outputTokenSupply: {}, vaultTotalDebt: {}, vaultTotalAssets: {}, vaultLastReport: {}, vaultCurrentReport: {}, outputTokenPriceUSD: {}, \
    StrategyPerfFee: {}, VaultPerfFee: {}, VaultManageFee: {}, SupplySideRevenueUSD: {}, TxnHash: {}",
    [
      vaultStore.id,
      vaultVersion.toString(),
      strategyAddress.toHexString(),
      reward.totalFee.toString(),
      reward.totalSharesMinted.toString(),
      reward.strategistReward.toString(),
      vaultStore.outputTokenSupply.toString(),
      vaultTotalDebt.toString(),
      vaultTotalAssets.toString(),
      vaultLastReportTimestamp.toString(),
      vaultCurrentReportTimestamp.toString(),
      outputTokenPriceUSD.toString(),
      strategyPerformanceFee.toString(),
      vaultPerformanceFee.toString(),
      vaultManagementFee.toString(),
      supplySideRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function updateFinancialsAfterReport(
  block: ethereum.Block,
  totalRevenueUSD: BigDecimal,
  supplySideRevenueUSD: BigDecimal,
  protocolSideRevenueUSD: BigDecimal
): void {
  const financialMetrics = getOrCreateFinancialDailySnapshots(block);
  const protocol = getOrCreateYieldAggregator();

  // TotalRevenueUSD Metrics
  financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(
    totalRevenueUSD
  );
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(
    totalRevenueUSD
  );
  financialMetrics.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;

  // SupplySideRevenueUSD Metrics
  financialMetrics.dailySupplySideRevenueUSD = financialMetrics.dailySupplySideRevenueUSD.plus(
    supplySideRevenueUSD
  );
  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(
    supplySideRevenueUSD
  );
  financialMetrics.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;

  // ProtocolSideRevenueUSD Metrics
  financialMetrics.dailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );
  financialMetrics.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;

  financialMetrics.save();
  protocol.save();
}

export function updateVaultSnapshotsAfterReport(
  vault: VaultStore,
  block: ethereum.Block,
  totalRevenueUSD: BigDecimal,
  supplySideRevenueUSD: BigDecimal,
  protocolSideRevenueUSD: BigDecimal
): void {
  let vaultDailySnapshot = getOrCreateVaultsDailySnapshots(vault.id, block);
  let vaultHourlySnapshot = getOrCreateVaultsHourlySnapshots(vault.id, block);

  vaultDailySnapshot.cumulativeSupplySideRevenueUSD =
    vault.cumulativeSupplySideRevenueUSD;
  vaultDailySnapshot.dailySupplySideRevenueUSD = vaultDailySnapshot.dailySupplySideRevenueUSD.plus(
    supplySideRevenueUSD
  );
  vaultDailySnapshot.cumulativeProtocolSideRevenueUSD =
    vault.cumulativeProtocolSideRevenueUSD;
  vaultDailySnapshot.dailyProtocolSideRevenueUSD = vaultDailySnapshot.dailyProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );
  vaultDailySnapshot.cumulativeTotalRevenueUSD =
    vault.cumulativeTotalRevenueUSD;
  vaultDailySnapshot.dailyTotalRevenueUSD = vaultDailySnapshot.dailyTotalRevenueUSD.plus(
    totalRevenueUSD
  );

  vaultHourlySnapshot.cumulativeSupplySideRevenueUSD =
    vault.cumulativeSupplySideRevenueUSD;
  vaultHourlySnapshot.hourlySupplySideRevenueUSD = vaultHourlySnapshot.hourlySupplySideRevenueUSD.plus(
    supplySideRevenueUSD
  );
  vaultHourlySnapshot.cumulativeProtocolSideRevenueUSD =
    vault.cumulativeProtocolSideRevenueUSD;
  vaultHourlySnapshot.hourlyProtocolSideRevenueUSD = vaultHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );
  vaultHourlySnapshot.cumulativeTotalRevenueUSD =
    vault.cumulativeTotalRevenueUSD;
  vaultHourlySnapshot.hourlyTotalRevenueUSD = vaultHourlySnapshot.hourlyTotalRevenueUSD.plus(
    totalRevenueUSD
  );

  vaultHourlySnapshot.save();
  vaultDailySnapshot.save();
}
