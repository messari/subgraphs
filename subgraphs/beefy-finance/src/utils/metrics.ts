import { bigInt, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { time } from "console";
import {
  Deposit,
  UsageMetricsDailySnapshot,
  Vault,
  Withdraw,
  YieldAggregator,
} from "../../generated/schema";
import { BIGINT_ZERO } from "../prices/common/constants";
import { getDaysSinceEpoch, getHoursSinceEpoch } from "./time";

export function getProtocolDailyId(
  block: ethereum.Block,
  protocol: YieldAggregator
): string {
  const daysSinceEpoch = getDaysSinceEpoch(block.timestamp.toI32());
  const id = protocol.id.concat("-").concat(daysSinceEpoch);
  return id;
}

export function getProtocolHourlyId(
  block: ethereum.Block,
  protocol: YieldAggregator
): string {
  const daysSinceEpoch = getHoursSinceEpoch(block.timestamp.toI32());
  const id = protocol.id.concat("-").concat(daysSinceEpoch);
  return id;
}

export function updateUsageMetricsDailySnapshot(
  block: ethereum.Block,
  protocol: YieldAggregator
): UsageMetricsDailySnapshot {
  const id = getProtocolDailyId(block, protocol);
  let protocolDailySnapshot = UsageMetricsDailySnapshot.load(id);
  if (protocolDailySnapshot == null) {
    protocolDailySnapshot = new UsageMetricsDailySnapshot(id);
    protocolDailySnapshot.protocol = protocol.id;
  }
  protocolDailySnapshot.dailyActiveUsers = getUniqueUsers(protocol, [
    beginDayTimestamp,
    timestamp,
  ]);
  protocolDailySnapshot.cumulativeUniqueUsers = getUniqueUsers(protocol, [
    0,
    timestamp,
  ]);
  protocolDailySnapshot.dailyTransactionCount = getDailyTransactionCount();
  protocolDailySnapshot.dailyDepositCount = getDailyDepositCount();
  protocolDailySnapshot.dailyWithdrawCount = getDailyWithdrawCount();
  protocolDailySnapshot.blockNumber = block.number;
  protocolDailySnapshot.timestamp = block.timestamp;
  protocolDailySnapshot.save();

  return protocolDailySnapshot;
}

function getUniqueUsers(
  protocol: YieldAggregator,
  timeframe: BigInt[]
): BigInt {
  let vault, deposit, user;
  let users: string[] = [];
  for (let i = 0; i < protocol.vaults.length; i++) {
    vault = Vault.load(protocol.vaults[i]); //already initialized if are in vaults field
    if (vault == null) {
      continue;
    } else {
      for (let j = 0; j < vault.deposits.length; j++) {
        deposit = Deposit.load(vault.deposits[j]);
        if (deposit == null) {
          continue;
        } else if (
          deposit.timestamp >= timeframe[0] &&
          deposit.timestamp <= timeframe[1]
        ) {
          user = deposit.from;
          for (let k = 0; k < users.length; k++) {
            if (users[k] == user) {
              break;
            }
            if (k == users.length - 1) {
              users.push(user);
            }
          }
        }
      }
    }
  }
  return new BigInt(users.length);
}

function getDepositCount(
  protocol: YieldAggregator,
  timeframe: BigInt[]
): BigInt {
  let vault, deposit;
  let count = BIGINT_ZERO;
  for (let i = 0; i < protocol.vaults.length; i++) {
    vault = Vault.load(protocol.vaults[i]); //already initialized if are in vaults field
    if (vault == null) {
      continue;
    } else {
      for (let j = 0; j < vault.deposits.length; j++) {
        deposit = Deposit.load(vault.deposits[j]);
        if (deposit == null) {
          continue;
        } else if (
          deposit.timestamp >= timeframe[0] &&
          deposit.timestamp <= timeframe[1]
        ) {
          count = count.plus(BigInt.fromI32(1));
        }
      }
    }
  }
  return count;
}

function getWithdrawCount(
  protocol: YieldAggregator,
  timeframe: BigInt[]
): BigInt {
  let vault, withdraw;
  let count = BIGINT_ZERO;
  for (let i = 0; i < protocol.vaults.length; i++) {
    vault = Vault.load(protocol.vaults[i]); //already initialized if are in vaults field
    if (vault == null) {
      continue;
    } else {
      for (let j = 0; j < vault.withdraws.length; j++) {
        withdraw = Withdraw.load(vault.withdraws[j]);
        if (withdraw == null) {
          continue;
        } else if (
          withdraw.timestamp >= timeframe[0] &&
          withdraw.timestamp <= timeframe[1]
        ) {
          count = count.plus(BigInt.fromI32(1));
        }
      }
    }
  }
  return count;
}

function getTransactionCount(
  protocol: YieldAggregator,
  timeframe: BigInt[]
): BigInt {
  return getDepositCount(protocol, timeframe).plus(
    getWithdrawCount(protocol, timeframe)
  );
}
