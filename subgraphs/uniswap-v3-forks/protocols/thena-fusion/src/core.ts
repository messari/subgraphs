import { Pool } from "../../../generated/templates/Pool/Pool";
import { GaugeCreated } from "../../../generated/Voter/Voter";
import { createLiquidityPool } from "../../../src/common/entities/pool";
import { AlgebraPool } from "../../../generated/templates/Pool/AlgebraPool";

export function handleGaugeCreated(event: GaugeCreated): void {
  const algebraPoolContract = AlgebraPool.bind(event.params.pool);

  const poolAddressCall = algebraPoolContract.try_pool();
  if (poolAddressCall.reverted) return;

  const poolAddress = poolAddressCall.value;
  const poolContract = Pool.bind(poolAddress);

  const token0 = poolContract.token0();
  const token1 = poolContract.token1();

  let fees = 0;

  const globalState = poolContract.try_globalState();
  if (!globalState.reverted) fees = globalState.value.getFee();

  createLiquidityPool(event, poolAddress, token0, token1, fees);
}
