import { Address, BigDecimal, dataSource } from "@graphprotocol/graph-ts";

import { WETH_ADDRESS as BNB_ADDRESS_BSC } from "../prices/config/bsc";

import { BIGDECIMAL_ONE, Network } from "../sdk/util/constants";
import { NetworkConfigs } from "../../configurations/configure";

export class PricedTokenParams {
  addr: Address;
  multiplier: BigDecimal;
  changed: boolean;

  constructor(addr: Address, multiplier: BigDecimal, changed: boolean) {
    this.addr = addr;
    this.multiplier = multiplier;
    this.changed = changed;
  }
}

export function getUpdatedPricedToken(tokenAddr: Address): PricedTokenParams {
  let pricedToken = tokenAddr;
  const multiplier = BIGDECIMAL_ONE;
  let changed = false;

  const network = dataSource.network().toUpperCase().replace("-", "_");
  if (network == Network.BSC) {
    // Case: inputToken is slisBNB
    if ([NetworkConfigs.getLSTAddress()].includes(pricedToken)) {
      pricedToken = BNB_ADDRESS_BSC;
      changed = true;
    }
  }
  return new PricedTokenParams(pricedToken, multiplier, changed);
}
