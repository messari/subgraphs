import { PoolCreated } from "../../generated/PoolFactory/PoolFactory";
import { TruefiPool2 } from "../../generated/templates";
import { createMarket } from "../entities/market";

export function handlePoolCreated(event: PoolCreated): void {
  createMarket(event, event.params.token, event.params.pool);
  TruefiPool2.create(event.params.pool);
}
