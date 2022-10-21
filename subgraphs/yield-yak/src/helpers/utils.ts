import { Address, BigInt, bigInt } from "@graphprotocol/graph-ts";
import { Account } from "../../generated/schema";
import { ZERO_BIGINT } from "./constants";

export function isUserAccountUniq(accountAddress: Address): BigInt {
  let isUnique = ZERO_BIGINT;
  let account = Account.load(accountAddress.toHexString());

  if (account == null) {
    account = new Account(accountAddress.toHexString());
    isUnique = bigInt.fromString("1");
  }

  return isUnique;
}