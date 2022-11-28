import {
  Address,
  ethereum,
  BigInt,
  DataSourceContext,
} from "@graphprotocol/graph-ts";

import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from "./tokens";
import {
  INT_ZERO,
  BIGINT_ZERO,
  BIGDECIMAL_ZERO,
  NetworkByID,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  ProtocolType,
  BridgePoolType,
  CrosschainTokenType,
  INACURATE_PRICEFEED_TOKENS,
  INT_ONE,
  Network,
  ZERO_ADDRESS,
} from "./constants";
import { Versions } from "../versions";
import { getUsdPricePerToken } from "../prices";
import { addToArrayAtIndex } from "./utils/arrays";
import { getDaysSinceEpoch, getHoursSinceEpoch } from "./utils/datetime";
import { NetworkConfigs } from "../../configurations/configure";

import {
  BridgeProtocol,
  Pool,
  PoolDailySnapshot,
  PoolHourlySnapshot,
  Token,
  CrosschainToken,
  UsageMetricsHourlySnapshot,
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  PoolRoute,
  PoolRouteSnapshot,
} from "../../generated/schema";
import { PoolTemplate } from "../../generated/templates";
import { ERC20 } from "../../generated/RouterV6/ERC20";
import { anyTOKEN } from "../../generated/RouterV6/anyTOKEN";

export function getOrCreateProtocol(): BridgeProtocol {
  let protocol = BridgeProtocol.load(NetworkConfigs.getFactoryAddress());
  if (!protocol) {
    protocol = new BridgeProtocol(NetworkConfigs.getFactoryAddress());
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.network = NetworkConfigs.getNetwork();
    protocol.type = ProtocolType.BRIDGE;
    protocol.permissionless = false;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeInUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeOutUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalVolumeUSD = BIGDECIMAL_ZERO;
    protocol.netVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = INT_ZERO;
    protocol.cumulativeUniqueLiquidityProviders = INT_ZERO;
    protocol.cumulativeUniqueMessageSenders = INT_ZERO;
    protocol.cumulativeTransactionCount = INT_ZERO;
    protocol.cumulativeTransferCount = INT_ZERO;
    protocol.cumulativeDepositCount = INT_ZERO;
    protocol.cumulativeWithdrawCount = INT_ZERO;
    protocol.cumulativeMessageSentCount = INT_ZERO;
    protocol.supportedNetworks = [];
    protocol.totalPoolCount = INT_ZERO;
    protocol.totalPoolRouteCount = INT_ZERO;
    protocol.canonicalRouteCount = INT_ZERO;
    protocol.wrappedRouteCount = INT_ZERO;
    protocol.supportedTokenCount = INT_ZERO;
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

    token.name = fetchTokenName(tokenAddress);
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress) as i32;

    token.lastPriceBlockNumber = blockNumber;
    token._totalSupply = BIGINT_ZERO;
  }

  if (!token.lastPriceUSD || token.lastPriceBlockNumber! < blockNumber) {
    let canonicalToken = token;

    const anyTokenContract = anyTOKEN.bind(tokenAddress);
    const underlyingTokenCall = anyTokenContract.try_underlying();
    if (
      !underlyingTokenCall.reverted &&
      underlyingTokenCall.value != Address.fromString(ZERO_ADDRESS)
    ) {
      canonicalToken = getOrCreateToken(underlyingTokenCall.value, blockNumber);

      token._canonicalToken = canonicalToken.id;
    }

    token.lastPriceUSD = BIGDECIMAL_ZERO;
    if (
      !INACURATE_PRICEFEED_TOKENS.includes(
        Address.fromString(canonicalToken.id)
      )
    ) {
      const price = getUsdPricePerToken(Address.fromString(canonicalToken.id));
      if (!price.reverted) {
        token.lastPriceUSD = price.usdPrice.div(price.decimalsBaseTen);
      }
    }
    token.lastPriceBlockNumber = blockNumber;

    const ERC20Contract = ERC20.bind(tokenAddress);
    const totalSupplyCall = ERC20Contract.try_totalSupply();
    if (!totalSupplyCall.reverted) {
      token._totalSupply = totalSupplyCall.value;
    }
  }
  token.save();

  return token;
}

