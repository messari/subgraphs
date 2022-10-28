import { Address, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { Vault } from "../../generated/schema";
import { YakStrategyV2 } from "../../generated/YakStrategyV2/YakStrategyV2";
import { initProtocol } from "./protocolInitializer";
import { initInputToken } from "./inputTokenInitializer";
import { ZERO_ADDRESS, ZERO_BIGDECIMAL, ZERO_BIGINT, DEFUALT_DECIMALS } from "../helpers/constants";
import { Token } from "../../generated/schema";
import { VaultFee } from "../../generated/schema";
import { RewardToken } from "../../generated/schema";
import { convertBigIntToBigDecimal } from "../helpers/converters";
import { calculateOutputTokenPriceInUSD } from "../calculators/outputTokenPriceInUSDCalculator";

export function initVault(contractAddress: Address, timestamp: BigInt, blockNumber: BigInt): Vault {
  const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);
  let vault = Vault.load(contractAddress.toHexString());

  if (vault == null) {
    vault = new Vault(contractAddress.toHexString());

    const protocol = initProtocol(contractAddress);
    vault.protocol = protocol.id;

    vault.createdBlockNumber = blockNumber;
    vault.createdTimestamp = timestamp;

    if (yakStrategyV2Contract.try_depositToken().reverted) {
      const inputTokenAddress = ZERO_ADDRESS;
      const inputToken = initInputToken(inputTokenAddress, blockNumber);
      vault.inputToken = inputToken.id;
    } else {
      const inputTokenAddress = yakStrategyV2Contract.depositToken();
      const inputToken = initInputToken(inputTokenAddress, blockNumber);
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
  let rewardToken = RewardToken.load(rewardTokenAddress.toHexString());
  if (rewardToken == null) {
    rewardToken = new RewardToken(rewardTokenAddress.toHexString());
  }
  rewardToken.token = initInputToken(rewardTokenAddress, blockNumber).id;
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

function defineFee(contractAddress: Address, feeType: string): VaultFee {
  const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);
  const fee = new VaultFee(contractAddress.toHexString().concat(feeType));
  if (feeType == "-adminFee") {
    if (yakStrategyV2Contract.try_ADMIN_FEE_BIPS().reverted) {
      fee.feePercentage = ZERO_BIGDECIMAL;
    } else {
      fee.feePercentage = convertBigIntToBigDecimal(yakStrategyV2Contract.ADMIN_FEE_BIPS(), 4);
    }
  } else if (feeType == "-developerFee") {
    if (yakStrategyV2Contract.try_DEV_FEE_BIPS().reverted) {
      fee.feePercentage = ZERO_BIGDECIMAL;
    } else {
      fee.feePercentage = convertBigIntToBigDecimal(yakStrategyV2Contract.DEV_FEE_BIPS(), 4);
    }
  } else if (feeType == "-reinvestorFee") {
    if (yakStrategyV2Contract.try_REINVEST_REWARD_BIPS().reverted) {
      fee.feePercentage = ZERO_BIGDECIMAL;
    } else {
      fee.feePercentage = convertBigIntToBigDecimal(yakStrategyV2Contract.REINVEST_REWARD_BIPS(), 4);
    }
  }
  fee.feeType = "PERFORMANCE_FEE";
  fee.save();
  return fee;
}