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
  ZERO_ADDRESS,
  NetworkByID,
  Network,
  InverseEventType,
} from "../common/constants";
import { getOrCreateAccount } from "../common/getters";
import { bigIntToBigDecimal } from "../common/utils/numbers";
import { addToArrayAtIndex, arrayUnique } from "../common/utils/arrays";

import {
  ActiveAccount,
  BridgeProtocol,
  BridgeTransfer,
  CrosschainToken,
  FinancialsDailySnapshot,
  LiquidityDeposit,
  LiquidityWithdraw,
  Pool,
  PoolDailySnapshot,
  PoolHourlySnapshot,
  PoolRoute,
  PoolRouteSnapshot,
  Token,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
} from "../../generated/schema";
import { NetworkConfigs } from "../../configurations/configure";
import {
  getDaysSinceEpoch,
  getHoursSinceEpoch,
} from "../common/utils/datetime";

export function updatePoolMetrics(
  token: Token,
  crosschainToken: CrosschainToken,
  pool: Pool,
  poolDailySnapshot: PoolDailySnapshot,
  poolHourlySnapshot: PoolHourlySnapshot,
  poolRoute: PoolRoute,
  block: ethereum.Block
): void {
  pool.inputTokenBalance = token._totalSupply;
  pool.totalValueLockedUSD = bigIntToBigDecimal(
    pool.inputTokenBalance,
    token.decimals
  ).times(token.lastPriceUSD!);
  pool.routes = arrayUnique(addToArrayAtIndex(pool.routes, poolRoute.id));
  pool.destinationTokens = arrayUnique(
    addToArrayAtIndex(pool.destinationTokens, crosschainToken.address)
  );

  poolDailySnapshot.inputTokenBalance = pool.inputTokenBalance;
  poolDailySnapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolDailySnapshot.routes = arrayUnique(
    addToArrayAtIndex(poolDailySnapshot.routes, poolRoute.id)
  );
  poolDailySnapshot.blockNumber = block.number;
  poolDailySnapshot.timestamp = block.timestamp;

  poolHourlySnapshot.inputTokenBalance = pool.inputTokenBalance;
  poolHourlySnapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolHourlySnapshot.routes = arrayUnique(
    addToArrayAtIndex(poolHourlySnapshot.routes, poolRoute.id)
  );
  poolHourlySnapshot.blockNumber = block.number;
  poolHourlySnapshot.timestamp = block.timestamp;

  if (pool.type == BridgePoolType.BURN_MINT) {
    pool.mintSupply = token._totalSupply;
    poolDailySnapshot.mintSupply = pool.mintSupply;
    poolHourlySnapshot.mintSupply = pool.mintSupply;
  }
}

export function updateVolume(
  protocol: BridgeProtocol,
  financialMetrics: FinancialsDailySnapshot,
  token: Token,
  pool: Pool,
  poolDailySnapshot: PoolDailySnapshot,
  poolHourlySnapshot: PoolHourlySnapshot,
  poolRoute: PoolRoute,
  poolRouteDailySnapshot: PoolRouteSnapshot,
  poolRouteHourlySnapshot: PoolRouteSnapshot,
  isOutgoing: boolean,
  amount: BigInt
): void {
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
}

export function updateRevenue(
  protocol: BridgeProtocol,
  financialMetrics: FinancialsDailySnapshot,
  pool: Pool,
  poolDailySnapshot: PoolDailySnapshot,
  poolHourlySnapshot: PoolHourlySnapshot,
  feeUSD: BigDecimal
): void {
  const protocolSideRevenueUSD = feeUSD.times(
    BigDecimal.fromString("55").div(BigDecimal.fromString("100"))
  );
  const supplySideRevenueUSD = feeUSD.times(
    BigDecimal.fromString("45").div(BigDecimal.fromString("100"))
  );

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
}

