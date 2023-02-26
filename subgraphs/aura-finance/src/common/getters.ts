import {
  log,
  BigInt,
  BigDecimal,
  Address,
  ethereum,
  DataSourceContext,
} from "@graphprotocol/graph-ts";

import {
  ProtocolType,
  BIGDECIMAL_ZERO,
  BIGDECIMAL_HUNDRED,
  BIGINT_ZERO,
  RewardTokenType,
  VaultFeeType,
  INACURATE_PRICEFEED_TOKENS,
} from "./constants";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPricePerToken } from "../prices";
import { fetchTokenName, fetchTokenSymbol, fetchTokenDecimals } from "./tokens";
import { getDaysSinceEpoch, getHoursSinceEpoch } from "./utils/datetime";
import { prefixID } from "./utils/strings";
import { readValue } from "./utils/ethereum";
import { bigIntToBigDecimal, divide } from "./utils/numbers";
import { CustomFeesType, PoolInfoType } from "./types";
import { getPoolTokensInfo, isBPT, getPoolTokenWeights } from "./pools";
import { Versions } from "../versions";

import {
  Token,
  RewardToken,
  YieldAggregator,
  VaultDailySnapshot,
  Vault as VaultStore,
  VaultHourlySnapshot,
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  VaultFee,
  _RewardPool,
} from "../../generated/schema";
import { RewardPool as RewardPoolTemplate } from "../../generated/templates";
import { BaseRewardPool } from "../../generated/Booster-v1/BaseRewardPool";
import { Booster } from "../../generated/Booster-v1/Booster";

