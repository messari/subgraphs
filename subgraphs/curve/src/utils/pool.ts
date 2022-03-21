import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
  DataSourceContext,
  ethereum,
} from "@graphprotocol/graph-ts";

import { Registry } from "../../generated/MainRegistry/Registry";

import { StableSwap } from "../../generated/MainRegistry/StableSwap";
import { ERC20 } from "../../generated/MainRegistry/ERC20";
import { Pool as PoolDataSource } from "../../generated/templates";

import {
  LiquidityPool,
  Token,
  PoolDailySnapshot,
} from "../../generated/schema";

import { getOrCreateToken } from "../utils/tokens";

import {
  BIGDECIMAL_ZERO,
  DEFAULT_DECIMALS,
  getOrNull,
  SECONDS_PER_DAY,
  toDecimal,
  ZERO_ADDRESS,
} from "../utils/constant";
import { getOrCreateProtocol } from "../mappings/registry";
import { normalizedUsdcPrice, usdcPrice, usdcPricePerToken } from "./pricing";

export function getOutTokenPriceUSD(pool: LiquidityPool): BigDecimal {
  return normalizedUsdcPrice(
    usdcPricePerToken(Address.fromBytes(pool._lpTokenAddress))
  );
}

export function getTotalVolumeUSD(
  pool: LiquidityPool,
  token_amount: BigInt[]
): BigDecimal {
  let totalVolumeUSD = BIGDECIMAL_ZERO;
  let tokenAmount = token_amount;
  for (let i = 0; i < tokenAmount.length; i++) {
    let inputToken = getOrCreateToken(Address.fromString(pool.inputTokens[i]));
    // Set totalVolume(tv)
    let tvUSD = normalizedUsdcPrice(usdcPrice(inputToken, tokenAmount[i]));
    totalVolumeUSD = totalVolumeUSD.plus(tvUSD);
  }
  return totalVolumeUSD;
}

export function getTVLUSD(pool: LiquidityPool): BigDecimal {
  let protocol = getOrCreateProtocol();
  let registryContract = Registry.bind(Address.fromString(protocol.id));
  let balances = registryContract.try_get_balances(Address.fromString(pool.id));
  let tokenBalance: BigInt[] = [];
  if (!balances.reverted) {
    tokenBalance = balances.value;
  }
  let totalValueLockedUSD = BIGDECIMAL_ZERO;
  for (let i = 0; i < tokenBalance.length; i++) {
    let inputToken = getOrCreateToken(Address.fromString(pool.inputTokens[i]));
    // Set totalValueLocked
    let tvlUSD = normalizedUsdcPrice(usdcPrice(inputToken, tokenBalance[i]));
    totalValueLockedUSD = totalValueLockedUSD.plus(tvlUSD);
  }
  return totalValueLockedUSD;
}

export function getCurrentTokenSupply(
  pool: LiquidityPool,
  token_supply: BigInt
): BigDecimal {
  // If token supply in event is 0, then check directly from contract
  let currentTokenSupply = toDecimal(token_supply, DEFAULT_DECIMALS);
  if (currentTokenSupply == toDecimal(BigInt.fromI32(0), DEFAULT_DECIMALS)) {
    let lpContract = ERC20.bind(Address.fromBytes(pool._lpTokenAddress));
    let supply = lpContract.try_totalSupply();
    if (!supply.reverted) {
      currentTokenSupply = toDecimal(supply.value, DEFAULT_DECIMALS);
    }
  }

  return currentTokenSupply;
}

export function getInputBalances(pool: LiquidityPool): BigDecimal[] {
  let poolContract = StableSwap.bind(Address.fromString(pool.id));
  let newPoolBalances: BigDecimal[] = [];
  for (let i = 0; i < pool.inputTokens.length; i++) {
    let ib = BigInt.fromI32(i);
    let balance = poolContract.try_balances(ib);
    if (!balance.reverted) {
      newPoolBalances.push(toDecimal(balance.value, DEFAULT_DECIMALS));
    }
  }
  return newPoolBalances;
}

