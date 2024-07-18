import { Address, BigDecimal, dataSource } from "@graphprotocol/graph-ts";

import { bigIntToBigDecimal } from "../prices/common/utils";
import { WETH_ADDRESS as WETH_ADDRESS_MAINNET } from "../prices/config/mainnet";

import {
  BIGDECIMAL_ONE,
  BIGINT_TEN_TO_EIGHTEENTH,
  Network,
} from "../sdk/util/constants";

import { EGETH } from "../../generated/ZtakingPool/EGETH";
import { EigenpieMLRT } from "../../generated/ZtakingPool/EigenpieMLRT";
import { WBETH } from "../../generated/ZtakingPool/WBETH";
import { SFRAX } from "../../generated/ZtakingPool/SFRAX";

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
    // Case: inputToken is egETH
    if (
      [
        Address.fromString("0x18f313fc6afc9b5fd6f0908c1b3d476e3fea1dd9"),
      ].includes(pricedToken)
    ) {
      const egEthContract = EGETH.bind(pricedToken);
      const multiplierCall = egEthContract.try_exchangeRateToNative();
      if (!multiplierCall.reverted) {
        pricedToken = WETH_ADDRESS_MAINNET;
        multiplier = bigIntToBigDecimal(multiplierCall.value);
        changed = true;
      }
    }

    // Case: inputToken is mwBETH or mswETH
    if (
      [
        Address.fromString("0xe46a5e19b19711332e33f33c2db3ea143e86bc10"),
        Address.fromString("0x32bd822d615a3658a68b6fdd30c2fcb2c996d678"),
      ].includes(pricedToken)
    ) {
      const mlrtContract = EigenpieMLRT.bind(pricedToken);
      const underlyingAssetCall = mlrtContract.try_underlyingAsset();
      if (!underlyingAssetCall.reverted) {
        pricedToken = underlyingAssetCall.value;
        changed = true;
      }
    }

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

    // Case: inputToken is ezETH
    if (
      [
        Address.fromString("0xbf5495efe5db9ce00f80364c8b423567e58d2110"),
      ].includes(pricedToken)
    ) {
      pricedToken = WETH_ADDRESS_MAINNET;
      changed = true;
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
