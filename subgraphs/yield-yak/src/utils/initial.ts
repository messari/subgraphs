import { Address, BigDecimal, BigInt, bigInt } from '@graphprotocol/graph-ts'
import {
   YieldAggregator, 
   Account, 
   ActiveAccount, 
   VaultHourlySnapshot, 
   UsageMetricsDailySnapshot, 
   UsageMetricsHourlySnapshot,
   FinancialsDailySnapshot } from '../../generated/schema';
import { YakStrategyV2 } from '../../generated/YakStrategyV2/YakStrategyV2';
import { DEFUALT_AMOUNT, DEFUALT_DECIMALS, ZERO_INT, YAK_STRATEGY_MANAGER_ADDRESS, ZERO_ADDRESS, ZERO_BIGDECIMAL, ZERO_BIGINT } from './constants';
import { Token, Vault, VaultFee, RewardToken, VaultDailySnapshot } from '../../generated/schema';
import { WAVAX_CONTRACT_ADDRESS } from './constants';
import { YakERC20 } from '../../generated/YakERC20/YakERC20';
import { calculateOutputTokenPriceInUSD, calculatePriceInUSD } from '../helpers/calculators';
import { convertBINumToDesiredDecimals } from '../helpers/converters';

export function defineProtocol(contractAddress: Address): YieldAggregator {
    const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);
    let ownerAddress: Address;
    if (yakStrategyV2Contract.try_owner().reverted) {
      ownerAddress = YAK_STRATEGY_MANAGER_ADDRESS;
    } else {
      ownerAddress = yakStrategyV2Contract.owner();
    }
    let protocol = YieldAggregator.load(ownerAddress.toHexString());
    if (protocol == null) {
      protocol = new YieldAggregator(ownerAddress.toHexString());
      protocol.name = "Yield Yak";
      protocol.slug = "yak";
      protocol.schemaVersion = "1.2.0";
      protocol.subgraphVersion = "1.0.0";
      protocol.methodologyVersion = "1.0.0";
      protocol.network = "AVALANCHE";
      protocol.type = "YIELD";
      protocol.protocolControlledValueUSD = ZERO_BIGDECIMAL;
      protocol.totalValueLockedUSD = ZERO_BIGDECIMAL;
      protocol.cumulativeSupplySideRevenueUSD = ZERO_BIGDECIMAL;
      protocol.cumulativeProtocolSideRevenueUSD = ZERO_BIGDECIMAL;
      protocol.cumulativeTotalRevenueUSD = ZERO_BIGDECIMAL;
      protocol.cumulativeUniqueUsers = ZERO_INT;
      protocol.totalPoolCount = ZERO_INT;
    }
    protocol.save();
    return protocol;
}

export function defineInputToken(tokenAddress: Address, blockNumber: BigInt): Token {
  if (tokenAddress == ZERO_ADDRESS) {
    tokenAddress = WAVAX_CONTRACT_ADDRESS;
  }

  const tokenContract = YakERC20.bind(tokenAddress);
  let token = Token.load(tokenAddress.toHexString());
  if (token == null) {
    token = new Token(tokenAddress.toHexString());
    if (tokenContract.try_name().reverted) {
      token.name = "";
    } else {
      token.name = tokenContract.name();
    }
    if (tokenContract.try_symbol().reverted) {
      token.symbol = "";
    } else {
      token.symbol = tokenContract.symbol();
    }
    if (tokenContract.try_decimals().reverted) {
      token.decimals = DEFUALT_DECIMALS.toI32();
    } else {
      token.decimals = tokenContract.decimals();
    }
  }
  token.lastPriceUSD = calculatePriceInUSD(tokenAddress, DEFUALT_AMOUNT);
  token.lastPriceBlockNumber = blockNumber;

  token.save();

  return token;
}

