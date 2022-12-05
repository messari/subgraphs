import { Address, ethereum } from "@graphprotocol/graph-ts";
import { Account, ActiveAccount } from "../../../generated/schema";

class AccountActivity {
  isNew: boolean;
  isFirstHourlyActivity: boolean;
  isFirstDailyActivity: boolean;
  account: Account;
}

export class Accounts {
  public static storeAccount(
    account: Address,
    event: ethereum.Event
  ): AccountActivity {
    let isNew = false;
    let acc = Account.load(account.toHexString());
    if (!acc) {
      acc = new Account(account.toHexString());
      acc.save();
      isNew = true;
    }

    const activity = Accounts.registerActivity(account, event);
    activity.isNew = isNew;
    return activity;
  }

  public static registerActivity(
    account: Address,
    event: ethereum.Event
  ): AccountActivity {
    // { daily/hourly }-{ Address of the account }-{ Days/hours since Unix epoch }
    const dailyId = `daily-${account.toHexString()}-${
      event.block.timestamp.toI32() / 86400
    }`;
    const hourlyId = `hourly-${account.toHexString()}-${
      event.block.timestamp.toI32() / 3600
    }`;

    let isFirstDailyActivity = false;
    let isFirstHourlyActivity = false;
    const daily = ActiveAccount.load(dailyId);
    const hourly = ActiveAccount.load(hourlyId);
    if (!daily) {
      new ActiveAccount(dailyId).save();
      isFirstDailyActivity = true;
    }
    if (!hourly) {
      new ActiveAccount(hourlyId).save();
      isFirstHourlyActivity = true;
    }

    return {
      isNew: false,
      isFirstDailyActivity,
      isFirstHourlyActivity,
    };
  }
}
