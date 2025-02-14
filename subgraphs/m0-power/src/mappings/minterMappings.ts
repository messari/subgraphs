import {
  updatePoolTVL,
  getOrCreatePool,
  initializeSDKFromEvent,
  updatePoolOutputTokenSupply,
} from "../common/initializers";
import * as constants from "../common/constants";
import { Address } from "@graphprotocol/graph-ts";
import { CollateralUpdated } from "../../generated/Minter/Minter";

export function handleCollateralUpdated(event: CollateralUpdated): void {
  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(Address.fromString(constants.Protocol.ID), sdk);

  updatePoolOutputTokenSupply(pool);
  updatePoolTVL(pool, event.params.collateral);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}
