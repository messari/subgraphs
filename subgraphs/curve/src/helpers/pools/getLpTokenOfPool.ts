import { Address } from "@graphprotocol/graph-ts";
import { addressToPool, PoolStaticInfo, ZERO_ADDRESS } from "../../utils/constant";

export function getLpTokenOfPool(pool: Address): Address {
    let p: PoolStaticInfo = addressToPool.get(pool.toHexString()) as PoolStaticInfo;
    let lpTokenAddress = p.lpTokenAddress;
  
    if (lpTokenAddress == null) {
      return Address.fromString(ZERO_ADDRESS);
    }
  
    return Address.fromString(lpTokenAddress);
  }
  