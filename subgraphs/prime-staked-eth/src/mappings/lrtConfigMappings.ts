import {
  getOrCreatePool,
  initializeSDKFromEvent,
} from "../common/initializers";
import { AddedNewSupportedAsset } from "../../generated/LRTConfig/LRTConfig";

export function handleAddedNewSupportedAsset(
  event: AddedNewSupportedAsset
): void {
  const receiptAddress = event.params.asset;

  const sdk = initializeSDKFromEvent(event);
  getOrCreatePool(receiptAddress, sdk);
}
