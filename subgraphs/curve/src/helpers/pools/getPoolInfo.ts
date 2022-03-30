import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { StableSwapLending2_v1 } from "../../../generated/templates/PoolLPToken/StableSwapLending2_v1";
import { StableSwapLending3 } from "../../../generated/templates/PoolLPToken/StableSwapLending3";
import { addressToPool, PoolInfo, PoolStaticInfo, PoolType, ZERO_ADDRESS } from "../../utils/constant";

export function getPoolInfo(pool: Address): PoolInfo {
    let staticInfo: PoolStaticInfo = addressToPool.get(pool.toHexString()) as PoolStaticInfo;
  
    let coins: Address[] = [];
    let balances: BigInt[] = [];
    let underlyingCoins: Address[] = [];
  
    let c: ethereum.CallResult<Address>;
    let b: ethereum.CallResult<BigInt>;
    let u: ethereum.CallResult<Address>;
  
    // old contracts use int128 as input to balances, new contracts use uint256
    if (staticInfo.is_v1) {
      let contract_v1 = StableSwapLending2_v1.bind(pool);
  
      for (let i = 0; i < staticInfo.coinCount; i++) {
        let ib = BigInt.fromI32(i);
        c = contract_v1.try_coins(ib);
        b = contract_v1.try_balances(ib);
  
        if (!c.reverted && c.value.toHexString() != ZERO_ADDRESS && !b.reverted) {
          coins.push(c.value);
          balances.push(b.value);
        }
  
        if (staticInfo.poolType == PoolType.LENDING) {
          u = contract_v1.try_underlying_coins(ib);
          if (!u.reverted) {
            underlyingCoins.push(u.value);
          }
        }
      }
    } else {
      let contract = StableSwapLending3.bind(pool);
      for (let i = 0; i < staticInfo.coinCount; i++) {
        let ib = BigInt.fromI32(i);
        c = contract.try_coins(ib);
        b = contract.try_balances(ib);
  
  
        if (!c.reverted && c.value.toHexString() != ZERO_ADDRESS && !b.reverted) {
          coins.push(c.value);
          balances.push(b.value);
        }
  
        if (staticInfo.poolType == PoolType.LENDING) {
          u = contract.try_underlying_coins(ib);
          if (!u.reverted) {
            underlyingCoins.push(u.value);
          }
        }
      }
    }
  
    return {
      coins,
      underlyingCoins,
      balances,
    };
  }
  