import { readValue } from "../common/utils";
import * as constants from "../common/constants";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { YearnLensContract } from "../../generated/Controller/YearnLensContract";

export function getYearnLensContract(network: string): YearnLensContract {
  return YearnLensContract.bind(
    Address.fromString(constants.YEARN_LENS_CONTRACT_ADDRESS.get(network))
  );
}

export function getTokenPriceFromYearnLens(
  tokenAddr: Address,
  network: string
): BigDecimal {
  const yearnLensContract = getYearnLensContract(network);

  if (!yearnLensContract) {
    return constants.BIGDECIMAL_ZERO;
  }

  let tokenPrice: BigDecimal = readValue<BigInt>(
    yearnLensContract.try_getPriceUsdcRecommended(tokenAddr),
    constants.BIGINT_ZERO
  ).toBigDecimal();

  return tokenPrice;
}