export function defineVault(contractAddress: Address, timestamp: BigInt, blockNumber: BigInt): Vault {
  const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);
  let vault = Vault.load(contractAddress.toHexString());
  if (vault == null) {
    vault = new Vault(contractAddress.toHexString());

    const protocol = defineProtocol(contractAddress);
    vault.protocol = protocol.id;

    vault.createdBlockNumber = blockNumber;
    vault.createdTimestamp = timestamp;
    if (yakStrategyV2Contract.try_depositToken().reverted) {
      const inputTokenAddress = ZERO_ADDRESS;
      const inputToken = defineInputToken(inputTokenAddress, blockNumber);
      vault.inputToken = inputToken.id;
    } else {
      const inputTokenAddress = yakStrategyV2Contract.depositToken();
      const inputToken = defineInputToken(inputTokenAddress, blockNumber);
      vault.inputToken = inputToken.id;
    }

    const outputToken = defineOutputToken(contractAddress, blockNumber);
    vault.outputToken = outputToken.id;

    vault.rewardTokens = [];
    vault.rewardTokenEmissionsAmount = [];
    vault.rewardTokenEmissionsUSD = [];
    vault.fees = [];
    vault.totalValueLockedUSD = ZERO_BIGDECIMAL;
    vault.cumulativeSupplySideRevenueUSD = ZERO_BIGDECIMAL;
    vault.cumulativeProtocolSideRevenueUSD = ZERO_BIGDECIMAL;
    vault.cumulativeTotalRevenueUSD = ZERO_BIGDECIMAL;
    vault.inputTokenBalance = ZERO_BIGINT;
    vault.rewardTokenEmissionsAmount = [];
    vault.rewardTokenEmissionsAmount = [];

    let rewardTokenAddress: Address;
    if (yakStrategyV2Contract.try_rewardToken().reverted) {
      rewardTokenAddress = ZERO_ADDRESS;
    } else {
      rewardTokenAddress = yakStrategyV2Contract.rewardToken();
    }
    const rewardToken = defineRewardToken(rewardTokenAddress, blockNumber);
    const rewardTokenArr = new Array<string>();
    rewardTokenArr.push(rewardToken.id);
    vault.rewardTokens = rewardTokenArr;
    
    const rewardTokenEmissionsAmountArr = new Array<BigInt>();
    rewardTokenEmissionsAmountArr.push(ZERO_BIGINT);
    vault.rewardTokenEmissionsAmount = rewardTokenEmissionsAmountArr;
    
    const rewardTokenEmissionsUSDArr = new Array<BigDecimal>();
    rewardTokenEmissionsUSDArr.push(ZERO_BIGDECIMAL);
    vault.rewardTokenEmissionsUSD = rewardTokenEmissionsUSDArr;

    vault.outputTokenSupply = ZERO_BIGINT;

    if (yakStrategyV2Contract.try_MAX_TOKENS_TO_DEPOSIT_WITHOUT_REINVEST().reverted) {
      vault.depositLimit = ZERO_BIGINT;
    } else {
      vault.depositLimit = yakStrategyV2Contract.MAX_TOKENS_TO_DEPOSIT_WITHOUT_REINVEST();
    }

    if (yakStrategyV2Contract.try_name().reverted) {
      vault.name = "";
    } else {
      vault.name = yakStrategyV2Contract.name();
    }
    if (yakStrategyV2Contract.try_symbol().reverted) {
      vault.symbol = "";
    } else {
      vault.symbol = yakStrategyV2Contract.symbol();
    }
    const adminFee = defineFee(contractAddress, "-adminFee")
    const developerFee = defineFee(contractAddress, "-developerFee")
    const reinvestorFee = defineFee(contractAddress, "-reinvestorFee")
    
    vault.fees.push(adminFee.id);
    vault.fees.push(developerFee.id);
    vault.fees.push(reinvestorFee.id);
  }
  vault.save()

  return vault
}

function defineRewardToken(rewardTokenAddress: Address, blockNumber: BigInt): RewardToken {
  let rewardToken = RewardToken.load("DEPOSIT-".concat(rewardTokenAddress.toHexString()));
  if (rewardToken == null) {
    rewardToken = new RewardToken("DEPOSIT-".concat(rewardTokenAddress.toHexString()));
  }
  rewardToken.token = defineInputToken(rewardTokenAddress, blockNumber).id;
  rewardToken.type = "DEPOSIT";
  rewardToken.save();

  return rewardToken
}

function defineOutputToken(tokenAddress: Address, blockNumber: BigInt): Token {
  const tokenContract = YakStrategyV2.bind(tokenAddress);
  let token = Token.load(tokenAddress.toHexString());
  if (token == null) {
    token = new Token(tokenAddress.toHexString());
    if (tokenContract.try_name().reverted) {
      token.name = "";
    } else {
      token.name = tokenContract.name();
    }
    if (tokenContract.try_symbol().reverted) {
      token.symbol = "";
    } else {
      token.symbol = tokenContract.symbol();
    }
    if (tokenContract.try_decimals().reverted) {
      token.decimals = DEFUALT_DECIMALS.toI32();
    } else {
      token.decimals = tokenContract.decimals();
    }
  }

  token.lastPriceUSD = calculateOutputTokenPriceInUSD(tokenAddress);
  token.lastPriceBlockNumber = blockNumber;

  token.save();

  return token;
}

