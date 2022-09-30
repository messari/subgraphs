import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { UniswapV1DAI } from "../../../generated/TornadoCash01/UniswapV1DAI";
import { UniswapV1USDC } from "../../../generated/TornadoCash01/UniswapV1USDC";
import { UniswapV1cDAI } from "../../../generated/TornadoCash01/UniswapV1cDAI";

function getUniswapV1DaiContract(network: string): UniswapV1DAI {
  return UniswapV1DAI.bind(constants.UNISWAP_DAI_CONTRACT_ADDRESS.get(network));
}

function getUniswapV1UsdcContract(network: string): UniswapV1USDC {
  return UniswapV1USDC.bind(
    constants.UNISWAP_USDC_CONTRACT_ADDRESS.get(network)
  );
}

function getUniswapV1cDAIContract(network: string): UniswapV1cDAI {
  return UniswapV1cDAI.bind(
    constants.UNISWAP_cDAI_CONTRACT_ADDRESS.get(network)
  );
}

export function getTokenPriceFromUniswapV1(
  tokenAddr: Address,
  network: string
): CustomPriceType {
  let tokensMapping = constants.WHITELIST_TOKENS_MAP.get(network);

  if (tokenAddr == tokensMapping!.get("USDC")!) {
    return CustomPriceType.initialize(
      BigInt.fromString("10")
        .pow(constants.DEFAULT_USDC_DECIMALS as u8)
        .toBigDecimal(),
      constants.DEFAULT_USDC_DECIMALS
    );
  } else if (tokenAddr == tokensMapping!.get("USDT")!) {
    return CustomPriceType.initialize(
      BigInt.fromString("10")
        .pow(constants.DEFAULT_USDT_DECIMALS as u8)
        .toBigDecimal(),
      constants.DEFAULT_USDT_DECIMALS
    );
  } else if (tokenAddr == tokensMapping!.get("DAI")!) {
    return CustomPriceType.initialize(
      BigInt.fromString("10")
        .pow(constants.DEFAULT_DAI_DECIMALS as u8)
        .toBigDecimal(),
      constants.DEFAULT_DAI_DECIMALS
    );
  }

  const daiContract = getUniswapV1DaiContract(network);
  const usdcContract = getUniswapV1UsdcContract(network);
  if (!daiContract || !usdcContract) {
    return new CustomPriceType();
  }

  let daiToEthPrice: BigDecimal = utils
    .readValue<BigInt>(
      daiContract.try_getTokenToEthOutputPrice(
        BigInt.fromString("10").pow(constants.DEFAULT_ETH_DECIMALS as u8)
      ),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  let usdcToEthPrice: BigDecimal = utils
    .readValue<BigInt>(
      usdcContract.try_getTokenToEthOutputPrice(
        BigInt.fromString("10").pow(constants.DEFAULT_ETH_DECIMALS as u8)
      ),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  let ethPrice = daiToEthPrice
    .div(
      BigInt.fromString("10")
        .pow(constants.DEFAULT_DAI_DECIMALS as u8)
        .toBigDecimal()
    )
    .plus(
      usdcToEthPrice.div(
        BigInt.fromString("10")
          .pow(constants.DEFAULT_USDC_DECIMALS as u8)
          .toBigDecimal()
      )
    )
    .times(
      BigInt.fromString("10")
        .pow(constants.DEFAULT_ETH_DECIMALS as u8)
        .toBigDecimal()
    )
    .div(BigDecimal.fromString("2"));

  if (tokenAddr == tokensMapping!.get("ETH")!) {
    return CustomPriceType.initialize(ethPrice, constants.DEFAULT_ETH_DECIMALS);
  } else if (tokenAddr == tokensMapping!.get("cDAI")!) {
    let cDAIContract = getUniswapV1cDAIContract(network);

    let ethTocDAIPrice: BigDecimal = utils
      .readValue<BigInt>(
        cDAIContract.try_getEthToTokenOutputPrice(
          BigInt.fromString("10").pow(constants.DEFAULT_cDAI_DECIMALS as u8)
        ),
        constants.BIGINT_ZERO
      )
      .toBigDecimal();

    let cDAIPrice = ethTocDAIPrice.times(ethPrice);

    return CustomPriceType.initialize(
      cDAIPrice,
      2 * constants.DEFAULT_ETH_DECIMALS
    );
  }

  return new CustomPriceType();
}