export function getOrCreateCrosschainToken(
  crosschainTokenAddress: Address,
  crosschainID: BigInt,
  tokenAddress: Address,
  blockNumber: BigInt
): CrosschainToken {
  const crosschainTokenID = crosschainID
    .toString()
    .concat("-")
    .concat(crosschainTokenAddress.toHexString());

  let crosschainToken = CrosschainToken.load(crosschainTokenID);
  if (!crosschainToken) {
    crosschainToken = new CrosschainToken(crosschainTokenID);

    const token = getOrCreateToken(tokenAddress, blockNumber);

    crosschainToken.network = NetworkByID.get(crosschainID.toString())
      ? NetworkByID.get(crosschainID.toString())!
      : Network.UNKNOWN_NETWORK;
    crosschainToken.address = crosschainTokenAddress.toHexString();
    crosschainToken.type = NetworkConfigs.getCrosschainTokenType(
      token,
      crosschainID.toString()
    );
    crosschainToken.token = token.id;
    crosschainToken.save();
  }

  return crosschainToken;
}

export function getOrCreatePool(
  poolAddress: string,
  event: ethereum.Event
): Pool {
  let pool = Pool.load(poolAddress);
  if (!pool) {
    pool = new Pool(poolAddress);

    const token = getOrCreateToken(
      Address.fromString(poolAddress),
      event.block.number
    );
    // pool.inputToken = token.id;
    // pool.inputTokenBalance = BIGINT_ZERO;
    pool.inputTokens = [token.id];
    pool.inputTokenBalances = [BIGINT_ZERO];
    pool.type = BridgePoolType.LIQUIDITY;

    pool.name = token.name;
    pool.symbol = token.symbol;
    pool.protocol = NetworkConfigs.getFactoryAddress();
    pool.destinationTokens = [];
    pool.routes = [];
    pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeVolumeIn = BIGINT_ZERO;
    pool.cumulativeVolumeInUSD = BIGDECIMAL_ZERO;
    pool.cumulativeVolumeOut = BIGINT_ZERO;
    pool.cumulativeVolumeOutUSD = BIGDECIMAL_ZERO;
    pool.netVolume = BIGINT_ZERO;
    pool.netVolumeUSD = BIGDECIMAL_ZERO;
    pool.createdTimestamp = event.block.timestamp;
    pool.createdBlockNumber = event.block.number;

    pool.save();

    const context = new DataSourceContext();
    context.setString("poolAddress", pool.id);
    context.setString("chainID", NetworkConfigs.getChainID().toString());

    PoolTemplate.createWithContext(Address.fromString(pool.id), context);

    const protocol = getOrCreateProtocol();

    protocol.pools = addToArrayAtIndex<string>(protocol.pools, pool.id);
    protocol.totalPoolCount += INT_ONE;
    protocol.supportedTokenCount += INT_ONE;

    protocol.save();
  }

  return pool;
}

