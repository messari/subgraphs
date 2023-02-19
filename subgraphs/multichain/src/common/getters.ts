import {
  Address,
  ethereum,
  BigInt,
  DataSourceContext,
  Bytes,
} from "@graphprotocol/graph-ts";

import {
  fetchTokenSymbol,
  fetchTokenName,
  fetchTokenDecimals,
  fetchTokenSupply,
} from "./tokens";
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
  BridgePermissionType,
  BIGDECIMAL_ONE,
} from "./constants";
import { getDaysSinceEpoch, getHoursSinceEpoch } from "./utils/datetime";
import { Versions } from "../versions";
import { getUsdPricePerToken } from "../prices";
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
  Account,
} from "../../generated/schema";
import { LiquidityPoolTemplate } from "../../generated/templates";
import { anyTOKEN } from "../../generated/RouterV6/anyTOKEN";

export function getOrCreateProtocol(): BridgeProtocol {
  let protocol = BridgeProtocol.load(
    Bytes.fromHexString(NetworkConfigs.getFactoryAddress())
  );
  if (!protocol) {
    protocol = new BridgeProtocol(
      Bytes.fromHexString(NetworkConfigs.getFactoryAddress())
    );

    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.network = NetworkConfigs.getNetwork();
    protocol.type = ProtocolType.BRIDGE;
    protocol.permissionType = BridgePermissionType.WHITELIST;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeInUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeOutUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalVolumeUSD = BIGDECIMAL_ZERO;
    protocol.netVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = INT_ZERO;
    protocol.cumulativeUniqueTransferSenders = INT_ZERO;
    protocol.cumulativeUniqueTransferReceivers = INT_ZERO;
    protocol.cumulativeUniqueLiquidityProviders = INT_ZERO;
    protocol.cumulativeUniqueMessageSenders = INT_ZERO;
    protocol.cumulativeTransactionCount = INT_ZERO;
    protocol.cumulativeTransferOutCount = INT_ZERO;
    protocol.cumulativeTransferInCount = INT_ZERO;
    protocol.cumulativeLiquidityDepositCount = INT_ZERO;
    protocol.cumulativeLiquidityWithdrawCount = INT_ZERO;
    protocol.cumulativeMessageSentCount = INT_ZERO;
    protocol.cumulativeMessageReceivedCount = INT_ZERO;
    protocol.supportedNetworks = [];
    protocol.totalPoolCount = INT_ZERO;
    protocol.totalPoolRouteCount = INT_ZERO;
    protocol.totalCanonicalRouteCount = INT_ZERO;
    protocol.totalWrappedRouteCount = INT_ZERO;
    protocol.totalSupportedTokenCount = INT_ZERO;
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();

  return protocol;
}

export function getOrCreateToken(
  protocol: BridgeProtocol,
  tokenAddress: Address,
  chainID: BigInt,
  block: ethereum.Block
): Token {
  let token = Token.load(tokenAddress);
  if (!token) {
    token = new Token(tokenAddress);

    token.name = fetchTokenName(tokenAddress);
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress) as i32;

    token.lastPriceBlockNumber = block.number;

    protocol.totalSupportedTokenCount += INT_ONE;
  }
  token._totalSupply = fetchTokenSupply(tokenAddress);

  if (!token.lastPriceUSD || token.lastPriceBlockNumber! < block.number) {
    token.lastPriceUSD = BIGDECIMAL_ZERO;

    const network = NetworkByID.get(chainID.toString())
      ? NetworkByID.get(chainID.toString())!
      : Network.UNKNOWN_NETWORK;

    if (
      !INACURATE_PRICEFEED_TOKENS.get(network)!.includes(
        Address.fromBytes(token.id)
      )
    ) {
      if (
        network == Network.ARBITRUM_ONE &&
        Address.fromBytes(token.id) ==
          Address.fromHexString("0xfea7a6a0b346362bf88a9e4a88416b77a57d6c2a")
      ) {
        token.lastPriceUSD = BIGDECIMAL_ONE;
      } else if (
        network == Network.MAINNET &&
        Address.fromBytes(token.id) ==
          Address.fromHexString("0xbbc4A8d076F4B1888fec42581B6fc58d242CF2D5") &&
        block.number == BigInt.fromString("14983245")
      ) {
        token.lastPriceUSD = BIGDECIMAL_ONE;
      } else {
        let pricedTokenAddress = tokenAddress;

        const anyTokenContract = anyTOKEN.bind(tokenAddress);
        const underlyingTokenCall = anyTokenContract.try_underlying();
        if (
          !underlyingTokenCall.reverted &&
          underlyingTokenCall.value != Address.fromString(ZERO_ADDRESS)
        ) {
          pricedTokenAddress = underlyingTokenCall.value;
        }

        const price = getUsdPricePerToken(pricedTokenAddress);
        if (!price.reverted) {
          token.lastPriceUSD = price.usdPrice.div(price.decimalsBaseTen);
        }
      }
    }
    token.lastPriceBlockNumber = block.number;
  }

  return token;
}

