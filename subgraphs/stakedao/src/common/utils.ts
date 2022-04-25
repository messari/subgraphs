import * as utils from "../common/utils";
import * as constants from "../common/constants";
import {
  Token,
  VaultFee,
  RewardToken,
  YieldAggregator,
  VaultDailySnapshot,
  Vault as VaultStore,
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
} from "../../generated/schema";
import { ERC20 as ERC20Contract } from "../../generated/Controller/ERC20";
import { BigInt, ethereum, Address, BigDecimal } from "@graphprotocol/graph-ts";

export function getTimeInMillis(time: BigInt): BigInt {
  return time.times(BigInt.fromI32(1000));
}

export function getTimestampInMillis(block: ethereum.Block): BigInt {
  return block.timestamp.times(BigInt.fromI32(1000));
}

export function getOrCreateYieldAggregator(id: string): YieldAggregator {
  let protocol = YieldAggregator.load(id);

  if (!protocol) {
    protocol = new YieldAggregator(constants.ETHEREUM_PROTOCOL_ID);
    protocol.name = "Stake DAO";
    protocol.slug = "stake-dao";
    protocol.schemaVersion = "1.0.0";
    protocol.subgraphVersion = "1.0.0";
    protocol.network = constants.Network.ETHEREUM;
    protocol.type = constants.ProtocolType.YIELD;
  }

  return protocol;
}

export function getOrCreateToken(address: Address): Token {
  let token = Token.load(address.toHexString());
  if (!token) {
    token = new Token(address.toHexString());

    let erc20Contract = ERC20Contract.bind(address);
    let name = utils.readValue<string>(erc20Contract.try_name(), "");
    let symbol = utils.readValue<string>(erc20Contract.try_symbol(), "");
    let decimals = utils.readValue<BigInt>(
      erc20Contract.try_decimals(),
      constants.DEFAULT_DECIMALS
    );

    token.name = name;
    token.symbol = symbol;
    token.decimals = decimals.toI32();

    token.save();
  }
  return token as Token;
}

export function getOrCreateRewardToken(address: Address): RewardToken {
  let rewardToken = RewardToken.load(address.toHexString());
  if (!rewardToken) {
    rewardToken = new RewardToken(address.toHexString());

    let erc20Contract = ERC20Contract.bind(address);
    let name = utils.readValue<string>(erc20Contract.try_name(), "");
    let symbol = utils.readValue<string>(erc20Contract.try_symbol(), "");
    let decimals = utils.readValue<BigInt>(
      erc20Contract.try_decimals(),
      constants.DEFAULT_DECIMALS
    );

    rewardToken.name = name;
    rewardToken.symbol = symbol;
    rewardToken.decimals = decimals.toI32();

    rewardToken.type = constants.RewardTokenType.DEPOSIT;
    rewardToken.save();
  }
  return rewardToken as RewardToken;
}

export function getFeePercentage(
  vaultAddress: string,
  feeType: string
): BigDecimal {
  let feesPercentage: BigDecimal = BigDecimal.fromString("0");
  const vault = VaultStore.load(vaultAddress);

  for (let i = 0; i < vault!.fees.length; i++) {
    const vaultFee = VaultFee.load(vault!.fees[i]);

    if (vaultFee!.feeType == feeType) {
      feesPercentage = vaultFee!.feePercentage;
    }
  }

  return feesPercentage;
}

export function getOrCreateFinancialSnapshots(
  financialSnapshotId: string
): FinancialsDailySnapshot {
  let financialMetrics = FinancialsDailySnapshot.load(financialSnapshotId);

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(financialSnapshotId);
    financialMetrics.protocol = constants.ETHEREUM_PROTOCOL_ID;

    financialMetrics.feesUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.totalVolumeUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.supplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.protocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
  }

  return financialMetrics;
}

export function getOrCreateVaultSnapshots(
  vaultSnapshotsId: string
): VaultDailySnapshot {
  let vaultSnapshots = VaultDailySnapshot.load(vaultSnapshotsId);

  if (!vaultSnapshots) {
    vaultSnapshots = new VaultDailySnapshot(vaultSnapshotsId);
    vaultSnapshots.protocol = constants.ETHEREUM_PROTOCOL_ID;

    vaultSnapshots.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.totalVolumeUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.inputTokenBalances = [constants.BIGINT_ZERO];
    vaultSnapshots.outputTokenSupply = constants.BIGINT_ZERO;
    vaultSnapshots.outputTokenPriceUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.rewardTokenEmissionsAmount = [constants.BIGINT_ZERO];
    vaultSnapshots.rewardTokenEmissionsUSD = [constants.BIGDECIMAL_ZERO];
  }

  return vaultSnapshots;
}

export function getOrCreateUsageMetricSnapshot(
  block: ethereum.Block
): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = block.timestamp.toI64() / constants.SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = constants.ETHEREUM_PROTOCOL_ID;

    usageMetrics.activeUsers = 0;
    usageMetrics.totalUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.save();
  }

  return usageMetrics;
}

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}
