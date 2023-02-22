// import { log } from "@graphprotocol/graph-ts";
import { Address, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../configurations/configure";
import { TokenABI } from "../../generated/Factory/TokenABI";
import {
  Account,
  DexAmmProtocol,
  LiquidityPool,
  UsageMetricsDailySnapshot,
  LiquidityPoolDailySnapshot,
  FinancialsDailySnapshot,
  LiquidityPoolFee,
  Token,
  RewardToken,
  LiquidityPoolHourlySnapshot,
  UsageMetricsHourlySnapshot,
  Position,
  PositionSnapshot,
  _PositionCounter,
  _Transfer,
} from "../../generated/schema";
import { Versions } from "../versions";
import {
  BIGDECIMAL_ZERO,
  INT_ZERO,
  ProtocolType,
  SECONDS_PER_DAY,
  DEFAULT_DECIMALS,
  RewardTokenType,
  BIGINT_ZERO,
  SECONDS_PER_HOUR,
  INT_ONE,
} from "./constants";
import { createPoolFees } from "./creators";


/**
 * Called when a deposit or withdrawl is made into a LiquidityPool
 * @param event 
 * @param amount0 
 * @param amount1 
 */
export function getOrCreatePosition(event: ethereum.Event):Position {
  // Find the position if one exists
  // Create the Id
  // Load from the Id
  // If not create a new position
  const pool = getLiquidityPool(
    event.address,
    event.block.number
  );
  const protocol = getOrCreateProtocol();

  const account = getOrCreateAccount(event);

  const counterId = account.id.toHexString()
                        .concat("-")
                        .concat(pool.id.toHexString())
  let counter = _PositionCounter.load(counterId);                      
  // Open position always ends with zero
  if(!counter) {
    counter = new _PositionCounter(counterId)
    counter.nextCount = INT_ZERO;
    counter.save();
  }
  const positionAddress = Address.fromString(account.id.toHexString()
                            .concat("-")
                            .concat(pool.id.toHexString())
                            .concat("-")
                            .concat(counter.nextCount.toString()));
  let position = Position.load(positionAddress);
  if(!position) {
    position = new Position(positionAddress);
    position.account = account.id
    position.pool = pool.id;
    position.hashOpened = event.transaction.hash;
    position.blockNumberOpened = event.block.number;
    position.timestampOpened = event.block.timestamp;
    position.depositCount = INT_ZERO;
    position.liquidity = BIGINT_ZERO;
    position.withdrawCount = INT_ZERO;
    position.save(); 
    pool.positionCount += INT_ONE;
    pool.openPositionCount += INT_ONE; 
    account.openPositionCount += INT_ONE;
    account.positionCount += INT_ONE;
    account.save();
    protocol.openPositionCount += INT_ONE;
    protocol.cumulativePositionCount += INT_ONE;
    protocol.cumulativeUniqueLPs += INT_ONE;
    protocol.save();  
  } 

  return position;
  
}

export function getOrCreateAccount(event:ethereum.Event): Account {
  let transfer = getOrCreateTransfer(event);

  let account = Account.load(Address.fromString(transfer.sender!));
  if(!account) {
    account = new Account(Address.fromString(transfer.sender!));
    account.positionCount = INT_ZERO;
    account.openPositionCount = INT_ZERO;
    account.closedPositionCount = INT_ZERO;
    account.depositCount = INT_ZERO;
    account.withdrawCount = INT_ZERO;
    account.swapCount = INT_ZERO;
    account.save()
  }
  return account;
}

export function getOrCreateProtocol(): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(Address.fromString(NetworkConfigs.getFactoryAddress()));
  if (!protocol) {
    protocol = new DexAmmProtocol(Address.fromString(NetworkConfigs.getFactoryAddress()));
    protocol.name = NetworkConfigs.getProtocolName();
    protocol.slug = NetworkConfigs.getProtocolSlug();
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = INT_ZERO;
    protocol.cumulativePositionCount = INT_ZERO;
    protocol.cumulativeUniqueLPs = INT_ZERO;
    protocol.cumulativeUniqueTraders = INT_ZERO;
    protocol.openPositionCount = INT_ZERO;
    protocol.cumulativePositionCount = INT_ZERO;
    protocol.activeLiquidityUSD = BIGDECIMAL_ZERO;
    protocol.totalLiquidityUSD = BIGDECIMAL_ZERO;

    protocol.network = NetworkConfigs.getNetwork();
    protocol.type = ProtocolType.EXCHANGE;
    protocol.totalPoolCount = INT_ZERO;
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();
  protocol.save();

  return protocol;
}

export function getLiquidityPool(
  poolAddress: Bytes,
  blockNumber: BigInt
): LiquidityPool {
  const pool = LiquidityPool.load(poolAddress)!;
  // pool.fees = createPoolFees(poolAddress, blockNumber);
  pool.save();
  return pool;
}

export function getLiquidityPoolFee(id: Bytes): LiquidityPoolFee {
  return LiquidityPoolFee.load(id)!;
}

// export function getOrCreateTokenWhitelist(
//   tokenAddress: string
// ): _TokenWhitelist {
//   let tokenTracker = _TokenWhitelist.load(tokenAddress);
//   // fetch info if null
//   if (!tokenTracker) {
//     tokenTracker = new _TokenWhitelist(tokenAddress);

//     tokenTracker.whitelistPools = [];
//     tokenTracker.save();
//   }

//   return tokenTracker;
// }

export function getOrCreateTransfer(event: ethereum.Event): _Transfer {
  let transfer = _Transfer.load(event.transaction.hash.toHexString());
  if (!transfer) {
    transfer = new _Transfer(event.transaction.hash.toHexString());
    transfer.blockNumber = event.block.number;
    transfer.timestamp = event.block.timestamp;
  }
  transfer.save();
  return transfer;
}

export function getOrCreateUsageMetricDailySnapshot(
  event: ethereum.Event
): UsageMetricsDailySnapshot {
  const protocol = getOrCreateProtocol();
  
  // Number of days since Unix epoch
  const id = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const dayId = id.toString();
  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(Address.fromString(dayId));

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(dayId);
    usageMetrics.protocol = Address.fromString(NetworkConfigs.getFactoryAddress());

    usageMetrics.dailyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = INT_ZERO;
    usageMetrics.dailyTransactionCount = INT_ZERO;
    
    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;

    usageMetrics.totalPoolCount = protocol.totalPoolCount;

    usageMetrics.save();
  }

  return usageMetrics;
}
export function getOrCreateUsageMetricHourlySnapshot(
  event: ethereum.Event
): UsageMetricsHourlySnapshot {
  const protocol = getOrCreateProtocol();
  // Number of days since Unix epoch
  const hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;
  const hourId = hour.toString();

  // Create unique id for the day
  let usageMetrics = UsageMetricsHourlySnapshot.load(hourId);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(hourId);
    usageMetrics.protocol = Address.fromString(NetworkConfigs.getFactoryAddress());

    usageMetrics.hourlyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = INT_ZERO;

    usageMetrics.hourlyDepositCount = INT_ZERO;
    usageMetrics.hourlyWithdrawCount = INT_ZERO;

    usageMetrics.hourlyTransactionCount = INT_ZERO;
    usageMetrics.hourlyWithdrawCount = INT_ZERO;

    usageMetrics.hourlySwapCount = INT_ZERO;

    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateLiquidityPoolDailySnapshot(
  event: ethereum.Event
): LiquidityPoolDailySnapshot {
  const day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const dayId = day.toString();
  let poolMetrics = LiquidityPoolDailySnapshot.load(
    Address.fromString(event.address.toHexString().concat("-").concat(dayId))
  );
  let depositStatId = event.address.toHexString().concat("-deposit-").concat(dayId);
  let withdrawStatId = event.address.toHexString().concat("-withdraw-").concat(dayId);
  let swapStatId = event.address.toHexString().concat("-swap-").concat(dayId);


  if (!poolMetrics) {
    poolMetrics = new LiquidityPoolDailySnapshot(
      Address.fromString(event.address.toHexString().concat("-").concat(dayId))
    );
    poolMetrics.protocol = NetworkConfigs.getFactoryAddress();
    poolMetrics.pool = event.address;
    poolMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyVolumeByTokenAmount = [BIGINT_ZERO, BIGINT_ZERO];
    poolMetrics.dailyVolumeByTokenUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    poolMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
    poolMetrics.inputTokenWeights = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

    poolMetrics.blockNumber = event.block.number;
    poolMetrics.timestamp = event.block.timestamp;

    let depositStatId = event.address.toHexString().concat("-deposit-").concat(dayId);
    let withdrawStatId = event.address.toHexString().concat("-withdraw-").concat(dayId);
    let swapStatId = event.address.toHexString().concat("-swap-").concat(dayId);
    poolMetrics.depositStats = createStat(depositStatId).id;
    poolMetrics.withdrawStats = createStat(withdrawStatId).id;
    poolMetrics.swapStats = createStat(swapStatId).id;
    poolMetrics.save();
  }

  return poolMetrics;
}

export function getOrCreateLiquidityPoolHourlySnapshot(
  event: ethereum.Event
): LiquidityPoolHourlySnapshot {
  const hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;

  const hourId = hour.toString();
  let poolMetrics = LiquidityPoolHourlySnapshot.load(
    event.address.toHexString().concat("-").concat(hourId)
  );

  if (!poolMetrics) {
    poolMetrics = new LiquidityPoolHourlySnapshot(
      event.address.toHexString().concat("-").concat(hourId)
    );
    poolMetrics.protocol = Address.fromString(NetworkConfigs.getFactoryAddress());
    poolMetrics.pool = event.address;
    poolMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyVolumeByTokenAmount = [BIGINT_ZERO, BIGINT_ZERO];
    poolMetrics.hourlyVolumeByTokenUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    poolMetrics.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
    poolMetrics.inputTokenWeights = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

    poolMetrics.blockNumber = event.block.number;
    poolMetrics.timestamp = event.block.timestamp;

    poolMetrics.save();
  }

  return poolMetrics;
}

export function getOrCreateFinancialsDailySnapshot(
  event: ethereum.Event
): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  const dayID = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const id = dayID.toString();

  let financialMetrics = FinancialsDailySnapshot.load(id);

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id);
    financialMetrics.protocol = Address.fromString(NetworkConfigs.getFactoryAddress());

    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyVolumeUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeVolumeUSD = BIGDECIMAL_ZERO;

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