export function getOrCreateCrosschainToken(
  token: Token,
  crosschainID: BigInt,
  crosschainTokenAddress: Address,
  crosschainTokenType: string
): CrosschainToken {
  const crosschainTokenID = Bytes.fromByteArray(
    Bytes.fromBigInt(crosschainID).concat(token.id)
  );

  let crosschainToken = CrosschainToken.load(crosschainTokenID);
  if (!crosschainToken) {
    crosschainToken = new CrosschainToken(crosschainTokenID);

    crosschainToken.chainID = crosschainID;
    const network = NetworkByID.get(crosschainID.toString())
      ? NetworkByID.get(crosschainID.toString())!
      : Network.UNKNOWN_NETWORK;

    crosschainToken.network = network;
    crosschainToken.address = crosschainTokenAddress;
    crosschainToken.type = crosschainTokenType;
    crosschainToken.token = token.id;
  }

  return crosschainToken;
}

export function getOrCreatePool(
  protocol: BridgeProtocol,
  token: Token,
  poolID: Bytes,
  poolType: string,
  crosschainID: BigInt,
  block: ethereum.Block
): Pool {
  let pool = Pool.load(poolID);
  if (!pool) {
    pool = new Pool(poolID);

    pool.inputToken = token.id;
    pool.inputTokenBalance = BIGINT_ZERO;

    pool.type = poolType;
    if (poolType == BridgePoolType.LIQUIDITY) {
      const context = new DataSourceContext();
      context.setString("poolID", pool.id.toHexString());
      context.setString("chainID", NetworkConfigs.getChainID().toString());
      context.setString("crosschainID", crosschainID.toString());

      LiquidityPoolTemplate.createWithContext(
        Address.fromBytes(pool.id),
        context
      );
    } else if (poolType == BridgePoolType.BURN_MINT) {
      pool.mintSupply = token._totalSupply;
    }

    pool.protocol = protocol.id;
    pool.name = token.name;
    pool.symbol = token.symbol;
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

    pool.createdTimestamp = block.timestamp;
    pool.createdBlockNumber = block.number;

    protocol.totalPoolCount += INT_ONE;
  }

  return pool;
}

