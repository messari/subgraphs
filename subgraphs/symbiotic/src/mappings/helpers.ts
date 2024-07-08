import { Address, BigDecimal, dataSource } from "@graphprotocol/graph-ts";

import { bigIntToBigDecimal } from "../prices/common/utils";
import { WETH_ADDRESS as WETH_ADDRESS_MAINNET } from "../prices/config/mainnet";

import {
  BIGDECIMAL_ONE,
  BIGINT_TEN_TO_EIGHTEENTH,
  Network,
} from "../sdk/util/constants";

import { WBETH } from "../../generated/Factory/WBETH";
import { SFRAX } from "../../generated/Factory/SFRAX";

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
      const multiplierCall = wbEthContract.try_exchangeRate();
      if (!multiplierCall.reverted) {
        pricedToken = WETH_ADDRESS_MAINNET;
        multiplier = bigIntToBigDecimal(multiplierCall.value);
        changed = true;
      }
    }

    // Case: inputToken is sfrxETH
    if (
      [
        Address.fromString("0xac3e018457b222d93114458476f3e3416abbe38f"),
      ].includes(pricedToken)
    ) {
      const sFraxContract = SFRAX.bind(pricedToken);
      const multiplierCall = sFraxContract.try_convertToAssets(
        BIGINT_TEN_TO_EIGHTEENTH
      );
      if (!multiplierCall.reverted) {
        pricedToken = WETH_ADDRESS_MAINNET;
        multiplier = bigIntToBigDecimal(multiplierCall.value);
        changed = true;
      }
    }
  }

  return new PricedTokenParams(pricedToken, multiplier, changed);
}
