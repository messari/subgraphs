import {
  getOrCreatePool,
  initializeSDKFromEvent,
  getRestakeManagerAddress,
} from "../common/initializers";
import * as constants from "../common/constants";
import { Address } from "@graphprotocol/graph-ts";
import { PoolAdded } from "../../generated/Points/Points";

export function handlePoolAdded(event: PoolAdded): void {
  const poolAddress = event.params.pool;

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(restakeManagerAddress, sdk);


}
