import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { YetiController } from "../../generated/ActivePool/YetiController";
import { getOrCreateToken } from "../entities/token";
import { BIGDECIMAL_TWO, BIGDECIMAL_ZERO, BIGINT_TEN, YETI_CONTROLLER } from "./constants";

export function getUSDPriceWithoutDecimals(tokenAddr: Address, amount: BigDecimal): BigDecimal {
  
    const token = getOrCreateToken(tokenAddr);
    return getUSDPrice(tokenAddr).times(amount).div(BIGINT_TEN.pow(token.decimals as u8).toBigDecimal());
}

export function getUSDPrice(tokenAddr: Address): BigDecimal {
    const yetiControllerContract = YetiController.bind(Address.fromString(YETI_CONTROLLER));
  
    const result = yetiControllerContract.try_getPrice(tokenAddr);
    if (!result.reverted) {
      let decimals = yetiControllerContract.try_DECIMAL_PRECISION();
        if(decimals.reverted) {
            return BIGDECIMAL_ZERO;
        }
        return result.value.div(decimals.value).toBigDecimal();
    }
    return BIGDECIMAL_ZERO
}

export function getAsssetsUSD(tokens: Address[], amounts: BigInt[]): BigDecimal {
    let totalAmount = BIGDECIMAL_ZERO;
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const amount = amounts[i];
        totalAmount = totalAmount.plus(getUSDPriceWithoutDecimals(token, amount.toBigDecimal()));
    }
    return totalAmount
}