import * as utils from "../common/utils";
import * as constants from "../common/constants";
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
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { _Strategy, Vault as VaultStore } from "../../generated/schema";
import { Strategy as StrategyTemplate } from "../../generated/templates";
import { ERC20 as ERC20Contract } from "../../generated/Controller/ERC20";
import { Strategy as StrategyContract } from "../../generated/controller/Strategy";
import { EthereumController as ControllerContract } from "../../generated/Controller/EthereumController";

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
  const protocolId = constants.ETHEREUM_PROTOCOL_ID;
  let protocol = YieldAggregator.load(protocolId);

  if (!protocol) {
    protocol = new YieldAggregator(protocolId);
    protocol.name = constants.Protocol.NAME;
    protocol.slug = constants.Protocol.SLUG;
    protocol.schemaVersion = constants.Protocol.SCHEMA_VERSION;
    protocol.subgraphVersion = constants.Protocol.SUBGRAPH_VERSION;
    protocol.network = constants.Protocol.NETWORK;
    protocol.type = constants.Protocol.TYPE;

    protocol.save();
  }

  return protocol;
}

export function getOrCreateToken(address: Address): Token {
  const tokenId = address.toHexString();
  let token = Token.load(tokenId);

  if (!token) {
    token = new Token(tokenId);

    const contract = ERC20Contract.bind(address);
    token.name = utils.readValue<string>(contract.try_name(), "");
    token.symbol = utils.readValue<string>(contract.try_symbol(), "");
    token.decimals = utils
      .readValue<BigInt>(contract.try_decimals(), constants.BIGINT_ZERO)
      .toI32() as u8;

    token.save();
  }

  return token;
}

export function getOrCreateRewardToken(address: Address): RewardToken {
  const rewardTokenId = address.toHexString();
  let rewardToken = RewardToken.load(rewardTokenId);

  if (!rewardToken) {
    rewardToken = new RewardToken(rewardTokenId);

    const token = getOrCreateToken(address);
    rewardToken.token = token.id;
    rewardToken.type = constants.RewardTokenType.DEPOSIT;

    rewardToken.save();
  }
  return rewardToken as RewardToken;
}

