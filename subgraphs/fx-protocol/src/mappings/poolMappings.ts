import {
  updatePoolTVLV2,
  getOrCreatePoolV2,
  initializeSDKFromEvent,
} from "../common/initializers";
import { PositionSnapshot } from "../../generated/PoolManager/Pool";

export function handlePositionSnapshot(event: PositionSnapshot): void {
  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePoolV2(event.address, sdk);

  updatePoolTVLV2(pool);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}
