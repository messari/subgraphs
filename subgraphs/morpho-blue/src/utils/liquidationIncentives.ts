import { BigInt } from "@graphprotocol/graph-ts";

import { mulDivDown } from "../maths/maths";
import { BIGINT_WAD } from "../sdk/constants";

const MAX_LIQUIDATION_INCENTIVE_FACTOR = BigInt.fromString(
  "1150000000000000000" // 1.15
);
const LIQUIDATION_CURSOR = BigInt.fromString("300000000000000000"); // 0.3

export function getLiquidationIncentiveFactor(lltv: BigInt): BigInt {
  const val = mulDivDown(
    BIGINT_WAD,
    BIGINT_WAD,
    BIGINT_WAD.minus(
      mulDivDown(LIQUIDATION_CURSOR, BIGINT_WAD.minus(lltv), BIGINT_WAD)
    )
  );
  if (val.gt(MAX_LIQUIDATION_INCENTIVE_FACTOR)) {
    return MAX_LIQUIDATION_INCENTIVE_FACTOR;
  }
  return val;
}