export function getOrCreatePoolRoute(
  protocol: BridgeProtocol,
  token: Token,
  crosschainToken: CrosschainToken,
  pool: Pool,
  chainID: BigInt,
  crosschainID: BigInt
): PoolRoute {
  const lowerChainID = chainID < crosschainID ? chainID : crosschainID;
  const greaterChainID = chainID > crosschainID ? chainID : crosschainID;
  const routeID = pool.id.concat(
    Bytes.fromUTF8(
      "-"
        .concat(lowerChainID.toString())
        .concat("-")
        .concat(greaterChainID.toString())
    )
  );
  let poolRoute = PoolRoute.load(routeID);
  if (!poolRoute) {
    poolRoute = new PoolRoute(routeID);

    poolRoute.pool = pool.id;
    poolRoute.inputToken = token.id;
    poolRoute.crossToken = crosschainToken.id;

    if (pool.type == BridgePoolType.LIQUIDITY) {
      poolRoute.counterType = BridgePoolType.LIQUIDITY;
    } else if (pool.type == BridgePoolType.BURN_MINT) {
      poolRoute.counterType = BridgePoolType.LOCK_RELEASE;
    }

    if (crosschainToken.type == CrosschainTokenType.CANONICAL) {
      protocol.totalCanonicalRouteCount += INT_ONE;
    } else {
      protocol.totalWrappedRouteCount += INT_ONE;
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
    addCrosschainTokenToPoolIfNotExists(pool, crosschainToken);
  }

  return poolRoute;
}

function addCrosschainTokenToPoolIfNotExists(
  pool: Pool,
  crossToken: CrosschainToken
): void {
  if (pool.destinationTokens.indexOf(crossToken.id) >= 0) {
    return;
  }

  const tokens = pool.destinationTokens;
  tokens.push(crossToken.id);
  pool.destinationTokens = tokens;
  pool.save();
}

export function getOrCreatePoolDailySnapshot(
  protocol: BridgeProtocol,
  pool: Pool,
  block: ethereum.Block
): PoolDailySnapshot {
  const dayId = getDaysSinceEpoch(block.timestamp.toI32());
  const snapshotID = pool.id.concat(Bytes.fromUTF8("-".concat(dayId)));

  let poolMetrics = PoolDailySnapshot.load(snapshotID);
  if (!poolMetrics) {
    poolMetrics = new PoolDailySnapshot(snapshotID);

    poolMetrics.day = BigInt.fromString(dayId).toI32();
    poolMetrics.protocol = protocol.id;
    poolMetrics.pool = pool.id;
    poolMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeVolumeIn = BIGINT_ZERO;
    poolMetrics.dailyVolumeIn = BIGINT_ZERO;
    poolMetrics.cumulativeVolumeInUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyVolumeInUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeVolumeOut = BIGINT_ZERO;
    poolMetrics.dailyVolumeOut = BIGINT_ZERO;
    poolMetrics.cumulativeVolumeOutUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyVolumeOutUSD = BIGDECIMAL_ZERO;
    poolMetrics.netCumulativeVolume = BIGINT_ZERO;
    poolMetrics.netDailyVolume = BIGINT_ZERO;
    poolMetrics.netCumulativeVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.netDailyVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.routes = [];
    poolMetrics.inputTokenBalance = BIGINT_ZERO;

    poolMetrics.blockNumber = block.number;
    poolMetrics.timestamp = block.timestamp;
  }

  return poolMetrics;
}

export function getOrCreatePoolHourlySnapshot(
  protocol: BridgeProtocol,
  pool: Pool,
  block: ethereum.Block
): PoolHourlySnapshot {
  const hourId = getHoursSinceEpoch(block.timestamp.toI32());
  const snapshotID = pool.id.concat(Bytes.fromUTF8("-".concat(hourId)));

  let poolMetrics = PoolHourlySnapshot.load(snapshotID);
  if (!poolMetrics) {
    poolMetrics = new PoolHourlySnapshot(snapshotID);

    poolMetrics.hour = BigInt.fromString(hourId).toI32();
    poolMetrics.protocol = protocol.id;
    poolMetrics.pool = pool.id;
    poolMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeVolumeIn = BIGINT_ZERO;
    poolMetrics.hourlyVolumeIn = BIGINT_ZERO;
    poolMetrics.cumulativeVolumeInUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyVolumeInUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeVolumeOut = BIGINT_ZERO;
    poolMetrics.hourlyVolumeOut = BIGINT_ZERO;
    poolMetrics.cumulativeVolumeOutUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyVolumeOutUSD = BIGDECIMAL_ZERO;
    poolMetrics.netCumulativeVolume = BIGINT_ZERO;
    poolMetrics.netHourlyVolume = BIGINT_ZERO;
    poolMetrics.netCumulativeVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.netHourlyVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.routes = [];
    poolMetrics.inputTokenBalance = BIGINT_ZERO;

    poolMetrics.blockNumber = block.number;
    poolMetrics.timestamp = block.timestamp;
  }

  return poolMetrics;
}

export function getOrCreatePoolRouteSnapshot(
  poolRoute: PoolRoute,
  poolSnapshotID: Bytes,
  block: ethereum.Block
): PoolRouteSnapshot {
  const routeSnapshotID = poolRoute.id.concat(
    Bytes.fromUTF8("-").concat(poolSnapshotID)
  );

  let poolRouteSnapshot = PoolRouteSnapshot.load(routeSnapshotID);
  if (!poolRouteSnapshot) {
    poolRouteSnapshot = new PoolRouteSnapshot(routeSnapshotID);

    poolRouteSnapshot.poolRoute = poolRoute.id;
    poolRouteSnapshot.cumulativeVolumeIn = BIGINT_ZERO;
    poolRouteSnapshot.snapshotVolumeIn = BIGINT_ZERO;
    poolRouteSnapshot.cumulativeVolumeInUSD = BIGDECIMAL_ZERO;
    poolRouteSnapshot.snapshotVolumeInUSD = BIGDECIMAL_ZERO;
    poolRouteSnapshot.cumulativeVolumeOut = BIGINT_ZERO;
    poolRouteSnapshot.snapshotVolumeOut = BIGINT_ZERO;
    poolRouteSnapshot.cumulativeVolumeOutUSD = BIGDECIMAL_ZERO;
    poolRouteSnapshot.snapshotVolumeOutUSD = BIGDECIMAL_ZERO;

    poolRouteSnapshot.blockNumber = block.number;
    poolRouteSnapshot.timestamp = block.timestamp;
  }

  return poolRouteSnapshot;
}

export function getOrCreateUsageMetricDailySnapshot(
  protocol: BridgeProtocol,
  block: ethereum.Block
): UsageMetricsDailySnapshot {
  const dayId = getDaysSinceEpoch(block.timestamp.toI32());

  let usageMetrics = UsageMetricsDailySnapshot.load(Bytes.fromUTF8(dayId));
  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(Bytes.fromUTF8(dayId));

    usageMetrics.day = BigInt.fromString(dayId).toI32();
    usageMetrics.protocol = protocol.id;
    usageMetrics.cumulativeUniqueUsers = INT_ZERO;
    usageMetrics.dailyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueTransferSenders = INT_ZERO;
    usageMetrics.dailyActiveTransferSenders = INT_ZERO;
    usageMetrics.cumulativeUniqueTransferReceivers = INT_ZERO;
    usageMetrics.dailyActiveTransferReceivers = INT_ZERO;
    usageMetrics.cumulativeUniqueLiquidityProviders = INT_ZERO;
    usageMetrics.dailyActiveLiquidityProviders = INT_ZERO;
    usageMetrics.cumulativeUniqueMessageSenders = INT_ZERO;
    usageMetrics.dailyActiveMessageSenders = INT_ZERO;
    usageMetrics.cumulativeTransactionCount = INT_ZERO;
    usageMetrics.dailyTransactionCount = INT_ZERO;
    usageMetrics.cumulativeTransferOutCount = INT_ZERO;
    usageMetrics.dailyTransferOutCount = INT_ZERO;
    usageMetrics.cumulativeTransferInCount = INT_ZERO;
    usageMetrics.dailyTransferInCount = INT_ZERO;
    usageMetrics.cumulativeLiquidityDepositCount = INT_ZERO;
    usageMetrics.dailyLiquidityDepositCount = INT_ZERO;
    usageMetrics.cumulativeLiquidityWithdrawCount = INT_ZERO;
    usageMetrics.dailyLiquidityWithdrawCount = INT_ZERO;
    usageMetrics.cumulativeMessageSentCount = INT_ZERO;
    usageMetrics.dailyMessageSentCount = INT_ZERO;
    usageMetrics.cumulativeMessageReceivedCount = INT_ZERO;
    usageMetrics.dailyMessageReceivedCount = INT_ZERO;
    usageMetrics.totalPoolCount = INT_ZERO;
    usageMetrics.totalPoolRouteCount = INT_ZERO;
    usageMetrics.totalCanonicalRouteCount = INT_ZERO;
    usageMetrics.totalWrappedRouteCount = INT_ZERO;
    usageMetrics.totalSupportedTokenCount = INT_ZERO;

    usageMetrics.blockNumber = block.number;
    usageMetrics.timestamp = block.timestamp;
  }

  return usageMetrics;
}

