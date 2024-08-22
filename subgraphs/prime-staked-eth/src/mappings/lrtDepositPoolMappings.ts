import {
  updatePoolTVL,
  getOrCreatePool,
  initializeSDKFromEvent,
} from "../common/initializers";
import {
  AssetDeposit,
  AssetSwapped,
  WithdrawalClaimed,
} from "../../generated/LRTDepositPool/LRTDepositPool";

export function handleAssetDeposit(event: AssetDeposit): void {
  const assetAddress = event.params.asset;

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(assetAddress, sdk);

  updatePoolTVL(pool);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}

export function handleAssetSwapped(event: AssetSwapped): void {
  const toAssetAddress = event.params.toAsset;
  const fromAssetAddress = event.params.fromAsset;

  const sdk = initializeSDKFromEvent(event);
  const toAssetPool = getOrCreatePool(toAssetAddress, sdk);
  updatePoolTVL(toAssetPool);

  const fromAssetPool = getOrCreatePool(fromAssetAddress, sdk);
  updatePoolTVL(fromAssetPool);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}

export function handleWithdrawalClaimed(event: WithdrawalClaimed): void {
  const assetAddress = event.params.asset;

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(assetAddress, sdk);

  updatePoolTVL(pool);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}
