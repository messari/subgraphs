import { Address, ethereum, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import {
  Account,
  FinancialsDailySnapshot,
  RewardToken,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  Vault,
  VaultDailySnapshot,
  VaultHourlySnapshot,
  YieldAggregator,
} from "../../generated/schema";
import { YakStrategyV2 } from "../../generated/YakStrategyV2/YakStrategyV2";
import * as utils from "./utils";
import {
  DEFUALT_AMOUNT,
  DEFAULT_DECIMALS,
  ZERO_BIGINT,
  ZERO_ADDRESS,
  ZERO_BIGDECIMAL,
  YAK_STRATEGY_MANAGER_ADDRESS,
  ZERO_INT,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  ZERO_BIGDECIMAL_ARRAY,
} from "../helpers/constants";
import { Token } from "../../generated/schema";
import { YakERC20 } from "../../generated/YakStrategyV2/YakERC20";
import { VaultFee } from "../../generated/schema";
import { convertBigIntToBigDecimal } from "../helpers/converters";
import { calculatePriceInUSD } from "./calculators";

export function getOrCreateVault(
  contractAddress: Address,
  block: ethereum.Block
): Vault {
  let vault = Vault.load(contractAddress.toHexString());

  if (vault == null) {
    vault = new Vault(contractAddress.toHexString());
    const stategyContract = YakStrategyV2.bind(contractAddress);

    if (stategyContract.try_name().reverted) {
      vault.name = "";
    } else {
      vault.name = stategyContract.name();
    }

    if (stategyContract.try_symbol().reverted) {
      vault.symbol = "";
    } else {
      vault.symbol = stategyContract.symbol();
    }

    const protocol = getOrCreateYieldAggregator();
    vault.protocol = protocol.id;

    if (stategyContract.try_MAX_TOKENS_TO_DEPOSIT_WITHOUT_REINVEST().reverted) {
      vault.depositLimit = ZERO_BIGINT;
    } else {
      vault.depositLimit =
        stategyContract.MAX_TOKENS_TO_DEPOSIT_WITHOUT_REINVEST();
    }

    if (stategyContract.try_depositToken().reverted) {
      const inputTokenAddress = ZERO_ADDRESS;
      const inputToken = getOrCreateToken(inputTokenAddress, block.number);
      vault.inputToken = inputToken.id;
    } else {
      const inputTokenAddress = stategyContract.depositToken();
      const inputToken = getOrCreateToken(inputTokenAddress, block.number);
      vault.inputToken = inputToken.id;
    }

    const outputToken = getOrCreateToken(contractAddress, block.number);
    vault.outputToken = outputToken.id;
    vault.outputTokenSupply = ZERO_BIGINT;
    vault.fees = [];
    vault.outputTokenPriceUSD = ZERO_BIGDECIMAL;
    vault.pricePerShare = ZERO_BIGDECIMAL;
    vault.createdBlockNumber = block.number;
    vault.createdTimestamp = block.timestamp;
    vault.totalValueLockedUSD = ZERO_BIGDECIMAL;
    vault.cumulativeSupplySideRevenueUSD = ZERO_BIGDECIMAL;
    vault.cumulativeProtocolSideRevenueUSD = ZERO_BIGDECIMAL;
    vault.cumulativeTotalRevenueUSD = ZERO_BIGDECIMAL;
    vault.inputTokenBalance = ZERO_BIGINT;
    vault.rewardTokenEmissionsAmount = [];

    let rewardTokenAddress: Address;
    if (stategyContract.try_rewardToken().reverted) {
      rewardTokenAddress = ZERO_ADDRESS;
    } else {
      rewardTokenAddress = stategyContract.rewardToken();
    }

    const rewardToken = defineRewardToken(rewardTokenAddress, block.number);
    const rewardTokenArr = new Array<string>();
    rewardTokenArr.push(rewardToken.id);
    vault.rewardTokens = rewardTokenArr;

    const rewardTokenEmissionsAmountArr = new Array<BigInt>();
    rewardTokenEmissionsAmountArr.push(ZERO_BIGINT);
    vault.rewardTokenEmissionsAmount = rewardTokenEmissionsAmountArr;

    const rewardTokenEmissionsUSDArr = new Array<BigDecimal>();
    rewardTokenEmissionsUSDArr.push(ZERO_BIGDECIMAL);
    vault.rewardTokenEmissionsUSD = rewardTokenEmissionsUSDArr;

    const adminFee = defineFee(contractAddress, "-adminFee");
    const developerFee = defineFee(contractAddress, "-developerFee");
    const reinvestorFee = defineFee(contractAddress, "-reinvestorFee");

    vault.fees = [adminFee.id, developerFee.id, reinvestorFee.id];

    utils.updateProtocolAfterNewVault(contractAddress);
  }

  vault.save();

  return vault;
}

function defineRewardToken(
  rewardTokenAddress: Address,
  blockNumber: BigInt
): RewardToken {
  let rewardToken = RewardToken.load(rewardTokenAddress.toHexString());
  if (rewardToken == null) {
    rewardToken = new RewardToken(rewardTokenAddress.toHexString());
  }
  rewardToken.token = getOrCreateToken(rewardTokenAddress, blockNumber).id;
  rewardToken.type = "DEPOSIT";
  rewardToken.save();

  return rewardToken;
}

export function getOrCreateToken(address: Address, blockNumber: BigInt): Token {
  let token = Token.load(address.toHexString());

  if (!token) {
    token = new Token(address.toHexString());

    const contract = YakERC20.bind(address);

    if (contract.try_name().reverted) {
      token.name = "";
    } else {
      token.name = contract.name();
    }

    if (contract.try_symbol().reverted) {
      token.symbol = "";
    } else {
      token.symbol = contract.symbol();
    }

    if (contract.try_decimals().reverted) {
      token.decimals = DEFAULT_DECIMALS.toI32();
    } else {
      token.decimals = contract.decimals();
    }

    token.lastPriceUSD = calculatePriceInUSD(address, DEFUALT_AMOUNT);
    token.lastPriceBlockNumber = blockNumber;

    token.save();
  }

  return token;
}

export function getOrCreateYieldAggregator(): YieldAggregator {
  let protocol = YieldAggregator.load(
    YAK_STRATEGY_MANAGER_ADDRESS.toHexString()
  );

  if (protocol == null) {
    protocol = new YieldAggregator(YAK_STRATEGY_MANAGER_ADDRESS.toHexString());
    protocol.name = "Yield Yak";
    protocol.slug = "yak";
    protocol.schemaVersion = "1.2.0";
    protocol.subgraphVersion = "1.0.0";
    protocol.methodologyVersion = "1.0.0";
    protocol.network = "AVALANCHE";
    protocol.type = "YIELD";
    protocol.totalValueLockedUSD = ZERO_BIGDECIMAL;
    protocol.cumulativeSupplySideRevenueUSD = ZERO_BIGDECIMAL;
    protocol.cumulativeProtocolSideRevenueUSD = ZERO_BIGDECIMAL;
    protocol.cumulativeTotalRevenueUSD = ZERO_BIGDECIMAL;
    // protocol.dailyProtocolSideRevenueUSD = ZERO_BIGDECIMAL;
    protocol.cumulativeUniqueUsers = ZERO_INT;
    protocol.totalPoolCount = ZERO_INT;
    protocol._vaultIds = [];

    protocol.save();
  }

  return protocol;
}

export function getOrCreateUsageMetricsDailySnapshot(
  block: ethereum.Block
): UsageMetricsDailySnapshot {
  let id: string = (block.timestamp.toI64() / SECONDS_PER_DAY).toString();
  let usageMetrics = UsageMetricsDailySnapshot.load(id);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id);

    const protocol = getOrCreateYieldAggregator();
    usageMetrics.protocol = protocol.id;

    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.dailyDepositCount = 0;
    usageMetrics.dailyWithdrawCount = 0;

    usageMetrics.blockNumber = block.number;
    usageMetrics.timestamp = block.timestamp;

    usageMetrics.totalPoolCount = protocol.totalPoolCount;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateUsageMetricsHourlySnapshot(
  block: ethereum.Block
): UsageMetricsHourlySnapshot {
  let metricsID: string = (
    block.timestamp.toI64() / SECONDS_PER_HOUR
  ).toString();
  let usageMetrics = UsageMetricsHourlySnapshot.load(metricsID);

  if (!usageMetrics) {
    const protocol = getOrCreateYieldAggregator();

    usageMetrics = new UsageMetricsHourlySnapshot(metricsID);
    usageMetrics.protocol = protocol.id;

    usageMetrics.hourlyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.hourlyTransactionCount = 0;
    usageMetrics.hourlyDepositCount = 0;
    usageMetrics.hourlyWithdrawCount = 0;
    usageMetrics.blockNumber = block.number;
    usageMetrics.timestamp = block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateFinancialDailySnapshots(
  block: ethereum.Block
): FinancialsDailySnapshot {
  let id = block.timestamp.toI64() / SECONDS_PER_DAY;
  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());

    const protocol = getOrCreateYieldAggregator();

    financialMetrics.protocol = protocol.id;

    financialMetrics.totalValueLockedUSD = ZERO_BIGDECIMAL;
    financialMetrics.dailySupplySideRevenueUSD = ZERO_BIGDECIMAL;
    financialMetrics.cumulativeSupplySideRevenueUSD = ZERO_BIGDECIMAL;
    financialMetrics.dailyProtocolSideRevenueUSD = ZERO_BIGDECIMAL;
    financialMetrics.cumulativeProtocolSideRevenueUSD = ZERO_BIGDECIMAL;

    financialMetrics.dailyTotalRevenueUSD = ZERO_BIGDECIMAL;
    financialMetrics.cumulativeTotalRevenueUSD = ZERO_BIGDECIMAL;

    financialMetrics.blockNumber = block.number;
    financialMetrics.timestamp = block.timestamp;

    financialMetrics.save();
  }

  return financialMetrics;
}

export function getOrCreateAccount(id: string): Account {
  let account = Account.load(id);

  if (!account) {
    account = new Account(id);
    account.save();

    const protocol = getOrCreateYieldAggregator();
    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }

  return account;
}

export function getOrCreateVaultsDailySnapshots(
  vaultId: string,
  block: ethereum.Block
): VaultDailySnapshot {
  let id: string = vaultId
    .concat("-")
    .concat((block.timestamp.toI64() / SECONDS_PER_DAY).toString());
  let vaultSnapshots = VaultDailySnapshot.load(id);

  if (!vaultSnapshots) {
    vaultSnapshots = new VaultDailySnapshot(id);

    const protocol = getOrCreateYieldAggregator();
    vaultSnapshots.protocol = protocol.id;
    vaultSnapshots.vault = vaultId;

    vaultSnapshots.totalValueLockedUSD = ZERO_BIGDECIMAL;
    vaultSnapshots.inputTokenBalance = ZERO_BIGINT;
    vaultSnapshots.outputTokenSupply = ZERO_BIGINT;
    vaultSnapshots.outputTokenPriceUSD = ZERO_BIGDECIMAL;
    vaultSnapshots.pricePerShare = ZERO_BIGDECIMAL;

    vaultSnapshots.dailySupplySideRevenueUSD = ZERO_BIGDECIMAL;
    vaultSnapshots.cumulativeSupplySideRevenueUSD = ZERO_BIGDECIMAL;

    vaultSnapshots.dailyProtocolSideRevenueUSD = ZERO_BIGDECIMAL;
    vaultSnapshots.cumulativeProtocolSideRevenueUSD = ZERO_BIGDECIMAL;

    vaultSnapshots.dailyTotalRevenueUSD = ZERO_BIGDECIMAL;
    vaultSnapshots.cumulativeTotalRevenueUSD = ZERO_BIGDECIMAL;

    vaultSnapshots.rewardAPR = ZERO_BIGDECIMAL_ARRAY;

    vaultSnapshots.blockNumber = block.number;
    vaultSnapshots.timestamp = block.timestamp;

    vaultSnapshots.save();
  }

  return vaultSnapshots;
}

export function getOrCreateVaultsHourlySnapshots(
  vaultId: string,
  block: ethereum.Block
): VaultHourlySnapshot {
  let id: string = vaultId
    .concat("-")
    .concat((block.timestamp.toI64() / SECONDS_PER_HOUR).toString());
  let vaultSnapshots = VaultHourlySnapshot.load(id);

  if (!vaultSnapshots) {
    vaultSnapshots = new VaultHourlySnapshot(id);

    const protocol = getOrCreateYieldAggregator();
    vaultSnapshots.protocol = protocol.id;
    vaultSnapshots.vault = vaultId;

    vaultSnapshots.totalValueLockedUSD = ZERO_BIGDECIMAL;
    vaultSnapshots.inputTokenBalance = ZERO_BIGINT;
    vaultSnapshots.outputTokenSupply = ZERO_BIGINT;
    vaultSnapshots.outputTokenPriceUSD = ZERO_BIGDECIMAL;
    vaultSnapshots.pricePerShare = ZERO_BIGDECIMAL;

    vaultSnapshots.hourlySupplySideRevenueUSD = ZERO_BIGDECIMAL;
    vaultSnapshots.cumulativeSupplySideRevenueUSD = ZERO_BIGDECIMAL;

    vaultSnapshots.hourlyProtocolSideRevenueUSD = ZERO_BIGDECIMAL;
    vaultSnapshots.cumulativeProtocolSideRevenueUSD = ZERO_BIGDECIMAL;

    vaultSnapshots.hourlyTotalRevenueUSD = ZERO_BIGDECIMAL;
    vaultSnapshots.cumulativeTotalRevenueUSD = ZERO_BIGDECIMAL;

    vaultSnapshots.rewardAPR = ZERO_BIGDECIMAL_ARRAY;

    vaultSnapshots.blockNumber = block.number;
    vaultSnapshots.timestamp = block.timestamp;

    vaultSnapshots.save();
  }

  return vaultSnapshots;
}

export function defineFee(contractAddress: Address, feeType: string): VaultFee {
  const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);

  const fee = new VaultFee(contractAddress.toHexString().concat(feeType));

  if (feeType == "-adminFee") {
    if (yakStrategyV2Contract.try_ADMIN_FEE_BIPS().reverted) {
      fee.feePercentage = ZERO_BIGDECIMAL;
    } else {
      fee.feePercentage = convertBigIntToBigDecimal(
        yakStrategyV2Contract.ADMIN_FEE_BIPS(),
        4
      );
    }
  } else if (feeType == "-developerFee") {
    if (yakStrategyV2Contract.try_DEV_FEE_BIPS().reverted) {
      fee.feePercentage = ZERO_BIGDECIMAL;
    } else {
      fee.feePercentage = convertBigIntToBigDecimal(
        yakStrategyV2Contract.DEV_FEE_BIPS(),
        4
      );
    }
  } else if (feeType == "-reinvestorFee") {
    if (yakStrategyV2Contract.try_REINVEST_REWARD_BIPS().reverted) {
      fee.feePercentage = ZERO_BIGDECIMAL;
    } else {
      fee.feePercentage = convertBigIntToBigDecimal(
        yakStrategyV2Contract.REINVEST_REWARD_BIPS(),
        4
      );
    }
  }

  fee.feeType = "PERFORMANCE_FEE";
  fee.save();

  return fee;
}
