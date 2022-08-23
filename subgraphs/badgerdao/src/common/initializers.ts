import {
  log,
  BigInt,
  Address,
  ethereum,
} from "@graphprotocol/graph-ts";
import {
  Token,
  Account,
  RewardToken,
  YieldAggregator,
  VaultDailySnapshot,
  VaultHourlySnapshot,
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
} from "../../generated/schema";
import * as utils from "./utils";
import * as constants from "./constants";
import { Vault as VaultStore } from "../../generated/schema";
import { ERC20 as ERC20Contract } from "../../generated/templates/Strategy/ERC20";
import { Vault as VaultContract } from "../../generated/templates/Strategy/Vault";
import { Strategy as StrategyContract } from "../../generated/templates/Strategy/Strategy";

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

export function getOrCreateYieldAggregator(): YieldAggregator {
  let protocol = YieldAggregator.load(constants.PROTOCOL_ID);

  if (!protocol) {
    protocol = new YieldAggregator(constants.PROTOCOL_ID);
    protocol.name = constants.Protocol.NAME;
    protocol.slug = constants.Protocol.SLUG;
    protocol.schemaVersion = constants.Protocol.SCHEMA_VERSION;
    protocol.subgraphVersion = constants.Protocol.SUBGRAPH_VERSION;
    protocol.methodologyVersion = constants.Protocol.METHODOLOGY_VERSION;
    protocol.network = constants.Network.MAINNET;
    protocol.type = constants.ProtocolType.YIELD;

    //////// Quantitative Data ////////
    protocol.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = 0;
    protocol.totalPoolCount = 0;
    protocol._vaultIds = [];

    protocol.save();
  }

  return protocol;
}

export function getOrCreateToken(address: Address): Token {
  let token = Token.load(address.toHexString());

  if (!token) {
    token = new Token(address.toHexString());

    const contract = ERC20Contract.bind(address);

    token.name = utils.readValue<string>(contract.try_name(), "");
    token.symbol = utils.readValue<string>(contract.try_symbol(), "");
    token.decimals = utils.readValue<i32>(contract.try_decimals(), 0) as u8;

    token.save();
  }

  return token;
}

export function getOrCreateRewardToken(address: Address): RewardToken {
  let rewardToken = RewardToken.load(address.toHexString());

  if (!rewardToken) {
    rewardToken = new RewardToken(address.toHexString());
    const token = getOrCreateToken(address);
    rewardToken.token = token.id;
    rewardToken.type = constants.RewardTokenType.DEPOSIT;

    rewardToken.save();
  }

  return rewardToken;
}

export function getOrCreateFinancialDailySnapshots(
  block: ethereum.Block
): FinancialsDailySnapshot {
  let id = block.timestamp.toI64() / constants.SECONDS_PER_DAY;
  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = constants.PROTOCOL_ID;

    financialMetrics.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.dailySupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.dailyProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD =
      constants.BIGDECIMAL_ZERO;

    financialMetrics.dailyTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;

    financialMetrics.blockNumber = block.number;
    financialMetrics.timestamp = block.timestamp;

    financialMetrics.save();
  }

  return financialMetrics;
}

