import { Address, ethereum } from "@graphprotocol/graph-ts";
import { Account } from "../../generated/schema";
import { EventType } from "./event";
import { BIGDECIMAL_ZERO, INT_ONE, INT_ZERO } from "../utils/constants";
import {
  incrementProtocolUniqueLP,
  incrementProtocolUniqueTakers,
  incrementProtocolUniqueUsers,
} from "./protocol";

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

    account.openPositionCount = INT_ZERO;
    account.closedPositionCount = INT_ZERO;
    account.callsMintedCount = INT_ZERO;
    account.putsMintedCount = INT_ZERO;
    account.contractsMintedCount = INT_ZERO;
    account.contractsTakenCount = INT_ZERO;
    account.contractsExpiredCount = INT_ZERO;
    account.contractsExercisedCount = INT_ZERO;
    account.contractsClosedCount = INT_ZERO;

    account.save();

    incrementProtocolUniqueUsers(event);
  }
  return account;
}

export function updateAccountOpenPositionCount(
  account: Account,
  isIncrease: boolean
): void {
  if (isIncrease) {
    account.openPositionCount += INT_ONE;
  } else {
    account.openPositionCount -= INT_ONE;
    account.closedPositionCount += INT_ONE;
  }

  account.save();
}

export function incrementAccountEventCount(
  event: ethereum.Event,
  account: Account,
  eventType: EventType,
  _isPut: boolean
): void {
  switch (eventType) {
    case EventType.Deposit:
      if (account.contractsMintedCount == INT_ZERO) {
        incrementProtocolUniqueLP(event);
      }
      if (_isPut) {
        account.putsMintedCount += INT_ONE;
      } else {
        account.callsMintedCount += INT_ONE;
      }
      account.contractsMintedCount += INT_ONE;
      break;
    case EventType.Withdraw:
      account.contractsExpiredCount += INT_ONE;
      account.contractsClosedCount += INT_ONE;
      break;
    case EventType.Purchase:
      if (account.contractsTakenCount == INT_ZERO) {
        incrementProtocolUniqueTakers(event);
      }
      account.contractsTakenCount += INT_ONE;
      break;
    case EventType.Settle:
      account.contractsExercisedCount += INT_ONE;
      break;
    default:
      break;
  }

  account.save();
}
