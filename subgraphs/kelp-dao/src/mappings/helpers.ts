import { Address, BigDecimal, dataSource } from "@graphprotocol/graph-ts";

import { bigIntToBigDecimal } from "../prices/common/utils";
import { WETH_ADDRESS as WETH_ADDRESS_MAINNET } from "../prices/config/mainnet";

import {
  BIGDECIMAL_ONE,
  BIGINT_TEN_TO_EIGHTEENTH,
  ETH_ADDRESS,
  Network,
} from "../sdk/util/constants";

import { LRTDepositPool } from "../../generated/LRTDepositPool/LRTDepositPool";
import { SFRAX } from "../../generated/LRTDepositPool/SFRAX";
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
  let multiplier = BIGDECIMAL_ONE;
  let changed = false;

  const network = dataSource.network().toUpperCase().replace("-", "_");
  if (network == Network.MAINNET) {
    // Case: inputToken is ETHx
    if (
      [
        Address.fromString("0xa35b1b31ce002fbf2058d22f30f95d405200a15b"),
      ].includes(pricedToken)
    ) {
      const lrtDepositContract = LRTDepositPool.bind(
        Address.fromString(NetworkConfigs.getProtocolId())
      );
      const swapAmountCall =
        lrtDepositContract.try_getSwapETHToAssetReturnAmount(
          pricedToken,
          BIGINT_TEN_TO_EIGHTEENTH
        );
      if (!swapAmountCall.reverted) {
        pricedToken = WETH_ADDRESS_MAINNET;
        multiplier = BIGINT_TEN_TO_EIGHTEENTH.toBigDecimal().div(
          swapAmountCall.value.toBigDecimal()
        );
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

  // Case: inputToken is ETH
  if ([Address.fromString(ETH_ADDRESS)].includes(pricedToken)) {
    pricedToken = WETH_ADDRESS_MAINNET;
    changed = true;
  }

  // Case: inputToken is rsETH
  if (
    [Address.fromString("0xa1290d69c65a6fe4df752f95823fae25cb99e5a7")].includes(
      pricedToken
    )
  ) {
    const lrtDepositContract = LRTDepositPool.bind(
      Address.fromString(NetworkConfigs.getProtocolId())
    );
    const swapAmountCall = lrtDepositContract.try_getRsETHAmountToMint(
      Address.fromString(ETH_ADDRESS),
      BIGINT_TEN_TO_EIGHTEENTH
    );
    if (!swapAmountCall.reverted) {
      pricedToken = WETH_ADDRESS_MAINNET;
      multiplier = BIGINT_TEN_TO_EIGHTEENTH.toBigDecimal().div(
        swapAmountCall.value.toBigDecimal()
      );
      changed = true;
    }
  }

  return new PricedTokenParams(pricedToken, multiplier, changed);
}
