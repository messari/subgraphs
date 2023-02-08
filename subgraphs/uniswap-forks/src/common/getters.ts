// import { log } from "@graphprotocol/graph-ts";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../configurations/configure";
import { TokenABI } from "../../generated/Factory/TokenABI";
import {
  DexAmmProtocol,
  LiquidityPool,
  UsageMetricsDailySnapshot,
  LiquidityPoolDailySnapshot,
  FinancialsDailySnapshot,
  _LiquidityPoolAmount,
  _Transfer,
  _TokenWhitelist,
  LiquidityPoolFee,
  Token,
  RewardToken,
  LiquidityPoolHourlySnapshot,
  UsageMetricsHourlySnapshot,
  PriceSnapshot,
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
  BIGDECIMAL_NEG_ONE,
  BIGDECIMAL_ONE,
  BIGDECIMAL_TWENTY,
  BIGINT_ONE,
} from "./constants";
import { createPoolFees } from "./creators";
import {
  findUSDPricePerToken,
  updateNativeTokenPriceInUSD,
} from "../price/price";
import { getUsdPricePerToken } from "../prices";

export function getOrCreateProtocol(): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(NetworkConfigs.getFactoryAddress());

  if (!protocol) {
    protocol = new DexAmmProtocol(NetworkConfigs.getFactoryAddress());
    protocol.name = NetworkConfigs.getProtocolName();
    protocol.slug = NetworkConfigs.getProtocolSlug();
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = INT_ZERO;
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
  poolAddress: string,
  blockNumber: BigInt
): LiquidityPool {
  const pool = LiquidityPool.load(poolAddress)!;
  pool.fees = createPoolFees(poolAddress, blockNumber);
  pool.save();
  return pool;
}

export function getLiquidityPoolAmounts(
  poolAddress: string
): _LiquidityPoolAmount {
  return _LiquidityPoolAmount.load(poolAddress)!;
}

export function getLiquidityPoolFee(id: string): LiquidityPoolFee {
  return LiquidityPoolFee.load(id)!;
}

