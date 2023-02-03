import { Address, BigInt } from "@graphprotocol/graph-ts";

import { Pool } from "../../generated/Router/Pool";

// LD == Local Decimals, SD == Shared Decimals
export function amountLDtoSD(poolAddr: Address, amountLD: BigInt): BigInt {
  const poolContract = Pool.bind(poolAddr);
  const convertRateCall = poolContract.try_convertRate();
  if (convertRateCall.reverted) {
    return amountLD;
  }

  const convertRate = convertRateCall.value;
  return amountLD.div(convertRate);
}
