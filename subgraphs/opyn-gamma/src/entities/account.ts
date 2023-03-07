import { Address } from "@graphprotocol/graph-ts";
import { Account } from "../../generated/schema";
import { BIGDECIMAL_ZERO, INT_ZERO } from "../common/constants";
import { incrementProtocolUniqueUsers } from "./protocol";

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

export function incrementAccountPositionCount(account: Account): void {
  account.openPositionCount += 1;
  account.save();
}
