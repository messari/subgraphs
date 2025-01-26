import { initializeSDKFromEvent } from "../common/initializers";
import { Pool as PoolTemplate } from "../../generated/templates";
import { RegisterPool, Harvest } from "../../generated/PoolManager/PoolManager";

export function handleHarvest(event: Harvest): void {
  const sdk = initializeSDKFromEvent(event);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}

export function handleRegisterPool(event: RegisterPool): void {
  PoolTemplate.create(event.params.pool);
}