export function getOrCreateToken(address: Bytes): Token {
  let token = Token.load(address);
  if (!token) {
    token = new Token(address);

    token.lastPriceUSD = BIGDECIMAL_ZERO;
    token.lastPriceBlockNumber = BIGINT_ZERO;
    if (NetworkConfigs.getBrokenERC20Tokens().includes(address.toHexString())) {
      token.name = "";
      token.symbol = "";
      token.decimals = DEFAULT_DECIMALS;
      token.save();

      return token as Token;
    }
    const erc20Contract = TokenABI.bind(Address.fromBytes(address));
    const decimals = erc20Contract.try_decimals();
    // Using try_cause some values might be missing
    const name = erc20Contract.try_name();
    const symbol = erc20Contract.try_symbol();
    // TODO: add overrides for name and symbol
    token.decimals = decimals.reverted ? DEFAULT_DECIMALS : decimals.value;
    token.name = name.reverted ? "" : name.value;
    token.symbol = symbol.reverted ? "" : symbol.value;

    token.save();
  }
  return token as Token;
}

export function getOrCreateLPToken(
  tokenAddress: Bytes,
  token0: Token,
  token1: Token
): Token {
  let token = Token.load(tokenAddress);
  // fetch info if null
  if (token === null) {
    token = new Token(tokenAddress);
    token.symbol = token0.name + "/" + token1.name;
    token.name = token0.name + "/" + token1.name + " LP";
    token.decimals = DEFAULT_DECIMALS;
    token.lastPriceUSD = BIGDECIMAL_ZERO;
    token.lastPriceBlockNumber = BIGINT_ZERO;
    token.save();
  }
  return token;
}

export function getOrCreateRewardToken(address: Bytes): RewardToken {
  let rewardToken = RewardToken.load(address);
  if (rewardToken == null) {
    const token = getOrCreateToken(address);
    rewardToken = new RewardToken(Address.fromString(RewardTokenType.DEPOSIT + "-" + address.toHexString()));
    rewardToken.token = token.id;
    rewardToken.type = RewardTokenType.DEPOSIT;
    rewardToken.save();
  }
  return rewardToken as RewardToken;
}
