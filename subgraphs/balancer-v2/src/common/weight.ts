import { Address, BigDecimal, log } from "@graphprotocol/graph-ts";
import { LiquidityPool } from "../../generated/schema";
import { WeightedPool } from "../../generated/Vault/WeightedPool";

export function updateWeight(poolId: string): void {
  let pool = LiquidityPool.load(poolId);
  if (pool == null) return;

  let poolContract = WeightedPool.bind(Address.fromString(poolId));
  let weightsCall = poolContract.try_getNormalizedWeights();
  if (!weightsCall.reverted) {
    let weights = weightsCall.value;
    let formattedWeights = new Array<BigDecimal>();
    for (let i = 0; i < weights.length; i++) {
      formattedWeights.push(weights[i].toBigDecimal());
    }
    pool.inputTokenWeights = formattedWeights;
    pool.save();
  }
}
