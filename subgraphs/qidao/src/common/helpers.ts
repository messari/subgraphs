import { Address } from "@graphprotocol/graph-ts";

import { BIGDECIMAL_HUNDRED, MATIC_ADDRESS } from "../utils/constants";
import { bigIntToBigDecimal } from "../utils/numbers";

import { Market } from "../../generated/schema";
import { ERC20QiStablecoin } from "../../generated/templates/Vault/ERC20QiStablecoin";

export function updateMetadata(market: Market): void {
  if (market.inputToken == MATIC_ADDRESS.toHexString()) {
    // No set/get functions in contract
    return;
  }

  const contract = ERC20QiStablecoin.bind(Address.fromString(market.id));
  const minCollateralPercent = contract.try__minimumCollateralPercentage();
  if (!minCollateralPercent.reverted) {
    const maximumLTV = BIGDECIMAL_HUNDRED.div(
      minCollateralPercent.value.toBigDecimal()
    ).times(BIGDECIMAL_HUNDRED);
    market.maximumLTV = maximumLTV;
    market.liquidationThreshold = maximumLTV;
  }
  const gainRatio = contract.try_gainRatio();
  if (!gainRatio.reverted) {
    const decimals = gainRatio.value.toString().length - 1;
    const liquidationPenalty = bigIntToBigDecimal(gainRatio.value, decimals)
      .times(BIGDECIMAL_HUNDRED)
      .minus(BIGDECIMAL_HUNDRED);
    market.liquidationPenalty = liquidationPenalty;
  }
}
