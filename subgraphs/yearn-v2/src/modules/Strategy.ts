import * as utils from "../common/utils";
import * as constants from "../common/constants";
import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import {
  getOrCreateYieldAggregator,
  getOrCreateFinancialDailySnapshots,
  getOrCreateStrategy,
} from "../common/initializers";
import { getUsdPricePerToken } from "../Prices";
import { getPriceOfOutputTokens } from "./Price";
import { Vault as VaultContract } from "../../generated/Registry_v1/Vault";
import { Token, _Strategy, Vault as VaultStore } from "../../generated/schema";
import { Strategy as StrategyContract } from "../../generated/templates/Vault/Strategy";

export function getVaultLastReport(
  vaultContract: VaultContract,
  storeLastReport: BigInt
): BigInt {
  if (storeLastReport.equals(constants.BIGINT_ZERO)) {
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
  strategyAddress: Address,
  vaultContract: VaultContract
): BigInt[] {
  let performanceFee: BigInt = constants.BIGINT_ZERO;
  let lastReport: BigInt = constants.BIGINT_ZERO;
  let activation: BigInt = constants.BIGINT_ZERO;

  let strategyData_v1 = vaultContract.try_strategies_v1(strategyAddress);
  if (strategyData_v1.reverted) {
    let strategyData_v2 = vaultContract.try_strategies_v2(strategyAddress);

    if (strategyData_v2.reverted) {
      lastReport = utils.readValue<BigInt>(
        vaultContract.try_lastReport(),
        constants.BIGINT_ZERO
      );

      return [constants.DEFAULT_PERFORMANCE_FEE, lastReport, constants.BIGINT_ZERO];
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
  totalSharesMinted: BigInt,
  vaultManagementFee: BigInt,
  vaultPerformanceFee: BigInt,
  strategyPerformanceFee: BigInt,
  vaultLastReportTimestamp: BigInt,
  vaultCurrentReportTimestamp: BigInt
): BigInt {
  // vault version: 0.3.0 - 0.3.2
  let duration = vaultCurrentReportTimestamp.minus(vaultLastReportTimestamp);

  // Management Fee
  let reportManagementFee = vaultTotalAssets
    .minus(gain)
    .times(duration)
    .times(vaultManagementFee)
    .div(constants.MAX_BPS)
    .div(constants.SECONDS_PER_YEAR);

  // Strategist Fee
  let reportStrategistFee = gain
    .times(strategyPerformanceFee)
    .div(constants.MAX_BPS);

  // Performance Fee
  let reportPerformanceFee = gain
    .times(vaultPerformanceFee)
    .div(constants.MAX_BPS);

  let totalFee = reportManagementFee
    .plus(reportStrategistFee)
    .plus(reportPerformanceFee);

  if (totalFee.gt(constants.BIGINT_ZERO)) {
    let totalReward = totalSharesMinted;

    if (reportStrategistFee.gt(constants.BIGINT_ZERO)) {
      let strategistReward = reportStrategistFee
        .times(totalReward)
        .div(totalFee);

      return strategistReward;
    }
  }

  return constants.BIGINT_ZERO;
}

export function calculateStrategistReward_v2(
  gain: BigInt,
  debtAdded: BigInt,
  debtPaid: BigInt,
  vaultTotalDebt: BigInt,
  totalSharesMinted: BigInt,
  vaultManagementFee: BigInt,
  vaultPerformanceFee: BigInt,
  strategyPerformanceFee: BigInt,
  vaultLastReportTimestamp: BigInt,
  vaultCurrentReportTimestamp: BigInt
): BigInt {
  // vault version: 0.3.3
  let duration = vaultCurrentReportTimestamp.minus(vaultLastReportTimestamp);

  // Management Fee
  let reportManagementFee = vaultTotalDebt
    .minus(debtAdded)
    .plus(debtPaid)
    .times(duration)
    .times(vaultManagementFee)
    .div(constants.MAX_BPS)
    .div(constants.SECONDS_PER_YEAR_EXACT);

  // Strategist Fee
  let reportStrategistFee = gain
    .times(strategyPerformanceFee)
    .div(constants.MAX_BPS);

  // Performance Fee
  let reportPerformanceFee = gain
    .times(vaultPerformanceFee)
    .div(constants.MAX_BPS);

  let totalFee = reportManagementFee
    .plus(reportStrategistFee)
    .plus(reportPerformanceFee);

  if (totalFee.gt(constants.BIGINT_ZERO)) {
    let totalReward = totalSharesMinted;

    if (reportStrategistFee.gt(constants.BIGINT_ZERO)) {
      let strategistReward = reportStrategistFee
        .times(totalReward)
        .div(totalFee);

      return strategistReward;
    }
  }

  return constants.BIGINT_ZERO;
}

export function calculateStrategistReward_v3(
  gain: BigInt,
  debtAdded: BigInt,
  debtPaid: BigInt,
  vaultTotalDebt: BigInt,
  totalSharesMinted: BigInt,
  vaultManagementFee: BigInt,
  vaultPerformanceFee: BigInt,
  strategyPerformanceFee: BigInt,
  strategyDelegatedAssets: BigInt,
  strategyLastReportTimestamp: BigInt,
  vaultCurrentReportTimestamp: BigInt
): BigInt {
  // vault version: 0.3.5 +
  let duration = vaultCurrentReportTimestamp.minus(strategyLastReportTimestamp);

  // Management Fee
  let reportManagementFee = vaultTotalDebt
    .minus(debtAdded)
    .plus(debtPaid)
    .minus(strategyDelegatedAssets)
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
    let totalReward = totalSharesMinted;

    if (reportStrategistFee.gt(constants.BIGINT_ZERO)) {
      let strategistReward = reportStrategistFee
        .times(totalReward)
        .div(totalFee);

      return strategistReward;
    }
  }

  return constants.BIGINT_ZERO;
}

export function strategyReported(
  gain: BigInt,
  debtAdded: BigInt,
  debtPaid: BigInt,
  totalDebt: BigInt,
  event: ethereum.Event,
  vaultAddress: Address,
  strategyAddress: Address,
): void {
  if (gain.equals(constants.BIGINT_ZERO)) {
    return;
  }

  const vaultStore = VaultStore.load(vaultAddress.toHexString())!;
  const strategyStore = getOrCreateStrategy(
    vaultAddress,
    strategyAddress,
    constants.BIGINT_ZERO
  );

  const vaultContract = VaultContract.bind(vaultAddress);
  const strategyContract = StrategyContract.bind(strategyAddress);

  const vaultVersion = utils.readValue<String>(
    vaultContract.try_apiVersion(),
    constants.VAULT_VERSION_LATEST
  );

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

  let totalSupply = vaultContract.totalSupply();
  let totalSharesMinted = totalSupply.minus(vaultStore.outputTokenSupply);

  let strategyInfo = getStrategyInfo(strategyAddress, vaultContract);
  let strategyPerformanceFee = strategyInfo[0];
  let vaultCurrentReportTimestamp = strategyInfo[1];
  let strategyActivation = strategyInfo[2];

  let strategistReward = constants.BIGINT_ZERO;
  if (
    vaultVersion == constants.VAULT_VERSION_0_3_0 ||
    vaultVersion == constants.VAULT_VERSION_0_3_2
  ) {
    let vaultTotalAssets = utils.readValue<BigInt>(
      vaultContract.try_totalAssets(),
      constants.BIGINT_ZERO
    );
    let vaultLastReportTimestamp = getVaultLastReport(
      vaultContract,
      vaultStore.lastReport
    );

    strategistReward = calculateStrategistReward_v1(
      gain,
      vaultTotalAssets,
      totalSharesMinted,
      vaultManagementFee,
      vaultPerformanceFee,
      strategyPerformanceFee,
      vaultLastReportTimestamp,
      vaultCurrentReportTimestamp
    );
  } else if (vaultVersion == constants.VAULT_VERSION_0_3_3) {
    let vaultTotalDebt = utils.readValue<BigInt>(
      vaultContract.try_totalDebt(),
      constants.BIGINT_ZERO
    );
    let vaultLastReportTimestamp = getVaultLastReport(
      vaultContract,
      vaultStore.lastReport
    );

    strategistReward = calculateStrategistReward_v2(
      gain,
      debtAdded,
      debtPaid,
      vaultTotalDebt,
      totalSharesMinted,
      vaultManagementFee,
      vaultPerformanceFee,
      strategyPerformanceFee,
      vaultLastReportTimestamp,
      vaultCurrentReportTimestamp
    );
  } else {
    let vaultTotalDebt = utils.readValue<BigInt>(
      vaultContract.try_totalDebt(),
      constants.BIGINT_ZERO
    );
    let strategyDelegatedAssets = utils.readValue<BigInt>(
      strategyContract.try_delegatedAssets(),
      constants.BIGINT_ZERO
    );
    let strategyLastReportTimestamp = getStrategyLastReport(
      strategyActivation,
      strategyStore.lastReport
    );

    strategistReward = calculateStrategistReward_v3(
      gain,
      debtAdded,
      debtPaid,
      vaultTotalDebt,
      totalSharesMinted,
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

  let outputTokenPriceUsd = getPriceOfOutputTokens(
    vaultAddress,
    inputTokenAddress,
    inputTokenDecimals
  );

  let strategistRevenueUSD = strategistReward
    .toBigDecimal()
    .div(inputTokenDecimals)
    .times(outputTokenPriceUsd);
  
  let protocolReward = totalSharesMinted.minus(strategistReward);
  let protocolSideRevenueUSD = protocolReward
    .toBigDecimal()
    .div(inputTokenDecimals)
    .times(outputTokenPriceUsd);

  let supplySideRevenueUSD = gainUSD
    .minus(protocolSideRevenueUSD)
    .minus(strategistRevenueUSD);
  let totalRevenueUSD = supplySideRevenueUSD
    .plus(protocolSideRevenueUSD)
    .plus(strategistRevenueUSD);

  vaultStore.inputTokenBalance = vaultStore.inputTokenBalance.plus(gain);
  vaultStore.outputTokenSupply = totalSupply;
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

  log.warning(
    "[StrategyReported] vaultAddress: {}, strategyAddress: {}, totalSharesMinted: {}, outputTokenPrice: {}, \
    strategistReward: {}, totalRevenueUSD: {}, supplySideRevenueUSD: {}, protocolSideRevenueUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      strategyAddress.toHexString(),
      totalSharesMinted.toString(),
      outputTokenPriceUsd.toString(),
      strategistReward.toString(),
      totalRevenueUSD.toString(),
      supplySideRevenueUSD.toString(),
      protocolSideRevenueUSD.toString(),
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
  const protocol = getOrCreateYieldAggregator(constants.ETHEREUM_PROTOCOL_ID);

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
