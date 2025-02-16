import {
  updatePoolTVLV1,
  getOrCreatePoolV1,
  initializeSDKFromEvent,
  updatePoolOutputTokenSupplyV1,
} from "../common/initializers";
import { Harvest } from "../../generated/PoolManager/TreasuryV2";

export function handleHarvest(event: Harvest): void {
  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePoolV1(event.address, sdk);

  updatePoolOutputTokenSupplyV1(pool);
  updatePoolTVLV1(pool);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}
