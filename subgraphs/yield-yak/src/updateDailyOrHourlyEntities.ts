import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { YakStrategyV2 } from "../generated/YakStrategyV2/YakStrategyV2";
import { calculatePriceInUSD, calculateOutputTokenPriceInUSD } from "./helpers/calculators";
import { convertBINumToDesiredDecimals } from "./helpers/converters";
import { DEFUALT_AMOUNT, ZERO_BIGDECIMAL, ZERO_BIGINT } from "./utils/constants";
import { 
    defineAccount,
    defineActiveAccount,
    defineProtocol, 
    defineVault, 
    defineVaultDailySnapshot, 
    defineVaultHourlySnapshot,
    defineUsageMetricsDailySnapshotEntity,
    defineUsageMetricsHourlySnapshot,
    defineFinancialsDailySnapshotEntity
} from "./utils/initial";

export function updateDailyOrHourlyEntities(contractAddress: Address, 
    timestamp: BigInt, 
    blockNumber: BigInt): void {
    protocolUpdater(contractAddress)
    vaultUpdater(contractAddress, timestamp, blockNumber)
    vaultDailySnapshotUpdater(contractAddress, timestamp, blockNumber)
    vaultHourlySnapshotUpdater(contractAddress, timestamp, blockNumber)
    usageMetricsDailySnapshotUpdater(contractAddress, timestamp, blockNumber)
    usageMetricsHourlySnapshotUpdater(contractAddress, timestamp, blockNumber)
    financialsDailySnapshotUpdater(contractAddress, timestamp, blockNumber)
  }

  function protocolUpdater(contractAddress: Address): void {
    const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);
    const protocol = defineProtocol(contractAddress);
    
    if (yakStrategyV2Contract.try_depositToken().reverted) {
      protocol.totalValueLockedUSD = ZERO_BIGDECIMAL;
    } else {
      protocol.totalValueLockedUSD = calculatePriceInUSD(yakStrategyV2Contract.depositToken(), DEFUALT_AMOUNT).times(convertBINumToDesiredDecimals(yakStrategyV2Contract.totalDeposits(), 18));
    }
    const isAccountUniqe = defineAccount(contractAddress);
    protocol.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers + isAccountUniqe.toI32();
    protocol.save();
  }

  function vaultUpdater(contractAddress: Address, timestamp: BigInt, blockNumber: BigInt): void {
    const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);
    const vault = defineVault(contractAddress, timestamp, blockNumber);
  
    if (yakStrategyV2Contract.try_totalSupply().reverted) {
      vault.outputTokenSupply = ZERO_BIGINT;
      vault.stakedOutputTokenAmount = ZERO_BIGINT;
    } else {
      vault.outputTokenSupply = yakStrategyV2Contract.totalSupply();
      vault.stakedOutputTokenAmount = yakStrategyV2Contract.totalSupply();
    }
    log.debug('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', [yakStrategyV2Contract.MIN_TOKENS_TO_REINVEST.toString()]);
    if (yakStrategyV2Contract.try_totalDeposits().reverted) {
      vault.inputTokenBalance = ZERO_BIGINT;
    } else {
      vault.inputTokenBalance = yakStrategyV2Contract.totalDeposits();
      if (yakStrategyV2Contract.try_depositToken().reverted) {
        vault.totalValueLockedUSD = ZERO_BIGDECIMAL;
      } else {
        vault.totalValueLockedUSD = calculatePriceInUSD(yakStrategyV2Contract.depositToken(), DEFUALT_AMOUNT).times(convertBINumToDesiredDecimals(yakStrategyV2Contract.totalDeposits(), 18));
      }
    }
    if (yakStrategyV2Contract.try_getDepositTokensForShares(DEFUALT_AMOUNT).reverted) {
      vault.pricePerShare = ZERO_BIGDECIMAL;
    } else {
      vault.pricePerShare = convertBINumToDesiredDecimals(yakStrategyV2Contract.getDepositTokensForShares(DEFUALT_AMOUNT), 18);
    }
    vault.outputTokenPriceUSD = calculateOutputTokenPriceInUSD(contractAddress);
  
    vault.save();
  }

  function vaultDailySnapshotUpdater(contractAddress: Address, 
    timestamp: BigInt, 
    blockNumber: BigInt): void {
    const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);
    const vaultDailySnapshotEntity = defineVaultDailySnapshot(timestamp, blockNumber, contractAddress);
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
    log.debug('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', [yakStrategyV2Contract.MIN_TOKENS_TO_REINVEST.toString()]);
    if (yakStrategyV2Contract.try_totalDeposits().reverted) {
      vaultDailySnapshotEntity.inputTokenBalance = ZERO_BIGINT;
    } else {
      vaultDailySnapshotEntity.inputTokenBalance = yakStrategyV2Contract.totalDeposits()
      if (yakStrategyV2Contract.try_depositToken().reverted) {
        vaultDailySnapshotEntity.totalValueLockedUSD = ZERO_BIGDECIMAL;
      } else {
        vaultDailySnapshotEntity.totalValueLockedUSD = calculatePriceInUSD(yakStrategyV2Contract.depositToken(), DEFUALT_AMOUNT).times(convertBINumToDesiredDecimals(yakStrategyV2Contract.totalDeposits(), 18));
      }
    }
    if (yakStrategyV2Contract.try_getDepositTokensForShares(DEFUALT_AMOUNT).reverted) {
      vaultDailySnapshotEntity.pricePerShare = ZERO_BIGDECIMAL;
    } else {
      vaultDailySnapshotEntity.pricePerShare = convertBINumToDesiredDecimals(yakStrategyV2Contract.getDepositTokensForShares(DEFUALT_AMOUNT), 18);
    }
    vaultDailySnapshotEntity.outputTokenPriceUSD = calculateOutputTokenPriceInUSD(contractAddress);
  
    vaultDailySnapshotEntity.save();
  }

  function vaultHourlySnapshotUpdater(contractAddress: Address,
    timestamp: BigInt, 
    blockNumber: BigInt): void {
    const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);
    const vaultHourlySnapshotEntity = defineVaultHourlySnapshot(timestamp, blockNumber, contractAddress);
    if (yakStrategyV2Contract.try_totalSupply().reverted) {
      vaultHourlySnapshotEntity.outputTokenSupply = ZERO_BIGINT;
      vaultHourlySnapshotEntity.stakedOutputTokenAmount = ZERO_BIGINT;
    } else {
      vaultHourlySnapshotEntity.outputTokenSupply = yakStrategyV2Contract.totalSupply();
      vaultHourlySnapshotEntity.stakedOutputTokenAmount = yakStrategyV2Contract.totalSupply();
    }

    log.debug('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', [yakStrategyV2Contract.MIN_TOKENS_TO_REINVEST.toString()]);
    if (yakStrategyV2Contract.try_totalDeposits().reverted) {
      vaultHourlySnapshotEntity.inputTokenBalance = ZERO_BIGINT;
    } else {
      vaultHourlySnapshotEntity.inputTokenBalance = yakStrategyV2Contract.totalDeposits()
      if (yakStrategyV2Contract.try_depositToken().reverted) {
        vaultHourlySnapshotEntity.totalValueLockedUSD = ZERO_BIGDECIMAL;
      } else {
        vaultHourlySnapshotEntity.totalValueLockedUSD = calculatePriceInUSD(yakStrategyV2Contract.depositToken(), DEFUALT_AMOUNT).times(convertBINumToDesiredDecimals(yakStrategyV2Contract.totalDeposits(), 18));
      }
    }
    if (yakStrategyV2Contract.try_getDepositTokensForShares(DEFUALT_AMOUNT).reverted) {
      vaultHourlySnapshotEntity.pricePerShare = ZERO_BIGDECIMAL;
    } else {
      vaultHourlySnapshotEntity.pricePerShare = convertBINumToDesiredDecimals(yakStrategyV2Contract.getDepositTokensForShares(DEFUALT_AMOUNT), 18);
    }
    vaultHourlySnapshotEntity.outputTokenPriceUSD = calculateOutputTokenPriceInUSD(contractAddress);
  
    vaultHourlySnapshotEntity.save();
  }

  function usageMetricsDailySnapshotUpdater(contractAddress: Address, 
    timestamp: BigInt, 
    blockNumber: BigInt): void {
    const protocol = defineProtocol(contractAddress);
    const isDailyAccountUniqe = defineActiveAccount(contractAddress, timestamp, "d");
    const usageMetricsDailySnapshotEntity = defineUsageMetricsDailySnapshotEntity(timestamp, blockNumber, contractAddress);
    usageMetricsDailySnapshotEntity.dailyTransactionCount = usageMetricsDailySnapshotEntity.dailyTransactionCount + 1;
    usageMetricsDailySnapshotEntity.dailyActiveUsers = usageMetricsDailySnapshotEntity.dailyActiveUsers + isDailyAccountUniqe.toI32();
    usageMetricsDailySnapshotEntity.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
    usageMetricsDailySnapshotEntity.save();
  }

  function usageMetricsHourlySnapshotUpdater(contractAddress: Address, 
    timestamp: BigInt, 
    blockNumber: BigInt): void {
    const protocol = defineProtocol(contractAddress);
    const isHourlyAccountUniqe = defineActiveAccount(contractAddress, timestamp, "h");
    const usageMetricsHourlySnapshotEntity = defineUsageMetricsHourlySnapshot(timestamp, blockNumber, contractAddress);
    usageMetricsHourlySnapshotEntity.hourlyTransactionCount = usageMetricsHourlySnapshotEntity.hourlyTransactionCount + 1;
    usageMetricsHourlySnapshotEntity.hourlyActiveUsers = usageMetricsHourlySnapshotEntity.hourlyActiveUsers + isHourlyAccountUniqe.toI32();
    usageMetricsHourlySnapshotEntity.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
    usageMetricsHourlySnapshotEntity.save();
  }

  function financialsDailySnapshotUpdater(contractAddress: Address, 
    timestamp: BigInt, 
    blockNumber: BigInt): void {
    const protocol = defineProtocol(contractAddress);
    const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);
    const financialsDailySnapshotEntity = defineFinancialsDailySnapshotEntity(timestamp, blockNumber, contractAddress);
    financialsDailySnapshotEntity.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
    financialsDailySnapshotEntity.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
    financialsDailySnapshotEntity.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
    financialsDailySnapshotEntity.totalValueLockedUSD = calculatePriceInUSD (yakStrategyV2Contract.depositToken(), DEFUALT_AMOUNT).times(convertBINumToDesiredDecimals(yakStrategyV2Contract.totalDeposits(), 18));
    financialsDailySnapshotEntity.save();
  }