export function updateUsageMetrics(
  protocol: BridgeProtocol,
  usageMetricsDaily: UsageMetricsDailySnapshot,
  usageMetricsHourly: UsageMetricsHourlySnapshot,
  eventType: string,
  crosschainID: BigInt,
  block: ethereum.Block,
  accountAddr: Address
): void {
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

  const account = getOrCreateAccount(protocol, accountAddr.toHexString());

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
  account.chains = arrayUnique(addToArrayAtIndex(account.chains, crosschainID));

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
  const dailyActiveAccountID = accountAddr
    .toHexString()
    .concat("-")
    .concat("daily")
    .concat("-")
    .concat(dayId)
    .concat("-")
    .concat(eventType);

  let dailyActiveAccount = ActiveAccount.load(
    Bytes.fromUTF8(dailyActiveAccountID)
  );
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(
      Bytes.fromUTF8(dailyActiveAccountID)
    );

    const inverseEventType = InverseEventType.get(eventType)!;
    const inverseDailyActiveAccountID = accountAddr
      .toHexString()
      .concat("-")
      .concat("daily")
      .concat("-")
      .concat(dayId)
      .concat("-")
      .concat(inverseEventType);
    const inverseDailyActiveAccount = ActiveAccount.load(
      Bytes.fromUTF8(inverseDailyActiveAccountID)
    );

    if (!inverseDailyActiveAccount) {
      usageMetricsDaily.dailyActiveUsers += transactionCount;
    }

    usageMetricsDaily.dailyActiveTransferSenders += transferOutCount;
    usageMetricsDaily.dailyActiveTransferReceivers += transferInCount;
    usageMetricsDaily.dailyActiveLiquidityProviders += depositCount;
    usageMetricsDaily.dailyActiveMessageSenders += messageOutCount;

    dailyActiveAccount.save();
  }

  const hourId = getHoursSinceEpoch(block.timestamp.toI32());
  const hourlyActiveAccountID = accountAddr
    .toHexString()
    .concat("-")
    .concat("hourly")
    .concat("-")
    .concat(hourId)
    .concat("-")
    .concat(eventType);

  let hourlyActiveAccount = ActiveAccount.load(
    Bytes.fromUTF8(hourlyActiveAccountID)
  );
  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(
      Bytes.fromUTF8(hourlyActiveAccountID)
    );

    const inverseEventType = InverseEventType.get(eventType)!;
    const inverseHourlyActiveAccountID = accountAddr
      .toHexString()
      .concat("-")
      .concat("hourly")
      .concat("-")
      .concat(hourId)
      .concat("-")
      .concat(inverseEventType);
    const inverseHourlyActiveAccount = ActiveAccount.load(
      Bytes.fromUTF8(inverseHourlyActiveAccountID)
    );

    if (!inverseHourlyActiveAccount) {
      usageMetricsHourly.hourlyActiveUsers += transactionCount;
    }

    usageMetricsHourly.hourlyActiveTransferSenders += transferOutCount;
    usageMetricsHourly.hourlyActiveTransferReceivers += transferInCount;
    usageMetricsHourly.hourlyActiveLiquidityProviders += depositCount;
    usageMetricsHourly.hourlyActiveMessageSenders += messageOutCount;

    hourlyActiveAccount.save();
  }

  usageMetricsDaily.totalPoolCount = protocol.totalPoolCount;
  usageMetricsDaily.totalPoolRouteCount = protocol.totalPoolRouteCount;
  usageMetricsDaily.totalCanonicalRouteCount =
    protocol.totalCanonicalRouteCount;
  usageMetricsDaily.totalWrappedRouteCount = protocol.totalWrappedRouteCount;
  usageMetricsDaily.totalSupportedTokenCount =
    protocol.totalSupportedTokenCount;

  const network = NetworkByID.get(crosschainID.toString())
    ? NetworkByID.get(crosschainID.toString())!
    : Network.UNKNOWN_NETWORK;
  protocol.supportedNetworks = arrayUnique(
    addToArrayAtIndex(protocol.supportedNetworks, network)
  );
}

export function updateProtocolTVL(
  protocol: BridgeProtocol,
  financialMetrics: FinancialsDailySnapshot,
  deltaPoolTVL: BigDecimal,
  block: ethereum.Block
): void {
  protocol.totalValueLockedUSD =
    protocol.totalValueLockedUSD.plus(deltaPoolTVL);

  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetrics.blockNumber = block.number;
  financialMetrics.timestamp = block.timestamp;
}

