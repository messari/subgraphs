import { Address, BigInt, Bytes, dataSource } from "@graphprotocol/graph-ts";

import {
  createBridgeTransferEvent,
  updateProtocolTVL,
  updatePoolMetrics,
  updateRevenue,
  updateUsageMetrics,
  updateVolume,
  createLiquidityDepositEvent,
  createLiquidityWithdrawEvent,
} from "./helpers";
import {
  getOrCreateCrosschainToken,
  getOrCreateFinancialsDailySnapshot,
  getOrCreatePool,
  getOrCreatePoolDailySnapshot,
  getOrCreatePoolHourlySnapshot,
  getOrCreatePoolRoute,
  getOrCreatePoolRouteSnapshot,
  getOrCreateProtocol,
  getOrCreateToken,
  getOrCreateUsageMetricDailySnapshot,
  getOrCreateUsageMetricHourlySnapshot,
} from "../common/getters";
import {
  BIGDECIMAL_ZERO,
  BridgePoolType,
  BridgeType,
  CONTEXT_KEY_CHAINID,
  CONTEXT_KEY_CROSSCHAINID,
  CONTEXT_KEY_POOLID,
  CrosschainTokenType,
  EventType,
  ZERO_ADDRESS,
} from "../common/constants";
import { NetworkConfigs } from "../../configurations/configure";

import { LogAnySwapIn, LogAnySwapOut } from "../../generated/Router-0/Router";
import {
  LogSwapout,
  LogSwapin,
  Transfer,
} from "../../generated/Router-0/anyToken";

export function handlerSwapOutV2(event: LogSwapout): void {
  const protocol = getOrCreateProtocol();
  const financialMetrics = getOrCreateFinancialsDailySnapshot(
    protocol,
    event.block
  );
  const usageMetricsDaily = getOrCreateUsageMetricDailySnapshot(
    protocol,
    event.block
  );
  const usageMetricsHourly = getOrCreateUsageMetricHourlySnapshot(
    protocol,
    event.block
  );

  const chainID = NetworkConfigs.getChainID();
  const tokenAddress = dataSource.address();
  const token = getOrCreateToken(protocol, tokenAddress, chainID, event.block);

  const crosschainID = NetworkConfigs.getCrosschainID(token.id.toHexString());
  const crosschainTokenAddress = NetworkConfigs.getCrosschainTokenAddress(
    BridgeType.BRIDGE,
    token.id.toHexString(),
    crosschainID.toString()
  );
  const crosschainToken = getOrCreateCrosschainToken(
    token,
    crosschainID,
    crosschainTokenAddress,
    CrosschainTokenType.CANONICAL
  );

  const poolID = token.id;
  const pool = getOrCreatePool(
    protocol,
    token,
    poolID,
    BridgePoolType.BURN_MINT,
    crosschainID,
    event.block
  );
  const poolDailySnapshot = getOrCreatePoolDailySnapshot(
    protocol,
    pool,
    event.block
  );
  const poolHourlySnapshot = getOrCreatePoolHourlySnapshot(
    protocol,
    pool,
    event.block
  );

  const poolRoute = getOrCreatePoolRoute(
    protocol,
    token,
    crosschainToken,
    pool,
    chainID,
    crosschainID
  );
  const poolRouteDailySnapshot = getOrCreatePoolRouteSnapshot(
    poolRoute,
    poolDailySnapshot.id,
    event.block
  );
  const poolRouteHourlySnapshot = getOrCreatePoolRouteSnapshot(
    poolRoute,
    poolHourlySnapshot.id,
    event.block
  );

  const oldPoolTVL = pool.totalValueLockedUSD;
  updatePoolMetrics(
    token,
    crosschainToken,
    pool,
    poolDailySnapshot,
    poolHourlySnapshot,
    poolRoute,
    poolRouteDailySnapshot.id,
    poolRouteHourlySnapshot.id,
    event.block
  );
  const deltaPoolTVL = pool.totalValueLockedUSD.minus(oldPoolTVL);

  updateVolume(
    protocol,
    financialMetrics,
    token,
    pool,
    poolDailySnapshot,
    poolHourlySnapshot,
    poolRoute,
    poolRouteDailySnapshot,
    poolRouteHourlySnapshot,
    true,
    event.params.amount
  );

  const feeUSD = NetworkConfigs.getBridgeFeeUSD(
    BridgeType.BRIDGE,
    token,
    crosschainID.toString(),
    event.params.amount
  );
  updateRevenue(
    protocol,
    financialMetrics,
    pool,
    poolDailySnapshot,
    poolHourlySnapshot,
    feeUSD
  );

  updateUsageMetrics(
    protocol,
    usageMetricsDaily,
    usageMetricsHourly,
    EventType.TRANSFER_OUT,
    crosschainID,
    event.block,
    event.params.account
  );

  createBridgeTransferEvent(
    protocol,
    token,
    crosschainToken,
    pool,
    poolRoute,
    chainID,
    crosschainID,
    true,
    event.params.account,
    event.params.bindaddr,
    event.params.amount,
    Bytes.fromHexString(ZERO_ADDRESS),
    event
  );

  poolRouteHourlySnapshot.save();
  poolRouteDailySnapshot.save();
  poolRoute.save();
  poolHourlySnapshot.save();
  poolDailySnapshot.save();
  pool.save();
  crosschainToken.save();
  token.save();
  usageMetricsHourly.save();
  usageMetricsDaily.save();

  updateProtocolTVL(protocol, financialMetrics, deltaPoolTVL, event.block);

  financialMetrics.save();
  protocol.save();
}

