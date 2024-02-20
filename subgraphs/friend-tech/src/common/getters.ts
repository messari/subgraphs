import { Address, Bytes, ethereum } from "@graphprotocol/graph-ts";

import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  ETH_ADDRESS,
  ETH_DECIMALS,
  ETH_NAME,
  ETH_SYMBOL,
  INT_ONE,
  INT_ZERO,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  ProtocolType,
} from "./constants";
import { getUsdPricePerEth } from "./prices";
import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";

import {
  Account,
  Connection,
  Pool,
  Protocol,
  Token,
} from "../../generated/schema";

export function getOrCreateToken(event: ethereum.Event): Token {
  const tokenAddress = Address.fromString(ETH_ADDRESS);
  let token = Token.load(tokenAddress);

  if (!token) {
    token = new Token(tokenAddress);

    token.name = ETH_NAME;
    token.symbol = ETH_SYMBOL;
    token.decimals = ETH_DECIMALS as i32;
    token.lastPriceBlockNumber = event.block.number;
  }

  if (!token.lastPriceUSD || token.lastPriceBlockNumber! < event.block.number) {
    const priceUSD = getUsdPricePerEth();

    token.lastPriceUSD = priceUSD;
    token.lastPriceBlockNumber = event.block.number;
  }
  token.save();
  return token;
}

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

    protocol.cumulativeBuyVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSellVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalVolumeUSD = BIGDECIMAL_ZERO;
    protocol.netVolumeUSD = BIGDECIMAL_ZERO;

    protocol.cumulativeUniqueBuyers = INT_ZERO;
    protocol.cumulativeUniqueSellers = INT_ZERO;
    protocol.cumulativeUniqueUsers = INT_ZERO;

    protocol.cumulativeBuyCount = INT_ZERO;
    protocol.cumulativeSellCount = INT_ZERO;
    protocol.cumulativeTransactionCount = INT_ZERO;

    protocol.totalPoolCount = INT_ZERO;

    protocol._lastDailySnapshotTimestamp = BIGINT_ZERO;
    protocol._lastHourlySnapshotTimestamp = BIGINT_ZERO;
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();

  return protocol;
}

export function getOrCreatePool(
  protocol: Protocol,
  poolAddress: Address,
  event: ethereum.Event
): Pool {
  let pool = Pool.load(poolAddress);

  if (!pool) {
    pool = new Pool(poolAddress);
    pool.protocol = protocol.id;
    pool.name = "Subject-" + poolAddress.toHexString();
    pool.symbol = "S-" + poolAddress.toHexString();
    pool.inputTokens = [Address.fromString(ETH_ADDRESS)];
    pool.createdTimestamp = event.block.timestamp;
    pool.createdBlockNumber = event.block.number;

    pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    pool.inputTokenBalances = [BIGINT_ZERO];
    pool.inputTokenBalancesUSD = [BIGDECIMAL_ZERO];
    pool.cumulativeBuyVolumeAmount = BIGINT_ZERO;
    pool.cumulativeBuyVolumeUSD = BIGDECIMAL_ZERO;
    pool.cumulativeSellVolumeAmount = BIGINT_ZERO;
    pool.cumulativeSellVolumeUSD = BIGDECIMAL_ZERO;
    pool.cumulativeTotalVolumeAmount = BIGINT_ZERO;
    pool.cumulativeTotalVolumeUSD = BIGDECIMAL_ZERO;
    pool.netVolumeAmount = BIGINT_ZERO;
    pool.netVolumeUSD = BIGDECIMAL_ZERO;

    pool.cumulativeUniqueUsers = INT_ZERO;
    pool.cumulativeBuyCount = INT_ZERO;
    pool.cumulativeSellCount = INT_ZERO;
    pool.cumulativeTransactionCount = INT_ZERO;

    pool.supply = BIGINT_ZERO;
    pool.sharePriceAmount = BIGINT_ZERO;
    pool.sharePriceUSD = BIGDECIMAL_ZERO;

    pool._lastDailySnapshotTimestamp = BIGINT_ZERO;
    pool._lastHourlySnapshotTimestamp = BIGINT_ZERO;

    protocol.totalPoolCount += INT_ONE;
  }
  return pool;
}

export function getOrCreateAccount(
  traderAddress: Address,
  event: ethereum.Event
): Account {
  let trader = Account.load(traderAddress);

  if (!trader) {
    trader = new Account(traderAddress);

    trader.cumulativeBuyVolumeUSD = BIGDECIMAL_ZERO;
    trader.cumulativeSellVolumeUSD = BIGDECIMAL_ZERO;
    trader.cumulativeTotalVolumeUSD = BIGDECIMAL_ZERO;
    trader.netVolumeUSD = BIGDECIMAL_ZERO;

    trader.cumulativeBuyCount = INT_ZERO;
    trader.cumulativeSellCount = INT_ZERO;
    trader.cumulativeTransactionCount = INT_ZERO;

    trader.createdTimestamp = event.block.timestamp;
    trader.createdBlockNumber = event.block.number;
  }
  return trader;
}

export function getOrCreateConnection(
  traderAddress: Address,
  subjectAddress: Address,
  event: ethereum.Event
): Connection {
  const id = Bytes.empty()
    .concat(traderAddress)
    .concat(Bytes.fromUTF8("-"))
    .concat(subjectAddress);

  let connection = Connection.load(id);

  if (!connection) {
    connection = new Connection(id);

    connection.trader = traderAddress;
    connection.subject = subjectAddress;
    connection.shares = BIGINT_ZERO;

    connection.cumulativeBuyVolumeUSD = BIGDECIMAL_ZERO;
    connection.cumulativeSellVolumeUSD = BIGDECIMAL_ZERO;
    connection.cumulativeTotalVolumeUSD = BIGDECIMAL_ZERO;
    connection.netVolumeUSD = BIGDECIMAL_ZERO;

    connection.cumulativeBuyCount = INT_ZERO;
    connection.cumulativeSellCount = INT_ZERO;
    connection.cumulativeTransactionCount = INT_ZERO;

    connection.createdTimestamp = event.block.timestamp;
    connection.createdBlockNumber = event.block.number;
  }
  return connection;
}
