import { Address, BigDecimal, dataSource } from "@graphprotocol/graph-ts";

import { WETH_ADDRESS as WETH_ADDRESS_MAINNET } from "../prices/config/mainnet";

import { BIGDECIMAL_ONE, ETH_ADDRESS, Network } from "../sdk/util/constants";

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
  if (network == Network.MAINNET) {
    // Case: inputToken is ETH
    if ([Address.fromString(ETH_ADDRESS)].includes(pricedToken)) {
      pricedToken = WETH_ADDRESS_MAINNET;
      changed = true;
    }
  }

  return new PricedTokenParams(pricedToken, multiplier, changed);
}
