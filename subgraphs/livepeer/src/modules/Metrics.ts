import { initializeSDK } from "../common/initializers";
import { Address, ethereum } from "@graphprotocol/graph-ts";

export function trackUsageMetrics(
  address: Address,
  event: ethereum.Event
): void {
  const sdk = initializeSDK(event);
  sdk.Accounts.loadAccount(address).trackActivity();
}
