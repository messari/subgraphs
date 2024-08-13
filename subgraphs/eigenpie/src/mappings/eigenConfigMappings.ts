import {
  getOrCreatePool,
  initializeSDKFromEvent,
} from "../common/initializers";
import {
  ReceiptTokenUpdated,
  AddedNewSupportedAsset,
} from "../../generated/EigenConfig/EigenConfig";

export function handleAddedNewSupportedAsset(
  event: AddedNewSupportedAsset
): void {
  const receiptAddress = event.params.receipt;

  const sdk = initializeSDKFromEvent(event);
  getOrCreatePool(receiptAddress, sdk);
}

export function handleReceiptTokenUpdated(event: ReceiptTokenUpdated): void {
  const receiptAddress = event.params.receipt;

  const sdk = initializeSDKFromEvent(event);
  getOrCreatePool(receiptAddress, sdk);
}
