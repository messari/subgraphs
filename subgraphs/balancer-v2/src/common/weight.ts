import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { LiquidityPool } from "../../generated/schema";
import { WeightedPool } from "../../generated/Vault/WeightedPool";
import { scaleDown } from "./tokens";

export function updateWeight(poolId: string): void {
  let pool = LiquidityPool.load(poolId);
  if (pool == null) return;

  let poolContract = WeightedPool.bind(Address.fromString(pool.outputToken));
  let weightsCall = poolContract.try_getNormalizedWeights();

  if (!weightsCall.reverted) {
    let weights = weightsCall.value;
    let formattedWeights = new Array<BigDecimal>();
    for (let i = 0; i < weights.length; i++) {
      formattedWeights.push(scaleDown(weights[i], null));
    }

    pool.inputTokenWeights = formattedWeights;
    pool.save();
  }
}
