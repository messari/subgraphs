import { Address, BigDecimal, dataSource } from "@graphprotocol/graph-ts";

import { bigIntToBigDecimal } from "../prices/common/utils";
import { WETH_ADDRESS as WAVAX_ADDRESS_AVALANCHE } from "../prices/config/avalanche";
import { NetworkConfigs } from "../../configurations/configure";

import {
  BIGDECIMAL_ONE,
  BIGINT_TEN_TO_EIGHTEENTH,
  Network,
} from "../sdk/util/constants";

import { SAVAX } from "../../generated/SAVAX/SAVAX";

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
  if (network == Network.AVALANCHE) {
    // Case: inputToken is sAVAX
    if ([NetworkConfigs.getSAVAXAddress()].includes(pricedToken)) {
      const sAVAXContract = SAVAX.bind(pricedToken);
      const exchangeRateCall = sAVAXContract.try_getPooledAvaxByShares(
        BIGINT_TEN_TO_EIGHTEENTH
      );
      if (!exchangeRateCall.reverted) {
        pricedToken = WAVAX_ADDRESS_AVALANCHE;
        multiplier = bigIntToBigDecimal(exchangeRateCall.value);
        changed = true;
      }
    }
  }

  return new PricedTokenParams(pricedToken, multiplier, changed);
}