export function getOrCreatePoolRoute(
  poolAddress: string,
  tokenAddress: Address,
  chainID: BigInt,
  crosschainTokenAddress: Address,
  crosschainID: BigInt,
  event: ethereum.Event
): PoolRoute {
  const lowerChainID = chainID < crosschainID ? chainID : crosschainID;
  const greaterChainID = chainID > crosschainID ? chainID : crosschainID;
  const routeID = poolAddress
    .concat("-")
    .concat(lowerChainID.toString())
    .concat("-")
    .concat(greaterChainID.toString());

  let poolRoute = PoolRoute.load(routeID);
  if (!poolRoute) {
    poolRoute = new PoolRoute(routeID);

    const pool = getOrCreatePool(poolAddress, event);
    poolRoute.pool = pool.id;

    const token = getOrCreateToken(tokenAddress, event.block.number);
    poolRoute.inputTokens = [token.id];

    const crosschainToken = getOrCreateCrosschainToken(
      crosschainTokenAddress,
      crosschainID,
      tokenAddress,
      event.block.number
    );
    poolRoute.crossToken = crosschainToken.address;
    poolRoute.counterType = BridgePoolType.LIQUIDITY;

    const protocol = getOrCreateProtocol();

    if (crosschainToken.type == CrosschainTokenType.CANONICAL) {
      protocol.canonicalRouteCount += INT_ONE;
    } else {
      protocol.wrappedRouteCount += INT_ONE;
    }

    poolRoute.isSwap = false;
    if (crosschainToken.token != token.id) {
      poolRoute.isSwap = true;
    }

    poolRoute.cumulativeVolumeIn = BIGINT_ZERO;
    poolRoute.cumulativeVolumeInUSD = BIGDECIMAL_ZERO;
    poolRoute.cumulativeVolumeOut = BIGINT_ZERO;
    poolRoute.cumulativeVolumeOutUSD = BIGDECIMAL_ZERO;

    poolRoute.createdTimestamp = BIGINT_ZERO;
    poolRoute.createdBlockNumber = BIGINT_ZERO;

    protocol.totalPoolRouteCount += INT_ONE;

    poolRoute.save();
    protocol.save();
  }

  return poolRoute;
}

export function getOrCreatePoolDailySnapshot(
  poolAddress: string,
  event: ethereum.Event
): PoolDailySnapshot {
  const dayId = getDaysSinceEpoch(event.block.timestamp.toI32());

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
    poolMetrics.cumulativeVolumeIn = BIGINT_ZERO;
    poolMetrics.cumulativeVolumeInUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyVolumeIn = BIGINT_ZERO;
    poolMetrics.dailyVolumeInUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeVolumeOut = BIGINT_ZERO;
    poolMetrics.cumulativeVolumeOutUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyVolumeOut = BIGINT_ZERO;
    poolMetrics.dailyVolumeOutUSD = BIGDECIMAL_ZERO;
    poolMetrics.netCumulativeVolume = BIGINT_ZERO;
    poolMetrics.netCumulativeVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.netDailyVolume = BIGINT_ZERO;
    poolMetrics.netDailyVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.routes = [];
    poolMetrics.inputTokenBalances = [BIGINT_ZERO];

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
  const hourId = getHoursSinceEpoch(event.block.timestamp.toI32());

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
    poolMetrics.cumulativeVolumeIn = BIGINT_ZERO;
    poolMetrics.cumulativeVolumeInUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyVolumeIn = BIGINT_ZERO;
    poolMetrics.hourlyVolumeInUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeVolumeOut = BIGINT_ZERO;
    poolMetrics.cumulativeVolumeOutUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyVolumeOut = BIGINT_ZERO;
    poolMetrics.hourlyVolumeOutUSD = BIGDECIMAL_ZERO;
    poolMetrics.netCumulativeVolume = BIGINT_ZERO;
    poolMetrics.netCumulativeVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.netHourlyVolume = BIGINT_ZERO;
    poolMetrics.netHourlyVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.routes = [];
    poolMetrics.mintSupply = BIGINT_ZERO;
    poolMetrics.inputTokenBalances = [BIGINT_ZERO];

    poolMetrics.blockNumber = event.block.number;
    poolMetrics.timestamp = event.block.timestamp;

    poolMetrics.save();
  }

  return poolMetrics;
}