export function getOrCreateUsageMetricHourlySnapshot(
  protocol: BridgeProtocol,
  block: ethereum.Block
): UsageMetricsHourlySnapshot {
  const hourId = getHoursSinceEpoch(block.timestamp.toI32());

  let usageMetrics = UsageMetricsHourlySnapshot.load(Bytes.fromUTF8(hourId));
  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(Bytes.fromUTF8(hourId));

    usageMetrics.hour = BigInt.fromString(hourId).toI32();
    usageMetrics.protocol = protocol.id;
    usageMetrics.cumulativeUniqueUsers = INT_ZERO;
    usageMetrics.hourlyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueTransferSenders = INT_ZERO;
    usageMetrics.hourlyActiveTransferSenders = INT_ZERO;
    usageMetrics.cumulativeUniqueTransferReceivers = INT_ZERO;
    usageMetrics.hourlyActiveTransferReceivers = INT_ZERO;
    usageMetrics.cumulativeUniqueLiquidityProviders = INT_ZERO;
    usageMetrics.hourlyActiveLiquidityProviders = INT_ZERO;
    usageMetrics.cumulativeUniqueMessageSenders = INT_ZERO;
    usageMetrics.hourlyActiveMessageSenders = INT_ZERO;
    usageMetrics.cumulativeTransactionCount = INT_ZERO;
    usageMetrics.hourlyTransactionCount = INT_ZERO;
    usageMetrics.cumulativeTransferOutCount = INT_ZERO;
    usageMetrics.hourlyTransferOutCount = INT_ZERO;
    usageMetrics.cumulativeTransferInCount = INT_ZERO;
    usageMetrics.hourlyTransferInCount = INT_ZERO;
    usageMetrics.cumulativeLiquidityDepositCount = INT_ZERO;
    usageMetrics.hourlyLiquidityDepositCount = INT_ZERO;
    usageMetrics.cumulativeLiquidityWithdrawCount = INT_ZERO;
    usageMetrics.hourlyLiquidityWithdrawCount = INT_ZERO;
    usageMetrics.cumulativeMessageSentCount = INT_ZERO;
    usageMetrics.hourlyMessageSentCount = INT_ZERO;
    usageMetrics.cumulativeMessageReceivedCount = INT_ZERO;
    usageMetrics.hourlyMessageReceivedCount = INT_ZERO;

    usageMetrics.blockNumber = block.number;
    usageMetrics.timestamp = block.timestamp;
  }

  return usageMetrics;
}

