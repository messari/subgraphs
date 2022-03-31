import {DexAmmProtocol, LiquidityPool} from "../../generated/schema"
import { PoolCreated } from "../../generated/WeightedPoolFactory/WeightedPoolFactory"
import {VAULT} from "../common/constants";

export function createPool(event: PoolCreated): void {
    let amm = DexAmmProtocol.load(VAULT)

    if (!amm) {

    }

    let pool = new LiquidityPool(event.address.toString())
    pool.save();
}