export function createBridgeTransferEvent(
  protocol: BridgeProtocol,
  token: Token,
  crosschainToken: CrosschainToken,
  pool: Pool,
  poolRoute: PoolRoute,
  chainID: BigInt,
  crosschainID: BigInt,
  isOutgoing: boolean,
  fromAddress: Address,
  toAddress: Address,
  amount: BigInt,
  crossTransactionID: Bytes,
  event: ethereum.Event
): void {
  const transferEventID = event.transaction.hash
    .toHexString()
    .concat("-")
    .concat(event.logIndex.toString());

  const transferEvent = new BridgeTransfer(Bytes.fromUTF8(transferEventID));

  transferEvent.hash = event.transaction.hash;
  transferEvent.logIndex = event.logIndex.toI32();
  transferEvent.protocol = Bytes.fromHexString(
    NetworkConfigs.getFactoryAddress()
  );
  transferEvent.to = event.transaction.to ? event.transaction.to! : toAddress;
  transferEvent.from = event.transaction.from;
  transferEvent.isOutgoing = isOutgoing;
  transferEvent.pool = pool.id;
  transferEvent.route = poolRoute.id;

  if (isOutgoing) {
    const account = getOrCreateAccount(
      protocol,
      transferEvent.from.toHexString()
    );
    transferEvent.account = account.id;

    transferEvent.fromChainID = chainID;
    transferEvent.toChainID = crosschainID;
    transferEvent.type = TransferType.BURN;
  } else {
    const account = getOrCreateAccount(
      protocol,
      transferEvent.to.toHexString()
    );
    transferEvent.account = account.id;

    transferEvent.fromChainID = crosschainID;
    transferEvent.toChainID = chainID;
    transferEvent.type = TransferType.MINT;
  }

  transferEvent.transferTo = toAddress;
  if (fromAddress != Address.fromString(ZERO_ADDRESS)) {
    transferEvent.transferFrom = fromAddress;
  }
  if (crossTransactionID != Bytes.fromHexString(ZERO_ADDRESS)) {
    transferEvent.crossTransactionID = crossTransactionID;
  }

  transferEvent.token = token.id;
  transferEvent.amount = amount;
  transferEvent.amountUSD = bigIntToBigDecimal(amount, token.decimals).times(
    token.lastPriceUSD!
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
  protocol: BridgeProtocol,
  token: Token,
  poolID: Bytes,
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

  const depositEvent = new LiquidityDeposit(Bytes.fromUTF8(depositEventID));

  depositEvent.hash = call.transaction.hash;
  depositEvent.logIndex = logIndex.toI32();
  depositEvent.protocol = Bytes.fromHexString(
    NetworkConfigs.getFactoryAddress()
  );
  depositEvent.to = toAddress;
  depositEvent.from = fromAddress;
  depositEvent.pool = poolID;
  depositEvent.chainID = chainID;

  const account = getOrCreateAccount(protocol, fromAddress.toHexString());
  depositEvent.account = account.id;

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
  protocol: BridgeProtocol,
  token: Token,
  poolID: Bytes,
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

  const withdrawEvent = new LiquidityWithdraw(Bytes.fromUTF8(withdrawEventID));

  withdrawEvent.hash = call.transaction.hash;
  withdrawEvent.logIndex = logIndex.toI32();
  withdrawEvent.protocol = Bytes.fromHexString(
    NetworkConfigs.getFactoryAddress()
  );
  withdrawEvent.to = toAddress;
  withdrawEvent.from = fromAddress;
  withdrawEvent.pool = poolID;
  withdrawEvent.chainID = chainID;

  const account = getOrCreateAccount(protocol, toAddress.toHexString());
  withdrawEvent.account = account.id;

  withdrawEvent.token = token.id;
  withdrawEvent.amount = amount;
  withdrawEvent.amountUSD = bigIntToBigDecimal(amount, token.decimals).times(
    token.lastPriceUSD!
  );

  withdrawEvent.blockNumber = call.block.number;
  withdrawEvent.timestamp = call.block.timestamp;

  withdrawEvent.save();
}