function defineFee(contractAddress:Address, feeType:string): VaultFee {
  const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);
  const fee = new VaultFee(contractAddress.toHexString().concat(feeType));
  if (feeType == "-adminFee") {
    if (yakStrategyV2Contract.try_ADMIN_FEE_BIPS().reverted) {
      fee.feePercentage = ZERO_BIGDECIMAL;
    } else {
      fee.feePercentage = convertBINumToDesiredDecimals(yakStrategyV2Contract.ADMIN_FEE_BIPS(), 4);
    }
  } else if(feeType == "-developerFee") {
    if (yakStrategyV2Contract.try_DEV_FEE_BIPS().reverted) {
      fee.feePercentage = ZERO_BIGDECIMAL;
    } else {
      fee.feePercentage = convertBINumToDesiredDecimals(yakStrategyV2Contract.DEV_FEE_BIPS(), 4);
    }
  } else if(feeType == "-reinvestorFee") {
    if (yakStrategyV2Contract.try_REINVEST_REWARD_BIPS().reverted) {
      fee.feePercentage = ZERO_BIGDECIMAL;
    } else {
      fee.feePercentage = convertBINumToDesiredDecimals(yakStrategyV2Contract.REINVEST_REWARD_BIPS(), 4);
    }
  }
    fee.feeType = "PERFORMANCE_FEE";
    fee.save();
    return fee;
}

export function defineAccount(accountAddress: Address): BigInt {
  let checker = ZERO_BIGINT;
  let account = Account.load(accountAddress.toHexString());
  if (account == null) {
    account = new Account(accountAddress.toHexString());
    checker = bigInt.fromString("1");
  }
  return checker;
}


export function defineActiveAccount(
  accountAddress: Address, 
  timestamp: BigInt, 
  check: string
  ): BigInt {
  
  let dailyActive = ZERO_BIGINT;
  const daysFromStart = timestamp.toI32() / 24 / 60 / 60
  let accountDaily = ActiveAccount.load(accountAddress.toHexString().concat("-").concat(daysFromStart.toString()));

  if (accountDaily == null) {
    accountDaily = new ActiveAccount(accountAddress.toHexString().concat("-").concat(daysFromStart.toString()));
    dailyActive = bigInt.fromString("1");
  }
  const hourInDay = (timestamp.toI32() - daysFromStart * 24 * 60 * 60) / 60 / 60
  
  let hourlyActive = ZERO_BIGINT;
  let accountHourly = ActiveAccount.load(accountAddress.toHexString().concat("-").concat(daysFromStart.toString()).concat("-").concat(hourInDay.toString()));
 
  if (accountHourly == null) {
    accountHourly = new ActiveAccount(accountAddress.toHexString().concat("-").concat(daysFromStart.toString()).concat("-").concat(hourInDay.toString()));
    hourlyActive = bigInt.fromString("1");
  }
  
  let checker = ZERO_BIGINT;

  if (check == "d" && dailyActive == bigInt.fromString("1")) {
    checker = bigInt.fromString("1");
  } else if (check == "h" && hourlyActive == bigInt.fromString("1")){
    checker = bigInt.fromString("1");
  }
  return checker;
}

export function defineVaultDailySnapshot(
  timestamp: BigInt,
  blockNumber: BigInt,
  contractAddress: Address,
): VaultDailySnapshot {
  const protocol = defineProtocol(contractAddress)
  const daysFromStart = timestamp.toI32() / 24 / 60 / 60;
  let vaultDailySnapshotEntity = VaultDailySnapshot.load(contractAddress.toHexString().concat("-").concat(daysFromStart.toString()));
  
  if (vaultDailySnapshotEntity == null) {
    vaultDailySnapshotEntity = new VaultDailySnapshot(contractAddress.toHexString().concat("-").concat(daysFromStart.toString()));
    vaultDailySnapshotEntity.timestamp = timestamp;
    vaultDailySnapshotEntity.blockNumber = blockNumber;
    vaultDailySnapshotEntity.protocol = protocol.id;
    vaultDailySnapshotEntity.totalValueLockedUSD = ZERO_BIGDECIMAL;
    vaultDailySnapshotEntity.cumulativeSupplySideRevenueUSD = ZERO_BIGDECIMAL;
    vaultDailySnapshotEntity.dailySupplySideRevenueUSD = ZERO_BIGDECIMAL;
    vaultDailySnapshotEntity.cumulativeProtocolSideRevenueUSD = ZERO_BIGDECIMAL;
    vaultDailySnapshotEntity.dailyProtocolSideRevenueUSD = ZERO_BIGDECIMAL;
    vaultDailySnapshotEntity.cumulativeTotalRevenueUSD = ZERO_BIGDECIMAL;
    vaultDailySnapshotEntity.dailyTotalRevenueUSD = ZERO_BIGDECIMAL;
    vaultDailySnapshotEntity.inputTokenBalance = ZERO_BIGINT;
    vaultDailySnapshotEntity.outputTokenSupply = ZERO_BIGINT;
    vaultDailySnapshotEntity.dailyTotalRevenueUSD = ZERO_BIGDECIMAL;

    const vault = defineVault(contractAddress, timestamp, blockNumber);
    vaultDailySnapshotEntity.vault = vault.id;

    const rewardTokenEmissionsAmountArr = new Array<BigInt>();
    rewardTokenEmissionsAmountArr.push(ZERO_BIGINT);
    vaultDailySnapshotEntity.rewardTokenEmissionsAmount = rewardTokenEmissionsAmountArr;
    
    const rewardTokenEmissionsUSDArr = new Array<BigDecimal>();
    rewardTokenEmissionsUSDArr.push(ZERO_BIGDECIMAL);
    vaultDailySnapshotEntity.rewardTokenEmissionsUSD = rewardTokenEmissionsUSDArr;

  }
  vaultDailySnapshotEntity.save();
  return vaultDailySnapshotEntity;
}

