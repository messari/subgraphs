import {
  OwnerFeeShareUpdated,
  PairCreated,
} from "../../../../generated/Factory/Factory";
import { LiquidityPoolFee } from "../../../../generated/schema";
import { LiquidityPoolFeeType } from "../../../../src/common/constants";
import { Logger } from "../../../../src/common/utils/logger";
import { convertTokenToDecimal } from "../../../../src/common/utils/utils";
import { INT_THREE, PROTOCOL_FEE_SHARE_ID } from "../common/constants";
import { createLiquidityPool } from "../common/creators";

// Percentage of fees that go to owner address, applies to all pools
export function handleOwnerFeeShareUpdated(event: OwnerFeeShareUpdated): void {
  const protocolFee = new LiquidityPoolFee(PROTOCOL_FEE_SHARE_ID);
  protocolFee.feePercentage = convertTokenToDecimal(
    event.params.ownerFeeShare,
    INT_THREE
  );
  protocolFee.feeType = LiquidityPoolFeeType.FIXED_PROTOCOL_FEE;
  protocolFee.save();
}

export function handlePairCreated(event: PairCreated): void {
  const log = new Logger(event, "handlePairCreated");
  log.info("create farm {}    {}     {}", [
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
