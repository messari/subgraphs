import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
} from "@graphprotocol/graph-ts";

import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ONE,
  INT_ZERO,
  EventType,
  TransferType,
  BridgePoolType,
} from "../common/constants";
import {
  getOrCreateProtocol,
  getOrCreatePool,
  getOrCreatePoolDailySnapshot,
  getOrCreatePoolHourlySnapshot,
  getOrCreateUsageMetricDailySnapshot,
  getOrCreateUsageMetricHourlySnapshot,
  getOrCreateFinancialsDailySnapshot,
  getOrCreatePoolRoute,
  getOrCreatePoolRouteSnapshot,
  getOrCreateToken,
  getOrCreateCrosschainToken,
  getOrCreateAccount,
} from "../common/getters";
import { bigIntToBigDecimal } from "../common/utils/numbers";
import { addToArrayAtIndex, arrayUnique } from "../common/utils/arrays";

import {
  ActiveAccount,
  BridgeTransfer,
  LiquidityDeposit,
  LiquidityWithdraw,
} from "../../generated/schema";
import { NetworkConfigs } from "../../configurations/configure";
import {
  getDaysSinceEpoch,
  getHoursSinceEpoch,
} from "../common/utils/datetime";

export function updatePoolMetrics(
  poolID: string,
  poolRouteID: string,
  tokenAddress: Address,
  crosschainTokenAddress: Address,
  event: ethereum.Event
): void {
  const pool = getOrCreatePool(poolID, event);
  const poolDailySnapshot = getOrCreatePoolDailySnapshot(poolID, event);
  const poolHourlySnapshot = getOrCreatePoolHourlySnapshot(poolID, event);
  const token = getOrCreateToken(tokenAddress, event.block.number);

  pool.inputTokenBalance = token._totalSupply;
  pool.totalValueLockedUSD = bigIntToBigDecimal(
    token._totalSupply,
    token.decimals
  ).times(token.lastPriceUSD!);
  pool.routes = arrayUnique(addToArrayAtIndex(pool.routes, poolRouteID));
  pool.destinationTokens = arrayUnique(
    addToArrayAtIndex(
      pool.destinationTokens,
      crosschainTokenAddress.toHexString()
    )
  );

  poolDailySnapshot.inputTokenBalance = pool.inputTokenBalance;
  poolDailySnapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolDailySnapshot.routes = arrayUnique(
    addToArrayAtIndex(poolDailySnapshot.routes, poolRouteID)
  );
  poolDailySnapshot.blockNumber = event.block.number;
  poolDailySnapshot.timestamp = event.block.timestamp;

  poolHourlySnapshot.inputTokenBalance = pool.inputTokenBalance;
  poolHourlySnapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolHourlySnapshot.routes = arrayUnique(
    addToArrayAtIndex(poolHourlySnapshot.routes, poolRouteID)
  );
  poolHourlySnapshot.blockNumber = event.block.number;
  poolHourlySnapshot.timestamp = event.block.timestamp;

  if (pool.type == BridgePoolType.BURN_MINT) {
    pool.mintSupply = token._totalSupply;
    poolDailySnapshot.mintSupply = pool.mintSupply;
    poolHourlySnapshot.mintSupply = pool.mintSupply;
  }

  poolHourlySnapshot.save();
  poolDailySnapshot.save();
  pool.save();
}

