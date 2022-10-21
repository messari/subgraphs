import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { YakStrategyV2 } from "../../generated/YakStrategyV2/YakStrategyV2";
import { convertBigIntToBigDecimal } from "../helpers/converters";
import { DEFUALT_AMOUNT, ZERO_BIGDECIMAL, ZERO_BIGINT } from "../helpers/constants";
import { initProtocol } from "../initializers/protocolInitializer";
import { initVault } from "../initializers/vaultInitializer";
import { isUserAccountUniq } from "../helpers/utils";
import { initActiveAccount } from "../initializers/activeAccountInitializer";
import { initVaultDailySnapshot } from "../initializers/vaultDailySnapshotInitializer";
import { initVaultHourlySnapshot } from "../initializers/vaultHourlySnapshotInitializer";
import { initUsageMetricsDailySnapshot } from "../initializers/usageMetricsDailySnapshotInitializer";
import { initUsageMetricsHourlySnapshot } from "../initializers/usageMetricsHourlySnapshotInitializer";
import { initFinancialsDailySnapshot } from "../initializers/financialsDailySnapshotInitializer";
import { calculatePriceInUSD } from "../calculators/priceInUSDCalculator";
import { calculateOutputTokenPriceInUSD } from "../calculators/outputTokenPriceInUSDCalculator";

export function updateDailyOrHourlyEntities(contractAddress: Address,
  timestamp: BigInt,
  blockNumber: BigInt): void {
  updateProtocol(contractAddress)
  updateVault(contractAddress, timestamp, blockNumber)
  updateVaultDailySnapshot(contractAddress, timestamp, blockNumber)
  updateVaultHourlySnapshot(contractAddress, timestamp, blockNumber)
  updateUsageMetricsDailySnapshot(contractAddress, timestamp, blockNumber)
  updateUsageMetricsHourlySnapshot(contractAddress, timestamp, blockNumber)
  updateFinancialsDailySnapshot(contractAddress, timestamp, blockNumber)
}

function updateProtocol(contractAddress: Address): void {
  const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);
  const protocol = initProtocol(contractAddress);
  protocol.totalPoolCount += 1;
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(protocol.cumulativeProtocolSideRevenueUSD);

  if (yakStrategyV2Contract.try_depositToken().reverted) {
    protocol.totalValueLockedUSD = ZERO_BIGDECIMAL;
  } else {
    protocol.totalValueLockedUSD = calculatePriceInUSD(yakStrategyV2Contract.depositToken(), DEFUALT_AMOUNT)
      .times(convertBigIntToBigDecimal(yakStrategyV2Contract.totalDeposits(), 18));
  }

  const isAccountUniqe = isUserAccountUniq(contractAddress);
  protocol.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers + isAccountUniqe.toI32();
  protocol.save();
}

function updateVault(contractAddress: Address, timestamp: BigInt, blockNumber: BigInt): void {
  const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);
  const vault = initVault(contractAddress, timestamp, blockNumber);

  if (yakStrategyV2Contract.try_totalSupply().reverted) {
    vault.outputTokenSupply = ZERO_BIGINT;
    vault.stakedOutputTokenAmount = ZERO_BIGINT;
  } else {
    vault.outputTokenSupply = yakStrategyV2Contract.totalSupply();
    vault.stakedOutputTokenAmount = yakStrategyV2Contract.totalSupply();
  }
  if (yakStrategyV2Contract.try_totalDeposits().reverted) {
    vault.inputTokenBalance = ZERO_BIGINT;
  } else {
    vault.inputTokenBalance = yakStrategyV2Contract.totalDeposits();
    if (yakStrategyV2Contract.try_depositToken().reverted) {
      vault.totalValueLockedUSD = ZERO_BIGDECIMAL;
    } else {
      vault.totalValueLockedUSD = calculatePriceInUSD(yakStrategyV2Contract.depositToken(), DEFUALT_AMOUNT).times(convertBigIntToBigDecimal(yakStrategyV2Contract.totalDeposits(), 18));
    }
  }
  if (yakStrategyV2Contract.try_getDepositTokensForShares(DEFUALT_AMOUNT).reverted) {
    vault.pricePerShare = ZERO_BIGDECIMAL;
  } else {
    vault.pricePerShare = convertBigIntToBigDecimal(yakStrategyV2Contract.getDepositTokensForShares(DEFUALT_AMOUNT), 18);
  }
  vault.outputTokenPriceUSD = calculateOutputTokenPriceInUSD(contractAddress);

  vault.save();
}

