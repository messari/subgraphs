import {
  Token,
  Account,
  RewardToken,
  YieldAggregator,
  _RewardPoolInfo,
  VaultDailySnapshot,
  Vault as VaultStore,
  VaultHourlySnapshot,
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
} from "../../generated/schema";
import {
  log,
  BigInt,
  Address,
  ethereum,
  DataSourceContext,
} from "@graphprotocol/graph-ts";
import * as utils from "./utils";
import * as constants from "./constants";
import { getTotalFees } from "../modules/Fees";
import { ERC20 as ERC20Contract } from "../../generated/Booster/ERC20";
import { PoolCrvRewards as PoolCrvRewardsTemplate } from "../../generated/templates";
import { Versions } from "../versions";

export function getOrCreateYieldAggregator(): YieldAggregator {
  const protocolId = constants.CONVEX_BOOSTER_ADDRESS.toHexString();
  let protocol = YieldAggregator.load(protocolId);

  if (!protocol) {
    protocol = new YieldAggregator(protocolId);
    protocol.name = constants.Protocol.NAME;
    protocol.slug = constants.Protocol.SLUG;
    protocol.network = constants.Network.MAINNET;
    protocol.type = constants.ProtocolType.YIELD;

    //////// Quantitative Data ////////
    protocol.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    protocol.protocolControlledValueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = 0;
    protocol.totalPoolCount = 0;

    protocol._poolCount = constants.BIGINT_ZERO;
    protocol._vaultIds = [];
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();

  protocol.save();

  return protocol;
}

export function getOrCreateToken(address: Address): Token {
  let token = Token.load(address.toHexString());

  if (!token) {
    token = new Token(address.toHexString());

    const contract = ERC20Contract.bind(address);

    token.name = utils.readValue<string>(contract.try_name(), "");
    token.symbol = utils.readValue<string>(contract.try_symbol(), "");
    token.decimals = utils.readValue<i32>(contract.try_decimals(), 18);

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

export function getOrCreateUsageMetricsDailySnapshot(
  block: ethereum.Block
): UsageMetricsDailySnapshot {
  let id = (block.timestamp.toI64() / constants.SECONDS_PER_DAY).toString();
  let usageMetrics = UsageMetricsDailySnapshot.load(id);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id);
    usageMetrics.protocol = constants.CONVEX_BOOSTER_ADDRESS.toHexString();

    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.dailyDepositCount = 0;
    usageMetrics.dailyWithdrawCount = 0;

    const protocol = getOrCreateYieldAggregator();
    usageMetrics.totalPoolCount = protocol.totalPoolCount;

    usageMetrics.blockNumber = block.number;
    usageMetrics.timestamp = block.timestamp;

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
    usageMetrics.protocol = constants.CONVEX_BOOSTER_ADDRESS.toHexString();

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
    .concat((block.timestamp.toI64() / constants.SECONDS_PER_DAY).toString());
  let vaultSnapshots = VaultDailySnapshot.load(id);

  if (!vaultSnapshots) {
    vaultSnapshots = new VaultDailySnapshot(id);
    vaultSnapshots.protocol = constants.CONVEX_BOOSTER_ADDRESS.toHexString();
    vaultSnapshots.vault = vaultId;

    vaultSnapshots.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.inputTokenBalance = constants.BIGINT_ZERO;
    vaultSnapshots.outputTokenSupply = constants.BIGINT_ZERO;
    vaultSnapshots.pricePerShare = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.rewardTokenEmissionsAmount = [constants.BIGINT_ZERO];
    vaultSnapshots.rewardTokenEmissionsUSD = [constants.BIGDECIMAL_ZERO];

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
    vaultSnapshots.protocol = constants.CONVEX_BOOSTER_ADDRESS.toHexString();
    vaultSnapshots.vault = vaultId;

    vaultSnapshots.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.inputTokenBalance = constants.BIGINT_ZERO;
    vaultSnapshots.outputTokenSupply = constants.BIGINT_ZERO;
    vaultSnapshots.pricePerShare = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.rewardTokenEmissionsAmount = [constants.BIGINT_ZERO];
    vaultSnapshots.rewardTokenEmissionsUSD = [constants.BIGDECIMAL_ZERO];

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

export function getOrCreateFinancialDailySnapshots(
  block: ethereum.Block
): FinancialsDailySnapshot {
  let id = (block.timestamp.toI64() / constants.SECONDS_PER_DAY).toString();
  let financialMetrics = FinancialsDailySnapshot.load(id);

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id);
    financialMetrics.protocol = constants.CONVEX_BOOSTER_ADDRESS.toHexString();

    financialMetrics.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.protocolControlledValueUSD = constants.BIGDECIMAL_ZERO;
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

export function getOrCreateRewardPoolInfo(
  poolId: BigInt,
  crvRewardPoolAddress: Address,
  block: ethereum.Block
): _RewardPoolInfo {
  const rewardPoolInfoId = poolId
    .toString()
    .concat("-")
    .concat(crvRewardPoolAddress.toHexString());

  let rewardPoolInfo = _RewardPoolInfo.load(rewardPoolInfoId);

  if (!rewardPoolInfo) {
    rewardPoolInfo = new _RewardPoolInfo(rewardPoolInfoId);

    rewardPoolInfo.historicalRewards = constants.BIGINT_ZERO;
    rewardPoolInfo.lastRewardTimestamp = block.timestamp;
    rewardPoolInfo.save();
  }

  return rewardPoolInfo;
}

export function getOrCreateVault(
  poolId: BigInt,
  block: ethereum.Block
): VaultStore | null {
  const vaultId = constants.CONVEX_BOOSTER_ADDRESS.toHexString()
    .concat("-")
    .concat(poolId.toString());
  let vault = VaultStore.load(vaultId);

  if (!vault) {
    vault = new VaultStore(vaultId);

    const poolInfo = utils.getPoolInfoFromPoolId(poolId);
    if (!poolInfo) {
      log.error("[NewVault]: PoolInfo Reverted, PoolId: {}, block: {}", [
        poolId.toString(),
        block.number.toString(),
      ]);

      return null;
    }

    const lpTokenContract = ERC20Contract.bind(poolInfo.lpToken);
    vault.name = utils.readValue<string>(lpTokenContract.try_name(), "");
    vault.symbol = utils.readValue<string>(lpTokenContract.try_symbol(), "");
    vault.protocol = constants.CONVEX_BOOSTER_ADDRESS.toHexString();

    const inputToken = getOrCreateToken(poolInfo.lpToken);
    vault.inputToken = inputToken.id;
    vault.inputTokenBalance = constants.BIGINT_ZERO;

    const outputToken = getOrCreateToken(poolInfo.token);
    vault.outputToken = outputToken.id;
    vault.outputTokenSupply = constants.BIGINT_ZERO;

    vault.outputTokenPriceUSD = constants.BIGDECIMAL_ZERO;
    vault.pricePerShare = constants.BIGDECIMAL_ZERO;

    vault.createdBlockNumber = block.number;
    vault.createdTimestamp = block.timestamp;

    vault.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;

    vault.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    vault.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    vault.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;

    const poolAddress = utils.getPool(poolInfo.lpToken);
    if (poolAddress == constants.NULL.TYPE_ADDRESS) {
      log.warning("Could not find pool for lp token {}", [
        poolInfo.lpToken.toHexString(),
      ]);
    }

    const performanceFeeId = utils
      .enumToPrefix(constants.VaultFeeType.PERFORMANCE_FEE)
      .concat(constants.CONVEX_BOOSTER_ADDRESS.toHexString());

    let performanceFee = getTotalFees();
    utils.createFeeType(
      performanceFeeId,
      constants.VaultFeeType.PERFORMANCE_FEE,
      performanceFee.totalFees().times(constants.BIGDECIMAL_HUNDRED)
    );

    vault.fees = [performanceFeeId];

    vault._crvRewards = poolInfo.crvRewards.toHexString();
    vault._pool = poolAddress.toHexString();
    vault._gauge = poolInfo.gauge.toHexString();
    vault._lpToken = poolInfo.lpToken.toHexString();

    vault.depositLimit = constants.BIGINT_ZERO;

    const context = new DataSourceContext();
    context.setString("poolId", poolId.toString());
    PoolCrvRewardsTemplate.createWithContext(poolInfo.crvRewards, context);

    utils.updateProtocolAfterNewVault(vault.id);

    vault.save();

    log.warning("[NewVault] poolId: {}, name: {}, inputToken: {}, pool: {}", [
      poolId.toString(),
      vault.name!,
      inputToken.id,
      poolAddress.toHexString(),
    ]);
  }

  return vault;
}