export function defineVaultHourlySnapshot(
  timestamp: BigInt,
  blockNumber: BigInt,
  contractAddress: Address,
): VaultHourlySnapshot {
  const protocol = defineProtocol(contractAddress)
  const daysFromStart = timestamp.toI32() / 24 / 60 / 60
  const hourInDay = (timestamp.toI32() - daysFromStart * 24 * 60 * 60) / 60 / 60;
  let vaultHourlySnapshotEntity = VaultHourlySnapshot.load(contractAddress.toHexString().concat("-").concat(daysFromStart.toString()).concat("-").concat(hourInDay.toString()));
  
  if (vaultHourlySnapshotEntity == null) {
    vaultHourlySnapshotEntity = new VaultHourlySnapshot(contractAddress.toHexString().concat("-").concat(daysFromStart.toString()).concat("-").concat(hourInDay.toString()));
    vaultHourlySnapshotEntity.timestamp = timestamp;
    vaultHourlySnapshotEntity.blockNumber = blockNumber;
    vaultHourlySnapshotEntity.protocol = protocol.id;
    const vault = defineVault(contractAddress, timestamp, blockNumber);
    vaultHourlySnapshotEntity.vault = vault.id;

    vaultHourlySnapshotEntity.hourlySupplySideRevenueUSD = ZERO_BIGDECIMAL;
    vaultHourlySnapshotEntity.hourlyProtocolSideRevenueUSD = ZERO_BIGDECIMAL;
    vaultHourlySnapshotEntity.hourlyTotalRevenueUSD = ZERO_BIGDECIMAL;
    vaultHourlySnapshotEntity.totalValueLockedUSD = ZERO_BIGDECIMAL;
    vaultHourlySnapshotEntity.cumulativeSupplySideRevenueUSD = ZERO_BIGDECIMAL;
    vaultHourlySnapshotEntity.cumulativeProtocolSideRevenueUSD = ZERO_BIGDECIMAL;
    vaultHourlySnapshotEntity.cumulativeTotalRevenueUSD = ZERO_BIGDECIMAL;
    vaultHourlySnapshotEntity.inputTokenBalance = ZERO_BIGINT;
    vaultHourlySnapshotEntity.outputTokenSupply = ZERO_BIGINT;

    const rewardTokenEmissionsAmountArr = new Array<BigInt>();
    rewardTokenEmissionsAmountArr.push(ZERO_BIGINT);
    vaultHourlySnapshotEntity.rewardTokenEmissionsAmount = rewardTokenEmissionsAmountArr;
    
    const rewardTokenEmissionsUSDArr = new Array<BigDecimal>();
    rewardTokenEmissionsUSDArr.push(ZERO_BIGDECIMAL);
    vaultHourlySnapshotEntity.rewardTokenEmissionsUSD = rewardTokenEmissionsUSDArr;

  }
  vaultHourlySnapshotEntity.save();
  return vaultHourlySnapshotEntity;
}