function updateVaultDailySnapshot(contractAddress: Address,
  timestamp: BigInt,
  blockNumber: BigInt): void {
  const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);
  const vaultDailySnapshotEntity = initVaultDailySnapshot(timestamp, blockNumber, contractAddress);

  if (yakStrategyV2Contract.try_totalSupply().reverted) {
    vaultDailySnapshotEntity.outputTokenSupply = ZERO_BIGINT;
  } else {
    vaultDailySnapshotEntity.outputTokenSupply = yakStrategyV2Contract.totalSupply();
  }

  if (yakStrategyV2Contract.try_totalSupply().reverted) {
    vaultDailySnapshotEntity.outputTokenSupply = ZERO_BIGINT;
    vaultDailySnapshotEntity.stakedOutputTokenAmount = ZERO_BIGINT;
  } else {
    vaultDailySnapshotEntity.outputTokenSupply = yakStrategyV2Contract.totalSupply();
    vaultDailySnapshotEntity.stakedOutputTokenAmount = yakStrategyV2Contract.totalSupply();
  }
  if (yakStrategyV2Contract.try_totalDeposits().reverted) {
    vaultDailySnapshotEntity.inputTokenBalance = ZERO_BIGINT;
  } else {
    vaultDailySnapshotEntity.inputTokenBalance = yakStrategyV2Contract.totalDeposits()
    if (yakStrategyV2Contract.try_depositToken().reverted) {
      vaultDailySnapshotEntity.totalValueLockedUSD = ZERO_BIGDECIMAL;
    } else {
      vaultDailySnapshotEntity.totalValueLockedUSD = calculatePriceInUSD(yakStrategyV2Contract.depositToken(), DEFUALT_AMOUNT).times(convertBigIntToBigDecimal(yakStrategyV2Contract.totalDeposits(), 18));
    }
  }
  if (yakStrategyV2Contract.try_getDepositTokensForShares(DEFUALT_AMOUNT).reverted) {
    vaultDailySnapshotEntity.pricePerShare = ZERO_BIGDECIMAL;
  } else {
    vaultDailySnapshotEntity.pricePerShare = convertBigIntToBigDecimal(yakStrategyV2Contract.getDepositTokensForShares(DEFUALT_AMOUNT), 18);
  }
  vaultDailySnapshotEntity.outputTokenPriceUSD = calculateOutputTokenPriceInUSD(contractAddress);

  vaultDailySnapshotEntity.save();
}