export function updateVolume(
  poolID: string,
  amount: BigInt,
  isOutgoing: boolean,
  tokenAddress: Address,
  chainID: BigInt,
  crosschainTokenAddress: Address,
  crosschainID: BigInt,
  event: ethereum.Event
): void {
  const protocol = getOrCreateProtocol();
  const pool = getOrCreatePool(poolID, event);
  const token = getOrCreateToken(tokenAddress, event.block.number);
  const poolRoute = getOrCreatePoolRoute(
    poolID,
    tokenAddress,
    chainID,
    crosschainTokenAddress,
    crosschainID,
    event
  );

  let volumeIn = BIGINT_ZERO;
  let volumeInUSD = BIGDECIMAL_ZERO;
  let volumeOut = BIGINT_ZERO;
  let volumeOutUSD = BIGDECIMAL_ZERO;

  if (isOutgoing) {
    volumeOut = amount;
    volumeOutUSD = bigIntToBigDecimal(volumeOut, token.decimals).times(
      token.lastPriceUSD!
    );
  } else {
    volumeIn = amount;
    volumeInUSD = bigIntToBigDecimal(volumeIn, token.decimals).times(
      token.lastPriceUSD!
    );
  }

  const poolDailySnapshot = getOrCreatePoolDailySnapshot(poolID, event);
  const poolRouteDailySnapshot = getOrCreatePoolRouteSnapshot(
    poolRoute.id,
    poolDailySnapshot.id,
    event
  );
  const poolHourlySnapshot = getOrCreatePoolHourlySnapshot(poolID, event);
  const poolRouteHourlySnapshot = getOrCreatePoolRouteSnapshot(
    poolRoute.id,
    poolHourlySnapshot.id,
    event
  );
  const financialMetrics = getOrCreateFinancialsDailySnapshot(event);

  protocol.cumulativeVolumeInUSD =
    protocol.cumulativeVolumeInUSD.plus(volumeInUSD);
  protocol.cumulativeVolumeOutUSD =
    protocol.cumulativeVolumeOutUSD.plus(volumeOutUSD);
  protocol.cumulativeTotalVolumeUSD = protocol.cumulativeVolumeOutUSD.plus(
    protocol.cumulativeVolumeInUSD
  );
  protocol.netVolumeUSD = protocol.cumulativeVolumeInUSD.minus(
    protocol.cumulativeVolumeOutUSD
  );

  pool.cumulativeVolumeIn = pool.cumulativeVolumeIn.plus(volumeIn);
  pool.cumulativeVolumeInUSD = pool.cumulativeVolumeInUSD.plus(volumeInUSD);
  pool.cumulativeVolumeOut = pool.cumulativeVolumeOut.plus(volumeOut);
  pool.cumulativeVolumeOutUSD = pool.cumulativeVolumeOutUSD.plus(volumeOutUSD);
  pool.netVolume = pool.cumulativeVolumeIn.minus(pool.cumulativeVolumeOut);
  pool.netVolumeUSD = pool.cumulativeVolumeInUSD.minus(
    pool.cumulativeVolumeOutUSD
  );

  poolRoute.cumulativeVolumeIn = poolRoute.cumulativeVolumeIn.plus(volumeIn);
  poolRoute.cumulativeVolumeInUSD =
    poolRoute.cumulativeVolumeInUSD.plus(volumeInUSD);
  poolRoute.cumulativeVolumeOut = poolRoute.cumulativeVolumeOut.plus(volumeOut);
  poolRoute.cumulativeVolumeOutUSD =
    poolRoute.cumulativeVolumeOutUSD.plus(volumeOutUSD);

  poolDailySnapshot.dailyVolumeIn =
    poolDailySnapshot.dailyVolumeIn.plus(volumeIn);
  poolDailySnapshot.dailyVolumeInUSD =
    poolDailySnapshot.dailyVolumeInUSD.plus(volumeInUSD);
  poolDailySnapshot.cumulativeVolumeIn = pool.cumulativeVolumeIn;
  poolDailySnapshot.cumulativeVolumeInUSD = pool.cumulativeVolumeInUSD;
  poolDailySnapshot.dailyVolumeOut =
    poolDailySnapshot.dailyVolumeOut.plus(volumeOut);
  poolDailySnapshot.dailyVolumeOutUSD =
    poolDailySnapshot.dailyVolumeOutUSD.plus(volumeOutUSD);
  poolDailySnapshot.cumulativeVolumeOut = pool.cumulativeVolumeOut;
  poolDailySnapshot.cumulativeVolumeOutUSD = pool.cumulativeVolumeOutUSD;
  poolDailySnapshot.netDailyVolume = poolDailySnapshot.dailyVolumeIn.minus(
    poolDailySnapshot.dailyVolumeOut
  );
  poolDailySnapshot.netDailyVolumeUSD =
    poolDailySnapshot.dailyVolumeInUSD.minus(
      poolDailySnapshot.dailyVolumeOutUSD
    );
  poolDailySnapshot.netCumulativeVolume = pool.netVolume;
  poolDailySnapshot.netCumulativeVolumeUSD = pool.netVolumeUSD;

  poolRouteDailySnapshot.snapshotVolumeIn =
    poolRouteDailySnapshot.snapshotVolumeIn.plus(volumeIn);
  poolRouteDailySnapshot.snapshotVolumeInUSD =
    poolRouteDailySnapshot.cumulativeVolumeInUSD.plus(volumeInUSD);
  poolRouteDailySnapshot.cumulativeVolumeIn = pool.cumulativeVolumeIn;
  poolRouteDailySnapshot.cumulativeVolumeInUSD = pool.cumulativeVolumeInUSD;
  poolRouteDailySnapshot.snapshotVolumeOut =
    poolRouteDailySnapshot.snapshotVolumeOut.plus(volumeOut);
  poolRouteDailySnapshot.snapshotVolumeOutUSD =
    poolRouteDailySnapshot.snapshotVolumeOutUSD.plus(volumeOutUSD);
  poolRouteDailySnapshot.cumulativeVolumeOut = pool.cumulativeVolumeOut;
  poolRouteDailySnapshot.cumulativeVolumeOutUSD = pool.cumulativeVolumeOutUSD;

  poolHourlySnapshot.hourlyVolumeIn =
    poolHourlySnapshot.hourlyVolumeIn.plus(volumeIn);
  poolHourlySnapshot.hourlyVolumeInUSD =
    poolHourlySnapshot.hourlyVolumeInUSD.plus(volumeInUSD);
  poolHourlySnapshot.cumulativeVolumeIn = pool.cumulativeVolumeIn;
  poolHourlySnapshot.cumulativeVolumeInUSD = pool.cumulativeVolumeInUSD;
  poolHourlySnapshot.hourlyVolumeOut =
    poolHourlySnapshot.hourlyVolumeOut.plus(volumeOut);
  poolHourlySnapshot.hourlyVolumeOutUSD =
    poolHourlySnapshot.hourlyVolumeOutUSD.plus(volumeOutUSD);
  poolHourlySnapshot.cumulativeVolumeOut = pool.cumulativeVolumeOut;
  poolHourlySnapshot.cumulativeVolumeOutUSD = pool.cumulativeVolumeOutUSD;
  poolHourlySnapshot.netHourlyVolume = poolHourlySnapshot.hourlyVolumeIn.minus(
    poolHourlySnapshot.hourlyVolumeOut
  );
  poolHourlySnapshot.netHourlyVolumeUSD =
    poolHourlySnapshot.hourlyVolumeInUSD.minus(
      poolHourlySnapshot.hourlyVolumeOutUSD
    );
  poolHourlySnapshot.netCumulativeVolume = pool.netVolume;
  poolHourlySnapshot.netCumulativeVolumeUSD = pool.netVolumeUSD;

  poolRouteHourlySnapshot.snapshotVolumeIn =
    poolRouteHourlySnapshot.snapshotVolumeIn.plus(volumeIn);
  poolRouteHourlySnapshot.snapshotVolumeInUSD =
    poolRouteHourlySnapshot.cumulativeVolumeInUSD.plus(volumeInUSD);
  poolRouteHourlySnapshot.cumulativeVolumeIn = pool.cumulativeVolumeIn;
  poolRouteHourlySnapshot.cumulativeVolumeInUSD = pool.cumulativeVolumeInUSD;
  poolRouteHourlySnapshot.snapshotVolumeOut =
    poolRouteHourlySnapshot.snapshotVolumeOut.plus(volumeOut);
  poolRouteHourlySnapshot.snapshotVolumeOutUSD =
    poolRouteHourlySnapshot.snapshotVolumeOutUSD.plus(volumeOutUSD);
  poolRouteHourlySnapshot.cumulativeVolumeOut = pool.cumulativeVolumeOut;
  poolRouteHourlySnapshot.cumulativeVolumeOutUSD = pool.cumulativeVolumeOutUSD;

  financialMetrics.dailyVolumeInUSD =
    financialMetrics.dailyVolumeInUSD.plus(volumeInUSD);
  financialMetrics.cumulativeVolumeInUSD = protocol.cumulativeVolumeInUSD;
  financialMetrics.dailyVolumeOutUSD =
    financialMetrics.dailyVolumeOutUSD.plus(volumeOutUSD);
  financialMetrics.cumulativeVolumeOutUSD = protocol.cumulativeVolumeOutUSD;
  financialMetrics.dailyNetVolumeUSD = financialMetrics.dailyVolumeInUSD.minus(
    financialMetrics.dailyVolumeOutUSD
  );
  financialMetrics.cumulativeNetVolumeUSD = protocol.netVolumeUSD;

  financialMetrics.save();
  poolRouteHourlySnapshot.save();
  poolHourlySnapshot.save();
  poolRouteDailySnapshot.save();
  poolDailySnapshot.save();
  poolRoute.save();
  pool.save();
  protocol.save();
}

