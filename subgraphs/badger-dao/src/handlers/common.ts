import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import {
  Token,
  Vault,
  VaultDailySnapshot,
  YieldAggregator,
  _User as User,
} from '../../generated/schema';
import {
  getOrCreateFinancialsDailySnapshot,
  getOrCreateUserSnapshot,
} from '../entities/Metrics';
import { getOrCreateProtocol } from '../entities/Protocol';
import { getDay, normalizedUsdcPrice } from '../utils/numbers';
import { getPriceOfCurveLpToken, getPriceOfStakedTokens } from './price';

export function updateUsageMetrics(user: User, block: ethereum.Block): void {
  let metrics = getOrCreateUserSnapshot(getDay(block.timestamp));
  let protocol = getOrCreateProtocol();
  let day = getDay(block.timestamp);

  metrics.protocol = protocol.id;
  metrics.dailyTransactionCount = metrics.dailyTransactionCount + 1;

  // no metrics yet, initialize
  if (metrics.blockNumber.equals(BigInt.zero())) {
    metrics.blockNumber = block.number;
    metrics.timestamp = block.timestamp;
  }

  // is a new user
  if (user.lastDayActive === 0) {
    user.lastDayActive = day;

    metrics.totalUniqueUsers = metrics.totalUniqueUsers + 1;
    metrics.activeUsers = metrics.activeUsers + 1;
  }

  // new user of the day
  else if (user.lastDayActive < day) {
    user.lastDayActive = day;

    metrics.activeUsers = metrics.activeUsers + 1;
  }

  user.save();
  metrics.save();
}

export function updateVault(
  vault: Vault,
  token: Token,
  inputTokenAmount: BigInt,
  tokenPrice: BigInt,
): void {
  let index = vault.inputTokens.indexOf(token.id);
  let balance = BigInt.zero();

  if (index === -1) {
    vault.inputTokens = vault.inputTokens.concat([token.id]);
    vault.inputTokenBalances = vault.inputTokenBalances.concat([inputTokenAmount]);
    balance = inputTokenAmount;
  }

  if (index !== -1) {
    let balances = vault.inputTokenBalances;
    balances[index] = balances[index].plus(inputTokenAmount);

    vault.inputTokenBalances = balances;
    balance = balances[index];
  }

  vault.outputTokenPriceUSD = normalizedUsdcPrice(
    getPriceOfStakedTokens(
      Address.fromString(vault.id),
      Address.fromString(token.id),
      BigInt.fromI32(token.decimals),
    ),
  ).toBigDecimal();
  vault.totalVolumeUSD = vault.totalVolumeUSD.plus(tokenPrice.toBigDecimal());
  vault.totalValueLockedUSD = normalizedUsdcPrice(
    getPriceOfCurveLpToken(
      Address.fromString(token.id),
      balance,
      BigInt.fromI32(token.decimals),
    ),
  ).toBigDecimal();

  vault.save();
}

export function updateFinancialMetrics(
  protocol: YieldAggregator,
  token: Token,
  tokenPrice: BigInt,
  inputTokenAmount: BigInt,
  block: ethereum.Block,
): void {
  let metrics = getOrCreateFinancialsDailySnapshot(getDay(block.timestamp));
  if (metrics.blockNumber.equals(BigInt.zero())) {
    metrics.timestamp = block.timestamp;
    metrics.blockNumber = block.number;
  }

  metrics.totalVolumeUSD = metrics.totalVolumeUSD.plus(tokenPrice.toBigDecimal());
  metrics.totalValueLockedUSD = normalizedUsdcPrice(
    getPriceOfCurveLpToken(
      Address.fromString(token.id),
      inputTokenAmount,
      BigInt.fromI32(token.decimals),
    ),
  ).toBigDecimal();
  metrics.protocol = protocol.id;
  metrics.save();
}

export function updateVaultMetrics(
  vault: Vault,
  token: Token,
  metrics: VaultDailySnapshot,
  inputTokenAmount: BigInt,
  tokenPrice: BigInt,
  isDeposit: bool,
  block: ethereum.Block,
): void {
  let currentBalance = metrics.inputTokenBalances;

  if (metrics.blockNumber.equals(BigInt.zero())) {
    metrics.timestamp = block.timestamp;
    metrics.blockNumber = block.number;
  }

  if (isDeposit) {
    currentBalance = currentBalance.plus(inputTokenAmount);
  } else {
    currentBalance = currentBalance.minus(inputTokenAmount);
  }

  metrics.outputTokenPriceUSD = normalizedUsdcPrice(
    getPriceOfStakedTokens(
      Address.fromString(vault.id),
      Address.fromString(token.id),
      BigInt.fromI32(token.decimals),
    ),
  ).toBigDecimal();
  metrics.totalVolumeUSD = vault.totalVolumeUSD.plus(tokenPrice.toBigDecimal());
  metrics.totalValueLockedUSD = normalizedUsdcPrice(
    getPriceOfCurveLpToken(
      Address.fromString(token.id),
      currentBalance,
      BigInt.fromI32(token.decimals),
    ),
  ).toBigDecimal();
  metrics.inputTokenBalances = currentBalance;
  metrics.save();
}
