import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

import {
  Token
  , RewardToken
  , YieldAggregator
  , UsageMetricsDailySnapshot
  , FinancialsDailySnapshot
  , VaultFee
  , Vault
  , VaultDailySnapshot
  , VaultHourlySnapshot
  , UsageMetricsHourlySnapshot
} from '../../generated/schema'

import { DexStrategyV4 } from "../../generated/x0aBD79f5144a70bFA3E3Aeed183f9e1A4d80A34F/DexStrategyV4"
import { Token as TokenContract } from "../../generated/x0aBD79f5144a70bFA3E3Aeed183f9e1A4d80A34F/Token"

import { convertBINumToDesiredDecimals } from "./utils/converters"
import { ZERO_BIGDECIMAL, ZERO_BIGINT, ZERO_ADDRESS, YakStrategyManagerV1, DEFUALT_DECIMALS, DEFUALT_AMOUNT } from "./utils/constants";

import { priceInUSD, calculateOutputTokenPriceInUSD } from "./PriceCalculator";


export function defineProtocol(contractAddress: Address): YieldAggregator {
  let dexStrategyV4Contract = DexStrategyV4.bind(contractAddress);
  let ownerAddress: Address;
  if (dexStrategyV4Contract.try_owner().reverted) {
    ownerAddress = YakStrategyManagerV1;
  } else {
    ownerAddress = dexStrategyV4Contract.owner();
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
  }
  protocol.save();
  return protocol;
}



export function defineInputToken(tokenAddress: Address, blockNumber: BigInt): Token {
  let avaxAddress: Address = Address.fromString("0x0000000000000000000000000000000000000000");
  if (tokenAddress == avaxAddress) {
    tokenAddress = Address.fromString("0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7");
  }
  let tokenContract = TokenContract.bind(tokenAddress);
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
  token.lastPriceUSD = priceInUSD(tokenAddress, DEFUALT_AMOUNT);
  token.lastPriceBlockNumber = blockNumber;

  token.save()

  return token
}