// Create new pool
export function CreatePool(
  call: ethereum.Call,
  poolAddress: Address,
  lpToken: Address,
  name: string
): void {
  let protocol = getOrCreateProtocol();
  let registryContract = Registry.bind(Address.fromString(protocol.id));
  // Check if pool exist
  let pool = LiquidityPool.load(poolAddress.toHexString());

  // If pool doesn't exist, create a new pool
  if (pool == null) {
    pool = new LiquidityPool(poolAddress.toHexString());
    // Input tokens
    let coins: Address[] | null = getOrNull<Address[]>(
      registryContract.try_get_coins(poolAddress)
    );
    let inputTokens = coins
      ? coins.map<Token>((coin) => getOrCreateToken(coin))
      : [];

    // Get Output tokens
    let outputToken = getOrCreateToken(lpToken).id;

    let inputTokenBalances: BigDecimal[] = [];
    for (let i = 0; i < inputTokens.length; i++) {
      inputTokenBalances.push(BIGDECIMAL_ZERO);
    }

    pool.protocol = protocol.id;
    pool.inputTokens = inputTokens.map<string>((t) => t.id);
    pool.inputTokenBalances = inputTokenBalances.map<BigDecimal>((tb) => tb);
    pool.outputToken = outputToken;
    pool.outputTokenSupply = BIGDECIMAL_ZERO;
    pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    pool.rewardTokens = [];
    pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    pool.inputTokenBalances = [];
    pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    pool.createdTimestamp = call.block.timestamp;
    pool.createdBlockNumber = call.block.number;
    pool.name = name;
    pool.symbol = null;
    pool._lpTokenAddress = lpToken;

    pool.save();
  }
}

export function updatePool(
  event: ethereum.Event,
  pool: LiquidityPool,
  balances: BigDecimal[],
  totalSupply: BigDecimal,
  outputTokenPriceUSD: BigDecimal,
  totalVolumeUSD: BigDecimal,
  totalValueLockedUSD: BigDecimal
): LiquidityPool {
  pool.inputTokenBalances = balances.map<BigDecimal>((tb) => tb);
  pool.outputTokenSupply = totalSupply;
  pool.outputTokenPriceUSD = outputTokenPriceUSD;
  pool.totalValueLockedUSD = totalValueLockedUSD;
  pool.totalVolumeUSD = totalVolumeUSD;
  pool.createdTimestamp = event.block.timestamp;
  pool.createdBlockNumber = event.block.number;

  pool.save();

  createPoolDailySnapshot(event, pool);

  return pool as LiquidityPool;
}

export function createPoolDailySnapshot(
  event: ethereum.Event,
  pool: LiquidityPool
): void {
  // Number of days since Unix epoch
  let timestamp = event.block.timestamp;
  let blockNumber = event.block.number;
  let day: i64 = timestamp.toI64() / SECONDS_PER_DAY;
  let id = event.address
    .toHexString()
    .concat("-")
    .concat(day.toString());
  let protocol = getOrCreateProtocol();
  let poolDailySnapshot = PoolDailySnapshot.load(id);
  if (poolDailySnapshot == null) {
    poolDailySnapshot = new PoolDailySnapshot(id);
    poolDailySnapshot.protocol = protocol.id;
    poolDailySnapshot.pool = pool.id;
    poolDailySnapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
    poolDailySnapshot.totalVolumeUSD = pool.totalVolumeUSD;
    poolDailySnapshot.inputTokenBalances = pool.inputTokenBalances.map<
      BigDecimal
    >((it) => it);
    poolDailySnapshot.outputTokenSupply = pool.outputTokenSupply;
    poolDailySnapshot.outputTokenPriceUSD = pool.outputTokenPriceUSD;
    poolDailySnapshot.rewardTokenEmissionsAmount = [];
    poolDailySnapshot.rewardTokenEmissionsUSD = [];
    poolDailySnapshot.blockNumber = blockNumber;
    poolDailySnapshot.timestamp = timestamp;

    poolDailySnapshot.save();
  }
}

export function removePool(address: Address, event: ethereum.Event): void {
  let id = address.toHexString();
  // Check if pool exist
  let pool = LiquidityPool.load(id);

  // If pool exist, update fields to ZERO
  if (pool != null) {
    pool.id = ZERO_ADDRESS.toString();
    pool.inputTokens = pool.inputTokens.map<string>((it) => ZERO_ADDRESS);
    pool.outputToken = ZERO_ADDRESS;
    pool.rewardTokens = [];
    pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    pool.totalVolumeUSD = BIGDECIMAL_ZERO;
    pool.inputTokenBalances = pool.inputTokenBalances.map<BigDecimal>(
      (itb) => BIGDECIMAL_ZERO
    );
    pool.outputTokenSupply = BIGDECIMAL_ZERO;
    pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    pool.name = "";
    pool.symbol = "";

    pool.save();
  }
}
