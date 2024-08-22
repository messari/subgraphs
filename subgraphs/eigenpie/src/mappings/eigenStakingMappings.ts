import {
  updatePoolTVL,
  getOrCreatePool,
  initializeSDKFromEvent,
  updatePoolOutputTokenSupply,
} from "../common/initializers";
import {
  AssetDeposit,
  AssetDeposit1 as AssetDepositWithoutMintAmount,
} from "../../generated/EigenStaking/EigenStaking";
import { getReceiptByAsset } from "../common/utils";

export function handleAssetDeposit(event: AssetDeposit): void {
  const assetAddress = event.params.asset;
  const receiptAddress = getReceiptByAsset(assetAddress);

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(receiptAddress, sdk);

  updatePoolOutputTokenSupply(pool);
  updatePoolTVL(pool);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}

export function handleAssetDepositWithoutMintAmount(
  event: AssetDepositWithoutMintAmount
): void {
  const assetAddress = event.params.asset;
  const receiptAddress = getReceiptByAsset(assetAddress);

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(receiptAddress, sdk);

  updatePoolOutputTokenSupply(pool);
  updatePoolTVL(pool);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}
