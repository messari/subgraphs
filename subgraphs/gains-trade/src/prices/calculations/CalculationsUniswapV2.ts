import { Address, BigInt, log } from "@graphprotocol/graph-ts";

import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { getUsdPricePerToken } from "..";

import { bigIntToBigDecimal } from "../../sdk/util/numbers";
import { ZERO_ADDRESS } from "../../sdk/util/constants";

import { UniswapFactory as UniswapFactoryContract } from "../../../generated/Vault/UniswapFactory";
import { UniswapPair as UniswapPairContract } from "../../../generated/Vault/UniswapPair";

export function getTokenPriceEth(
  tokenAddress: Address,
  tokenDecimals: BigInt
): CustomPriceType {
  const config = utils.getConfig();
  if (!config) return new CustomPriceType();

  const uniswapFactoryAddress = config.uniswapFactory();
  const uniswapFactoryContract = UniswapFactoryContract.bind(
    uniswapFactoryAddress
  );

  const ethAddress = config.wethAddress();
  const uniswapPairCall = uniswapFactoryContract.try_getPair(
    tokenAddress,
    ethAddress
  );
  if (
    uniswapPairCall.reverted ||
    uniswapPairCall.value == Address.fromString(ZERO_ADDRESS)
  ) {
    log.warning(
      "[CalculationsUniswapV2] pair not found on UniswapV2: {} vs {}",
      [tokenAddress.toHexString(), ethAddress.toHexString()]
    );
    return new CustomPriceType();
  }

  const uniswapPairAddress = uniswapPairCall.value;
  const uniswapPairContract = UniswapPairContract.bind(uniswapPairAddress);

  const pairReservesCall = uniswapPairContract.try_getReserves();
  if (pairReservesCall.reverted) {
    return new CustomPriceType();
  }

  const ethReserves = pairReservesCall.value.value1;
  const ethPriceUSD = getUsdPricePerToken(ethAddress).usdPrice;

  const tokenReserves = pairReservesCall.value.value0;
  const tokenPriceEth = ethReserves
    .toBigDecimal()
    .times(ethPriceUSD)
    .div(bigIntToBigDecimal(tokenReserves, tokenDecimals.toI32()));

  return CustomPriceType.initialize(
    tokenPriceEth,
    constants.DEFAULT_DECIMALS.toI32() as u8
  );
}