export function updateRevenue(
  poolID: string,
  feeUSD: BigDecimal,
  event: ethereum.Event
): void {
  const protocolSideRevenueUSD = feeUSD.times(
    BigDecimal.fromString("55").div(BigDecimal.fromString("100"))
  );
  const supplySideRevenueUSD = feeUSD.times(
    BigDecimal.fromString("45").div(BigDecimal.fromString("100"))
  );

  const protocol = getOrCreateProtocol();
  const pool = getOrCreatePool(poolID, event);
  const poolDailySnapshot = getOrCreatePoolDailySnapshot(poolID, event);
  const poolHourlySnapshot = getOrCreatePoolHourlySnapshot(poolID, event);
  const financialMetrics = getOrCreateFinancialsDailySnapshot(event);

  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(supplySideRevenueUSD);
  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(feeUSD);

  pool.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD.plus(supplySideRevenueUSD);
  pool.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);
  pool.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD.plus(feeUSD);

  poolDailySnapshot.dailySupplySideRevenueUSD =
    poolDailySnapshot.dailySupplySideRevenueUSD.plus(supplySideRevenueUSD);
  poolDailySnapshot.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolDailySnapshot.dailyProtocolSideRevenueUSD =
    poolDailySnapshot.dailyProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);
  poolDailySnapshot.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  poolDailySnapshot.dailyTotalRevenueUSD =
    poolDailySnapshot.dailyTotalRevenueUSD.plus(feeUSD);
  poolDailySnapshot.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;

  poolHourlySnapshot.hourlySupplySideRevenueUSD =
    poolHourlySnapshot.hourlySupplySideRevenueUSD.plus(supplySideRevenueUSD);
  poolHourlySnapshot.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolHourlySnapshot.hourlyProtocolSideRevenueUSD =
    poolHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(
      protocolSideRevenueUSD
    );
  poolHourlySnapshot.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  poolHourlySnapshot.hourlyTotalRevenueUSD =
    poolHourlySnapshot.hourlyTotalRevenueUSD.plus(feeUSD);
  poolHourlySnapshot.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;

  financialMetrics.dailySupplySideRevenueUSD =
    financialMetrics.dailySupplySideRevenueUSD.plus(supplySideRevenueUSD);
  financialMetrics.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.dailyProtocolSideRevenueUSD =
    financialMetrics.dailyProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);
  financialMetrics.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialMetrics.dailyTotalRevenueUSD =
    financialMetrics.dailyTotalRevenueUSD.plus(feeUSD);
  financialMetrics.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;

  financialMetrics.save();
  poolHourlySnapshot.save();
  poolDailySnapshot.save();
  pool.save();
  protocol.save();
}