export function handlerSwapInV2(event: LogSwapin): void {
  const protocol = getOrCreateProtocol();
  const financialMetrics = getOrCreateFinancialsDailySnapshot(
    protocol,
    event.block
  );
  const usageMetricsDaily = getOrCreateUsageMetricDailySnapshot(
    protocol,
    event.block
  );
  const usageMetricsHourly = getOrCreateUsageMetricHourlySnapshot(
    protocol,
    event.block
  );

  const chainID = NetworkConfigs.getChainID();
  const tokenAddress = dataSource.address();
  const token = getOrCreateToken(protocol, tokenAddress, chainID, event.block);

  const crosschainID = NetworkConfigs.getCrosschainID(token.id.toHexString());
  const crosschainTokenAddress = NetworkConfigs.getCrosschainTokenAddress(
    BridgeType.BRIDGE,
    token.id.toHexString(),
    crosschainID.toString()
  );
  const crosschainToken = getOrCreateCrosschainToken(
    token,
    crosschainID,
    crosschainTokenAddress,
    CrosschainTokenType.CANONICAL
  );

  const poolID = token.id;
  const pool = getOrCreatePool(
    protocol,
    token,
    poolID,
    BridgePoolType.BURN_MINT,
    crosschainID,
    event.block
  );
  const poolDailySnapshot = getOrCreatePoolDailySnapshot(
    protocol,
    pool,
    event.block
  );
  const poolHourlySnapshot = getOrCreatePoolHourlySnapshot(
    protocol,
    pool,
    event.block
  );

  const poolRoute = getOrCreatePoolRoute(
    protocol,
    token,
    crosschainToken,
    pool,
    chainID,
    crosschainID
  );
  const poolRouteDailySnapshot = getOrCreatePoolRouteSnapshot(
    poolRoute,
    poolDailySnapshot.id,
    event.block
  );
  const poolRouteHourlySnapshot = getOrCreatePoolRouteSnapshot(
    poolRoute,
    poolHourlySnapshot.id,
    event.block
  );

  const oldPoolTVL = pool.totalValueLockedUSD;
  updatePoolMetrics(
    token,
    crosschainToken,
    pool,
    poolDailySnapshot,
    poolHourlySnapshot,
    poolRoute,
    poolRouteDailySnapshot.id,
    poolRouteHourlySnapshot.id,
    event.block
  );
  const deltaPoolTVL = pool.totalValueLockedUSD.minus(oldPoolTVL);

  updateVolume(
    protocol,
    financialMetrics,
    token,
    pool,
    poolDailySnapshot,
    poolHourlySnapshot,
    poolRoute,
    poolRouteDailySnapshot,
    poolRouteHourlySnapshot,
    false,
    event.params.amount
  );

  updateRevenue(
    protocol,
    financialMetrics,
    pool,
    poolDailySnapshot,
    poolHourlySnapshot,
    BIGDECIMAL_ZERO
  );

  updateUsageMetrics(
    protocol,
    usageMetricsDaily,
    usageMetricsHourly,
    EventType.TRANSFER_IN,
    crosschainID,
    event.block,
    event.params.account
  );

  createBridgeTransferEvent(
    protocol,
    token,
    crosschainToken,
    pool,
    poolRoute,
    chainID,
    crosschainID,
    false,
    Address.fromString(ZERO_ADDRESS),
    event.params.account,
    event.params.amount,
    event.params.txhash,
    event
  );

  poolRouteHourlySnapshot.save();
  poolRouteDailySnapshot.save();
  poolRoute.save();
  poolHourlySnapshot.save();
  poolDailySnapshot.save();
  pool.save();
  crosschainToken.save();
  token.save();
  usageMetricsHourly.save();
  usageMetricsDaily.save();

  updateProtocolTVL(protocol, financialMetrics, deltaPoolTVL, event.block);

  financialMetrics.save();
  protocol.save();
}

