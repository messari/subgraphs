import { Address, BigInt } from '@graphprotocol/graph-ts';
import { UsageMetricsDailySnapshot, _User as User } from '../../generated/schema';

export function getOrCreateUser(id: Address): User {
  let user = User.load(id.toHex());

  if (user) {
    return user;
  }

  user = new User(id.toHex());
  user.lastDayActive = 0;
  user.save();

  return user;
}

export function getOrCreateUserSnapshot(day: i32): UsageMetricsDailySnapshot {
  let snapshot = UsageMetricsDailySnapshot.load(day.toString());

  if (snapshot) {
    return snapshot;
  }

  snapshot = new UsageMetricsDailySnapshot(day.toString());

  snapshot.protocol = '';
  snapshot.activeUsers = 0;
  snapshot.totalUniqueUsers = 0;
  snapshot.dailyTransactionCount = 0;
  snapshot.blockNumber = BigInt.fromI32(0);
  snapshot.timestamp = BigInt.fromI32(0);
  snapshot.save();

  return snapshot;
}
