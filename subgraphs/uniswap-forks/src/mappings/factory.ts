import { log } from "@graphprotocol/graph-ts";

import { PairCreated } from "../../generated/Factory/Factory";
import { createLiquidityPool } from "../common/creators";

// Handle the creation of a new liquidity pool from the Factory contract
// Create the pool entity and track events from the new pool contract using the template specified in the subgraph.yaml
export function handlePairCreated(event: PairCreated): void {
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

// The call handler is used to update feeTo as on or off for each pool
// export function handleFeeTo(call: SetFeeToCall): void {
//   let protocol = getOrCreateDex()
//   let poolIds = protocol._poolIds
//   let lpFeeUpdate: BigDecimal
//   let protocolFeeUpdate: BigDecimal
//   if (call.inputs._feeTo.toHexString() != ZERO_ADDRESS)  {
//     lpFeeUpdate = LP_FEE_TO_ON
//     protocolFeeUpdate = PROTOCOL_FEE_TO_ON
//   } else {
//     lpFeeUpdate = LP_FEE_TO_OFF
//     protocolFeeUpdate = PROTOCOL_FEE_TO_OFF
//   }
//     for (let i = 0; i < poolIds.length; i++) {
//       // will need blockNumber param
//       let pool = getLiquidityPool(poolIds[i].toHexString())
//       let lpFeeId = pool.fees[0]
//       let protocolFeeId = pool.fees[1]

//       let lpFee = getLiquidityPoolFee(lpFeeId)
//       lpFee.feePercentage = lpFeeUpdate

//       let protocolFee = getLiquidityPoolFee(protocolFeeId)
//       protocolFee.feePercentage = protocolFeeUpdate

//       lpFee.save()
//       protocolFee.save()
//   }
// }
