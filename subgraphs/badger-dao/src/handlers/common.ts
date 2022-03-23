import { BigInt, ethereum } from '@graphprotocol/graph-ts';
import {
  UsageMetricsDailySnapshot,
  Vault,
  YieldAggregator,
  _User as User,
} from '../../generated/schema';
import { getDay } from '../utils/numbers';

export function updateUsageMetrics(
  user: User,
  protocol: YieldAggregator,
  metrics: UsageMetricsDailySnapshot,
  block: ethereum.Block,
): void {
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

export function updateProtocol(
  protocol: YieldAggregator,
  vault: Vault,
  metrics: UsageMetricsDailySnapshot,
): void {
  if (protocol.vaults.indexOf(vault.id) === -1) {
    protocol.vaults.concat([vault.id]);
  }

  if (protocol.usageMetrics.indexOf(metrics.id) === -1) {
    protocol.usageMetrics = protocol.usageMetrics.concat([metrics.id]);
  }

  protocol.save();
}
