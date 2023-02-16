import { Address, ethereum } from "@graphprotocol/graph-ts";
import { Account } from "../../generated/schema";
import {
  incrementProtocolUniqueBorrowers,
  incrementProtocolUniqueLiquidators,
  incrementProtocolUniqueLiquidatees,
  incrementProtocolUniqueUsers,
} from "./protocol";
import { EventType } from "./event";
import {
  BIGDECIMAL_ZERO,
  INT_ONE,
  INT_ZERO,
  PositionSide,
} from "../utils/constants";

export function getOrCreateAccount(
  event: ethereum.Event,
  address: Address
): Account {
  let account = Account.load(address);
  if (!account) {
    account = new Account(address);
    account.cumulativeEntryPremiumUSD = BIGDECIMAL_ZERO;
    account.cumulativeExitPremiumUSD = BIGDECIMAL_ZERO;
    account.cumulativeTotalPremiumUSD = BIGDECIMAL_ZERO;
    account.cumulativeDepositPremiumUSD = BIGDECIMAL_ZERO;
    account.cumulativeWithdrawPremiumUSD = BIGDECIMAL_ZERO;
    account.cumulativeTotalLiquidityPremiumUSD = BIGDECIMAL_ZERO;

    account.longPositionCount = INT_ZERO;
    account.shortPositionCount = INT_ZERO;
    account.openPositionCount = INT_ZERO;
    account.closedPositionCount = INT_ZERO;
    account.cumulativeUniqueLiquidatees = INT_ZERO;

    account._depositCount = INT_ZERO;
    account._borrowCount = INT_ZERO;
    account._liquidateCount = INT_ZERO;
    account._liquidationCount = INT_ZERO;

    account.save();

    incrementProtocolUniqueUsers(event);
  }
  return account;
}

export function incrementAccountOpenPositionCount(
  account: Account,
  positionSide: string
): void {
  if (PositionSide.LONG == positionSide) {
    account.longPositionCount += INT_ONE;
  } else {
    account.shortPositionCount += INT_ONE;
  }
  account.openPositionCount += INT_ONE;

  account.save();
}

export function decrementAccountOpenPositionCount(
  account: Account,
  positionSide: string
): void {
  if (PositionSide.LONG == positionSide) {
    account.longPositionCount -= INT_ONE;
  } else {
    account.shortPositionCount -= INT_ONE;
  }
  account.openPositionCount -= INT_ONE;
  account.closedPositionCount += INT_ONE;

  account.save();
}

export function incrementAccountEventCount(
  event: ethereum.Event,
  account: Account,
  eventType: EventType
): void {
  switch (eventType) {
    case EventType.Deposit:
      if (account._depositCount == INT_ZERO) {
        incrementProtocolUniqueLiquidatees(event);
      }
      account._depositCount += INT_ONE;
      break;
    case EventType.CollateralIn:
      if (account._borrowCount == INT_ZERO) {
        incrementProtocolUniqueBorrowers(event);
      }
      account._borrowCount += INT_ONE;
      break;
    case EventType.Liquidate:
      if (account._liquidateCount == INT_ZERO) {
        incrementProtocolUniqueLiquidators(event);
      }
      account._liquidateCount += INT_ONE;
      break;
    case EventType.Liquidated:
      if (account._liquidationCount == INT_ZERO) {
        incrementProtocolUniqueLiquidatees(event);
      }
      account._liquidationCount += INT_ONE;
      break;
    default:
      break;
  }

  account.save();
}
