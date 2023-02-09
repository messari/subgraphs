import { Address, Bytes } from "@graphprotocol/graph-ts";
import {
  Account as AccountSchema,
  ActiveAccount,
} from "../../../../generated/schema";
import { ProtocolManager } from "./protocol";
import { TokenManager } from "./tokens";
import { CustomEventType, getUnixDays, getUnixHours } from "../../util/events";

export class AccountManager {
  protocol: ProtocolManager;
  tokens: TokenManager;

  constructor(protocol: ProtocolManager, tokens: TokenManager) {
    this.protocol = protocol;
    this.tokens = tokens;
  }

  loadAccount(address: Address): Account {
    let acc = AccountSchema.load(address);
    if (acc) {
      return new Account(this.protocol, acc, this.tokens);
    }

    acc = new AccountSchema(address);
    acc.save();

    this.protocol.addUser();

    return new Account(this.protocol, acc, this.tokens);
  }
}

export class AccountWasActive {
  hourly: boolean;
  daily: boolean;
}

export class Account {
  account: AccountSchema;
  event: CustomEventType;
  protocol: ProtocolManager;
  tokens: TokenManager;

  constructor(
    protocol: ProtocolManager,
    account: AccountSchema,
    tokens: TokenManager
  ) {
    this.account = account;
    this.protocol = protocol;
    this.event = protocol.getCurrentEvent();
    this.tokens = tokens;
  }

  trackActivity(): void {
    const days = getUnixDays(this.event.block);
    const hours = getUnixHours(this.event.block);

    const generalHourlyID = `${this.account.id.toHexString()}-hourly-${hours}`;
    const generalDailyID = `${this.account.id.toHexString()}-daily-${days}`;

    const generalActivity: AccountWasActive = {
      daily: this.isActiveByActivityID(generalDailyID),
      hourly: this.isActiveByActivityID(generalHourlyID),
    };

    this.protocol.addActiveUser(generalActivity);
  }

  private isActiveByActivityID(id: string): boolean {
    const _id = Bytes.fromUTF8(id);
    const dAct = ActiveAccount.load(_id);
    if (!dAct) {
      new ActiveAccount(_id).save();
      return true;
    }
    return false;
  }
}
