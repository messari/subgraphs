import { Address } from "@graphprotocol/graph-ts";
import { _User as User } from "../../generated/schema";

export function getOrCreateUser(id: Address): User {
  let user = User.load(id.toHex());

  if (user) {
    return user;
  }

  user = new User(id.toHex());
  user.lastDayActive = 0;
  user.save();

  return user;
}
