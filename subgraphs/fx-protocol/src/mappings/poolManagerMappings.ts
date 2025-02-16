import {
  getOrCreatePoolV2,
  initializeSDKFromEvent,
  updatePoolTVLV2,
} from "../common/initializers";
import * as constants from "../common/constants";
import { Address } from "@graphprotocol/graph-ts";
import { Harvest } from "../../generated/PoolManager/PoolManager";

export function handleHarvest(event: Harvest): void {
  const sdk = initializeSDKFromEvent(event);

  const pool = getOrCreatePoolV2(
    Address.fromString(constants.POOL_ADDRESS),
    sdk
  );

  updatePoolTVLV2(pool);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}