export function getOrCreatePoolRouteSnapshot(
  poolRouteID: string,
  poolSnapshotID: string,
  event: ethereum.Event
): PoolRouteSnapshot {
  const routeSnapshotID = poolRouteID.concat("-").concat(poolSnapshotID);

  let poolRouteSnapshot = PoolRouteSnapshot.load(routeSnapshotID);
  if (!poolRouteSnapshot) {
    poolRouteSnapshot = new PoolRouteSnapshot(routeSnapshotID);

    poolRouteSnapshot.poolRoute = poolRouteID;
    poolRouteSnapshot.snapshotVolumeIn = BIGINT_ZERO;
    poolRouteSnapshot.snapshotVolumeInUSD = BIGDECIMAL_ZERO;
    poolRouteSnapshot.cumulativeVolumeIn = BIGINT_ZERO;
    poolRouteSnapshot.cumulativeVolumeInUSD = BIGDECIMAL_ZERO;
    poolRouteSnapshot.snapshotVolumeOut = BIGINT_ZERO;
    poolRouteSnapshot.snapshotVolumeOutUSD = BIGDECIMAL_ZERO;
    poolRouteSnapshot.cumulativeVolumeOut = BIGINT_ZERO;
    poolRouteSnapshot.cumulativeVolumeOutUSD = BIGDECIMAL_ZERO;

    poolRouteSnapshot.blockNumber = event.block.number;
    poolRouteSnapshot.timestamp = event.block.timestamp;

    poolRouteSnapshot.save();
  }

  return poolRouteSnapshot;
}

export function getOrCreateUsageMetricDailySnapshot(
  block: ethereum.Block
): UsageMetricsDailySnapshot {
  const dayId = getDaysSinceEpoch(block.timestamp.toI32());

  let usageMetrics = UsageMetricsDailySnapshot.load(dayId);
  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(dayId);

    usageMetrics.protocol = NetworkConfigs.getFactoryAddress();
    usageMetrics.dailyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueLiquidityProviders = INT_ZERO;
    usageMetrics.dailyActiveLiquidityProviders = INT_ZERO;
    usageMetrics.cumulativeUniqueMessageSenders = INT_ZERO;
    usageMetrics.dailyActiveMessageSenders = INT_ZERO;
    usageMetrics.dailyTransactionCount = INT_ZERO;
    usageMetrics.dailyTransferCount = INT_ZERO;
    usageMetrics.dailyDepositCount = INT_ZERO;
    usageMetrics.dailyWithdrawCount = INT_ZERO;
    usageMetrics.dailyMessageSentCount = INT_ZERO;
    usageMetrics.totalPoolCount = INT_ZERO;
    usageMetrics.totalPoolRouteCount = INT_ZERO;
    usageMetrics.canonicalRouteCount = INT_ZERO;
    usageMetrics.wrappedRouteCount = INT_ZERO;
    usageMetrics.supportedTokenCount = INT_ZERO;

    usageMetrics.blockNumber = block.number;
    usageMetrics.timestamp = block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateUsageMetricHourlySnapshot(
  block: ethereum.Block
): UsageMetricsHourlySnapshot {
  const hourId = getHoursSinceEpoch(block.timestamp.toI32());

  let usageMetrics = UsageMetricsHourlySnapshot.load(hourId);
  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(hourId);

    usageMetrics.protocol = NetworkConfigs.getFactoryAddress();
    usageMetrics.hourlyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = INT_ZERO;
    usageMetrics.hourlyTransactionCount = INT_ZERO;
    usageMetrics.hourlyTransferCount = INT_ZERO;
    usageMetrics.hourlyDepositCount = INT_ZERO;
    usageMetrics.hourlyWithdrawCount = INT_ZERO;
    usageMetrics.hourlyMessageSentCount = INT_ZERO;
    usageMetrics.hourlyTransactionCount = INT_ZERO;

    usageMetrics.blockNumber = block.number;
    usageMetrics.timestamp = block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateFinancialsDailySnapshot(
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
    financialMetrics.dailyVolumeInUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeVolumeInUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyVolumeOutUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeVolumeOutUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyNetVolumeUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeNetVolumeUSD = BIGDECIMAL_ZERO;

    financialMetrics.blockNumber = event.block.number;
    financialMetrics.timestamp = event.block.timestamp;

    financialMetrics.save();
  }

  return financialMetrics;
}
