import { LiquidityPool } from "../../generated/schema";
import { getLiquidityPoolFee } from "../common/getters";
import { scaleDown } from "../common/tokens";
import { BIGDECIMAL_ONE } from "../common/constants";
import { SwapFeePercentageChanged } from "../../generated/Vault/LinearPool";
import { log } from "@graphprotocol/graph-ts";

/************************************
 *********** SWAP FEES ************
 ************************************/

export function handleSwapFeePercentageChange(event: SwapFeePercentageChanged): void {
  let poolAddress = event.address;
  let pool = LiquidityPool.load(poolAddress.toHexString());

  let poolTradingFee = getLiquidityPoolFee(pool!.fees[2]);

  let protocolFeeProportion = scaleDown(event.params.swapFeePercentage, null);
  // Update protocol and trading fees for this pool
  poolTradingFee.feePercentage = protocolFeeProportion;
  poolTradingFee.save();
}