export function updateUsageMetrics(
  eventType: string,
  crosschainID: BigInt,
  block: ethereum.Block,
  transaction: ethereum.Transaction
): void {
  const protocol = getOrCreateProtocol();
  const usageMetricsDaily = getOrCreateUsageMetricDailySnapshot(block);
  const usageMetricsHourly = getOrCreateUsageMetricHourlySnapshot(block);

  const transactionCount = INT_ONE;
  const depositCount = eventType == EventType.DEPOSIT ? INT_ONE : INT_ZERO;
  const withdrawCount = eventType == EventType.WITHDRAW ? INT_ONE : INT_ZERO;
  const transferInCount =
    eventType == EventType.TRANSFER_IN ? INT_ONE : INT_ZERO;
  const transferOutCount =
    eventType == EventType.TRANSFER_OUT ? INT_ONE : INT_ZERO;
  const messageInCount = eventType == EventType.MESSAGE_IN ? INT_ONE : INT_ZERO;
  const messageOutCount =
    eventType == EventType.MESSAGE_OUT ? INT_ONE : INT_ZERO;

  protocol.cumulativeTransactionCount += transactionCount;
  protocol.cumulativeLiquidityDepositCount += depositCount;
  protocol.cumulativeLiquidityWithdrawCount += withdrawCount;
  protocol.cumulativeTransferInCount += transferInCount;
  protocol.cumulativeTransferOutCount += transferOutCount;
  protocol.cumulativeMessageReceivedCount += messageInCount;
  protocol.cumulativeMessageSentCount += messageOutCount;

  usageMetricsDaily.cumulativeTransactionCount =
    protocol.cumulativeTransactionCount;
  usageMetricsDaily.cumulativeLiquidityDepositCount =
    protocol.cumulativeLiquidityDepositCount;
  usageMetricsDaily.cumulativeLiquidityWithdrawCount =
    protocol.cumulativeLiquidityWithdrawCount;
  usageMetricsDaily.cumulativeTransferInCount =
    protocol.cumulativeTransferInCount;
  usageMetricsDaily.cumulativeTransferOutCount =
    protocol.cumulativeTransferOutCount;
  usageMetricsDaily.cumulativeMessageReceivedCount =
    protocol.cumulativeMessageReceivedCount;
  usageMetricsDaily.cumulativeMessageSentCount =
    protocol.cumulativeMessageSentCount;

  usageMetricsDaily.dailyTransactionCount += transactionCount;
  usageMetricsDaily.dailyLiquidityDepositCount += depositCount;
  usageMetricsDaily.dailyLiquidityWithdrawCount += withdrawCount;
  usageMetricsDaily.dailyTransferInCount += transferInCount;
  usageMetricsDaily.dailyTransferOutCount += transferOutCount;
  usageMetricsDaily.dailyMessageReceivedCount += messageInCount;
  usageMetricsDaily.dailyMessageSentCount += messageOutCount;

  usageMetricsDaily.blockNumber = block.number;
  usageMetricsDaily.timestamp = block.timestamp;

  usageMetricsHourly.cumulativeTransactionCount =
    protocol.cumulativeTransactionCount;
  usageMetricsHourly.cumulativeLiquidityDepositCount =
    protocol.cumulativeLiquidityDepositCount;
  usageMetricsHourly.cumulativeLiquidityWithdrawCount =
    protocol.cumulativeLiquidityWithdrawCount;
  usageMetricsHourly.cumulativeTransferInCount =
    protocol.cumulativeTransferInCount;
  usageMetricsHourly.cumulativeTransferOutCount =
    protocol.cumulativeTransferOutCount;
  usageMetricsHourly.cumulativeMessageReceivedCount =
    protocol.cumulativeMessageReceivedCount;
  usageMetricsHourly.cumulativeMessageSentCount =
    protocol.cumulativeMessageSentCount;

  usageMetricsHourly.hourlyTransactionCount += transactionCount;
  usageMetricsHourly.hourlyLiquidityDepositCount += depositCount;
  usageMetricsHourly.hourlyLiquidityWithdrawCount += withdrawCount;
  usageMetricsHourly.hourlyTransferInCount += transferInCount;
  usageMetricsHourly.hourlyTransferOutCount += transferOutCount;
  usageMetricsHourly.hourlyMessageReceivedCount += messageInCount;
  usageMetricsHourly.hourlyMessageSentCount += messageOutCount;

  usageMetricsHourly.blockNumber = block.number;
  usageMetricsHourly.timestamp = block.timestamp;

  const from = transaction.from.toHexString();
  let account = getOrCreateAccount(from);

  if (account.transferInCount == INT_ZERO) {
    protocol.cumulativeUniqueTransferReceivers += transferInCount;
  }
  if (account.transferOutCount == INT_ZERO) {
    protocol.cumulativeUniqueTransferSenders += transferOutCount;
  }
  if (account.depositCount == INT_ZERO) {
    protocol.cumulativeUniqueLiquidityProviders += depositCount;
  }
  if (account.messageSentCount == INT_ZERO) {
    protocol.cumulativeUniqueMessageSenders += messageOutCount;
  }

  account.depositCount += depositCount;
  account.withdrawCount += withdrawCount;
  account.transferInCount += transferInCount;
  account.transferOutCount += transferOutCount;
  account.messageReceivedCount += messageInCount;
  account.messageSentCount += messageOutCount;
  account.chains = arrayUnique(
    addToArrayAtIndex(account.chains, crosschainID.toI32())
  );

  account.save();

  usageMetricsDaily.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetricsDaily.cumulativeUniqueTransferSenders =
    protocol.cumulativeUniqueTransferSenders;
  usageMetricsDaily.cumulativeUniqueTransferReceivers =
    protocol.cumulativeUniqueTransferReceivers;
  usageMetricsDaily.cumulativeUniqueLiquidityProviders =
    protocol.cumulativeUniqueLiquidityProviders;
  usageMetricsDaily.cumulativeUniqueMessageSenders =
    protocol.cumulativeUniqueMessageSenders;

  usageMetricsHourly.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetricsHourly.cumulativeUniqueTransferSenders =
    protocol.cumulativeUniqueTransferSenders;
  usageMetricsHourly.cumulativeUniqueTransferReceivers =
    protocol.cumulativeUniqueTransferReceivers;
  usageMetricsHourly.cumulativeUniqueLiquidityProviders =
    protocol.cumulativeUniqueLiquidityProviders;
  usageMetricsHourly.cumulativeUniqueMessageSenders =
    protocol.cumulativeUniqueMessageSenders;

  const dayId = getDaysSinceEpoch(block.timestamp.toI32());
  const dailyActiveAccountID = from
    .concat("-")
    .concat("daily")
    .concat("-")
    .concat(dayId)
    .concat("-")
    .concat(eventType);

  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountID);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountID);
  }
  usageMetricsDaily.dailyActiveUsers += transactionCount;
  usageMetricsDaily.dailyActiveTransferSenders += messageOutCount;
  usageMetricsDaily.dailyActiveTransferReceivers += messageInCount;
  usageMetricsDaily.dailyActiveLiquidityProviders += depositCount;
  usageMetricsDaily.dailyActiveMessageSenders += messageOutCount;

  dailyActiveAccount.save();

  const hourId = getHoursSinceEpoch(block.timestamp.toI32());
  const hourlyActiveAccountID = from
    .concat("-")
    .concat("hourly")
    .concat("-")
    .concat(hourId)
    .concat("-")
    .concat(eventType);

  let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountID);
  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountID);
  }
  usageMetricsHourly.hourlyActiveUsers += transactionCount;
  usageMetricsHourly.hourlyActiveTransferSenders += messageOutCount;
  usageMetricsHourly.hourlyActiveTransferReceivers += messageInCount;
  usageMetricsHourly.hourlyActiveLiquidityProviders += depositCount;
  usageMetricsHourly.hourlyActiveMessageSenders += messageOutCount;

  hourlyActiveAccount.save();

  usageMetricsDaily.totalPoolCount = protocol.totalPoolCount;
  usageMetricsDaily.totalPoolRouteCount = protocol.totalPoolRouteCount;
  usageMetricsDaily.totalCanonicalRouteCount =
    protocol.totalCanonicalRouteCount;
  usageMetricsDaily.totalWrappedRouteCount = protocol.totalWrappedRouteCount;
  usageMetricsDaily.totalSupportedTokenCount =
    protocol.totalSupportedTokenCount;

  usageMetricsHourly.save();
  usageMetricsDaily.save();
  protocol.save();
}

