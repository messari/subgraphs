import { NetworkConfigs } from "../../configurations/configure";

import { BIGINT_ZERO } from "../sdk/util/constants";

import { _FeePercentage } from "../../generated/schema";

export function getOrCreateFeePercentage(): _FeePercentage {
  let feePercentage = _FeePercentage.load(NetworkConfigs.getLSTAddress());
  if (!feePercentage) {
    feePercentage = new _FeePercentage(NetworkConfigs.getLSTAddress());
    feePercentage.nodeOperator = BIGINT_ZERO;
    feePercentage.treasury = BIGINT_ZERO;
  }
  return feePercentage;
}
