import { Address, BigDecimal, dataSource } from "@graphprotocol/graph-ts";

import { bigIntToBigDecimal } from "../prices/common/utils";
import { WETH_ADDRESS as WETH_ADDRESS_MAINNET } from "../prices/config/mainnet";
import { WETH_ADDRESS_BSC } from "../prices/config/bsc";

import { BIGDECIMAL_ONE, ETH_ADDRESS, Network } from "../sdk/util/constants";

import { WBETH } from "../../generated/WBETH/WBETH";

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
    // Case: inputToken is wBETH
    if (
      [
        Address.fromString("0xa2e3356610840701bdf5611a53974510ae27e2e1"),
      ].includes(pricedToken)
    ) {
      const wbEthContract = WBETH.bind(pricedToken);
      const exchangeRateCall = wbEthContract.try_exchangeRate();
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

  if (network == Network.BSC) {
    // Case: inputToken is wBETH
    if (
      [
        Address.fromString("0xa2e3356610840701bdf5611a53974510ae27e2e1"),
      ].includes(pricedToken)
    ) {
      const wbEthContract = WBETH.bind(pricedToken);
      const exchangeRateCall = wbEthContract.try_exchangeRate();
      if (!exchangeRateCall.reverted) {
        pricedToken = WETH_ADDRESS_BSC;
        multiplier = bigIntToBigDecimal(exchangeRateCall.value);
        changed = true;
      }
    }

    // Case: inputToken is ETH
    if ([Address.fromString(ETH_ADDRESS)].includes(pricedToken)) {
      pricedToken = WETH_ADDRESS_BSC;
      changed = true;
    }
  }

  return new PricedTokenParams(pricedToken, multiplier, changed);
}
