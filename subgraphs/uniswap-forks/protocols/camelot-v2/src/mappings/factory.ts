import { NetworkConfigs } from "../../../../configurations/configure";
import {
  OwnerFeeShareUpdated,
  PairCreated,
} from "../../../../generated/Factory/Factory";
import { LiquidityPoolFee } from "../../../../generated/schema";
import { LiquidityPoolFeeType } from "../../../../src/common/constants";
import { INT_THREE, PROTOCOL_FEE_SHARE_ID } from "../common/constants";
import { createLiquidityPool } from "../common/creators";
import { Logger } from "../common/utils/logger";
import { bigIntToBigDecimal } from "../common/utils/numbers";

export function handleOwnerFeeShareUpdated(event: OwnerFeeShareUpdated): void {
  const protocolFee = new LiquidityPoolFee(PROTOCOL_FEE_SHARE_ID);
  protocolFee.feePercentage = bigIntToBigDecimal(
    event.params.ownerFeeShare,
    INT_THREE
  );
  protocolFee.feeType = LiquidityPoolFeeType.FIXED_PROTOCOL_FEE;
  protocolFee.save();
}

export function handlePairCreated(event: PairCreated): void {
  const logger = new Logger(event, "handlePairCreated");
  if (
    NetworkConfigs.getUntrackedPairs().includes(event.params.pair.toHexString())
  ) {
    logger.warning(
      "farm found in UntrackedPairs list, not tracking: {}    {}     {}",
      [
        event.params.pair.toHexString(),
        event.params.token0.toHexString(),
        event.params.token1.toHexString(),
      ]
    );
    return;
  }
  logger.info("create farm {}    {}     {}", [
    event.params.pair.toHexString(),
    event.params.token0.toHexString(),
    event.params.token1.toHexString(),
  ]);
  createLiquidityPool(
    event,
    event.params.pair.toHexString(),
    event.params.token0.toHexString(),
    event.params.token1.toHexString()
  );
}
