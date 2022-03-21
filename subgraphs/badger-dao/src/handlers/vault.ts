import { BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { LendingProtocol, UsageMetricsDailySnapshot, User } from '../../generated/schema';
import { Deposit } from '../../generated/templates/AffiliateSettVault/BadgerAffiliateSett';
import { getOrCreateMarket, getOrCreateProtocol } from '../entities/Market';
import { getOrCreateDeposit } from '../entities/Transaction';
import { getOrCreateUser, getOrCreateUserSnapshot } from '../entities/User';
import { getDay } from '../utils/numbers';

export function handleDeposit(event: Deposit): void {
  let user = getOrCreateUser(event.params.account);
  let protocol = getOrCreateProtocol(event.address);
  let usageMetrics = getOrCreateUserSnapshot(getDay(event.block.timestamp));

  updateUsageMetrics(user, protocol, usageMetrics, event.block);

  let deposit = getOrCreateDeposit(event.transaction.hash, event.logIndex);
  deposit.protocol = protocol.id;
  deposit.to = event.address.toHex(); // TODO: need verification
  deposit.from = user.id;
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.market = getOrCreateMarket(
    event.address,
    event.block.timestamp,
    event.block.number,
  ).id;
  deposit.asset = ''; // TODO: missing ?
  deposit.amount = event.params.amount.toBigDecimal();
  deposit.amountUSD = BigDecimal.zero(); // TODO: cal
  deposit.save();
}

function updateUsageMetrics(
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
