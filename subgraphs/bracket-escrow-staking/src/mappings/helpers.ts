import { Address, BigDecimal, dataSource } from "@graphprotocol/graph-ts";

import { bigIntToBigDecimal } from "../prices/common/utils";
import { WETH_ADDRESS as WETH_ADDRESS_MAINNET } from "../prices/config/mainnet";
import { WETH_ADDRESS as WETH_ADDRESS_ARBITRUM } from "../prices/config/arbitrum";
import {
  WETH_ADDRESS as WETH_ADDRESS_BSC,
  USDC_ADDRESS as USDC_ADDRESS_BSC,
} from "../prices/config/bsc";

import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_TEN_TO_EIGHTEENTH,
  Network,
} from "../sdk/util/constants";

import { ChainlinkDataFeed } from "../../generated/Escrow/ChainlinkDataFeed";
import { WBETH } from "../../generated/Escrow/WBETH";
import { PendlePT } from "../../generated/Escrow/PendlePT";
import { PendleSY } from "../../generated/Escrow/PendleSY";
import { EigenpieMLRT } from "../../generated/Escrow/EigenpieMLRT";
import { SFRAX } from "../../generated/Escrow/SFRAX";

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
      const exchangeRateCall = wbEthContract.try_exchangeRate();
      if (!exchangeRateCall.reverted) {
        pricedToken = WETH_ADDRESS_MAINNET;
        multiplier = bigIntToBigDecimal(exchangeRateCall.value);
        changed = true;
      }
    }

    // Case: inputToken is sfrxETH or sFRAX or apxETH
    if (
      [
        Address.fromString("0xac3e018457b222d93114458476f3e3416abbe38f"),
        Address.fromString("0xa663b02cf0a4b149d2ad41910cb81e23e1c41c32"),
        Address.fromString("0x9ba021b0a9b958b5e75ce9f6dff97c7ee52cb3e6"),
        Address.fromString("0xdcee70654261af21c44c093c300ed3bb97b78192"),
      ].includes(pricedToken)
    ) {
      const sFraxContract = SFRAX.bind(pricedToken);
      const assetCall = sFraxContract.try_asset();
      if (!assetCall.reverted) {
        pricedToken = assetCall.value;
        changed = true;

        const miltipleCall = sFraxContract.try_convertToAssets(
          BIGINT_TEN_TO_EIGHTEENTH
        );
        if (!miltipleCall.reverted) {
          multiplier = bigIntToBigDecimal(miltipleCall.value);
        }
      }
    }
    if (
      [
        Address.fromString("0x04c154b66cb340f3ae24111cc767e0184ed00cc6"),
        Address.fromString("0x5e8422345238f34275888049021821e8e08caa1f"),
        Address.fromString("0xf1c9acdc66974dfb6decb12aa385b9cd01190e38"),
      ].includes(pricedToken)
    ) {
      pricedToken = WETH_ADDRESS_MAINNET;
      changed = true;
    }

    // Case: inputToken is Pendle PT
    if (
      [
        Address.fromString("0xc69ad9bab1dee23f4605a82b3354f8e40d1e5966"),
        Address.fromString("0x6ee2b5e19ecba773a352e5b21415dc419a700d1d"),
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
        Address.fromString("0x5cb12d56f5346a016dbba8ca90635d82e6d1bcea"),
      ].includes(pricedToken)
    ) {
      pricedToken = Address.fromString(
        "0xfae103dc9cf190ed75350761e95403b7b8afa6c0"
      );
      changed = true;
    }
    if (
      [
        Address.fromString("0xb05cabcd99cf9a73b19805edefc5f67ca5d1895e"),
      ].includes(pricedToken)
    ) {
      pricedToken = Address.fromString(
        "0xa1290d69c65a6fe4df752f95823fae25cb99e5a7"
      );
      changed = true;
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
  }
  if (network == Network.ARBITRUM_ONE) {
    // Case: inputToken is weETH or ezETH or ksETH or Pendle PT-eth tokens
    if (
      [
        Address.fromString("0xafd22f824d51fb7eed4778d303d4388ac644b026"),
        Address.fromString("0x8ea5040d423410f1fdc363379af88e1db5ea1c34"),
        Address.fromString("0x35751007a407ca6feffe80b3cb397736d2cf4dbe"),
        Address.fromString("0x2416092f143378750bb29b79ed961ab195cceea5"),
        Address.fromString("0x1c27ad8a19ba026adabd615f6bc77158130cfbe4"),
        Address.fromString("0x4186bfc76e2e237523cbc30fd220fe055156b41f"),
      ].includes(pricedToken)
    ) {
      pricedToken = WETH_ADDRESS_ARBITRUM;
      changed = true;
    }
  }
  if (network == Network.BSC) {
    // Case: inputToken is slisBNB
    if (
      [
        Address.fromString("0xb0b84d294e0c75a6abe60171b70edeb2efd14a1b"),
      ].includes(pricedToken)
    ) {
      pricedToken = WETH_ADDRESS_BSC;
      changed = true;
    }
    // Case: inputToken is lisUSD
    if (
      [
        Address.fromString("0x0782b6d8c4551b9760e74c0545a9bcd90bdc41e5"),
      ].includes(pricedToken)
    ) {
      pricedToken = USDC_ADDRESS_BSC;
      changed = true;
    }
  }

  return new PricedTokenParams(pricedToken, multiplier, changed);
}

export function getPriceFromChainlinkDatafeed(tokenAddr: Address): BigDecimal {
  if (
    tokenAddr ==
    Address.fromString("0x5979d7b546e38e414f7e9822514be443a4800529")
  ) {
    const datafeedETHUSD = ChainlinkDataFeed.bind(
      Address.fromString("0x639fe6ab55c921f74e7fac1ee960c0b6293ba612") // ETH / USD feed
    );
    const resultETHUSD = datafeedETHUSD.latestAnswer();
    const decimalsETHUSD = datafeedETHUSD.decimals();
    const ETHUSD = bigIntToBigDecimal(resultETHUSD, decimalsETHUSD);

    const datafeedWSTETHETH = ChainlinkDataFeed.bind(
      Address.fromString("0xb523ae262d20a936bc152e6023996e46fdc2a95d") // wstETH / ETH feed
    );
    const resultWSTETHETH = datafeedWSTETHETH.latestAnswer();
    const decimalsWSTETHETH = datafeedWSTETHETH.decimals();
    const WSTETHETH = bigIntToBigDecimal(resultWSTETHETH, decimalsWSTETHETH);

    return WSTETHETH.times(ETHUSD);
  }
  return BIGDECIMAL_ZERO;
}