function defineOutputToken(tokenAddress: Address, blockNumber: BigInt): Token {

  let tokenContract = DexStrategyV4.bind(tokenAddress);
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

function defineFee(contractAddress:Address, feeType:string): VaultFee {
  let dexStrategyV4Contract = DexStrategyV4.bind(contractAddress);
  let fee = new VaultFee(contractAddress.toHexString().concat(feeType));
  if (feeType == "-adminFee") {
    if (dexStrategyV4Contract.try_ADMIN_FEE_BIPS().reverted) {
      fee.feePercentage = ZERO_BIGDECIMAL;
    } else {
      fee.feePercentage = convertBINumToDesiredDecimals(dexStrategyV4Contract.ADMIN_FEE_BIPS(), 4);
    }
  } else if(feeType == "-developerFee") {
    if (dexStrategyV4Contract.try_DEV_FEE_BIPS().reverted) {
      fee.feePercentage = ZERO_BIGDECIMAL;
    } else {
      fee.feePercentage = convertBINumToDesiredDecimals(dexStrategyV4Contract.DEV_FEE_BIPS(), 4);
    }
  } else if(feeType == "-reinvestorFee") {
    if (dexStrategyV4Contract.try_REINVEST_REWARD_BIPS().reverted) {
      fee.feePercentage = ZERO_BIGDECIMAL;
    } else {
      fee.feePercentage = convertBINumToDesiredDecimals(dexStrategyV4Contract.REINVEST_REWARD_BIPS(), 4);
    }
  }
    fee.feeType = "PERFORMANCE_FEE";
    fee.save();
    return fee;
}

export function defineVault(contractAddress: Address, timestamp: BigInt, blockNumber: BigInt): Vault {
  let dexStrategyV4Contract = DexStrategyV4.bind(contractAddress);
  let vault = Vault.load(contractAddress.toHexString());
  if (vault == null) {
    vault = new Vault(contractAddress.toHexString());

    let protocol = defineProtocol(contractAddress);
    vault.protocol = protocol.id;

    vault.createdBlockNumber = blockNumber;
    vault.createdTimestamp = timestamp;
    if (dexStrategyV4Contract.try_depositToken().reverted) {
      let inputTokenAddress = ZERO_ADDRESS;
      let inputToken = defineInputToken(inputTokenAddress, blockNumber);
      vault.inputToken = inputToken.id;
    } else {
      let inputTokenAddress = dexStrategyV4Contract.depositToken();
      let inputToken = defineInputToken(inputTokenAddress, blockNumber);
      vault.inputToken = inputToken.id;
    }

    let outputToken = defineOutputToken(contractAddress, blockNumber);
    vault.outputToken = outputToken.id;

    vault.rewardTokens = [];
    vault.rewardTokenEmissionsAmount = [];
    vault.rewardTokenEmissionsUSD = [];
    vault.fees = [];

    let rewardTokenAddress: Address;
    if (dexStrategyV4Contract.try_rewardToken().reverted) {
      rewardTokenAddress = ZERO_ADDRESS;
    } else {
      rewardTokenAddress = dexStrategyV4Contract.rewardToken();
    }
    let rewardToken = defineRewardToken(rewardTokenAddress, blockNumber);
    let rewardTokenArr = new Array<string>();
    rewardTokenArr.push(rewardToken.id);
    vault.rewardTokens = rewardTokenArr;
    
    let rewardTokenEmissionsAmountArr = new Array<BigInt>();
    rewardTokenEmissionsAmountArr.push(ZERO_BIGINT);
    vault.rewardTokenEmissionsAmount = rewardTokenEmissionsAmountArr;
    
    let rewardTokenEmissionsUSDArr = new Array<BigDecimal>();
    rewardTokenEmissionsUSDArr.push(ZERO_BIGDECIMAL);
    vault.rewardTokenEmissionsUSD = rewardTokenEmissionsUSDArr;

    vault.outputTokenSupply = ZERO_BIGINT;

    if (dexStrategyV4Contract.try_MAX_TOKENS_TO_DEPOSIT_WITHOUT_REINVEST().reverted) {
      vault.depositLimit = ZERO_BIGINT;
    } else {
      vault.depositLimit = dexStrategyV4Contract.MAX_TOKENS_TO_DEPOSIT_WITHOUT_REINVEST();
    }

    if (dexStrategyV4Contract.try_name().reverted) {
      vault.name = "";
    } else {
      vault.name = dexStrategyV4Contract.name();
    }
    if (dexStrategyV4Contract.try_symbol().reverted) {
      vault.symbol = "";
    } else {
      vault.symbol = dexStrategyV4Contract.symbol();
    }
    let adminFee = defineFee(contractAddress, "-adminFee")
    let developerFee = defineFee(contractAddress, "-developerFee")
    let reinvestorFee = defineFee(contractAddress, "-reinvestorFee")
    
    vault.fees.push(adminFee.id);
    vault.fees.push(developerFee.id);
    vault.fees.push(reinvestorFee.id);
  }
  vault.save()

  return vault
}

export function defineUsageMetricsDailySnapshotEntity(
  timestamp: BigInt,
  blockNumber: BigInt,
  contractAddress: Address,
): UsageMetricsDailySnapshot {
  let protocol = defineProtocol(contractAddress);
  let daysFromStart = timestamp.toI32() / 24 / 60 / 60;
  let usageMetricsDailySnapshotEntity = UsageMetricsDailySnapshot.load(daysFromStart.toString());
  if (usageMetricsDailySnapshotEntity == null) {
    usageMetricsDailySnapshotEntity = new UsageMetricsDailySnapshot(daysFromStart.toString());
    usageMetricsDailySnapshotEntity.timestamp = timestamp;
    usageMetricsDailySnapshotEntity.blockNumber = blockNumber;
    usageMetricsDailySnapshotEntity.protocol = protocol.id;
  }
  usageMetricsDailySnapshotEntity.save();
  return usageMetricsDailySnapshotEntity;

}

export function defineUsageMetricsHourlySnapshot(
  timestamp: BigInt,
  blockNumber: BigInt,
  contractAddress: Address,
): UsageMetricsHourlySnapshot {
  let protocol = defineProtocol(contractAddress);
  let daysFromStart = timestamp.toI32() / 24 / 60 / 60;
  let hourInDay = (timestamp.toI32() - daysFromStart * 24 * 60 * 60) / 60 / 60;
  let usageMetricsHourlySnapshotEntity = UsageMetricsHourlySnapshot.load(daysFromStart.toString().concat("-").concat(hourInDay.toString()));
  if (usageMetricsHourlySnapshotEntity == null) {
    usageMetricsHourlySnapshotEntity = new UsageMetricsHourlySnapshot(daysFromStart.toString().concat("-").concat(hourInDay.toString()));
    usageMetricsHourlySnapshotEntity.timestamp = timestamp;
    usageMetricsHourlySnapshotEntity.blockNumber = blockNumber;
    usageMetricsHourlySnapshotEntity.protocol = protocol.id;
  }
  usageMetricsHourlySnapshotEntity.save();
  return usageMetricsHourlySnapshotEntity;
}


export function defineFinancialsDailySnapshotEntity(
  timestamp: BigInt,
  blockNumber: BigInt,
  contractAddress: Address,
): FinancialsDailySnapshot {
  let protocol = defineProtocol(contractAddress);
  let daysFromStart = timestamp.toI32() / 24 / 60 / 60
  let financialsDailySnapshotEntity = FinancialsDailySnapshot.load(daysFromStart.toString());
  if (financialsDailySnapshotEntity == null) {
    financialsDailySnapshotEntity = new FinancialsDailySnapshot(daysFromStart.toString());
    financialsDailySnapshotEntity.timestamp = timestamp;
    financialsDailySnapshotEntity.blockNumber = blockNumber;
    financialsDailySnapshotEntity.protocol = protocol.id;
    financialsDailySnapshotEntity.protocolControlledValueUSD = ZERO_BIGDECIMAL;
  }


  financialsDailySnapshotEntity.save();
  return financialsDailySnapshotEntity;
}

export function defineVaultDailySnapshot(
  timestamp: BigInt,
  blockNumber: BigInt,
  contractAddress: Address,
): VaultDailySnapshot {
  let protocol = defineProtocol(contractAddress)
  let daysFromStart = timestamp.toI32() / 24 / 60 / 60;
  let vaultDailySnapshotEntity = VaultDailySnapshot.load(contractAddress.toHexString().concat("-").concat(daysFromStart.toString()));
  if (vaultDailySnapshotEntity == null) {
    vaultDailySnapshotEntity = new VaultDailySnapshot(contractAddress.toHexString().concat("-").concat(daysFromStart.toString()));
    vaultDailySnapshotEntity.timestamp = timestamp;
    vaultDailySnapshotEntity.blockNumber = blockNumber;
    vaultDailySnapshotEntity.protocol = protocol.id;
    let vault = defineVault(contractAddress, timestamp, blockNumber);
    vaultDailySnapshotEntity.vault = vault.id;

    let rewardTokenEmissionsAmountArr = new Array<BigInt>();
    rewardTokenEmissionsAmountArr.push(ZERO_BIGINT);
    vaultDailySnapshotEntity.rewardTokenEmissionsAmount = rewardTokenEmissionsAmountArr;
    
    let rewardTokenEmissionsUSDArr = new Array<BigDecimal>();
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
  let protocol = defineProtocol(contractAddress)
  let daysFromStart = timestamp.toI32() / 24 / 60 / 60
  let hourInDay = (timestamp.toI32() - daysFromStart * 24 * 60 * 60) / 60 / 60;
  let vaultHourlySnapshotEntity = VaultHourlySnapshot.load(contractAddress.toHexString().concat("-").concat(daysFromStart.toString()).concat("-").concat(hourInDay.toString()));
  if (vaultHourlySnapshotEntity == null) {
    vaultHourlySnapshotEntity = new VaultHourlySnapshot(contractAddress.toHexString().concat("-").concat(daysFromStart.toString()).concat("-").concat(hourInDay.toString()));
    vaultHourlySnapshotEntity.timestamp = timestamp;
    vaultHourlySnapshotEntity.blockNumber = blockNumber;
    vaultHourlySnapshotEntity.protocol = protocol.id;
    let vault = defineVault(contractAddress, timestamp, blockNumber);
    vaultHourlySnapshotEntity.vault = vault.id;

    let rewardTokenEmissionsAmountArr = new Array<BigInt>();
    rewardTokenEmissionsAmountArr.push(ZERO_BIGINT);
    vaultHourlySnapshotEntity.rewardTokenEmissionsAmount = rewardTokenEmissionsAmountArr;
    
    let rewardTokenEmissionsUSDArr = new Array<BigDecimal>();
    rewardTokenEmissionsUSDArr.push(ZERO_BIGDECIMAL);
    vaultHourlySnapshotEntity.rewardTokenEmissionsUSD = rewardTokenEmissionsUSDArr;

  }
  vaultHourlySnapshotEntity.save();
  return vaultHourlySnapshotEntity;
}