export function updateProtocolTVL(event: ethereum.Event): void {
  const protocol = getOrCreateProtocol();
  const financialMetrics = getOrCreateFinancialsDailySnapshot(event);

  const pools = protocol.pools;
  let tvl = BIGDECIMAL_ZERO;
  for (let i = 0; i < pools.length; i++) {
    const pool = getOrCreatePool(pools[i], event);

    tvl = tvl.plus(pool.totalValueLockedUSD);
  }
  protocol.totalValueLockedUSD = tvl;

  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;

  financialMetrics.save();
  protocol.save();
}

export function createBridgeTransferEvent(
  poolID: string,
  tokenAddress: Address,
  chainID: BigInt,
  crosschainTokenAddress: Address,
  crosschainID: BigInt,
  poolRouteID: string,
  isOutgoing: boolean,
  amount: BigInt,
  event: ethereum.Event,
  fromAddress: Address,
  toAddress: Address,
  crossTransactionID: Bytes
): void {
  const transferEventID = event.transaction.hash
    .toHexString()
    .concat("-")
    .concat(event.logIndex.toString());

  const transferEvent = new BridgeTransfer(transferEventID);

  transferEvent.hash = event.transaction.hash;
  transferEvent.logIndex = event.logIndex.toI32();
  transferEvent.protocol = NetworkConfigs.getFactoryAddress();
  transferEvent.to = event.transaction.to!;
  transferEvent.from = event.transaction.from;
  transferEvent.isOutgoing = isOutgoing;
  transferEvent.pool = poolID;
  transferEvent.route = poolRouteID;

  if (isOutgoing) {
    let account = getOrCreateAccount(event.transaction.from.toHexString());
    transferEvent.account = account.id;

    transferEvent.fromChainID = chainID.toI32();
    transferEvent.toChainID = crosschainID.toI32();
    transferEvent.type = TransferType.BURN;
  } else {
    let account = getOrCreateAccount(event.transaction.to!.toHexString());
    transferEvent.account = account.id;

    transferEvent.fromChainID = crosschainID.toI32();
    transferEvent.toChainID = chainID.toI32();
    transferEvent.type = TransferType.MINT;
  }

  if (fromAddress) {
    transferEvent.transferFrom = fromAddress;
  }
  if (toAddress) {
    transferEvent.transferTo = toAddress;
  }
  if (crossTransactionID) {
    transferEvent.crossTransactionID = crossTransactionID;
  }

  const token = getOrCreateToken(tokenAddress, event.block.number);
  transferEvent.token = token.id;
  transferEvent.amount = amount;
  transferEvent.amountUSD = bigIntToBigDecimal(amount, token.decimals).times(
    token.lastPriceUSD!
  );

  const crosschainToken = getOrCreateCrosschainToken(
    crosschainTokenAddress,
    crosschainID,
    tokenAddress,
    event.block.number
  );
  transferEvent.crosschainToken = crosschainToken.id;

  transferEvent.isSwap = false;
  if (crosschainToken.token != token.id) {
    transferEvent.isSwap = true;
  }

  transferEvent.blockNumber = event.block.number;
  transferEvent.timestamp = event.block.timestamp;

  transferEvent.save();
}

