// import { log } from "@graphprotocol/graph-ts"
import { Address, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/Factory/ERC20";
import {
  DexAmmProtocol,
  LiquidityPool,
  UsageMetricsDailySnapshot,
  PoolDailySnapshot,
  FinancialsDailySnapshot,
  _LiquidityPoolAmount,
  _Transfer,
  _HelperStore,
  _TokenTracker,
  LiquidityPoolFee,
  Token,
} from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  HelperStoreType,
  Network,
  INT_ZERO,
  FACTORY_ADDRESS,
  ProtocolType,
  SECONDS_PER_DAY,
  BIGINT_ZERO,
  DEFAULT_DECIMALS,
} from "./constants";

export function getOrCreateDex(): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(FACTORY_ADDRESS);

  if (!protocol) {
    protocol = new DexAmmProtocol(FACTORY_ADDRESS);
    protocol.name = "Uniswap v2";
    protocol.slug = "uniswap-v2";
    protocol.schemaVersion = "1.1.0";
    protocol.subgraphVersion = "1.0.2";
    protocol.methodologyVersion = "1.0.0";
    protocol.currentTvlUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = INT_ZERO;
    protocol.network = Network.ETHEREUM;
    protocol.type = ProtocolType.EXCHANGE;

    protocol.save();
  }
  return protocol;
}

export function getLiquidityPool(poolAddress: string): LiquidityPool {
  return LiquidityPool.load(poolAddress)!;
}

export function getLiquidityPoolAmounts(poolAddress: string): _LiquidityPoolAmount {
  return _LiquidityPoolAmount.load(poolAddress)!;
}

export function getLiquidityPoolFee(id: string): LiquidityPoolFee {
  return LiquidityPoolFee.load(id)!;
}

export function getOrCreateTokenTracker(tokenAddress: string): _TokenTracker {
  let tokenTracker = _TokenTracker.load(tokenAddress);
  // fetch info if null
  if (!tokenTracker) {
    tokenTracker = new _TokenTracker(tokenAddress);

    tokenTracker.whitelistPools = [];
    tokenTracker.save();
  }

  return tokenTracker;
}

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

export function getOrCreateUsageMetricSnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let dayID = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let id = dayID.toString();
  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id);
    usageMetrics.protocol = FACTORY_ADDRESS;

    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreatePoolDailySnapshot(event: ethereum.Event): PoolDailySnapshot {
  let dayID = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let id = dayID.toString();
  let poolMetrics = PoolDailySnapshot.load(
    event.address
      .toHexString()
      .concat("-")
      .concat(id)
  );

  if (!poolMetrics) {
    poolMetrics = new PoolDailySnapshot(
      event.address
        .toHexString()
        .concat("-")
        .concat(id)
    );
    poolMetrics.protocol = FACTORY_ADDRESS;
    poolMetrics.pool = event.address.toHexString();
    poolMetrics.currentRewardTokenEmissionsAmount = [];
    poolMetrics.currentRewardTokenEmissionsUSD = [];

    poolMetrics.save();
  }

  return poolMetrics;
}

export function getOrCreateFinancials(event: ethereum.Event): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  let dayID = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let id = dayID.toString();

  let financialMetrics = FinancialsDailySnapshot.load(id);

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id);
    financialMetrics.protocol = FACTORY_ADDRESS;

    financialMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    financialMetrics.currentTvlUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;

    financialMetrics.save();
  }
  return financialMetrics;
}

export function getOrCreateToken(address: string): Token {
  let token = Token.load(address);
  if (!token) {
    token = new Token(address);
    let erc20Contract = ERC20.bind(Address.fromString(address));
    let decimals = erc20Contract.try_decimals();
    // Using try_cause some values might be missing
    let name = erc20Contract.try_name();
    let symbol = erc20Contract.try_symbol();
    // TODO: add overrides for name and symbol
    token.decimals = decimals.reverted ? DEFAULT_DECIMALS : decimals.value.toI32();
    token.name = name.reverted ? "" : name.value;
    token.symbol = symbol.reverted ? "" : symbol.value;
    token.save();
  }
  return token as Token;
}

export function getOrCreateLPToken(tokenAddress: string, token0: Token, token1: Token): Token {
  let token = Token.load(tokenAddress);
  // fetch info if null
  if (token === null) {
    token = new Token(tokenAddress);
    token.symbol = token0.name + "/" + token1.name;
    token.name = token0.name + "/" + token1.name + " LP";
    token.decimals = DEFAULT_DECIMALS;
    token.save();
  }
  return token;
}

export function getOrCreateEtherHelper(): _HelperStore {
  let ether = _HelperStore.load(HelperStoreType.ETHER);
  if (!ether) {
    ether = new _HelperStore(HelperStoreType.ETHER);
    ether.valueDecimal = BIGDECIMAL_ZERO;
    ether.save();
  }
  return ether;
}
export function getOrCreateUsersHelper(): _HelperStore {
  let uniqueUsersTotal = _HelperStore.load(HelperStoreType.USERS);
  if (!uniqueUsersTotal) {
    uniqueUsersTotal = new _HelperStore(HelperStoreType.USERS);
    uniqueUsersTotal.valueInt = INT_ZERO;
    uniqueUsersTotal.save();
  }
  return uniqueUsersTotal;
}
