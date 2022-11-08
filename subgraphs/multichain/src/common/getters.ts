import { Address, ethereum, BigInt, log } from "@graphprotocol/graph-ts";

import {
  fetchTokenSymbol,
  fetchTokenName,
  fetchTokenDecimals,
  isNativeToken,
  isRewardToken,
} from "./tokens";
import {
  BIGDECIMAL_ZERO,
  INT_ZERO,
  ProtocolType,
  BIGINT_ZERO,
  RewardTokenType,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  CHAINS,
} from "./constants";
import { Versions } from "../versions";
import { getUsdPricePerToken } from "../prices";
import { addToArrayAtIndex } from "./utils/arrays";
import { getDaysSinceEpoch, getHoursSinceEpoch } from "./utils/datetime";
import { NetworkConfigs } from "../../configurations/configure";

import {
  Protocol,
  Pool,
  PoolDailySnapshot,
  PoolHourlySnapshot,
  Token,
  RewardToken,
  UsageMetricsHourlySnapshot,
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
} from "../../generated/schema";
import { anyTOKEN } from "../../generated/RouterV6/anyTOKEN";

export function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load(NetworkConfigs.getFactoryAddress());

  if (!protocol) {
    protocol = new Protocol(NetworkConfigs.getFactoryAddress());
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.network = NetworkConfigs.getNetwork();
    protocol.type = ProtocolType.GENERIC;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = 0;
    protocol.totalPoolCount = 0;
    protocol.pools = [];
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();

  protocol.save();

  return protocol;
}

export function getOrCreateToken(
  tokenAddress: Address,
  blockNumber: BigInt
): Token {
  let token = Token.load(tokenAddress.toHexString());

  if (!token) {
    token = new Token(tokenAddress.toHexString());

    if (isNativeToken(tokenAddress)) {
      let conf = NetworkConfigs.getNativeToken();

      token.name = conf.get("name")!;
      token.symbol = conf.get("symbol")!;
      token.decimals = parseInt(conf.get("decimals")!) as i32;
    } else if (isRewardToken(tokenAddress)) {
      let rewardTokenConf = NetworkConfigs.getRewardToken();

      token.name = rewardTokenConf.get("name")!;
      token.symbol = rewardTokenConf.get("symbol")!;
      token.decimals = parseInt(rewardTokenConf.get("decimals")!) as i32;
    } else {
      token.name = fetchTokenName(tokenAddress);
      token.symbol = fetchTokenSymbol(tokenAddress);
      token.decimals = fetchTokenDecimals(tokenAddress) as i32;
    }
    token.lastPriceBlockNumber = blockNumber;
  }

  if (!token.lastPriceUSD || token.lastPriceBlockNumber! < blockNumber) {
    let price = getUsdPricePerToken(tokenAddress);
    if (price.reverted) {
      token.lastPriceUSD = BIGDECIMAL_ZERO;
    } else {
      token.lastPriceUSD = price.usdPrice.div(price.decimalsBaseTen);
    }

    // for anyTOKEN, can use underlying token price
    if (token.lastPriceUSD == BIGDECIMAL_ZERO) {
      const anyTokenContract = anyTOKEN.bind(Address.fromString(token.id));
      const underlyingTokenCall = anyTokenContract.try_underlying();
      if (!underlyingTokenCall.reverted) {
        let price = getUsdPricePerToken(underlyingTokenCall.value);
        token.lastPriceUSD = price.usdPrice.div(price.decimalsBaseTen);

        log.warning(
          "[Oracle] Using underlying token price; tokenAddr: {}, Underlying tokenAddr: {}, Price: {}",
          [
            token.id,
            underlyingTokenCall.value.toHexString(),
            token.lastPriceUSD!.toString(),
          ]
        );
      }
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
    let token = getOrCreateToken(address, blockNumber);

    rewardToken = new RewardToken(
      RewardTokenType.DEPOSIT.concat("-").concat(address.toHexString())
    );

    rewardToken.token = token.id;
    rewardToken.type = RewardTokenType.DEPOSIT;

    rewardToken.save();
  }

  return rewardToken;
}

export function getOrCreatePool(
  poolAddress: string,
  event: ethereum.Event
): Pool {
  let pool = Pool.load(poolAddress);

  if (!pool) {
    pool = new Pool(poolAddress);

    let inputToken = getOrCreateToken(
      Address.fromString(poolAddress.split("-")[1]),
      event.block.number
    );
    pool.inputTokens = [inputToken.id];
    pool.inputTokenBalances = [BIGINT_ZERO];

    pool.name = CHAINS.get(poolAddress.split("-")[0])
      .concat("-")
      .concat(inputToken.name);
    pool.symbol = CHAINS.get(poolAddress.split("-")[0])
      .concat("-")
      .concat(inputToken.symbol);

    let rewardToken = getOrCreateRewardToken(
      Address.fromString(NetworkConfigs.getRewardToken().get("address")!),
      event.block.number
    );
    pool.rewardTokens = [rewardToken.id];
    pool.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    pool.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];

    pool.protocol = NetworkConfigs.getFactoryAddress();
    pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    pool.createdTimestamp = event.block.timestamp;
    pool.createdBlockNumber = event.block.number;
    pool.save();

    let protocol = getOrCreateProtocol();

    protocol.pools = addToArrayAtIndex<string>(protocol.pools, pool.id);
    protocol.totalPoolCount = protocol.totalPoolCount + 1;
    protocol.save();
  }

  return pool;
}

