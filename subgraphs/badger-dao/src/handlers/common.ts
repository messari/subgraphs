import { BigInt, ethereum } from '@graphprotocol/graph-ts';
import {
  LendingProtocol,
  UsageMetricsDailySnapshot,
  _User as User,
} from '../../generated/schema';
import { getDay } from '../utils/numbers';

export function updateUsageMetrics(
  user: User,
  protocol: LendingProtocol,
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