export function getOrCreateUsageMetricsDailySnapshot(
  block: ethereum.Block
): UsageMetricsDailySnapshot {
  let id: string = (
    block.timestamp.toI64() / constants.SECONDS_PER_DAY
  ).toString();
  let usageMetrics = UsageMetricsDailySnapshot.load(id);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id);
    usageMetrics.protocol = constants.PROTOCOL_ID;

    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.dailyDepositCount = 0;
    usageMetrics.dailyWithdrawCount = 0;

    usageMetrics.blockNumber = block.number;
    usageMetrics.timestamp = block.timestamp;

    const protocol = getOrCreateYieldAggregator();
    usageMetrics.totalPoolCount = protocol.totalPoolCount;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateUsageMetricsHourlySnapshot(
  block: ethereum.Block
): UsageMetricsHourlySnapshot {
  let metricsID: string = (
    block.timestamp.toI64() / constants.SECONDS_PER_HOUR
  ).toString();
  let usageMetrics = UsageMetricsHourlySnapshot.load(metricsID);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(metricsID);
    usageMetrics.protocol = constants.PROTOCOL_ID;

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

export function getOrCreateVaultsDailySnapshots(
  vaultId: string,
  block: ethereum.Block
): VaultDailySnapshot {
  let id: string = vaultId
    .concat("-")
    .concat((block.timestamp.toI64() / constants.SECONDS_PER_DAY).toString());
  let vaultSnapshots = VaultDailySnapshot.load(id);

  if (!vaultSnapshots) {
    vaultSnapshots = new VaultDailySnapshot(id);
    vaultSnapshots.protocol = constants.PROTOCOL_ID;
    vaultSnapshots.vault = vaultId;

    vaultSnapshots.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.inputTokenBalance = constants.BIGINT_ZERO;
    vaultSnapshots.outputTokenSupply = constants.BIGINT_ZERO;
    vaultSnapshots.outputTokenPriceUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.pricePerShare = constants.BIGDECIMAL_ZERO;

    vaultSnapshots.dailySupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;

    vaultSnapshots.dailyProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;

    vaultSnapshots.dailyTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;

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
    .concat((block.timestamp.toI64() / constants.SECONDS_PER_HOUR).toString());
  let vaultSnapshots = VaultHourlySnapshot.load(id);

  if (!vaultSnapshots) {
    vaultSnapshots = new VaultHourlySnapshot(id);
    vaultSnapshots.protocol = constants.PROTOCOL_ID;
    vaultSnapshots.vault = vaultId;

    vaultSnapshots.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.inputTokenBalance = constants.BIGINT_ZERO;
    vaultSnapshots.outputTokenSupply = constants.BIGINT_ZERO;
    vaultSnapshots.outputTokenPriceUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.pricePerShare = constants.BIGDECIMAL_ZERO;

    vaultSnapshots.hourlySupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;

    vaultSnapshots.hourlyProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;

    vaultSnapshots.hourlyTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;

    vaultSnapshots.blockNumber = block.number;
    vaultSnapshots.timestamp = block.timestamp;

    vaultSnapshots.save();
  }

  return vaultSnapshots;
}

export function createWithdrawalFee(vaultAddress: Address, strategyContract: StrategyContract): string {
  const withdrawalFeeId =
    utils.enumToPrefix(constants.VaultFeeType.WITHDRAWAL_FEE) +
    vaultAddress.toHexString();
  
    let withdrawalFee = utils.readValue<BigInt>(
    strategyContract.try_withdrawalFee(),
    constants.BIGINT_ZERO
  );
  
  utils.createFeeType(
    withdrawalFeeId,
    constants.VaultFeeType.WITHDRAWAL_FEE,
    withdrawalFee
  );

  return withdrawalFeeId;
}

export function createPerformanceFee(vaultAddress: Address, strategyContract: StrategyContract): string {
  const performanceFeeId =
    utils.enumToPrefix(constants.VaultFeeType.PERFORMANCE_FEE) +
    vaultAddress.toHexString();
  
  let performanceFeeGovernance = utils.readValue<BigInt>(
    strategyContract.try_performanceFeeGovernance(),
    constants.BIGINT_ZERO
  );
  let performanceFeeStrategist = utils.readValue<BigInt>(
    strategyContract.try_performanceFeeStrategist(),
    constants.BIGINT_ZERO
  );

  utils.createFeeType(
    performanceFeeId,
    constants.VaultFeeType.PERFORMANCE_FEE,
    performanceFeeGovernance.plus(performanceFeeStrategist)
  );

  return performanceFeeId;
}

export function getOrCreateVault(
  vaultAddress: Address,
  block: ethereum.Block
): VaultStore {
  let vault = VaultStore.load(vaultAddress.toHexString());

  if (!vault) {
    vault = new VaultStore(vaultAddress.toHexString());

    const vaultContract = VaultContract.bind(vaultAddress);

    vault.name = utils.readValue<string>(vaultContract.try_name(), "");
    vault.symbol = utils.readValue<string>(vaultContract.try_symbol(), "");
    vault.protocol = constants.PROTOCOL_ID;
    vault.depositLimit = utils.readValue<BigInt>(
      vaultContract.try_max(),
      constants.BIGINT_ZERO
    );

    const inputTokenAddress = utils.readValue<Address>(
      vaultContract.try_token(),
      constants.NULL.TYPE_ADDRESS
    );
    const inputToken = getOrCreateToken(inputTokenAddress);
    vault.inputToken = inputToken.id;
    vault.inputTokenBalance = constants.BIGINT_ZERO;

    const outputToken = getOrCreateToken(vaultAddress);
    vault.outputToken = outputToken.id;
    vault.outputTokenSupply = constants.BIGINT_ZERO;
    vault.outputTokenPriceUSD = constants.BIGDECIMAL_ZERO;

    vault.pricePerShare = utils
      .readValue<BigInt>(
        vaultContract.try_getPricePerFullShare(),
        constants.BIGINT_ZERO
      )
      .toBigDecimal()
      .div(constants.BIGINT_TEN.pow(outputToken.decimals as u8).toBigDecimal());

    vault.createdBlockNumber = block.number;
    vault.createdTimestamp = block.timestamp;

    vault.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;

    vault.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    vault.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    vault.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;

    const strategyAddress = utils.getStrategyAddressFromVault(vaultAddress);
    const strategyContract = StrategyContract.bind(strategyAddress);

    const withdrawalFeeId = createWithdrawalFee(vaultAddress, strategyContract);
    const performanceFeeId = createPerformanceFee(vaultAddress, strategyContract);
    
    vault.fees = [withdrawalFeeId, performanceFeeId];

    vault._strategy = strategyAddress.toHexString();
    vault.save();

    utils.updateProtocolAfterNewVault(vaultAddress);
    
    log.warning(
      "[CreateVault] VaultId: {}, inputToken: {}, strategy: {}",
      [
        vaultAddress.toHexString(),
        inputTokenAddress.toHexString(),
        strategyAddress.toHexString(),
      ]
    );
  }

  return vault;
}