export function getOrCreateYieldAggregator(): YieldAggregator {
  const protocolId = NetworkConfigs.getFactoryAddress();
  let protocol = YieldAggregator.load(protocolId);

  if (!protocol) {
    protocol = new YieldAggregator(protocolId);
    protocol.name = NetworkConfigs.getProtocolName();
    protocol.slug = NetworkConfigs.getProtocolSlug();
    protocol.network = NetworkConfigs.getNetwork();
    protocol.type = ProtocolType.YIELD;

    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = 0;
    protocol.totalPoolCount = 0;

    protocol._activePoolCount = BIGINT_ZERO;
    protocol._vaultIds = [];
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();

  protocol.save();

  return protocol;
}

export function getOrCreateUsageMetricsDailySnapshot(
  event: ethereum.Event
): UsageMetricsDailySnapshot {
  const dayId = getDaysSinceEpoch(event.block.timestamp.toI32());
  let usageMetrics = UsageMetricsDailySnapshot.load(dayId);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(dayId);
    usageMetrics.protocol = NetworkConfigs.getFactoryAddress();

    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.dailyDepositCount = 0;
    usageMetrics.dailyWithdrawCount = 0;

    const protocol = getOrCreateYieldAggregator();
    usageMetrics.totalPoolCount = protocol.totalPoolCount;

    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateUsageMetricsHourlySnapshot(
  event: ethereum.Event
): UsageMetricsHourlySnapshot {
  const hourId = getHoursSinceEpoch(event.block.timestamp.toI32());
  let usageMetrics = UsageMetricsHourlySnapshot.load(hourId);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(hourId);
    usageMetrics.protocol = NetworkConfigs.getFactoryAddress();

    usageMetrics.hourlyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.hourlyTransactionCount = 0;
    usageMetrics.hourlyDepositCount = 0;
    usageMetrics.hourlyWithdrawCount = 0;

    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateFinancialDailySnapshots(
  event: ethereum.Event
): FinancialsDailySnapshot {
  const dayId = getDaysSinceEpoch(event.block.timestamp.toI32());
  let financialMetrics = FinancialsDailySnapshot.load(dayId);

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(dayId);
    financialMetrics.protocol = NetworkConfigs.getFactoryAddress();

    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;

    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    financialMetrics.blockNumber = event.block.number;
    financialMetrics.timestamp = event.block.timestamp;

    financialMetrics.save();
  }

  return financialMetrics;
}

export function getOrCreateBalancerPoolToken(
  poolAddress: Address,
  blockNumber: BigInt
): Token {
  const bpt = getOrCreateToken(poolAddress, blockNumber);

  const poolTokensInfo = getPoolTokensInfo(poolAddress);

  const inputTokens = poolTokensInfo.getInputTokens;
  const balances = poolTokensInfo.getBalances;
  const supply = poolTokensInfo.getSupply;
  const popIndex = poolTokensInfo.getPopIndex;

  const tokens: Token[] = [];
  let knownPriceForAtleastOnePoolToken = false;
  let knownPricePoolTokenIndex = -1;

  for (let idx = 0; idx < inputTokens.length; idx++) {
    const tokenAddress = Address.fromString(inputTokens[idx]);
    let token = getOrCreateToken(tokenAddress, blockNumber);

    if (isBPT(tokenAddress)) {
      token = getOrCreateBalancerPoolToken(tokenAddress, blockNumber);
    }

    if (INACURATE_PRICEFEED_TOKENS.includes(Address.fromString(token.id))) {
      token.lastPriceUSD = BIGDECIMAL_ZERO;
    }

    if (
      !knownPriceForAtleastOnePoolToken &&
      token.lastPriceUSD! != BIGDECIMAL_ZERO
    ) {
      knownPriceForAtleastOnePoolToken = true;
      knownPricePoolTokenIndex = idx;
    }

    tokens.push(token);
  }

  if (knownPriceForAtleastOnePoolToken) {
    const knownPricePoolToken = tokens[knownPricePoolTokenIndex];

    let poolTVL = BIGDECIMAL_ZERO;
    for (let idx = 0; idx < tokens.length; idx++) {
      if (tokens[idx].lastPriceUSD! == BIGDECIMAL_ZERO) {
        const unknownPricePoolToken = tokens[idx];

        const weights = getPoolTokenWeights(poolAddress, popIndex);

        const knownPricePoolTokenValueUSD = bigIntToBigDecimal(
          balances[knownPricePoolTokenIndex],
          knownPricePoolToken.decimals
        ).times(knownPricePoolToken.lastPriceUSD!);

        const unknownPricePoolTokenValueUSD = divide(
          weights[idx].times(knownPricePoolTokenValueUSD),
          weights[knownPricePoolTokenIndex]
        );
        unknownPricePoolToken.lastPriceUSD = divide(
          unknownPricePoolTokenValueUSD,
          bigIntToBigDecimal(balances[idx], unknownPricePoolToken.decimals)
        );

        unknownPricePoolToken.save();
      }

      const tokenValueUSD = bigIntToBigDecimal(
        balances[idx],
        tokens[idx].decimals
      ).times(tokens[idx].lastPriceUSD!);

      poolTVL = poolTVL.plus(tokenValueUSD);
    }

    bpt.lastPriceUSD = divide(
      poolTVL,
      bigIntToBigDecimal(supply, bpt.decimals)
    );
    bpt.lastPriceBlockNumber = blockNumber;

    bpt.save();
  } else {
    log.warning(
      "[getOrCreateBalancerPoolToken] No price for Balancer Pool input tokens. Balancer Pool Token: {} Input Tokens: {}",
      [poolAddress.toHexString(), inputTokens.toString()]
    );
  }

  return bpt;
}

export function getOrCreateToken(
  tokenAddress: Address,
  blockNumber: BigInt
): Token {
  let token = Token.load(tokenAddress.toHexString());

  if (!token) {
    token = new Token(tokenAddress.toHexString());

    token.name = fetchTokenName(tokenAddress);
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress) as i32;
    token.lastPriceBlockNumber = blockNumber;
  }

  if (!token.lastPriceUSD || token.lastPriceBlockNumber! < blockNumber) {
    const price = getUsdPricePerToken(tokenAddress);

    if (price.reverted) {
      token.lastPriceUSD = BIGDECIMAL_ZERO;
    } else {
      token.lastPriceUSD = price.usdPrice.div(price.decimalsBaseTen);
    }
    token.lastPriceBlockNumber = blockNumber;
  }
  token.save();

  return token;
}

export function getOrCreateRewardToken(
  address: Address,
  blockNumber: BigInt
): RewardToken {
  let rewardToken = RewardToken.load(
    RewardTokenType.DEPOSIT.concat("-").concat(address.toHexString())
  );

  if (!rewardToken) {
    const token = getOrCreateToken(address, blockNumber);

    rewardToken = new RewardToken(
      RewardTokenType.DEPOSIT.concat("-").concat(address.toHexString())
    );

    rewardToken.token = token.id;
    rewardToken.type = RewardTokenType.DEPOSIT;

    rewardToken.save();
  }

  return rewardToken;
}

export function getOrCreateFeeType(
  feeId: string,
  feeType: string,
  feePercentage: BigDecimal
): VaultFee {
  let fees = VaultFee.load(feeId);

  if (!fees) {
    fees = new VaultFee(feeId);
  }
  fees.feeType = feeType;
  fees.feePercentage = feePercentage;

  fees.save();

  return fees;
}

export function getFees(boosterAddr: Address): CustomFeesType {
  const boosterContract = Booster.bind(boosterAddr);

  const lockIncentive = readValue<BigInt>(
    boosterContract.try_lockIncentive(),
    BIGINT_ZERO
  );
  const callIncentive = readValue<BigInt>(
    boosterContract.try_earmarkIncentive(),
    BIGINT_ZERO
  );
  const stakerIncentive = readValue<BigInt>(
    boosterContract.try_stakerIncentive(),
    BIGINT_ZERO
  );
  const platformFee = readValue<BigInt>(
    boosterContract.try_platformFee(),
    BIGINT_ZERO
  );

  return new CustomFeesType(
    lockIncentive,
    callIncentive,
    stakerIncentive,
    platformFee
  );
}

export function getOrCreateVault(
  boosterAddr: Address,
  poolId: BigInt,
  event: ethereum.Event
): VaultStore | null {
  const vaultId = boosterAddr
    .toHexString()
    .concat("-")
    .concat(poolId.toString());
  let vault = VaultStore.load(vaultId);

  if (!vault) {
    vault = new VaultStore(vaultId);

    const boosterContract = Booster.bind(boosterAddr);

    const poolInfoCall = boosterContract.try_poolInfo(poolId);
    if (poolInfoCall.reverted) {
      log.error("[NewVault]: PoolInfo Reverted, PoolId: {}, block: {}", [
        poolId.toString(),
        event.block.number.toString(),
      ]);

      return null;
    }

    const poolInfo = new PoolInfoType(poolInfoCall.value);

    const inputToken = getOrCreateBalancerPoolToken(
      poolInfo.lpToken,
      event.block.number
    );
    vault.inputToken = inputToken.id;
    vault.inputTokenBalance = BIGINT_ZERO;

    vault.name = inputToken.name;
    vault.symbol = inputToken.symbol;
    vault.protocol = NetworkConfigs.getFactoryAddress();

    const outputToken = getOrCreateToken(poolInfo.token, event.block.number);
    vault.outputToken = outputToken.id;
    vault.outputTokenSupply = BIGINT_ZERO;

    vault.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    vault.pricePerShare = BIGDECIMAL_ZERO;

    vault.createdBlockNumber = event.block.number;
    vault.createdTimestamp = event.block.timestamp;

    vault.totalValueLockedUSD = BIGDECIMAL_ZERO;

    vault.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    vault.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    vault.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    const performanceFeeId = prefixID(
      VaultFeeType.PERFORMANCE_FEE,
      boosterAddr.toHexString()
    );

    getOrCreateFeeType(
      performanceFeeId,
      VaultFeeType.PERFORMANCE_FEE,
      getFees(boosterAddr).totalFees().times(BIGDECIMAL_HUNDRED)
    );

    vault.fees = [performanceFeeId];

    vault.rewardTokens = [
      getOrCreateRewardToken(
        Address.fromString(NetworkConfigs.getRewardToken()),
        event.block.number
      ).id,
    ];
    vault.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    vault.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];

    vault._balRewards = poolInfo.crvRewards.toHexString();
    vault._gauge = poolInfo.gauge.toHexString();
    vault._lpToken = poolInfo.lpToken.toHexString();
    vault._active = true;

    vault.depositLimit = BIGINT_ZERO;

    const context = new DataSourceContext();
    context.setString("poolId", poolId.toString());
    RewardPoolTemplate.createWithContext(poolInfo.crvRewards, context);

    vault.save();
  }

  return vault;
}

