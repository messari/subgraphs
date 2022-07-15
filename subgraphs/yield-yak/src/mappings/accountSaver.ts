import { Address, BigInt, bigInt } from '@graphprotocol/graph-ts'

import { Account
  ,ActiveAccount} from '../../generated/schema'

import { ZERO_BIGINT } from "./utils/constants";



export function defineAccount(accountAddress: Address): BigInt {
    let checker = ZERO_BIGINT;
    let account = Account.load(accountAddress.toHexString());
    if (account == null) {
      account = new Account(accountAddress.toHexString());
      checker = bigInt.fromString("1");
    }
    return checker;
  }
  
  export function defineActiveAccount(accountAddress: Address, 
    timestamp: BigInt, 
    check: string): BigInt {
    let checker = ZERO_BIGINT;
    let dailyActive = ZERO_BIGINT;
    let hourlyActive = ZERO_BIGINT;
    let daysFromStart = timestamp.toI32() / 24 / 60 / 60
    let accountDaily = ActiveAccount.load(accountAddress.toHexString().concat("-").concat(daysFromStart.toString()));
    if (accountDaily == null) {
      accountDaily = new ActiveAccount(accountAddress.toHexString().concat("-").concat(daysFromStart.toString()));
      dailyActive = bigInt.fromString("1");
    }
    let hourInDay = (timestamp.toI32() - daysFromStart * 24 * 60 * 60) / 60 / 60
    let accountHourly = ActiveAccount.load(accountAddress.toHexString().concat("-").concat(daysFromStart.toString()).concat("-").concat(hourInDay.toString()));
    if (accountHourly == null) {
      accountHourly = new ActiveAccount(accountAddress.toHexString().concat("-").concat(daysFromStart.toString()).concat("-").concat(hourInDay.toString()));
      hourlyActive = bigInt.fromString("1");
    }
    
    if (check == "d" && dailyActive == bigInt.fromString("1")) {
      checker = bigInt.fromString("1");
    } else if (check == "h" && hourlyActive == bigInt.fromString("1")){
      checker = bigInt.fromString("1");
    }
    return checker;
  }