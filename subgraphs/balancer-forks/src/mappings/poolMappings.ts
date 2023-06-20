import { log } from "@graphprotocol/graph-ts";
import { calculatePoolFees } from "../common/utils";
import { SwapFeePercentageChanged } from "../../generated/templates/WeightedPool/WeightedPool";

export function handleSwapFeePercentageChanged(
  event: SwapFeePercentageChanged
): void {
  const poolAddress = event.address;
  const fees = calculatePoolFees(poolAddress);

  log.warning(
    "[Pool:SwapFeeChanged] Pool: {}, TradingFees: {}, ProtocolFees: {}, LpFee: {}, Txn: {}",
    [
      poolAddress.toHexString(),
      fees.getTradingFees.toString(),
      fees.getProtocolFees.toString(),
      fees.getLpFees.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}
