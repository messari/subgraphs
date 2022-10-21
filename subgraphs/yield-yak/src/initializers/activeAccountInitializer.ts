import { Address, BigInt, bigInt } from "@graphprotocol/graph-ts";
import { ZERO_BIGINT } from "../helpers/constants";
import { ActiveAccount } from "../../generated/schema";

export function initActiveAccount(
  accountAddress: Address,
  timestamp: BigInt,
  check: string
): BigInt {
  let dailyActive = ZERO_BIGINT;
  const daysFromStart = timestamp.toI32() / 24 / 60 / 60
  let accountDaily = ActiveAccount.load(accountAddress.toHexString()
    .concat("-")
    .concat(daysFromStart.toString()));

  if (accountDaily == null) {
    accountDaily = new ActiveAccount(accountAddress
      .toHexString()
      .concat("-")
      .concat(daysFromStart.toString()));
    dailyActive = bigInt.fromString("1");
  }

  const hourInDay = (timestamp.toI32() - daysFromStart * 24 * 60 * 60) / 60 / 60

  let hourlyActive = ZERO_BIGINT;
  let accountHourly = ActiveAccount.load(accountAddress.toHexString()
    .concat("-")
    .concat(daysFromStart.toString())
    .concat("-")
    .concat(hourInDay.toString()));

  if (accountHourly == null) {
    accountHourly = new ActiveAccount(accountAddress.toHexString()
      .concat("-")
      .concat(daysFromStart.toString())
      .concat("-")
      .concat(hourInDay.toString()));
    hourlyActive = bigInt.fromString("1");
  }

  let checker = ZERO_BIGINT;

  if (check == "d" && dailyActive == bigInt.fromString("1")) {
    checker = bigInt.fromString("1");
  } else if (check == "h" && hourlyActive == bigInt.fromString("1")) {
    checker = bigInt.fromString("1");
  }

  return checker;
}