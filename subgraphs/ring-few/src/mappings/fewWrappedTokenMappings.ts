import {
  updatePoolTVL,
  getOrCreatePool,
  initializeSDKFromEvent,
  updatePoolOutputTokenSupply,
} from "../common/initializers";
import {
  Mint,
  Burn,
} from "../../generated/templates/FewWrappedToken/FewWrappedToken";

export function handleMint(event: Mint): void {
  const sender = event.params.minter;

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  updatePoolOutputTokenSupply(pool);
  updatePoolTVL(pool);

  const account = sdk.Accounts.loadAccount(sender);
  account.trackActivity();
}

export function handleBurn(event: Burn): void {
  const sender = event.params.burner;

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  updatePoolOutputTokenSupply(pool);
  updatePoolTVL(pool);

  const account = sdk.Accounts.loadAccount(sender);
  account.trackActivity();
}
