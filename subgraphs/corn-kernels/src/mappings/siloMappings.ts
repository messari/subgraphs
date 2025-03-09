import { updatePoolTVL, initializeSDKFromEvent } from "../common/initializers";
import {
  TokenDeposited,
  TokenWithdrawn,
} from "../../generated/CornSiloV1/CornSilo";

export function handleTokenDeposited(event: TokenDeposited): void {
  const sdk = initializeSDKFromEvent(event);

  updatePoolTVL(sdk, event.params.token, event.params.assets);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}

export function handleTokenWithdrawn(event: TokenWithdrawn): void {
  const sdk = initializeSDKFromEvent(event);

  updatePoolTVL(sdk, event.params.token, event.params.assets.neg());

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}
