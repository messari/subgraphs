import {
  GoListed,
  NoListed,
} from "../../generated/GoldfinchConfig/GoldfinchConfig";
import { AddressUpdated } from "../../generated/GoldfinchConfig/GoldfinchConfig";
import { BIGINT_ONE } from "../common/constants";
import { getOrInitUser } from "../entities/user";

export function handleGoListed(event: GoListed): void {
  const user = getOrInitUser(event.params.member);
  user.isGoListed = true;
  user.save();
}

export function handleNoListed(event: NoListed): void {
  const user = getOrInitUser(event.params.member);
  user.isGoListed = false;
  user.save();
}

export function handleAddressUpdated(event: AddressUpdated): void {
  // TODO update CreditLine related fields when  address is updated
  // Need a reverse mapping of config to market/pool
  // see ConfigOptions.sol for index
  if (event.params.index.equals(BIGINT_ONE)) {
  }
}
