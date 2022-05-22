import {
  BigDecimal,
  BigInt,
  ethereum,
  Address,
  log,
} from "@graphprotocol/graph-ts";

import { PoolManager } from "../../../../generated/PoolManager/PoolManager";

import { handleUpdatePoolWeightImpl } from "../../../common/masterChef/ubeswap/handelCreatePool";

export function handleUpdatePoolWeight(event: ethereum.Event): void {
  handleUpdatePoolWeightImpl(event);
}
