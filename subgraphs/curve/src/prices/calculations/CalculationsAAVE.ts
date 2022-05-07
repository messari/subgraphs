import { Atoken } from "../../../generated/MainRegistry/Atoken";
import { Address, log } from "@graphprotocol/graph-ts";
import { CustomPriceType } from "../common/types";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { getPriceUsdc } from "../routers/SushiSwapRouter";

function getUnderlyingPrice(tokenAddr: Address, network: string): CustomPriceType {
  if (utils.isStableCoin(tokenAddr,network)) {
      return CustomPriceType.initialize(constants.BIGDECIMAL_ONE);
  }
  return getPriceUsdc(tokenAddr, network);
}

export function getTokenPriceFromCalculationAave(tokenAddr: Address, network: string): CustomPriceType {
  let calculationAaveContract = Atoken.bind(tokenAddr);

  let underlyingTokenCall = calculationAaveContract.try_underlyingAssetAddress();
  if (underlyingTokenCall.reverted){
    let underlyingToken: Address = utils.readValue<Address>(
      calculationAaveContract.try_UNDERLYING_ASSET_ADDRESS(),
      constants.ZERO_ADDRESS,
    );
    if (underlyingToken == constants.ZERO_ADDRESS) {
      return new CustomPriceType();
    }
    return getUnderlyingPrice(underlyingToken, network);
  }
  let underlyingToken = underlyingTokenCall.value;
  return getUnderlyingPrice(underlyingToken, network);
}