export function getOrCreateFinancialsDailySnapshot(
  protocol: BridgeProtocol,
  block: ethereum.Block
): FinancialsDailySnapshot {
  const dayId = getDaysSinceEpoch(block.timestamp.toI32());

  let financialMetrics = FinancialsDailySnapshot.load(Bytes.fromUTF8(dayId));
  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(Bytes.fromUTF8(dayId));

    financialMetrics.day = BigInt.fromString(dayId).toI32();
    financialMetrics.protocol = protocol.id;
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

    financialMetrics.blockNumber = block.number;
    financialMetrics.timestamp = block.timestamp;
  }

  return financialMetrics;
}

export function getOrCreateAccount(
  protocol: BridgeProtocol,
  accountID: string
): Account {
  let account = Account.load(Bytes.fromUTF8(accountID));
  if (!account) {
    account = new Account(Bytes.fromUTF8(accountID));

    account.chains = [];
    account.transferOutCount = INT_ZERO;
    account.transferInCount = INT_ZERO;
    account.depositCount = INT_ZERO;
    account.withdrawCount = INT_ZERO;
    account.messageSentCount = INT_ZERO;
    account.messageReceivedCount = INT_ZERO;

    account.save();

    protocol.cumulativeUniqueUsers += INT_ONE;
  }

  return account;
}
