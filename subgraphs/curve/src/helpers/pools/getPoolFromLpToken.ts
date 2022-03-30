import { Address } from "@graphprotocol/graph-ts";
import { lpTokenToPool, ZERO_ADDRESS } from "../../utils/constant";

export function getPoolFromLpToken(lpToken: Address): Address {
    let poolAddress = lpTokenToPool.get(lpToken.toHexString()) as string;
  
    if (poolAddress == null) {
      return Address.fromString(ZERO_ADDRESS);
    }
  
    return Address.fromString(poolAddress);
  }