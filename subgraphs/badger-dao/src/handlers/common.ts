import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import {
  FinancialsDailySnapshot,
  Vault,
  VaultDailySnapshot,
  YieldAggregator,
  _User as User,
} from '../../generated/schema';
import { getOrCreateUserSnapshot } from '../entities/Metrics';
import { getOrCreateProtocol } from '../entities/Protocol';
import { getDay } from '../utils/numbers';

export function updateUsageMetrics(user: User, block: ethereum.Block): void {
  let metrics = getOrCreateUserSnapshot(getDay(block.timestamp));
  let protocol = getOrCreateProtocol();

  // no metrics yet, initialize
  if (metrics.blockNumber.equals(BigInt.zero())) {
    metrics.blockNumber = block.number;
    metrics.timestamp = block.timestamp;
  }

  metrics.protocol = protocol.id;
  metrics.dailyTransactionCount = metrics.dailyTransactionCount + 1;

  let day = getDay(block.timestamp);

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
  inputTokenAddress: Address,
  inputTokenAmount: BigInt,
): void {
  let index = vault.inputTokens.indexOf(inputTokenAddress.toHex());

  if (index === -1) {
    vault.inputTokens = vault.inputTokens.concat([inputTokenAddress.toHex()]);
    vault.inputTokenBalances = vault.inputTokenBalances.concat([inputTokenAmount]);
  }

  if (index !== -1) {
    let balances = vault.inputTokenBalances;
    balances[index] = balances[index].plus(inputTokenAmount);

    vault.inputTokenBalances = balances;
  }

  vault.save();
}

export function updateFinancialMetrics(
  metrics: FinancialsDailySnapshot,
  protocol: YieldAggregator,
  block: ethereum.Block,
): void {
  if (metrics.blockNumber.equals(BigInt.zero())) {
    metrics.timestamp = block.timestamp;
    metrics.blockNumber = block.number;
  }

  metrics.protocol = protocol.id;
  metrics.save();
}

export function updateVaultMetrics(
  metrics: VaultDailySnapshot,
  inputTokenAmount: BigInt,
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

  metrics.inputTokenBalances = currentBalance;
  metrics.save();
}
