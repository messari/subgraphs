import {
  AddLiquidity,
  RemoveLiquidity,
  GlpManager,
} from "../../generated/GlpManager/GlpManager";
import { getOrCreateToken } from "../entities/token";
import { getOrCreatePool } from "../entities/pool";
import { updateUsageMetrics } from "../entityUpdates/usageMetrics";
import { updateProtocolAndPoolTvl } from "../entityUpdates/financialMetrics";

export function handleAddLiquidity(event: AddLiquidity): void {
  const pool = getOrCreatePool(event.block.number, event.block.timestamp);
  if (!pool.outputToken) {
    const glpManagerContract = GlpManager.bind(event.address);
    const tryGlp = glpManagerContract.try_glp();
    if (!tryGlp.reverted) {
      pool.outputToken = getOrCreateToken(tryGlp.value, event.block.number).id;
      pool.save();
    }
  }

  updateProtocolAndPoolTvl(
    event.block,
    event.params.aumInUsdg,
    event.params.glpSupply
  );

  updateUsageMetrics(event.block, event.params.account);
}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  updateProtocolAndPoolTvl(
    event.block,
    event.params.aumInUsdg,
    event.params.glpSupply
  );

  updateUsageMetrics(event.block, event.params.account);
}
