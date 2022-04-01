import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Remove_liquidity_one_coinCall } from "../../../generated/Factory/StableSwap";
import { LiquidityPool, RemoveLiqudityOneEvent } from "../../../generated/schema";
import { getCoinCount, getOrCreateProtocol } from "../../utils/common";
import { BIGINT_ZERO } from "../../utils/constant";
import { getOrCreateFinancials } from "../financials";
import { createPoolDailySnapshot } from "../poolDailySnapshot";
import { updateUsageMetrics } from "../updateUsageMetrics";
import { createWithdraw } from "../withdraw";
// import { handleRLOEEntityUpdate } from "./RemoveLiquidityOneUpdate";

export function getOrCreateRemoveLiquidityOneEvent(
    id: string,
    pool: LiquidityPool
  ): RemoveLiqudityOneEvent {
    let removeLiquidityEvent = RemoveLiqudityOneEvent.load(id);
    if (removeLiquidityEvent != null) {
      return removeLiquidityEvent as RemoveLiqudityOneEvent;
    }
    removeLiquidityEvent = new RemoveLiqudityOneEvent(id);
    removeLiquidityEvent.pool = pool.id;
    removeLiquidityEvent.eventApplied = false;
    removeLiquidityEvent.callApplied = false;
    removeLiquidityEvent.save();
  
    return removeLiquidityEvent as RemoveLiqudityOneEvent;
  }

export function RemoveLiquidityOneCall(call: ethereum.Call, i: BigInt, token_amount: BigInt, coin_amount: BigInt): void {
  let protocol = getOrCreateProtocol()
    // load pool
    let pool = LiquidityPool.load(call.to.toHexString());
    if(pool !== null) {
        // update RemoveLiquidityOne entity
        let id = call.transaction.hash
          .toHexString()
          .concat("-")
          .concat(pool.id);
          let entity = getOrCreateRemoveLiquidityOneEvent(id, pool);
          
          entity.i = i.toI32();
          entity.callApplied = true;
          
          entity.save();

        let coinCount = getCoinCount(call.to)
        let tokenAmounts: BigInt[] = []
        let inputTokenBalances: BigInt[] = []
        for(let j = 0; j < coinCount.toI32(); ++j) {
          if(j == i.toI32()){
            tokenAmounts.push(token_amount)
            pool.outputTokenSupply = pool.outputTokenSupply.minus(token_amount)
            inputTokenBalances.push(pool.inputTokenBalances[j].minus(coin_amount))
          }else{
            tokenAmounts.push(BIGINT_ZERO)
          }
        }
        pool.inputTokenBalances = inputTokenBalances.map<BigInt>(tb => tb)
        pool.save()

           // Update Withdraw
    createWithdraw(pool, protocol, token_amount, pool.inputTokenBalances, call.from, call.block.hash, entity.logIndex, call.block.number, call.block.timestamp);
  
    // Take a PoolDailySnapshot
    createPoolDailySnapshot(call.to, call.block.number, call.block.timestamp, pool);
  
    // Take FinancialsDailySnapshot
    getOrCreateFinancials(protocol, call.block.timestamp, call.block.number);
  
    // Take UsageMetricsDailySnapshot
    updateUsageMetrics(call.from, protocol, call.block.timestamp, call.block.number);


    //handleRLOEEntityUpdate(call.to, entity, pool, call.block.timestamp, call.block.number, call.transaction.hash, entity.logIndex);

    }
  
  }