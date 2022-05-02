import { BigInt, BigDecimal, bigDecimal, Address } from '@graphprotocol/graph-ts'

import { DexStrategyV4 } from "../../generated/x0aBD79f5144a70bFA3E3Aeed183f9e1A4d80A34F/DexStrategyV4"

import { convertBINumToDesiredDecimals } from "./utils/converters"
import { ZERO_BIGDECIMAL, DEFUALT_AMOUNT } from "./utils/constants";
import { priceInUSD } from './PriceCalculator';
import { defineVault } from './initialDefineOrLoad';


export function distributedRewardInUSDCalculator(contractAddress: Address, 
    timestamp: BigInt, 
    blockNumber: BigInt, 
    newTotalSupply: BigInt): BigDecimal {
    let dexStrategyV4Contract = DexStrategyV4.bind(contractAddress);
    let depositTokenPrice: BigDecimal;
    if (dexStrategyV4Contract.try_depositToken().reverted) {
        depositTokenPrice = ZERO_BIGDECIMAL;
    } else {
        depositTokenPrice = priceInUSD(dexStrategyV4Contract.depositToken(), DEFUALT_AMOUNT);
    }
    let distributedReward = distributedRewardCalculator(contractAddress, timestamp, blockNumber, newTotalSupply);
    let allFees: BigDecimal;
    if (dexStrategyV4Contract.try_DEV_FEE_BIPS().reverted || dexStrategyV4Contract.try_ADMIN_FEE_BIPS().reverted || dexStrategyV4Contract.try_REINVEST_REWARD_BIPS().reverted) {
        allFees = ZERO_BIGDECIMAL;
    } else {
        allFees = (dexStrategyV4Contract.DEV_FEE_BIPS().plus(dexStrategyV4Contract.ADMIN_FEE_BIPS().plus(dexStrategyV4Contract.REINVEST_REWARD_BIPS()))).toBigDecimal().div(bigDecimal.fromString("1000"));
    }
    let allDistributedReward: BigDecimal;
    if (allFees != ZERO_BIGDECIMAL) {
        allDistributedReward = distributedReward.toBigDecimal().div(allFees);
    } else {
        allDistributedReward = ZERO_BIGDECIMAL;
    }
    let distributedRewardInUSD = depositTokenPrice.times(convertBINumToDesiredDecimals(distributedReward, 18));
    return distributedRewardInUSD;
}

export function protocolRewardInUSDCalculator(contractAddress: Address, 
    timestamp: BigInt, 
    blockNumber: BigInt, 
    newTotalSupply: BigInt): BigDecimal {
    let dexStrategyV4Contract = DexStrategyV4.bind(contractAddress);
    let depositTokenPrice: BigDecimal;
    if (dexStrategyV4Contract.try_depositToken().reverted) {
        depositTokenPrice = ZERO_BIGDECIMAL;
    } else {
        depositTokenPrice = priceInUSD(dexStrategyV4Contract.depositToken(), DEFUALT_AMOUNT);
    }
    let distributedReward = distributedRewardCalculator(contractAddress, timestamp, blockNumber, newTotalSupply);
    let allFees: BigDecimal;
    if (dexStrategyV4Contract.try_DEV_FEE_BIPS().reverted || dexStrategyV4Contract.try_ADMIN_FEE_BIPS().reverted || dexStrategyV4Contract.try_REINVEST_REWARD_BIPS().reverted) {
        allFees = ZERO_BIGDECIMAL;
    } else {
        allFees = (dexStrategyV4Contract.DEV_FEE_BIPS().plus(dexStrategyV4Contract.ADMIN_FEE_BIPS().plus(dexStrategyV4Contract.REINVEST_REWARD_BIPS()))).toBigDecimal().div(bigDecimal.fromString("1000"));
    }
    let allDistributedReward: BigDecimal;
    if (allFees != ZERO_BIGDECIMAL) {
        allDistributedReward = distributedReward.toBigDecimal().div(allFees);
    } else {
        allDistributedReward = ZERO_BIGDECIMAL;
    }
    let protocolReward: BigDecimal
    if (dexStrategyV4Contract.try_ADMIN_FEE_BIPS().reverted) {
        protocolReward = ZERO_BIGDECIMAL;
    } else {
        protocolReward = allDistributedReward.times(dexStrategyV4Contract.ADMIN_FEE_BIPS().toBigDecimal()).div(bigDecimal.fromString("1000"));
    }
    let protocolRewardInUSD = depositTokenPrice.times(protocolReward);
    return protocolRewardInUSD;

}

export function allDistributedRewardInUSDCalculator(contractAddress: Address, 
    timestamp: BigInt, 
    blockNumber: BigInt, 
    newTotalSupply: BigInt): BigDecimal {
    let dexStrategyV4Contract = DexStrategyV4.bind(contractAddress);
    let depositTokenPrice: BigDecimal;
    if (dexStrategyV4Contract.try_depositToken().reverted) {
        depositTokenPrice = ZERO_BIGDECIMAL;
    } else {
        depositTokenPrice = priceInUSD(dexStrategyV4Contract.depositToken(), DEFUALT_AMOUNT);
    }
    let distributedReward = distributedRewardCalculator(contractAddress, timestamp, blockNumber, newTotalSupply);
    let allFees: BigDecimal;
    if (dexStrategyV4Contract.try_DEV_FEE_BIPS().reverted || dexStrategyV4Contract.try_ADMIN_FEE_BIPS().reverted || dexStrategyV4Contract.try_REINVEST_REWARD_BIPS().reverted) {
        allFees = ZERO_BIGDECIMAL;
    } else {
        allFees = (dexStrategyV4Contract.DEV_FEE_BIPS().plus(dexStrategyV4Contract.ADMIN_FEE_BIPS().plus(dexStrategyV4Contract.REINVEST_REWARD_BIPS()))).toBigDecimal().div(bigDecimal.fromString("1000"));
    }
    let allDistributedReward: BigDecimal;
    if (allFees != ZERO_BIGDECIMAL) {
        allDistributedReward = distributedReward.toBigDecimal().div(allFees);
    } else {
        allDistributedReward = ZERO_BIGDECIMAL;
    }
    let allDistributedRewardInUSD = depositTokenPrice.times(allDistributedReward);
    return allDistributedRewardInUSD;
}

export function distributedRewardCalculator(contractAddress: Address, 
    timestamp: BigInt, 
    blockNumber: BigInt, 
    newTotalSupply: BigInt): BigInt {
    let dexStrategyV4Contract = DexStrategyV4.bind(contractAddress);
    let depositTokenPrice: BigDecimal;
    if (dexStrategyV4Contract.try_depositToken().reverted) {
        depositTokenPrice = ZERO_BIGDECIMAL;
    } else {
        depositTokenPrice = priceInUSD(dexStrategyV4Contract.depositToken(), DEFUALT_AMOUNT);
    }
    let vault = defineVault(contractAddress, timestamp, blockNumber);
    let beforeReinvestSupply = vault.outputTokenSupply;
    let distributedReward: BigInt = newTotalSupply.minus(beforeReinvestSupply!);
    return distributedReward;
}