export function handleSwapOut(event: LogAnySwapOut): void {
  const chainID = event.params.fromChainID;
  const crosschainID = event.params.toChainID;
  const tokenAddress = event.params.token;

  if (!NetworkConfigs.isWhitelistToken(tokenAddress, crosschainID.toString())) {
    return;
  }

  const protocol = getOrCreateProtocol();
  const financialMetrics = getOrCreateFinancialsDailySnapshot(
    protocol,
    event.block
  );
  const usageMetricsDaily = getOrCreateUsageMetricDailySnapshot(
    protocol,
    event.block
  );
  const usageMetricsHourly = getOrCreateUsageMetricHourlySnapshot(
    protocol,
    event.block
  );

  const token = getOrCreateToken(protocol, tokenAddress, chainID, event.block);

  const crosschainTokenAddress = NetworkConfigs.getCrosschainTokenAddress(
    BridgeType.ROUTER,
    token.id.toHexString(),
    crosschainID.toString()
  );
  const crosschainToken = getOrCreateCrosschainToken(
    token,
    crosschainID,
    crosschainTokenAddress,
    CrosschainTokenType.WRAPPED
  );

  const poolID = token.id;
  const pool = getOrCreatePool(
    protocol,
    token,
    poolID,
    BridgePoolType.LIQUIDITY,
    crosschainID,
    event.block
  );
  const poolDailySnapshot = getOrCreatePoolDailySnapshot(
    protocol,
    pool,
    event.block
  );
  const poolHourlySnapshot = getOrCreatePoolHourlySnapshot(
    protocol,
    pool,
    event.block
  );

  const poolRoute = getOrCreatePoolRoute(
    protocol,
    token,
    crosschainToken,
    pool,
    chainID,
    crosschainID
  );
  const poolRouteDailySnapshot = getOrCreatePoolRouteSnapshot(
    poolRoute,
    poolDailySnapshot.id,
    event.block
  );
  const poolRouteHourlySnapshot = getOrCreatePoolRouteSnapshot(
    poolRoute,
    poolHourlySnapshot.id,
    event.block
  );

  const oldPoolTVL = pool.totalValueLockedUSD;
  updatePoolMetrics(
    token,
    crosschainToken,
    pool,
    poolDailySnapshot,
    poolHourlySnapshot,
    poolRoute,
    poolRouteDailySnapshot.id,
    poolRouteHourlySnapshot.id,
    event.block
  );
  const deltaPoolTVL = pool.totalValueLockedUSD.minus(oldPoolTVL);

  updateVolume(
    protocol,
    financialMetrics,
    token,
    pool,
    poolDailySnapshot,
    poolHourlySnapshot,
    poolRoute,
    poolRouteDailySnapshot,
    poolRouteHourlySnapshot,
    true,
    event.params.amount
  );

  const feeUSD = NetworkConfigs.getBridgeFeeUSD(
    BridgeType.ROUTER,
    token,
    crosschainID.toString(),
    event.params.amount
  );
  updateRevenue(
    protocol,
    financialMetrics,
    pool,
    poolDailySnapshot,
    poolHourlySnapshot,
    feeUSD
  );

  updateUsageMetrics(
    protocol,
    usageMetricsDaily,
    usageMetricsHourly,
    EventType.TRANSFER_OUT,
    crosschainID,
    event.block,
    event.params.from
  );

  createBridgeTransferEvent(
    protocol,
    token,
    crosschainToken,
    pool,
    poolRoute,
    chainID,
    crosschainID,
    true,
    event.params.from,
    event.params.to,
    event.params.amount,
    Bytes.fromHexString(ZERO_ADDRESS),
    event
  );

  poolRouteHourlySnapshot.save();
  poolRouteDailySnapshot.save();
  poolRoute.save();
  poolHourlySnapshot.save();
  poolDailySnapshot.save();
  pool.save();
  crosschainToken.save();
  token.save();
  usageMetricsHourly.save();
  usageMetricsDaily.save();

  updateProtocolTVL(protocol, financialMetrics, deltaPoolTVL, event.block);

  financialMetrics.save();
  protocol.save();
}

