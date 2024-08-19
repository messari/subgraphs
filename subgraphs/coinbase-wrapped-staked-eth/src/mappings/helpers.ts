import { Address, BigDecimal, dataSource } from "@graphprotocol/graph-ts";

import { bigIntToBigDecimal } from "../prices/common/utils";
import { WETH_ADDRESS as WETH_ADDRESS_MAINNET } from "../prices/config/mainnet";
import { NetworkConfigs } from "../../configurations/configure";

import { BIGDECIMAL_ONE, ETH_ADDRESS, Network } from "../sdk/util/constants";

import { CBETH } from "../../generated/CBETH/CBETH";

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
  let multiplier = BIGDECIMAL_ONE;
  let changed = false;

  const network = dataSource.network().toUpperCase().replace("-", "_");
  if (network == Network.MAINNET) {
    // Case: inputToken is cBETH
    if ([NetworkConfigs.getLSTAddress()].includes(pricedToken)) {
      const cbEthContract = CBETH.bind(pricedToken);
      const exchangeRateCall = cbEthContract.try_exchangeRate();
      if (!exchangeRateCall.reverted) {
        pricedToken = WETH_ADDRESS_MAINNET;
        multiplier = bigIntToBigDecimal(exchangeRateCall.value);
        changed = true;
      }
    }

    // Case: inputToken is ETH
    if ([Address.fromString(ETH_ADDRESS)].includes(pricedToken)) {
      pricedToken = WETH_ADDRESS_MAINNET;
      changed = true;
    }
  }

  return new PricedTokenParams(pricedToken, multiplier, changed);
}
