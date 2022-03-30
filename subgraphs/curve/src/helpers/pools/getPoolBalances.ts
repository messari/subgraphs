import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { LiquidityPool } from "../../../generated/schema";
import { StableSwapLending2_v1 } from "../../../generated/templates/PoolLPToken/StableSwapLending2_v1";
import { StableSwapLending3 } from "../../../generated/templates/PoolLPToken/StableSwapLending3";
import { addressToPool, PoolStaticInfo } from "../../utils/constant";

export function getPoolBalances(pool: LiquidityPool): BigInt[] {
    let balances: BigInt[] = [];
    let b: ethereum.CallResult<BigInt>;
  
    let p: PoolStaticInfo = addressToPool.get(pool.id) as PoolStaticInfo;
  
    // old contracts use int128 as input to balances, new contracts use uint256
    if (p.is_v1) {
      let contract_v1 = StableSwapLending2_v1.bind(Address.fromString(pool.id));
  
      for (let i = 0; i < pool._coinCount.toI32(); ++i) {
        let ib = BigInt.fromI32(i);
        b = contract_v1.try_balances(ib);
        if (!b.reverted) {
          balances.push(b.value);
        }
      }
    } else {
      let contract = StableSwapLending3.bind(Address.fromString(pool.id));
  
      for (let i = 0; i < pool._coinCount.toI32(); ++i) {
        let ib = BigInt.fromI32(i);
        b = contract.try_balances(ib);
        if (!b.reverted) {
          balances.push(b.value);
        }
      }
    }
  
    return balances;
  }