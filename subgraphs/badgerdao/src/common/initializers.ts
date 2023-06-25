import {
  log,
  Address,
  ethereum,
  BigDecimal,
  DataSourceContext,
} from "@graphprotocol/graph-ts";
import {
  Token,
  Account,
  VaultFee,
  _WantToken,
  RewardToken,
  YieldAggregator,
  VaultDailySnapshot,
  VaultHourlySnapshot,
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
} from "../../generated/schema";
import * as utils from "./utils";
import { Versions } from "../versions";
import * as constants from "./constants";
import { getUsdPricePerToken } from "../prices";
import { Vault as VaultStore } from "../../generated/schema";
import { Strategy as StrategyTemplate } from "../../generated/templates";
import { ERC20 as ERC20Contract } from "../../generated/templates/Strategy/ERC20";
import { Vault as VaultContract } from "../../generated/templates/Strategy/Vault";

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
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();

  protocol.save();

  return protocol;
}

export function getOrCreateToken(
  address: Address,
  block: ethereum.Block
): Token {
  let token = Token.load(address.toHexString());

  if (!token) {
    token = new Token(address.toHexString());

    const contract = ERC20Contract.bind(address);

    token.name = utils.readValue<string>(contract.try_name(), "");
    token.symbol = utils.readValue<string>(contract.try_symbol(), "");
    token.decimals = utils.readValue<i32>(contract.try_decimals(), 0) as u8;

    token.save();
  }

  if (
    !token.lastPriceUSD ||
    !token.lastPriceBlockNumber ||
    block.number
      .minus(token.lastPriceBlockNumber!)
      .gt(constants.ETH_AVERAGE_BLOCK_PER_HOUR)
  ) {
    const tokenPrice = getUsdPricePerToken(address, block);
    token.lastPriceUSD = tokenPrice.usdPrice;
    token.lastPriceBlockNumber = block.number;

    token.save();
  }

  return token;
}

export function getOrCreateWantToken(
  wantToken: Address,
  vaultAddress: Address | null
): _WantToken {
  let wantTokenStore = _WantToken.load(wantToken.toHexString());

  if (!wantTokenStore) {
    wantTokenStore = new _WantToken(wantToken.toHexString());

    if (!vaultAddress) vaultAddress = constants.NULL.TYPE_ADDRESS;

    wantTokenStore.vaultAddress = vaultAddress.toHexString();

    wantTokenStore.save();
  }

  return wantTokenStore;
}

export function getOrCreateRewardToken(
  address: Address,
  block: ethereum.Block
): RewardToken {
  let rewardToken = RewardToken.load(address.toHexString());

  if (!rewardToken) {
    rewardToken = new RewardToken(address.toHexString());
    const token = getOrCreateToken(address, block);
    rewardToken.token = token.id;
    rewardToken.type = constants.RewardTokenType.DEPOSIT;

    rewardToken.save();
  }

  return rewardToken;
}

export function getOrCreateVaultFee(
  feeId: string,
  feeType: string,
  feePercentage: BigDecimal | null = null
): VaultFee {
  let fees = VaultFee.load(feeId);

  if (!fees) {
    fees = new VaultFee(feeId);

    fees.feeType = feeType;
    fees.feePercentage = feePercentage;

    fees.save();
  }

  if (feePercentage) {
    fees.feePercentage = feePercentage;

    fees.save();
  }

  return fees;
}

export function getOrCreateFinancialDailySnapshots(
  block: ethereum.Block
): FinancialsDailySnapshot {
  const id = block.timestamp.toI64() / constants.SECONDS_PER_DAY;
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
  const id: string = (
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
  const metricsID: string = (
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
  const id: string = vaultId
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
  const id: string = vaultId
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

    // There is no deposit limit on Badger DAO
    vault.depositLimit = constants.BIGINT_ZERO;
    vault.protocol = constants.PROTOCOL_ID;

    const inputTokenAddress = utils.readValue<Address>(
      vaultContract.try_token(),
      constants.NULL.TYPE_ADDRESS
    );
    const inputToken = getOrCreateToken(inputTokenAddress, block);
    getOrCreateWantToken(inputTokenAddress, vaultAddress);

    vault.inputToken = inputToken.id;
    vault.inputTokenBalance = constants.BIGINT_ZERO;

    const outputToken = getOrCreateToken(vaultAddress, block);
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

    const controllerAddress = utils.getControllerAddress(vaultAddress);
    const strategyAddress = utils.getVaultStrategy(
      vaultAddress,
      inputTokenAddress
    );
    if (strategyAddress.notEqual(constants.NULL.TYPE_ADDRESS)) {
      const context = new DataSourceContext();
      context.setString("vaultAddress", vaultAddress.toHexString());

      StrategyTemplate.createWithContext(strategyAddress, context);
    }

    const bribesAddress = utils.getBribesProcessor(
      vaultAddress,
      strategyAddress
    );

    vault.fees = utils.getVaultFees(vaultAddress, strategyAddress).stringIds();
    vault._lastRewardsBlockNumber = block.number;

    vault._bribesProcessor = bribesAddress.toHexString();
    vault._controller = controllerAddress.toHexString();
    vault._strategy = strategyAddress.toHexString();

    vault.save();

    utils.updateProtocolAfterNewVault(vaultAddress);

    log.warning("[NewVault] VaultId: {}, inputToken: {}, strategy: {}", [
      vaultAddress.toHexString(),
      inputTokenAddress.toHexString(),
      strategyAddress.toHexString(),
    ]);
  }

  if (
    block.number
      .minus(vault._lastRewardsBlockNumber)
      .gt(constants.REWARDS_LOGGER_CACHING)
  ) {
    utils.deactivateFinishedRewards(vault, block);

    vault._lastRewardsBlockNumber = block.number;
    vault.save();
  }

  return vault;
}
