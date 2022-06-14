import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { YetiController } from "../../../generated/ActivePool/YetiController";

export function getYetiControllerContract(): YetiController {
  return YetiController.bind(
    Address.fromString(constants.YETI_CONTROLLER)
  );
}

export function getTokenPriceFromYetiController(
  tokenAddr: Address,
  network: string
): CustomPriceType {
  const yetiControllerContract = getYetiControllerContract();

  if (!yetiControllerContract) {
    return new CustomPriceType();
  }

 const result = yetiControllerContract.try_getPrice(tokenAddr)


    if (!result.reverted) {
        let decimals = yetiControllerContract.try_DECIMAL_PRECISION();
    
        if (decimals.reverted) {
          new CustomPriceType();
        }
    
        return CustomPriceType.initialize(
          result.value.toBigDecimal(),
          decimals.value.toI32()
        );
      }   
  return new CustomPriceType();
}