export function getOrCreateVaultDailySnapshots(
  vaultId: string,
  event: ethereum.Event
): VaultDailySnapshot {
  const id: string = vaultId
    .concat("-")
    .concat(getDaysSinceEpoch(event.block.timestamp.toI32()));
  let vaultSnapshots = VaultDailySnapshot.load(id);

  if (!vaultSnapshots) {
    vaultSnapshots = new VaultDailySnapshot(id);
    vaultSnapshots.protocol = NetworkConfigs.getFactoryAddress();
    vaultSnapshots.vault = vaultId;

    vaultSnapshots.totalValueLockedUSD = BIGDECIMAL_ZERO;
    vaultSnapshots.inputTokenBalance = BIGINT_ZERO;
    vaultSnapshots.outputTokenSupply = BIGINT_ZERO;
    vaultSnapshots.pricePerShare = BIGDECIMAL_ZERO;
    vaultSnapshots.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    vaultSnapshots.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];

    vaultSnapshots.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    vaultSnapshots.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;

    vaultSnapshots.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    vaultSnapshots.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;

    vaultSnapshots.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    vaultSnapshots.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    vaultSnapshots.blockNumber = event.block.number;
    vaultSnapshots.timestamp = event.block.timestamp;

    vaultSnapshots.save();
  }

  return vaultSnapshots;
}