function updateVaultHourlySnapshot(contractAddress: Address,
  timestamp: BigInt,
  blockNumber: BigInt): void {
  const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);
  const vaultHourlySnapshotEntity = initVaultHourlySnapshot(timestamp, blockNumber, contractAddress);
  if (yakStrategyV2Contract.try_totalSupply().reverted) {
    vaultHourlySnapshotEntity.outputTokenSupply = ZERO_BIGINT;
    vaultHourlySnapshotEntity.stakedOutputTokenAmount = ZERO_BIGINT;
  } else {
    vaultHourlySnapshotEntity.outputTokenSupply = yakStrategyV2Contract.totalSupply();
    vaultHourlySnapshotEntity.stakedOutputTokenAmount = yakStrategyV2Contract.totalSupply();
  }

  if (yakStrategyV2Contract.try_totalDeposits().reverted) {
    vaultHourlySnapshotEntity.inputTokenBalance = ZERO_BIGINT;
  } else {
    vaultHourlySnapshotEntity.inputTokenBalance = yakStrategyV2Contract.totalDeposits()
    if (yakStrategyV2Contract.try_depositToken().reverted) {
      vaultHourlySnapshotEntity.totalValueLockedUSD = ZERO_BIGDECIMAL;
    } else {
      vaultHourlySnapshotEntity.totalValueLockedUSD = calculatePriceInUSD(yakStrategyV2Contract.depositToken(), DEFUALT_AMOUNT).times(convertBigIntToBigDecimal(yakStrategyV2Contract.totalDeposits(), 18));
    }
  }
  if (yakStrategyV2Contract.try_getDepositTokensForShares(DEFUALT_AMOUNT).reverted) {
    vaultHourlySnapshotEntity.pricePerShare = ZERO_BIGDECIMAL;
  } else {
    vaultHourlySnapshotEntity.pricePerShare = convertBigIntToBigDecimal(yakStrategyV2Contract.getDepositTokensForShares(DEFUALT_AMOUNT), 18);
  }
  vaultHourlySnapshotEntity.outputTokenPriceUSD = calculateOutputTokenPriceInUSD(contractAddress);

  vaultHourlySnapshotEntity.save();
}

function updateUsageMetricsDailySnapshot(contractAddress: Address,
  timestamp: BigInt,
  blockNumber: BigInt): void {
  const protocol = initProtocol(contractAddress);
  const isDailyAccountUniqe = initActiveAccount(contractAddress, timestamp, "d");
  const usageMetricsDailySnapshotEntity = initUsageMetricsDailySnapshot(timestamp, blockNumber, contractAddress);
  usageMetricsDailySnapshotEntity.dailyTransactionCount = usageMetricsDailySnapshotEntity.dailyTransactionCount + 1;
  usageMetricsDailySnapshotEntity.dailyActiveUsers = usageMetricsDailySnapshotEntity.dailyActiveUsers + isDailyAccountUniqe.toI32();
  usageMetricsDailySnapshotEntity.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetricsDailySnapshotEntity.save();
}

function updateUsageMetricsHourlySnapshot(contractAddress: Address,
  timestamp: BigInt,
  blockNumber: BigInt): void {
  const protocol = initProtocol(contractAddress);
  const isHourlyAccountUniqe = initActiveAccount(contractAddress, timestamp, "h");
  const usageMetricsHourlySnapshotEntity = initUsageMetricsHourlySnapshot(timestamp, blockNumber, contractAddress);
  usageMetricsHourlySnapshotEntity.hourlyTransactionCount = usageMetricsHourlySnapshotEntity.hourlyTransactionCount + 1;
  usageMetricsHourlySnapshotEntity.hourlyActiveUsers = usageMetricsHourlySnapshotEntity.hourlyActiveUsers + isHourlyAccountUniqe.toI32();
  usageMetricsHourlySnapshotEntity.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetricsHourlySnapshotEntity.save();
}

function updateFinancialsDailySnapshot(contractAddress: Address,
  timestamp: BigInt,
  blockNumber: BigInt): void {
  const protocol = initProtocol(contractAddress);
  const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);
  const financialsDailySnapshotEntity = initFinancialsDailySnapshot(timestamp, blockNumber, contractAddress);
  financialsDailySnapshotEntity.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
  financialsDailySnapshotEntity.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
  financialsDailySnapshotEntity.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  financialsDailySnapshotEntity.totalValueLockedUSD = calculatePriceInUSD(yakStrategyV2Contract.depositToken(), DEFUALT_AMOUNT).times(convertBigIntToBigDecimal(yakStrategyV2Contract.totalDeposits(), 18));
  financialsDailySnapshotEntity.save();
}