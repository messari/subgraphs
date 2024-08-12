import {
  updatePoolTVL,
  getOrCreatePool,
  initializeSDKFromEvent,
  updatePoolOutputTokenSupply,
} from "../common/initializers";
import { getReceiptByAsset } from "../common/utils";
import { AssetDeposit } from "../../generated/EigenStaking/EigenStaking";

export function handleAssetDeposit(event: AssetDeposit): void {
  const assetAddress = event.params.asset;
  const receiptAddress = getReceiptByAsset(assetAddress);

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(receiptAddress, sdk);

  updatePoolTVL(pool, assetAddress);
  updatePoolOutputTokenSupply(pool);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}
