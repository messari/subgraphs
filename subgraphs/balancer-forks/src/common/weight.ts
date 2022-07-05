import { Address, BigDecimal, log } from "@graphprotocol/graph-ts";
import { LiquidityPool } from "../../generated/schema";
import { WeightedPool } from "../../generated/Vault/WeightedPool";
import { BIGDECIMAL_HUNDRED, BIGDECIMAL_ONE, BIGINT_ONE, DEFAULT_DECIMALS } from "./constants";
import { shrinkToBigDecimal } from "./utils/utils";

export function updateWeight(pool: LiquidityPool): void {
  let poolContract = WeightedPool.bind(Address.fromString(pool.id));
  let weightsCall = poolContract.try_getNormalizedWeights();
  if (!weightsCall.reverted) {
    let weights = weightsCall.value;
    let formattedWeights = new Array<BigDecimal>();
    for (let i = 0; i < weights.length; i++) {
      formattedWeights.push(shrinkToBigDecimal(weights[i], DEFAULT_DECIMALS).times(BIGDECIMAL_HUNDRED));
    }
    pool.inputTokenWeights = formattedWeights;
    return;
  }
  pool.inputTokenWeights = [BIGDECIMAL_ONE];
}