export function handleSwapIn(event: LogAnySwapIn): void {
  const chainID = event.params.toChainID;
  const crosschainID = event.params.fromChainID;
  const tokenAddress = event.params.token;

  if (!NetworkConfigs.isWhitelistToken(tokenAddress, crosschainID.toString())) {
    return;
  }

  const protocol = getOrCreateProtocol();
  const financialMetrics = getOrCreateFinancialsDailySnapshot(
    protocol,
    event.block
  );
  const usageMetricsDaily = getOrCreateUsageMetricDailySnapshot(
    protocol,
    event.block
  );
  const usageMetricsHourly = getOrCreateUsageMetricHourlySnapshot(
    protocol,
    event.block
  );

  const token = getOrCreateToken(protocol, tokenAddress, chainID, event.block);

  const crosschainTokenAddress = NetworkConfigs.getCrosschainTokenAddress(
    BridgeType.ROUTER,
    token.id.toHexString(),
    crosschainID.toString()
  );
  const crosschainToken = getOrCreateCrosschainToken(
    token,
    crosschainID,
    crosschainTokenAddress,
    CrosschainTokenType.WRAPPED
  );

  const poolID = token.id;
  const pool = getOrCreatePool(
    protocol,
    token,
    poolID,
    BridgePoolType.LIQUIDITY,
    crosschainID,
    event.block
  );
  const poolDailySnapshot = getOrCreatePoolDailySnapshot(
    protocol,
    pool,
    event.block
  );
  const poolHourlySnapshot = getOrCreatePoolHourlySnapshot(
    protocol,
    pool,
    event.block
  );

  const poolRoute = getOrCreatePoolRoute(
    protocol,
    token,
    crosschainToken,
    pool,
    chainID,
    crosschainID
  );
  const poolRouteDailySnapshot = getOrCreatePoolRouteSnapshot(
    poolRoute,
    poolDailySnapshot.id,
    event.block
  );
  const poolRouteHourlySnapshot = getOrCreatePoolRouteSnapshot(
    poolRoute,
    poolHourlySnapshot.id,
    event.block
  );

  const oldPoolTVL = pool.totalValueLockedUSD;
  updatePoolMetrics(
    token,
    crosschainToken,
    pool,
    poolDailySnapshot,
    poolHourlySnapshot,
    poolRoute,
    poolRouteDailySnapshot.id,
    poolRouteHourlySnapshot.id,
    event.block
  );
  const deltaPoolTVL = pool.totalValueLockedUSD.minus(oldPoolTVL);

  updateVolume(
    protocol,
    financialMetrics,
    token,
    pool,
    poolDailySnapshot,
    poolHourlySnapshot,
    poolRoute,
    poolRouteDailySnapshot,
    poolRouteHourlySnapshot,
    false,
    event.params.amount
  );

  updateRevenue(
    protocol,
    financialMetrics,
    pool,
    poolDailySnapshot,
    poolHourlySnapshot,
    BIGDECIMAL_ZERO
  );

  updateUsageMetrics(
    protocol,
    usageMetricsDaily,
    usageMetricsHourly,
    EventType.TRANSFER_IN,
    crosschainID,
    event.block,
    event.params.to
  );

  createBridgeTransferEvent(
    protocol,
    token,
    crosschainToken,
    pool,
    poolRoute,
    chainID,
    crosschainID,
    false,
    Address.fromString(ZERO_ADDRESS),
    event.params.to,
    event.params.amount,
    event.params.txhash,
    event
  );

  poolRouteHourlySnapshot.save();
  poolRouteDailySnapshot.save();
  poolRoute.save();
  poolHourlySnapshot.save();
  poolDailySnapshot.save();
  pool.save();
  crosschainToken.save();
  token.save();
  usageMetricsHourly.save();
  usageMetricsDaily.save();

  updateProtocolTVL(protocol, financialMetrics, deltaPoolTVL, event.block);

  financialMetrics.save();
  protocol.save();
}