export function defineUsageMetricsDailySnapshotEntity(
  timestamp: BigInt,
  blockNumber: BigInt,
  contractAddress: Address,
): UsageMetricsDailySnapshot {
  const protocol = defineProtocol(contractAddress);
  const daysFromStart = timestamp.toI32() / 24 / 60 / 60;
  let usageMetricsDailySnapshotEntity = UsageMetricsDailySnapshot.load(daysFromStart.toString());
  
  if (usageMetricsDailySnapshotEntity == null) {
    usageMetricsDailySnapshotEntity = new UsageMetricsDailySnapshot(daysFromStart.toString());
    usageMetricsDailySnapshotEntity.timestamp = timestamp;
    usageMetricsDailySnapshotEntity.blockNumber = blockNumber;
    usageMetricsDailySnapshotEntity.protocol = protocol.id;
    usageMetricsDailySnapshotEntity.totalPoolCount = protocol.totalPoolCount;
    usageMetricsDailySnapshotEntity.dailyActiveUsers = ZERO_INT;
    usageMetricsDailySnapshotEntity.cumulativeUniqueUsers = ZERO_INT;
    usageMetricsDailySnapshotEntity.dailyTransactionCount = ZERO_INT;
    usageMetricsDailySnapshotEntity.dailyDepositCount = ZERO_INT;
    usageMetricsDailySnapshotEntity.dailyWithdrawCount = ZERO_INT;
  }

  usageMetricsDailySnapshotEntity.save();
  return usageMetricsDailySnapshotEntity;
}

export function  defineUsageMetricsHourlySnapshot(
  timestamp: BigInt,
  blockNumber: BigInt,
  contractAddress: Address,
): UsageMetricsHourlySnapshot {
  const protocol = defineProtocol(contractAddress);
  const daysFromStart = timestamp.toI32() / 24 / 60 / 60;
  const hourInDay = (timestamp.toI32() - daysFromStart * 24 * 60 * 60) / 60 / 60;
  let usageMetricsHourlySnapshotEntity = UsageMetricsHourlySnapshot.load(daysFromStart.toString().concat("-").concat(hourInDay.toString()));
  if (usageMetricsHourlySnapshotEntity == null) {
    usageMetricsHourlySnapshotEntity = new UsageMetricsHourlySnapshot(daysFromStart.toString().concat("-").concat(hourInDay.toString()));
    usageMetricsHourlySnapshotEntity.timestamp = timestamp;
    usageMetricsHourlySnapshotEntity.blockNumber = blockNumber;
    usageMetricsHourlySnapshotEntity.protocol = protocol.id;
    usageMetricsHourlySnapshotEntity.hourlyActiveUsers = ZERO_INT;
    usageMetricsHourlySnapshotEntity.cumulativeUniqueUsers = ZERO_INT;
    usageMetricsHourlySnapshotEntity.hourlyTransactionCount = ZERO_INT;
    usageMetricsHourlySnapshotEntity.hourlyDepositCount = ZERO_INT;
    usageMetricsHourlySnapshotEntity.hourlyWithdrawCount = ZERO_INT;
  }
  usageMetricsHourlySnapshotEntity.save();
  return usageMetricsHourlySnapshotEntity;
}

export function defineFinancialsDailySnapshotEntity(
  timestamp: BigInt,
  blockNumber: BigInt,
  contractAddress: Address,
): FinancialsDailySnapshot {
  const protocol = defineProtocol(contractAddress);
  const daysFromStart = timestamp.toI32() / 24 / 60 / 60
  let financialsDailySnapshotEntity = FinancialsDailySnapshot.load(daysFromStart.toString());

  if (financialsDailySnapshotEntity == null) {
    financialsDailySnapshotEntity = new FinancialsDailySnapshot(daysFromStart.toString());
    financialsDailySnapshotEntity.timestamp = timestamp;
    financialsDailySnapshotEntity.blockNumber = blockNumber;
    financialsDailySnapshotEntity.protocol = protocol.id;
    financialsDailySnapshotEntity.protocolControlledValueUSD = ZERO_BIGDECIMAL;
    financialsDailySnapshotEntity.totalValueLockedUSD = ZERO_BIGDECIMAL;
    financialsDailySnapshotEntity.dailySupplySideRevenueUSD = ZERO_BIGDECIMAL;
    financialsDailySnapshotEntity.cumulativeSupplySideRevenueUSD = ZERO_BIGDECIMAL;
    financialsDailySnapshotEntity.dailyProtocolSideRevenueUSD = ZERO_BIGDECIMAL;
    financialsDailySnapshotEntity.cumulativeProtocolSideRevenueUSD = ZERO_BIGDECIMAL;
    financialsDailySnapshotEntity.dailyTotalRevenueUSD = ZERO_BIGDECIMAL;
    financialsDailySnapshotEntity.cumulativeTotalRevenueUSD = ZERO_BIGDECIMAL;
  }


  financialsDailySnapshotEntity.save();
  return financialsDailySnapshotEntity;
}