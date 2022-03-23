import { BigDecimal } from '@graphprotocol/graph-ts';
import {
  LendingProtocol,
  Market,
  UsageMetricsDailySnapshot,
} from '../../generated/schema';
import {
  Deposit,
  Withdraw,
} from '../../generated/templates/AffiliateSettVault/BadgerAffiliateSett';
import { getOrCreateMarket, getOrCreateProtocol } from '../entities/Market';
import { getOrCreateToken } from '../entities/Token';
import { getOrCreateDeposit, getOrCreateWithdraw } from '../entities/Transaction';
import { getOrCreateUser, getOrCreateUserSnapshot } from '../entities/User';
import { getDay } from '../utils/numbers';
import { updateUsageMetrics } from './common';

export function handleDeposit(event: Deposit): void {
  let user = getOrCreateUser(event.params.account);
  let protocol = getOrCreateProtocol();
  let metrics = getOrCreateUserSnapshot(getDay(event.block.timestamp));
  let market = getOrCreateMarket(event.address, event.block);
  let token = getOrCreateToken(event.address);

  updateUsageMetrics(user, protocol, metrics, event.block);
  updateProtocol(protocol, market, metrics);

  let deposit = getOrCreateDeposit(event.transaction.hash, event.logIndex);
  deposit.protocol = protocol.id;
  deposit.to = event.address.toHex(); // TODO: need verification
  deposit.from = user.id;
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.market = market.id;
  deposit.asset = token.id;
  deposit.amount = event.params.amount.toBigDecimal();
  deposit.amountUSD = BigDecimal.zero(); // TODO: cal
  deposit.save();
}

export function handleWithdraw(event: Withdraw): void {
  let user = getOrCreateUser(event.params.account);
  let protocol = getOrCreateProtocol();
  let metrics = getOrCreateUserSnapshot(getDay(event.block.timestamp));
  let market = getOrCreateMarket(event.address, event.block);
  let token = getOrCreateToken(event.address);

  updateUsageMetrics(user, protocol, metrics, event.block);
  updateProtocol(protocol, market, metrics);

  let withdraw = getOrCreateWithdraw(event.transaction.hash, event.logIndex);
  withdraw.protocol = protocol.id;
  withdraw.to = event.params.account.toHex();
  withdraw.from = event.address.toHex();
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.market = market.id;
  withdraw.asset = token.id;
  withdraw.amount = event.params.amount.toBigDecimal();
  withdraw.amountUSD = BigDecimal.zero(); // TODO: cal
  withdraw.save();
}

function updateProtocol(
  protocol: LendingProtocol,
  market: Market,
  metrics: UsageMetricsDailySnapshot,
): void {
  if (protocol.markets.indexOf(market.id) === -1) {
    protocol.markets.concat([market.id]);
  }

  if (protocol.usageMetrics.indexOf(metrics.id) === -1) {
    protocol.usageMetrics = protocol.usageMetrics.concat([metrics.id]);
  }

  protocol.save();
}