export function handleTransfer(event: Transfer): void {
  if (
    event.params.from == Address.fromString(ZERO_ADDRESS) ||
    event.params.to == Address.fromString(ZERO_ADDRESS)
  ) {
    const context = dataSource.context();
    const poolID = context.getString(CONTEXT_KEY_POOLID);
    const chainID = BigInt.fromString(context.getString(CONTEXT_KEY_CHAINID));
    const crosschainID = BigInt.fromString(
      context.getString(CONTEXT_KEY_CROSSCHAINID)
    );

    const protocol = getOrCreateProtocol();
    const usageMetricsDaily = getOrCreateUsageMetricDailySnapshot(
      protocol,
      event.block
    );
    const usageMetricsHourly = getOrCreateUsageMetricHourlySnapshot(
      protocol,
      event.block
    );

    const tokenAddress = Address.fromString(poolID);
    const token = getOrCreateToken(
      protocol,
      tokenAddress,
      chainID,
      event.block
    );

    if (event.params.from == Address.fromString(ZERO_ADDRESS)) {
      updateUsageMetrics(
        protocol,
        usageMetricsDaily,
        usageMetricsHourly,
        EventType.DEPOSIT,
        crosschainID,
        event.block,
        event.params.to
      );

      createLiquidityDepositEvent(
        protocol,
        token,
        Bytes.fromHexString(poolID),
        chainID,
        event.params.to,
        tokenAddress,
        event.params.value,
        event
      );
    } else if (event.params.to == Address.fromString(ZERO_ADDRESS)) {
      updateUsageMetrics(
        protocol,
        usageMetricsDaily,
        usageMetricsHourly,
        EventType.WITHDRAW,
        crosschainID,
        event.block,
        event.params.from
      );

      createLiquidityWithdrawEvent(
        protocol,
        token,
        Bytes.fromHexString(poolID),
        chainID,
        event.params.from,
        tokenAddress,
        event.params.value,
        event
      );
    }

    usageMetricsHourly.save();
    usageMetricsDaily.save();
    protocol.save();
  }
}
