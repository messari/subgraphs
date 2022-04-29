import { Atoken } from "../../../generated/MainRegistry/Atoken"
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { CustomPriceType } from "../common/types";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { getPriceUsdc } from "../routers/SushiSwapRouter";



export function getTokenPriceFromCalculationAave(
    tokenAddr: Address,
    network: string
  ): CustomPriceType {
    let calculationAaveContract = Atoken.bind(tokenAddr)
    let underlyingToken: Address = utils.readValue<Address>(calculationAaveContract.try_UNDERLYING_ASSET_ADDRESS(),constants.ZERO_ADDRESS)
    if (underlyingToken == constants.ZERO_ADDRESS) {
      return new CustomPriceType()
    }
    return getPriceUsdc(underlyingToken, network);
  }
