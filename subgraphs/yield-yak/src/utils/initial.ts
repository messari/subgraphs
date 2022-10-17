import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { YieldAggregator } from '../../generated/schema';
import { YakStrategyV2 } from '../../generated/YakStrategyV2/YakStrategyV2';
import { DEFUALT_AMOUNT, DEFUALT_DECIMALS, YAK_STRATEGY_MANAGER_ADDRESS, ZERO_ADDRESS, ZERO_BIGDECIMAL, ZERO_BIGINT } from './constants';
import { Token, Vault, VaultFee, RewardToken } from '../../generated/schema';
import { WAVAX_CONTRACT_ADDRESS } from './constants';
import { YakERC20 } from '../../generated/YakERC20/YakERC20';
import { calculateOutputTokenPriceInUSD, calculatePriceInUSD } from '../helpers/calculators';
import { convertBINumToDesiredDecimals } from '../helpers/converters';

export function defineProtocol(contractAddress: Address): YieldAggregator {
    let dexStrategyV4Contract = YakStrategyV2.bind(contractAddress);
    let ownerAddress: Address;
    if (dexStrategyV4Contract.try_owner().reverted) {
      ownerAddress = YAK_STRATEGY_MANAGER_ADDRESS;
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
  if (tokenAddress == ZERO_ADDRESS) {
    tokenAddress = WAVAX_CONTRACT_ADDRESS;
  }

  let tokenContract = YakERC20.bind(tokenAddress);
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
  let dexStrategyV4Contract = YakStrategyV2.bind(contractAddress);
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
  let tokenContract = YakStrategyV2.bind(tokenAddress);
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
  let dexStrategyV4Contract = YakStrategyV2.bind(contractAddress);
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