export function getOrCreateVaultHourlySnapshots(
  vaultId: string,
  event: ethereum.Event
): VaultHourlySnapshot {
  const id: string = vaultId
    .concat("-")
    .concat(getHoursSinceEpoch(event.block.timestamp.toI32()));
  let vaultSnapshots = VaultHourlySnapshot.load(id);

  if (!vaultSnapshots) {
    vaultSnapshots = new VaultHourlySnapshot(id);
    vaultSnapshots.protocol = NetworkConfigs.getFactoryAddress();
    vaultSnapshots.vault = vaultId;

    vaultSnapshots.totalValueLockedUSD = BIGDECIMAL_ZERO;
    vaultSnapshots.inputTokenBalance = BIGINT_ZERO;
    vaultSnapshots.outputTokenSupply = BIGINT_ZERO;
    vaultSnapshots.pricePerShare = BIGDECIMAL_ZERO;
    vaultSnapshots.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    vaultSnapshots.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];

    vaultSnapshots.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    vaultSnapshots.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;

    vaultSnapshots.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    vaultSnapshots.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;

    vaultSnapshots.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;
    vaultSnapshots.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    vaultSnapshots.blockNumber = event.block.number;
    vaultSnapshots.timestamp = event.block.timestamp;

    vaultSnapshots.save();
  }

  return vaultSnapshots;
}

export function getOrCreateRewardPool(
  poolId: BigInt,
  rewardPoolAddr: Address,
  block: ethereum.Block
): _RewardPool {
  const rewardPoolId = poolId
    .toString()
    .concat("-")
    .concat(rewardPoolAddr.toHexString());

  let rewardPool = _RewardPool.load(rewardPoolId);

  if (!rewardPool) {
    rewardPool = new _RewardPool(rewardPoolId);

    rewardPool.historicalRewards = BIGINT_ZERO;
    rewardPool.lastAddedRewards = BIGINT_ZERO;
    rewardPool.lastRewardTimestamp = block.timestamp;
  }

  if (
    !rewardPool.historicalRewards ||
    rewardPool.lastRewardTimestamp < block.timestamp
  ) {
    const rewardPoolContract = BaseRewardPool.bind(rewardPoolAddr);
    const historicalRewardsUpdated = readValue<BigInt>(
      rewardPoolContract.try_historicalRewards(),
      BIGINT_ZERO
    );

    rewardPool.lastAddedRewards = historicalRewardsUpdated.minus(
      rewardPool.historicalRewards
    );
    rewardPool.historicalRewards = historicalRewardsUpdated;
    rewardPool.lastRewardTimestamp = block.timestamp;
  }
  rewardPool.save();

  return rewardPool;
}