export function createLiquidityDepositEvent(
  poolID: string,
  tokenAddress: Address,
  chainID: BigInt,
  fromAddress: Address,
  toAddress: Address,
  amount: BigInt,
  call: ethereum.Call
): void {
  const logIndex = BigInt.fromI32(0);
  const depositEventID = call.transaction.hash
    .toHexString()
    .concat("-")
    .concat(logIndex.toString());

  const depositEvent = new LiquidityDeposit(depositEventID);

  depositEvent.hash = call.transaction.hash;
  depositEvent.logIndex = logIndex.toI32();
  depositEvent.protocol = NetworkConfigs.getFactoryAddress();
  depositEvent.to = toAddress;
  depositEvent.from = fromAddress;
  depositEvent.pool = poolID;
  depositEvent.chainID = chainID.toI32();

  const account = getOrCreateAccount(fromAddress.toHexString());
  depositEvent.account = account.id;

  const token = getOrCreateToken(tokenAddress, call.block.number);
  depositEvent.token = token.id;
  depositEvent.amount = amount;
  depositEvent.amountUSD = bigIntToBigDecimal(amount, token.decimals).times(
    token.lastPriceUSD!
  );

  depositEvent.blockNumber = call.block.number;
  depositEvent.timestamp = call.block.timestamp;

  depositEvent.save();
}

