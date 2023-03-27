import { Address, ethereum } from "@graphprotocol/graph-ts";
import { Account, Option } from "../../generated/schema";
import { BIGDECIMAL_ZERO, INT_ZERO, OptionType } from "../common/constants";
import {
  decrementPoolPositionCount,
  incrementPoolExercisedCount,
  incrementPoolMintedCount,
  incrementPoolPositionCount,
} from "./pool";
import { incrementProtocolUniqueUsers } from "./protocol";
import { incrementProtocolTakerCount } from "./usage";

export function getOrCreateAccount(address: Address): Account {
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
    account.putsMintedCount = INT_ZERO;
    account.callsMintedCount = INT_ZERO;
    account.contractsMintedCount = INT_ZERO;
    account.contractsTakenCount = INT_ZERO;
    account.contractsExpiredCount = INT_ZERO;
    account.contractsExercisedCount = INT_ZERO;
    account.contractsClosedCount = INT_ZERO;
    account.save();
    incrementProtocolUniqueUsers();
  }
  return account;
}

export function incrementAccountPositionCount(
  event: ethereum.Event,
  account: Account,
  option: Option
): void {
  account.openPositionCount += 1;
  account.contractsTakenCount += 1;
  account.save();
  incrementPoolPositionCount(event, option);
  incrementProtocolTakerCount(event, account);
}

export function decrementAccountPositionCount(
  event: ethereum.Event,
  account: Account,
  option: Option
): void {
  account.openPositionCount -= 1;
  account.closedPositionCount += 1;
  account.contractsClosedCount += 1;
  account.save();
  decrementPoolPositionCount(event, option);
}

export function incrementAccountMintedCount(
  event: ethereum.Event,
  account: Account,
  option: Option
): void {
  if (option.type == OptionType.CALL) {
    account.callsMintedCount += 1;
  } else {
    account.putsMintedCount += 1;
  }
  account.contractsMintedCount += 1;
  account.save();
  incrementPoolMintedCount(event, option);
}

export function incrementAccountExercisedCount(
  event: ethereum.Event,
  account: Account,
  option: Option
): void {
  account.contractsExercisedCount += 1;
  account.save();
  incrementPoolExercisedCount(event, option);
}