export function getOrCreatePoolDailySnapshot(
  poolAddress: string,
  event: ethereum.Event
): PoolDailySnapshot {
  let dayId = getDaysSinceEpoch(event.block.timestamp.toI32());

  let poolMetrics = PoolDailySnapshot.load(
    poolAddress.concat("-").concat(dayId)
  );

  if (!poolMetrics) {
    poolMetrics = new PoolDailySnapshot(poolAddress.concat("-").concat(dayId));

    poolMetrics.protocol = NetworkConfigs.getFactoryAddress();
    poolMetrics.pool = poolAddress;
    poolMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.inputTokenBalances = [];
    poolMetrics.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    poolMetrics.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];

    poolMetrics.blockNumber = event.block.number;
    poolMetrics.timestamp = event.block.timestamp;

    poolMetrics.save();
  }

  return poolMetrics;
}

export function getOrCreatePoolHourlySnapshot(
  poolAddress: string,
  event: ethereum.Event
): PoolHourlySnapshot {
  let hourId = getHoursSinceEpoch(event.block.timestamp.toI32());

  let poolMetrics = PoolHourlySnapshot.load(
    poolAddress.concat("-").concat(hourId)
  );

  if (!poolMetrics) {
    poolMetrics = new PoolHourlySnapshot(
      poolAddress.concat("-").concat(hourId)
    );

    poolMetrics.protocol = NetworkConfigs.getFactoryAddress();
    poolMetrics.pool = poolAddress;
    poolMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.inputTokenBalances = [];
    poolMetrics.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    poolMetrics.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];

    poolMetrics.blockNumber = event.block.number;
    poolMetrics.timestamp = event.block.timestamp;

    poolMetrics.save();
  }

  return poolMetrics;
}

export function getOrCreateUsageMetricDailySnapshot(
  event: ethereum.Event
): UsageMetricsDailySnapshot {
  let dayId = getDaysSinceEpoch(event.block.timestamp.toI32());

  let usageMetrics = UsageMetricsDailySnapshot.load(dayId);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(dayId);

    usageMetrics.protocol = NetworkConfigs.getFactoryAddress();
    usageMetrics.dailyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = INT_ZERO;
    usageMetrics.dailyTransactionCount = INT_ZERO;
    usageMetrics.totalPoolCount = INT_ZERO;
    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateUsageMetricHourlySnapshot(
  event: ethereum.Event
): UsageMetricsHourlySnapshot {
  let hourId = getHoursSinceEpoch(event.block.timestamp.toI32());

  let usageMetrics = UsageMetricsHourlySnapshot.load(hourId);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(hourId);

    usageMetrics.protocol = NetworkConfigs.getFactoryAddress();
    usageMetrics.hourlyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = INT_ZERO;
    usageMetrics.hourlyTransactionCount = INT_ZERO;
    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateFinancialsDailySnapshot(
  event: ethereum.Event
): FinancialsDailySnapshot {
  let dayId = getDaysSinceEpoch(event.block.timestamp.toI32());

  let financialMetrics = FinancialsDailySnapshot.load(dayId);

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(dayId);

    financialMetrics.protocol = NetworkConfigs.getFactoryAddress();
    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.blockNumber = event.block.number;
    financialMetrics.timestamp = event.block.timestamp;

    financialMetrics.save();
  }

  return financialMetrics;
}