export function getOrCreateFinancialDailySnapshots(
  block: ethereum.Block
): FinancialsDailySnapshot {
  let id = block.timestamp.toI64() / constants.SECONDS_PER_DAY;
  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = constants.ETHEREUM_PROTOCOL_ID;

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

export function getOrCreateUsageMetricsDailySnapshot(
  block: ethereum.Block
): UsageMetricsDailySnapshot {
  let id: i64 = block.timestamp.toI64() / constants.SECONDS_PER_DAY;
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = constants.ETHEREUM_PROTOCOL_ID;

    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.dailyDepositCount = 0;
    usageMetrics.dailyWithdrawCount = 0;

    usageMetrics.blockNumber = block.number;
    usageMetrics.timestamp = block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateUsageMetricsHourlySnapshot(
  block: ethereum.Block
): UsageMetricsHourlySnapshot {
  let metricsID: string = (block.timestamp.toI64() / constants.SECONDS_PER_DAY)
    .toString()
    .concat("-")
    .concat((block.timestamp.toI64() / constants.SECONDS_PER_HOUR).toString());
  let usageMetrics = UsageMetricsHourlySnapshot.load(metricsID);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(metricsID);
    usageMetrics.protocol = constants.ETHEREUM_PROTOCOL_ID;

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
  vaultAddress: Address,
  block: ethereum.Block
): VaultDailySnapshot {
  let id: string = vaultAddress
    .toHexString()
    .concat((block.timestamp.toI64() / constants.SECONDS_PER_DAY).toString());
  let vaultSnapshots = VaultDailySnapshot.load(id);

  if (!vaultSnapshots) {
    vaultSnapshots = new VaultDailySnapshot(id);
    vaultSnapshots.protocol = constants.ETHEREUM_PROTOCOL_ID;
    vaultSnapshots.vault = vaultAddress.toHexString();

    vaultSnapshots.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.inputTokenBalance = constants.BIGINT_ZERO;
    vaultSnapshots.outputTokenSupply = constants.BIGINT_ZERO;
    vaultSnapshots.outputTokenPriceUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.pricePerShare = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.stakedOutputTokenAmount = constants.BIGINT_ZERO;
    vaultSnapshots.rewardTokenEmissionsAmount = [constants.BIGINT_ZERO];
    vaultSnapshots.rewardTokenEmissionsUSD = [constants.BIGDECIMAL_ZERO];

    vaultSnapshots.blockNumber = block.number;
    vaultSnapshots.timestamp = block.timestamp;

    vaultSnapshots.save();
  }

  return vaultSnapshots;
}

export function getOrCreateVaultsHourlySnapshots(
  vaultAddress: Address,
  block: ethereum.Block
): VaultHourlySnapshot {
  let id: string = vaultAddress
    .toHexString()
    .concat((block.timestamp.toI64() / constants.SECONDS_PER_DAY).toString())
    .concat("-")
    .concat((block.timestamp.toI64() / constants.SECONDS_PER_HOUR).toString());
  let vaultSnapshots = VaultHourlySnapshot.load(id);

  if (!vaultSnapshots) {
    vaultSnapshots = new VaultHourlySnapshot(id);
    vaultSnapshots.protocol = constants.ETHEREUM_PROTOCOL_ID;
    vaultSnapshots.vault = vaultAddress.toHexString();

    vaultSnapshots.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.inputTokenBalance = constants.BIGINT_ZERO;
    vaultSnapshots.outputTokenSupply = constants.BIGINT_ZERO;
    vaultSnapshots.outputTokenPriceUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.pricePerShare = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.stakedOutputTokenAmount = constants.BIGINT_ZERO;
    vaultSnapshots.rewardTokenEmissionsAmount = [constants.BIGINT_ZERO];
    vaultSnapshots.rewardTokenEmissionsUSD = [constants.BIGDECIMAL_ZERO];

    vaultSnapshots.blockNumber = block.number;
    vaultSnapshots.timestamp = block.timestamp;

    vaultSnapshots.save();
  }

  return vaultSnapshots;
}

export function getOrCreateStrategy(
  controllerAddress: Address,
  vault: VaultStore,
  _inputAddress: Address,
  _strategyAddress: Address | null = null
): string {
  let strategyAddress: string;
  const controller = ControllerContract.bind(controllerAddress);

  if (!_strategyAddress) {
    strategyAddress = utils
      .readValue<Address>(
        controller.try_strategies(_inputAddress),
        constants.ZERO_ADDRESS
      )
      .toHexString();
  } else {
    strategyAddress = _strategyAddress.toHexString();
  }

  if (strategyAddress == constants.ZERO_ADDRESS_STRING) {
    return strategyAddress;
  }

  const strategy = new _Strategy(strategyAddress);
  const strategyContract = StrategyContract.bind(
    Address.fromString(strategyAddress)
  );

  strategy.vaultAddress = Address.fromString(vault.id);
  strategy.inputToken = _inputAddress;
  strategy.save();

  const withdrawalFeeId = utils.prefixID(
    constants.VaultFeeType.WITHDRAWAL_FEE,
    vault.id
  );
  const withdrawalFee = utils.readValue<BigInt>(
    strategyContract.try_withdrawalFee(),
    constants.DEFAULT_WITHDRAWAL_FEE
  );
  utils.createFeeType(
    withdrawalFeeId,
    constants.VaultFeeType.WITHDRAWAL_FEE,
    withdrawalFee
  );

  const performanceFeeId = utils.prefixID(
    constants.VaultFeeType.PERFORMANCE_FEE,
    vault.id
  );
  const performanceFee = utils.readValue<BigInt>(
    strategyContract.try_performanceFee(),
    constants.DEFAULT_PERFORMANCE_FEE
  );
  utils.createFeeType(
    performanceFeeId,
    constants.VaultFeeType.PERFORMANCE_FEE,
    performanceFee
  );

  vault.fees = [withdrawalFeeId, performanceFeeId];
  vault._strategy = strategyAddress;
  vault.save();

  StrategyTemplate.create(Address.fromString(strategyAddress));

  return strategyAddress;
}
