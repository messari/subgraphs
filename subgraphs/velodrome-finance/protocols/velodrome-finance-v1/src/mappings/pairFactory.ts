import { Address } from "@graphprotocol/graph-ts";

import { createLiquidityPool } from "../../../../src/mappings/helpers/entities";
import { updateAllPoolFees } from "../../../../src/mappings/helpers/pools";
import { getOrCreateDex } from "../../../../src/common/getters";
import {
  FACTORY_ADDRESS,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  HARDCODED_POOLS,
} from "../common/constants";
import { BIGDECIMAL_HUNDRED } from "../../../../src/common/constants";

import {
  PairCreated,
  PairFactory,
} from "../../../../generated/Factory/PairFactory";
import { Pair as PairTemplate } from "../../../../generated/templates";

export function handlePairCreated(event: PairCreated): void {
  const protocol = getOrCreateDex(
    FACTORY_ADDRESS,
    PROTOCOL_NAME,
    PROTOCOL_SLUG
  );

  PairTemplate.create(event.params.pair);
  createLiquidityPool(
    protocol,
    event.params.pair,
    event.params.token0,
    event.params.token1,
    event.params.stable,
    HARDCODED_POOLS,
    event
  );

  const factoryContract = PairFactory.bind(Address.fromString(FACTORY_ADDRESS));
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
