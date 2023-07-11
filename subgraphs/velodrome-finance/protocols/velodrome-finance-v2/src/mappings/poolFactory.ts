import { Address } from "@graphprotocol/graph-ts";

import {
  createLiquidityPool,
  createPoolFees,
} from "../../../../src/mappings/helpers/entities";
import {
  getLiquidityPool,
  getOrCreateDex,
} from "../../../../src/common/getters";
import {
  FACTORY_ADDRESS,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  HARDCODED_POOLS,
} from "../common/constants";
import { BIGDECIMAL_HUNDRED } from "../../../../src/common/constants";
import { updateAllPoolFees } from "../../../../src/mappings/helpers/pools";

import {
  PoolCreated,
  PoolFactory,
  SetCustomFee,
} from "../../../../generated/Factory/PoolFactory";
import { Pool as PoolTemplate } from "../../../../generated/templates";

export function handlePoolCreated(event: PoolCreated): void {
  const protocol = getOrCreateDex(
    FACTORY_ADDRESS,
    PROTOCOL_NAME,
    PROTOCOL_SLUG
  );

  PoolTemplate.create(event.params.pool);
  createLiquidityPool(
    protocol,
    event.params.pool,
    event.params.token0,
    event.params.token1,
    event.params.stable,
    HARDCODED_POOLS,
    event
  );

  const factoryContract = PoolFactory.bind(Address.fromString(FACTORY_ADDRESS));
  const stableFee = factoryContract
    .stableFee()
    .toBigDecimal()
    .div(BIGDECIMAL_HUNDRED);
  const volatileFee = factoryContract
    .volatileFee()
    .toBigDecimal()
    .div(BIGDECIMAL_HUNDRED);
  updateAllPoolFees(protocol, stableFee, volatileFee, event.block, false);
}

export function handleSetCustomFee(event: SetCustomFee): void {
  const pool = getLiquidityPool(event.params.pool);
  if (!pool) return;

  pool._customFeeApplied = true;
  const fee = event.params.fee.toBigDecimal().div(BIGDECIMAL_HUNDRED);
  createPoolFees(event.params.pool, fee);
}
