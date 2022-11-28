import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";

import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ONE,
  INT_ZERO,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
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
} from "../common/getters";
import { bigIntToBigDecimal } from "../common/utils/numbers";
import { addToArrayAtIndex, arrayUnique } from "../common/utils/arrays";

import {
  Account,
  AccountTransaction,
  ActiveAccount,
  ActiveAccountTransaction,
  BridgeTransfer,
  CrosschainToken,
  LiquidityDeposit,
  LiquidityWithdraw,
  Token,
} from "../../generated/schema";
import { NetworkConfigs } from "../../configurations/configure";

export function updatePoolMetrics(
  poolAddress: string,
  poolRouteAddress: string,
  token: Token,
  crosschainToken: CrosschainToken,
  event: ethereum.Event
): void {
  const pool = getOrCreatePool(poolAddress, event);
  const poolDailySnapshot = getOrCreatePoolDailySnapshot(poolAddress, event);
  const poolHourlySnapshot = getOrCreatePoolHourlySnapshot(poolAddress, event);

  // pool.inputTokenBalance = token._totalSupply;
  pool.inputTokenBalances = [token._totalSupply];
  pool.totalValueLockedUSD = bigIntToBigDecimal(
    token._totalSupply,
    token.decimals
  ).times(token.lastPriceUSD!);
  pool.routes = arrayUnique(addToArrayAtIndex(pool.routes, poolRouteAddress));
  pool.destinationTokens = arrayUnique(
    addToArrayAtIndex(pool.destinationTokens, crosschainToken.id)
  );

  // poolDailySnapshot.inputTokenBalance = pool.inputTokenBalance;
  poolDailySnapshot.inputTokenBalances = pool.inputTokenBalances;
  poolDailySnapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolDailySnapshot.routes = arrayUnique(
    addToArrayAtIndex(poolDailySnapshot.routes, poolRouteAddress)
  );
  poolDailySnapshot.blockNumber = event.block.number;
  poolDailySnapshot.timestamp = event.block.timestamp;

  // poolHourlySnapshot.inputTokenBalance = pool.inputTokenBalance;
  poolHourlySnapshot.inputTokenBalances = pool.inputTokenBalances;
  poolHourlySnapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolHourlySnapshot.routes = arrayUnique(
    addToArrayAtIndex(poolHourlySnapshot.routes, poolRouteAddress)
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
  poolAddress: string,
  amount: BigInt,
  isOutgoing: boolean,
  token: Token,
  chainID: BigInt,
  crosschainTokenAddress: Address,
  crosschainID: BigInt,
  event: ethereum.Event
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

  const protocol = getOrCreateProtocol();
  const pool = getOrCreatePool(poolAddress, event);
  const poolRoute = getOrCreatePoolRoute(
    poolAddress,
    Address.fromString(token.id),
    chainID,
    crosschainTokenAddress,
    crosschainID,
    event
  );

  const poolDailySnapshot = getOrCreatePoolDailySnapshot(poolAddress, event);
  const poolRouteDailySnapshot = getOrCreatePoolRouteSnapshot(
    poolRoute.id,
    poolDailySnapshot.id,
    event
  );
  const poolHourlySnapshot = getOrCreatePoolHourlySnapshot(poolAddress, event);
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
  protocol.netVolumeUSD = protocol.cumulativeVolumeOutUSD.minus(
    protocol.cumulativeVolumeInUSD
  );

  pool.cumulativeVolumeIn = pool.cumulativeVolumeIn.plus(volumeIn);
  pool.cumulativeVolumeInUSD = pool.cumulativeVolumeInUSD.plus(volumeInUSD);
  pool.cumulativeVolumeOut = pool.cumulativeVolumeOut.plus(volumeOut);
  pool.cumulativeVolumeOutUSD = pool.cumulativeVolumeOutUSD.plus(volumeOutUSD);
  pool.netVolume = pool.cumulativeVolumeOut.plus(pool.cumulativeVolumeIn);
  pool.netVolumeUSD = pool.cumulativeVolumeOutUSD.plus(
    pool.cumulativeVolumeInUSD
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
  poolDailySnapshot.netDailyVolume = poolDailySnapshot.dailyVolumeOut.minus(
    poolDailySnapshot.dailyVolumeIn
  );
  poolDailySnapshot.netDailyVolumeUSD =
    poolDailySnapshot.dailyVolumeOutUSD.minus(
      poolDailySnapshot.dailyVolumeInUSD
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
  poolHourlySnapshot.netHourlyVolume = poolHourlySnapshot.hourlyVolumeOut.minus(
    poolHourlySnapshot.hourlyVolumeIn
  );
  poolHourlySnapshot.netHourlyVolumeUSD =
    poolHourlySnapshot.hourlyVolumeOutUSD.minus(
      poolHourlySnapshot.hourlyVolumeInUSD
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
  financialMetrics.dailyNetVolumeUSD = financialMetrics.dailyVolumeOutUSD.minus(
    financialMetrics.dailyVolumeInUSD
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
  poolAddress: string,
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
  const pool = getOrCreatePool(poolAddress, event);

  const poolDailySnapshot = getOrCreatePoolDailySnapshot(poolAddress, event);
  const poolHourlySnapshot = getOrCreatePoolHourlySnapshot(poolAddress, event);
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
  let transactionCount = INT_ONE;
  let transferCount = eventType == EventType.TRANSFER ? INT_ONE : INT_ZERO;
  let depositCount = eventType == EventType.DEPOSIT ? INT_ONE : INT_ZERO;
  let withdrawCount = eventType == EventType.WITHDRAW ? INT_ONE : INT_ZERO;
  let messageSentCount = eventType == EventType.MESSAGE ? INT_ONE : INT_ZERO;

  let liquidityProviders = eventType == EventType.DEPOSIT ? INT_ONE : INT_ZERO;
  let messageSenders = eventType == EventType.MESSAGE ? INT_ONE : INT_ZERO;

  let from = transaction.from.toHexString();

  let usageMetricsDaily = getOrCreateUsageMetricDailySnapshot(block);
  let usageMetricsHourly = getOrCreateUsageMetricHourlySnapshot(block);

  let protocol = getOrCreateProtocol();

  protocol.cumulativeTransactionCount += transactionCount;
  protocol.cumulativeTransferCount += transferCount;
  protocol.cumulativeDepositCount += depositCount;
  protocol.cumulativeWithdrawCount += withdrawCount;

  usageMetricsDaily.blockNumber = block.number;
  usageMetricsDaily.timestamp = block.timestamp;
  usageMetricsDaily.dailyTransactionCount += transactionCount;
  usageMetricsDaily.dailyTransferCount += transferCount;
  usageMetricsDaily.dailyDepositCount += depositCount;
  usageMetricsDaily.dailyWithdrawCount += withdrawCount;
  usageMetricsDaily.dailyMessageSentCount += messageSentCount;

  usageMetricsHourly.blockNumber = block.number;
  usageMetricsHourly.timestamp = block.timestamp;
  usageMetricsHourly.hourlyTransactionCount += transactionCount;
  usageMetricsHourly.hourlyTransferCount += transferCount;
  usageMetricsHourly.hourlyDepositCount += depositCount;
  usageMetricsHourly.hourlyWithdrawCount += withdrawCount;
  usageMetricsHourly.hourlyMessageSentCount += messageSentCount;

  // Number of days since Unix epoch
  let day = block.timestamp.toI32() / SECONDS_PER_DAY;
  let hour = block.timestamp.toI32() / SECONDS_PER_HOUR;

  let dayId = day.toString();
  let hourId = hour.toString();

  // Combine the id, user address and transaction type to generate a unique user id for the day
  let dailyActiveAccountId = "daily-"
    .concat(from)
    .concat("-")
    .concat(dayId)
    .concat("-");
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    usageMetricsDaily.dailyActiveUsers += INT_ONE;

    dailyActiveAccount.save();
  }

  let dailyActiveAccountTransactionId = "daily-"
    .concat(from)
    .concat("-")
    .concat(dayId)
    .concat("-")
    .concat(eventType);
  let dailyActiveAccountTransaction = ActiveAccountTransaction.load(
    dailyActiveAccountTransactionId
  );
  if (!dailyActiveAccountTransaction) {
    dailyActiveAccountTransaction = new ActiveAccountTransaction(
      dailyActiveAccountTransactionId
    );
    usageMetricsDaily.dailyActiveLiquidityProviders += liquidityProviders;
    usageMetricsDaily.dailyActiveMessageSenders += messageSenders;

    dailyActiveAccountTransaction.save();
  }

  let hourlyActiveAccountId = "hourly-".concat(from).concat("-").concat(hourId);
  let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountId);
  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountId);
    usageMetricsHourly.hourlyActiveUsers += INT_ONE;

    hourlyActiveAccount.save();
  }

  let account = Account.load(from);
  if (!account) {
    account = new Account(from);
    account.chains = [];

    protocol.cumulativeUniqueUsers += INT_ONE;
  }
  account.chains = arrayUnique(addToArrayAtIndex(account.chains, crosschainID));
  account.save();

  let accountTransactionId = from.concat("-").concat(eventType);
  let accountTransaction = AccountTransaction.load(accountTransactionId);
  if (!accountTransaction) {
    accountTransaction = new AccountTransaction(accountTransactionId);
    accountTransaction.chains = [];

    protocol.cumulativeUniqueLiquidityProviders += liquidityProviders;
    protocol.cumulativeUniqueMessageSenders += messageSenders;
  }
  accountTransaction.chains = arrayUnique(
    addToArrayAtIndex(accountTransaction.chains, crosschainID)
  );
  accountTransaction.save();

  usageMetricsDaily.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetricsDaily.cumulativeUniqueLiquidityProviders =
    protocol.cumulativeUniqueLiquidityProviders;
  usageMetricsDaily.cumulativeUniqueMessageSenders =
    protocol.cumulativeUniqueMessageSenders;

  usageMetricsHourly.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  usageMetricsDaily.totalPoolCount = protocol.totalPoolCount;
  usageMetricsDaily.totalPoolRouteCount = protocol.totalPoolRouteCount;
  usageMetricsDaily.canonicalRouteCount = protocol.canonicalRouteCount;
  usageMetricsDaily.wrappedRouteCount = protocol.wrappedRouteCount;
  usageMetricsDaily.supportedTokenCount = protocol.supportedTokenCount;

  usageMetricsHourly.save();
  usageMetricsDaily.save();
  protocol.save();
}

export function updateProtocolTVL(event: ethereum.Event): void {
  let protocol = getOrCreateProtocol();
  let financialMetrics = getOrCreateFinancialsDailySnapshot(event);

  let pools = protocol.pools;
  let tvl = BIGDECIMAL_ZERO;
  for (let i = 0; i < pools.length; i++) {
    let pool = getOrCreatePool(pools[i], event);

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
  poolAddress: string,
  tokenAddress: Address,
  chainID: BigInt,
  crosschainTokenAddress: Address,
  crosschainID: BigInt,
  poolRouteAddress: string,
  isOutgoing: boolean,
  fromAddress: Address,
  toAddress: Address,
  crossTransactionID: Bytes,
  amount: BigInt,
  event: ethereum.Event
): void {
  const transferEventID = EventType.TRANSFER.concat("-")
    .concat(event.transaction.hash.toHexString())
    .concat("-")
    .concat(event.logIndex.toString());

  const transferEvent = new BridgeTransfer(transferEventID);

  transferEvent.hash = event.transaction.hash.toHexString();
  transferEvent.logIndex = event.logIndex;
  transferEvent.protocol = NetworkConfigs.getFactoryAddress();
  transferEvent.pool = poolAddress;
  transferEvent.route = poolRouteAddress;
  transferEvent.crossTransactionID = crossTransactionID.toHexString();
  transferEvent.from = event.transaction.from.toHexString();
  transferEvent.to = event.transaction.to!.toHexString();
  transferEvent.transferFrom = fromAddress.toHexString();
  transferEvent.transferTo = toAddress.toHexString();
  transferEvent.amount = amount;
  transferEvent.isOutgoing = isOutgoing;

  if (isOutgoing) {
    transferEvent.fromChainID = chainID;
    transferEvent.toChainID = crosschainID;
    transferEvent.type = TransferType.BURN;
  } else {
    transferEvent.fromChainID = crosschainID;
    transferEvent.toChainID = chainID;
    transferEvent.type = TransferType.MINT;
  }

  let token = getOrCreateToken(tokenAddress, event.block.number);
  transferEvent.token = token.id;

  let crosschainToken = getOrCreateCrosschainToken(
    crosschainTokenAddress,
    crosschainID,
    tokenAddress,
    event.block.number
  );
  transferEvent.crosschainToken = crosschainToken.address;

  transferEvent.isSwap = false;
  if (crosschainToken.token != token.id) {
    transferEvent.isSwap = true;
  }

  transferEvent.blockNumber = event.block.number;
  transferEvent.timestamp = event.block.timestamp;

  transferEvent.save();
}

export function createLiquidityDepositEvent(
  poolAddress: string,
  tokenAddress: string,
  chainID: BigInt,
  fromAddress: Address,
  toAddress: Address,
  amount: BigInt,
  call: ethereum.Call
): void {
  const logIndex = BigInt.fromI32(0);
  const depositEventID = EventType.DEPOSIT.concat("-")
    .concat(call.transaction.hash.toHexString())
    .concat("-")
    .concat(logIndex.toString());

  const depositEvent = new LiquidityDeposit(depositEventID);

  depositEvent.hash = call.transaction.hash.toHexString();
  depositEvent.logIndex = logIndex;
  depositEvent.protocol = NetworkConfigs.getFactoryAddress();
  depositEvent.to = toAddress.toHexString();
  depositEvent.from = fromAddress.toHexString();
  depositEvent.pool = poolAddress;
  depositEvent.token = tokenAddress;
  depositEvent.chainID = chainID;
  depositEvent.amount = amount;
  depositEvent.blockNumber = call.block.number;
  depositEvent.timestamp = call.block.timestamp;

  depositEvent.save();
}

export function createLiquidityWithdrawEvent(
  poolAddress: string,
  tokenAddress: string,
  chainID: BigInt,
  fromAddress: Address,
  toAddress: Address,
  amount: BigInt,
  call: ethereum.Call
): void {
  const logIndex = BigInt.fromI32(0);
  const withdrawEventID = EventType.WITHDRAW.concat("-")
    .concat(call.transaction.hash.toHexString())
    .concat("-")
    .concat(logIndex.toString());

  const withdrawEvent = new LiquidityWithdraw(withdrawEventID);

  withdrawEvent.hash = call.transaction.hash.toHexString();
  withdrawEvent.logIndex = logIndex;
  withdrawEvent.protocol = NetworkConfigs.getFactoryAddress();
  withdrawEvent.to = toAddress.toHexString();
  withdrawEvent.from = fromAddress.toHexString();
  withdrawEvent.pool = poolAddress;
  withdrawEvent.token = tokenAddress;
  withdrawEvent.chainID = chainID;
  withdrawEvent.amount = amount;
  withdrawEvent.blockNumber = call.block.number;
  withdrawEvent.timestamp = call.block.timestamp;

  withdrawEvent.save();
}
