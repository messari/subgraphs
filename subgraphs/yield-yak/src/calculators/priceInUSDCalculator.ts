import { Address, BigInt, BigDecimal, log, bigInt } from "@graphprotocol/graph-ts";
import {
  ZERO_ADDRESS,
  WAVAX_CONTRACT_ADDRESS,
  ZERO_BIGDECIMAL,
  USDC_ADDRESS,
  YAK_ROUTER_ADDRESS
} from "../helpers/constants";
import { YakRouter } from '../../generated/YakStrategyV2/YakRouter';
import { convertBigIntToBigDecimal } from "../helpers/converters";

export function calculatePriceInUSD(tokenAddress: Address, amount: BigInt): BigDecimal {
  const avaxAddress = ZERO_ADDRESS;

  if (tokenAddress == avaxAddress) {
    tokenAddress = WAVAX_CONTRACT_ADDRESS;
  }

  let tokenPriceInUSDWithDecimal = getPriceInUsd("2", amount, tokenAddress)

  if (tokenPriceInUSDWithDecimal == ZERO_BIGDECIMAL) {
    tokenPriceInUSDWithDecimal = getPriceInUsd("3", amount, tokenAddress)
  }

  if (tokenPriceInUSDWithDecimal == ZERO_BIGDECIMAL) {
    tokenPriceInUSDWithDecimal = getPriceInUsd("4", amount, tokenAddress)
  }

  return tokenPriceInUSDWithDecimal;
}

function getPriceInUsd(pathLenght: string, amount: BigInt, tokenAddress: Address): BigDecimal {
  const usdcAddress = USDC_ADDRESS;
  const yakRouterAddress = YAK_ROUTER_ADDRESS;
  const yakRouter = YakRouter.bind(yakRouterAddress);
  let tokenPriceInUSDWithDecimal: BigDecimal;

  if (yakRouter.try_findBestPath(amount, tokenAddress, usdcAddress, BigInt.fromString(pathLenght)).reverted) {
    tokenPriceInUSDWithDecimal = ZERO_BIGDECIMAL;
  } else {
    const tokenPriceInUSDStructure = yakRouter.findBestPath(amount, tokenAddress, usdcAddress, bigInt.fromString(pathLenght));

    if (tokenPriceInUSDStructure.amounts.length == 0) {
      tokenPriceInUSDWithDecimal = ZERO_BIGDECIMAL;
    } else {
      if (tokenPriceInUSDStructure.path[tokenPriceInUSDStructure.amounts.length - 1] == usdcAddress) {
        tokenPriceInUSDWithDecimal = convertBigIntToBigDecimal(tokenPriceInUSDStructure.amounts[tokenPriceInUSDStructure.amounts.length - 1], 6);
      } else {
        tokenPriceInUSDWithDecimal = ZERO_BIGDECIMAL;
      }
    }
  }

  return tokenPriceInUSDWithDecimal
}