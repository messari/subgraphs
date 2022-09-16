import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import {
  PairCreated,
  SetFeeCall,
} from "../../generated/PairFactory/PairFactory";
import { getLiquidityPool, getOrCreateDex } from "../common/getters";
import { createLiquidityPool, createPoolFees } from "./helpers/entities";
import { updateAllPoolFees } from "./helpers/pools";

export function handlePairCreated(event: PairCreated): void {
  createLiquidityPool(
    event,
    event.params.pair,
    event.params.token0,
    event.params.token1,
    event.params.stable
  );
  updateAllPoolFees();
}

// Currently not used as call handlers are not supported in optimism
export function handleSetFeeCall(call: SetFeeCall): void {
  let fees = call.inputs._fee.toBigDecimal().div(BigDecimal.fromString("100"));
  let protocol = getOrCreateDex();
  if (call.inputs._stable) {
    protocol._stableFee = fees;
  } else {
    protocol._volatileFee = fees;
  }

  let allPools = protocol._allPools;
  for (let i = 0; i < allPools.length; i++) {
    let poolAddress = Address.fromBytes(allPools[i]);
    let pool = getLiquidityPool(poolAddress);
    if (pool._stable == call.inputs._stable) {
      createPoolFees(poolAddress, fees);
    }
  }

  protocol.save();
}
