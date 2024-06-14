import { initializeSDKFromEvent } from "../common/initializers";
import { Deposited } from "../../generated/StakingPoolManager/StakingPoolManager";

export function handleDeposited(event: Deposited): void {
  const sender = event.params.caller;
  const sdk = initializeSDKFromEvent(event);

  const account = sdk.Accounts.loadAccount(sender);
  account.trackActivity();
}
