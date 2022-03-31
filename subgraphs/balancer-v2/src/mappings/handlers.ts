import {
  createPool
} from "./helpers";
import { PoolCreated } from "../../generated/WeightedPoolFactory/WeightedPoolFactory"

// To improve readability and consistency, it is recommended that you put all
// handlers in this file, and create helper functions to handle specific events

export function handleNewPool(pool: PoolCreated): void {
  createPool(pool);
}