export function createLiquidityWithdrawEvent(
  poolID: string,
  tokenAddress: Address,
  chainID: BigInt,
  fromAddress: Address,
  toAddress: Address,
  amount: BigInt,
  call: ethereum.Call
): void {
  const logIndex = BigInt.fromI32(0);
  const withdrawEventID = call.transaction.hash
    .toHexString()
    .concat("-")
    .concat(logIndex.toString());

  const withdrawEvent = new LiquidityWithdraw(withdrawEventID);

  withdrawEvent.hash = call.transaction.hash;
  withdrawEvent.logIndex = logIndex.toI32();
  withdrawEvent.protocol = NetworkConfigs.getFactoryAddress();
  withdrawEvent.to = toAddress;
  withdrawEvent.from = fromAddress;
  withdrawEvent.pool = poolID;
  withdrawEvent.chainID = chainID.toI32();

  const account = getOrCreateAccount(toAddress.toHexString());
  withdrawEvent.account = account.id;

  const token = getOrCreateToken(tokenAddress, call.block.number);
  withdrawEvent.token = token.id;
  withdrawEvent.amount = amount;
  withdrawEvent.amountUSD = bigIntToBigDecimal(amount, token.decimals).times(
    token.lastPriceUSD!
  );

  withdrawEvent.blockNumber = call.block.number;
  withdrawEvent.timestamp = call.block.timestamp;

  withdrawEvent.save();
}