export function getOrCreateTokenWhitelist(
  tokenAddress: string
): _TokenWhitelist {
  let tokenTracker = _TokenWhitelist.load(tokenAddress);
  // fetch info if null
  if (!tokenTracker) {
    tokenTracker = new _TokenWhitelist(tokenAddress);

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

export function getOrCreateUsageMetricDailySnapshot(
  event: ethereum.Event
): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  const id = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const dayId = id.toString();
  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(dayId);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(dayId);
    usageMetrics.protocol = NetworkConfigs.getFactoryAddress();

    usageMetrics.dailyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = INT_ZERO;
    usageMetrics.dailyTransactionCount = INT_ZERO;
    usageMetrics.dailyDepositCount = INT_ZERO;
    usageMetrics.dailyWithdrawCount = INT_ZERO;
    usageMetrics.dailySwapCount = INT_ZERO;

    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;

    const protocol = getOrCreateProtocol();
    usageMetrics.totalPoolCount = protocol.totalPoolCount;

    usageMetrics.save();
  }

  return usageMetrics;
}
export function getOrCreateUsageMetricHourlySnapshot(
  event: ethereum.Event
): UsageMetricsHourlySnapshot {
  // Number of days since Unix epoch
  const hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;
  const hourId = hour.toString();

  // Create unique id for the day
  let usageMetrics = UsageMetricsHourlySnapshot.load(hourId);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(hourId);
    usageMetrics.protocol = NetworkConfigs.getFactoryAddress();

    usageMetrics.hourlyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = INT_ZERO;
    usageMetrics.hourlyTransactionCount = INT_ZERO;
    usageMetrics.hourlyDepositCount = INT_ZERO;
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
    event.address.toHexString().concat("-").concat(dayId)
  );

  if (!poolMetrics) {
    poolMetrics = new LiquidityPoolDailySnapshot(
      event.address.toHexString().concat("-").concat(dayId)
    );
    poolMetrics.protocol = NetworkConfigs.getFactoryAddress();
    poolMetrics.pool = event.address.toHexString();
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
    poolMetrics.protocol = NetworkConfigs.getFactoryAddress();
    poolMetrics.pool = event.address.toHexString();
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
    financialMetrics.protocol = NetworkConfigs.getFactoryAddress();

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

export function getOrCreateToken(
  event: ethereum.Event,
  address: string,
  retrieve_price: bool = true
): Token {
  let token = Token.load(address);
  if (!token) {
    token = new Token(address);

    token.lastPriceUSD = BIGDECIMAL_ZERO;
    token.lastPriceBlockNumber = BIGINT_ZERO;
    if (NetworkConfigs.getBrokenERC20Tokens().includes(address)) {
      token.name = "";
      token.symbol = "";
      token.decimals = DEFAULT_DECIMALS;
      token._harshOracleZero = BIGINT_ZERO;
      token._lpOracleZero = BIGINT_ZERO;
      token.save();

      return token as Token;
    }
    const erc20Contract = TokenABI.bind(Address.fromString(address));
    const decimals = erc20Contract.try_decimals();
    // Using try_cause some values might be missing
    const name = erc20Contract.try_name();
    const symbol = erc20Contract.try_symbol();
    // TODO: add overrides for name and symbol
    token.decimals = decimals.reverted ? DEFAULT_DECIMALS : decimals.value;
    token.name = name.reverted ? "" : name.value;
    token.symbol = symbol.reverted ? "" : symbol.value;
    token._lpOracleZero = BIGINT_ZERO;
    token._harshOracleZero = BIGINT_ZERO;

    token.save();
  }

  if (event.block.number != token.lastPriceBlockNumber! && retrieve_price) {
    const nativeToken = updateNativeTokenPriceInUSD(event);
    token.lastPriceUSD = findUSDPricePerToken(event, token, nativeToken);
    const harshOraclePrice = getUsdPricePerToken(
      Address.fromString(token.id),
      event.block
    );
    token._harshOraclePriceUSD = harshOraclePrice.usdPrice;
    token._harshOracleUsed = harshOraclePrice.oracleType;

    if (harshOraclePrice.usdPrice == BIGDECIMAL_ZERO) {
      token._harshOracleZero = token._harshOracleZero.plus(BIGINT_ONE);
    }
    if (token.lastPriceUSD == BIGDECIMAL_ZERO) {
      token._lpOracleZero = token._lpOracleZero.plus(BIGINT_ONE);
    }
    token.lastPriceBlockNumber = event.block.number;
    nativeToken.save();

    // Check if price difference is greater than 5% between lastPriceUSD and harshOraclePrice
    if (
      token.lastPriceUSD!.notEqual(BIGDECIMAL_ZERO) &&
      harshOraclePrice.usdPrice.notEqual(BIGDECIMAL_ZERO)
    ) {
      const percentageDifference = abs(
        token
          .lastPriceUSD!.minus(harshOraclePrice.usdPrice)
          .div(token.lastPriceUSD!)
      );

      if (percentageDifference.gt(BIGDECIMAL_ONE.div(BIGDECIMAL_TWENTY))) {
        const priceSnapshot = new PriceSnapshot(event.block.number.toString());
        priceSnapshot.lpOraclePrice = token.lastPriceUSD!;
        priceSnapshot.harshOraclePrice = harshOraclePrice.usdPrice;
        priceSnapshot.harshOracleUsed = harshOraclePrice.oracleType;
        priceSnapshot.percentageDifference = percentageDifference;
        priceSnapshot.token = token.id;
        priceSnapshot.blockNumber = event.block.number;
        priceSnapshot.timestamp = event.block.timestamp;
        priceSnapshot.save();
      }
    }

    token.save();
  }

  return token as Token;
}

function abs(x: BigDecimal): BigDecimal {
  return x.gt(BIGDECIMAL_ZERO) ? x : x.times(BIGDECIMAL_NEG_ONE);
}

export function getOrCreateLPToken(
  tokenAddress: string,
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
    token._lpOracleZero = BIGINT_ZERO;
    token._harshOracleZero = BIGINT_ZERO;
    token.save();
  }
  return token;
}

export function getOrCreateRewardToken(
  event: ethereum.Event,
  address: string
): RewardToken {
  let rewardToken = RewardToken.load(address);
  if (rewardToken == null) {
    const token = getOrCreateToken(event, address);
    rewardToken = new RewardToken(RewardTokenType.DEPOSIT + "-" + address);
    rewardToken.token = token.id;
    rewardToken.type = RewardTokenType.DEPOSIT;
    rewardToken.save();
  }
  return rewardToken as RewardToken;
}
