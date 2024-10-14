import { Address, BigDecimal, dataSource } from "@graphprotocol/graph-ts";

import { bigIntToBigDecimal } from "../prices/common/utils";
import {
  WETH_ADDRESS as WETH_ADDRESS_MAINNET,
  USDC_ADDRESS as USDC_ADDRESS_MAINNET,
} from "../prices/config/mainnet";

import {
  BIGDECIMAL_ONE,
  BIGINT_TEN_TO_EIGHTEENTH,
  BIGINT_TEN_TO_SIX,
  Network,
} from "../sdk/util/constants";

import { EGETH } from "../../generated/Vault/EGETH";
import { EigenpieMLRT } from "../../generated/Vault/EigenpieMLRT";
import { WBETH } from "../../generated/Vault/WBETH";
import { SFRAX } from "../../generated/Vault/SFRAX";
import { SUSDE } from "../../generated/Vault/SUSDE";
import { PendlePT } from "../../generated/Vault/PendlePT";
import { PendleSY } from "../../generated/Vault/PendleSY";

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
    // Case: inputToken is Pendle PT
    if (
      [
        Address.fromString("0xc69ad9bab1dee23f4605a82b3354f8e40d1e5966"), // PT-weETH-27JUN2024
        Address.fromString("0x6ee2b5e19ecba773a352e5b21415dc419a700d1d"), // PT-weETH-26DEC2024
        Address.fromString("0x9946c55a34cd105f1e0cf815025eaecff7356487"), // PT-ENA-29AUG2024
      ].includes(pricedToken)
    ) {
      const pendlePTContract = PendlePT.bind(pricedToken);
      const SYCall = pendlePTContract.try_SY();
      if (!SYCall.reverted) {
        const pendleSYContract = PendleSY.bind(SYCall.value);
        const assetInfoCall = pendleSYContract.try_assetInfo();
        if (!assetInfoCall.reverted) {
          pricedToken = assetInfoCall.value.getValue1();
          changed = true;
        }
      }
    }
    if (
      [
        Address.fromString("0x5cb12d56f5346a016dbba8ca90635d82e6d1bcea"), // PT-rswETH-27JUN2024
      ].includes(pricedToken)
    ) {
      pricedToken = Address.fromString(
        "0xfae103dc9cf190ed75350761e95403b7b8afa6c0"
      );
      changed = true;
    }
    if (
      [
        Address.fromString("0xb05cabcd99cf9a73b19805edefc5f67ca5d1895e"), // PT-rsETH-27JUN2024
      ].includes(pricedToken)
    ) {
      pricedToken = Address.fromString(
        "0xa1290d69c65a6fe4df752f95823fae25cb99e5a7"
      );
      changed = true;
    }
    if (
      [
        Address.fromString("0xf7906f274c174a52d444175729e3fa98f9bde285"), // PT-ezETH-26DEC2024
      ].includes(pricedToken)
    ) {
      pricedToken = Address.fromString(
        "0xbf5495efe5db9ce00f80364c8b423567e58d2110"
      );
      changed = true;
    }
    if (
      [
        Address.fromString("0xd810362556296c834e30c9a61d8e21a5cf29eab4"), // PT-sUSDE-25JUL2024
      ].includes(pricedToken)
    ) {
      pricedToken = Address.fromString(
        "0x9d39a5de30e57443bff2a8307a4256c8797a3497"
      );
      changed = true;
    }
    if (
      [
        Address.fromString("0xa0021ef8970104c2d008f38d92f115ad56a9b8e1"), // PT-USDe-25JUL2024
      ].includes(pricedToken)
    ) {
      pricedToken = USDC_ADDRESS_MAINNET;
      changed = true;
    }

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

    // Case: inputToken is sUSDe
    if (
      [
        Address.fromString("0x9d39a5de30e57443bff2a8307a4256c8797a3497"),
      ].includes(pricedToken)
    ) {
      const sUSDEContract = SUSDE.bind(pricedToken);
      const multiplierCall = sUSDEContract.try_convertToAssets(
        BIGINT_TEN_TO_EIGHTEENTH
      );
      if (!multiplierCall.reverted) {
        pricedToken = USDC_ADDRESS_MAINNET;
        multiplier = bigIntToBigDecimal(multiplierCall.value);
        changed = true;
      }
    }
  }

  return new PricedTokenParams(pricedToken, multiplier, changed);
}
