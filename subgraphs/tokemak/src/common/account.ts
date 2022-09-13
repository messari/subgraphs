import { Account } from "../../generated/schema";
import { getOrCreateProtocol } from "./protocol";

export function getOrCreateAccount(id: string): Account {
  let account = Account.load(id);

  if (!account) {
    account = new Account(id);
    account.save();

    const protocol = getOrCreateProtocol();
    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }

  return account;
}
