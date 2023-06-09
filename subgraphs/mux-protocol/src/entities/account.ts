import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Account, LiquidityPool } from "../../generated/schema";
import {
  incrementPoolUniqueUsers,
  incrementPoolUniqueDepositors,
  incrementPoolUniqueBorrowers,
  incrementPoolUniqueLiquidators,
  incrementPoolUniqueLiquidatees,
} from "./pool";
import { EventType } from "./event";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ONE,
  INT_ZERO,
  PositionSide,
} from "../utils/constants";

export function getOrCreateAccount(
  event: ethereum.Event,
  pool: LiquidityPool,
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

    account.depositCount = INT_ZERO;
    account.withdrawCount = INT_ZERO;
    account.borrowCount = INT_ZERO;
    account.collateralInCount = INT_ZERO;
    account.collateralOutCount = INT_ZERO;
    account.liquidateCount = INT_ZERO;
    account.liquidationCount = INT_ZERO;
    account.swapCount = INT_ZERO;

    account.save();

    incrementPoolUniqueUsers(event, pool);
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
  pool: LiquidityPool,
  account: Account,
  eventType: EventType,
  sizeDelta: BigInt
): void {
  switch (eventType) {
    case EventType.Deposit:
      if (account.depositCount == INT_ZERO) {
        incrementPoolUniqueDepositors(event, pool);
      }
      account.depositCount += INT_ONE;
      break;
    case EventType.Withdraw:
      account.withdrawCount += INT_ONE;
      break;
    case EventType.CollateralIn:
      account.collateralInCount += INT_ONE;
      if (sizeDelta > BIGINT_ZERO) {
        if (account.borrowCount == INT_ZERO) {
          incrementPoolUniqueBorrowers(event, pool);
        }
        account.borrowCount += INT_ONE;
      }
      break;
    case EventType.CollateralOut:
      account.collateralOutCount += INT_ONE;
      break;
    case EventType.Liquidate:
      if (account.liquidateCount == INT_ZERO) {
        incrementPoolUniqueLiquidators(event, pool);
      }
      account.liquidateCount += INT_ONE;
      break;
    case EventType.Liquidated:
      if (account.liquidationCount == INT_ZERO) {
        incrementPoolUniqueLiquidatees(event, pool);
      }
      account.liquidationCount += INT_ONE;
    case EventType.Swap:
      account.swapCount += INT_ONE;
      break;
    default:
      break;
  }

  account.save();
}
