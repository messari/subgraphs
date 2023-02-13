import {
  Deposit,
  Withdraw,
  CollateralIn,
  ActiveAccount,
  Account as AccountSchema,
  Position as PerpetualPosition,
} from "../../../../generated/schema";
import { Perpetual } from "./protocol";
import { TokenManager } from "./tokens";
import * as constants from "../../util/constants";
import { Address, Bytes } from "@graphprotocol/graph-ts";
import { CustomEventType, getUnixDays, getUnixHours } from "../../util/events";

export class AccountManager {
  protocol: Perpetual;
  tokens: TokenManager;

  constructor(protocol: Perpetual, tokens: TokenManager) {
    this.protocol = protocol;
    this.tokens = tokens;
  }

  loadAccount(address: Address): Account {
    let account = AccountSchema.load(address);
    if (!account) {
      account = new AccountSchema(address);

      account.cumulativeEntryPremiumUSD = constants.BIGDECIMAL_ZERO;
      account.cumulativeExitPremiumUSD = constants.BIGDECIMAL_ZERO;
      account.cumulativeTotalPremiumUSD = constants.BIGDECIMAL_ZERO;

      account.cumulativeDepositPremiumUSD = constants.BIGDECIMAL_ZERO;
      account.cumulativeWithdrawPremiumUSD = constants.BIGDECIMAL_ZERO;
      account.cumulativeTotalLiquidityPremiumUSD = constants.BIGDECIMAL_ZERO;

      account.longPositionCount = 0;
      account.shortPositionCount = 0;
      account.openPositionCount = 0;
      account.closedPositionCount = 0;
      account.cumulativeUniqueLiquidatees = 0;

      account.save();
      this.protocol.addUser();
    }
    return new Account(this.protocol, account, this.tokens);
  }
}

export class AccountWasActive {
  hourly: boolean;
  daily: boolean;
}

export class Account {
  account: AccountSchema;
  event: CustomEventType;
  protocol: Perpetual;
  tokens: TokenManager;

  constructor(
    protocol: Perpetual,
    account: AccountSchema,
    tokens: TokenManager
  ) {
    this.account = account;
    this.protocol = protocol;
    this.tokens = tokens;
    this.event = protocol.getCurrentEvent();
  }

  deposit(): Deposit {
    // " deposit-{ Transaction hash }-{ Log index } "
    const depositId = Bytes.empty();
    let deposit = new Deposit(depositId);

    deposit.hash;
    deposit.logIndex;
    deposit.protocol;
    deposit.to;
    deposit.from;
    deposit.account;
    deposit.blockNumber;
    deposit.timestamp;
    deposit.inputTokens;
    deposit.outputToken;
    deposit.inputTokenAmounts;
    deposit.outputTokenAmount;
    deposit.amountUSD;
    deposit.pool;

    return deposit;
  }

  withdraw(): Withdraw {
    // " withdraw-{ Transaction hash }-{ Log index } "
    const withdrawId = Bytes.empty();
    let withdraw = new Withdraw(withdrawId);

    withdraw.hash;
    withdraw.logIndex;
    withdraw.protocol;
    withdraw.to;
    withdraw.from;
    withdraw.account;
    withdraw.blockNumber;
    withdraw.timestamp;
    withdraw.inputTokens;
    withdraw.outputToken;
    withdraw.inputTokenAmounts;
    withdraw.outputTokenAmount;
    withdraw.amountUSD;
    withdraw.pool;

    return withdraw;
  }

  collateralIn(): CollateralIn {
    // " deposit-{ Transaction hash }-{ Log index } "

    const collateralId = Bytes.empty();
    let withdraw = new CollateralIn(collateralId);

    withdraw.hash;
    withdraw.logIndex;
    withdraw.protocol;
    withdraw.to;
    withdraw.from;
    withdraw.account;
    withdraw.blockNumber;
    withdraw.timestamp;
    withdraw.inputTokens;
    withdraw.outputToken;
    withdraw.inputTokenAmounts;
    withdraw.outputTokenAmount;
    withdraw.amountUSD;
    withdraw.pool;

    return deposit;
  }
}
