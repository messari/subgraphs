import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { Token } from "../../../../generated/schema";
import {
    MAPLE_GLOBALS_ADDRESS,
    MAPLE_GLOBALS_ORACLE_QUOTE_DECIMALS,
    YEARN_ORACLE_ADDRESS,
    YEARN_ORACLE_QUOTE_DECIMALS,
    ZERO_BD
} from "../../constants";
import { YearnOracle } from "../../../../generated/templates/Pool/YearnOracle";

import { PriceQuote } from "../../types";
import { parseUnits } from "../../utils";

/**
 * Get a quote in USD from yearn oracle for token, this quote is only valid if valid is true.
 * If invalid, the value of the quote will be ZERO_BD
 * @param token token to get the quote for
 * @returns quote
 */
export function yearnOracleGetTokenPriceInUSD(token: Token): PriceQuote {
    const yearnOracleContract = YearnOracle.bind(YEARN_ORACLE_ADDRESS);

    const getLatestPriceCall = yearnOracleContract.try_getPriceUsdcRecommended(Address.fromString(token.id));

    const priceQuote: PriceQuote = {
        value: ZERO_BD,
        valid: false
    };

    if (!getLatestPriceCall.reverted) {
        const rawQuote = getLatestPriceCall.value;
        priceQuote.value = parseUnits(rawQuote, YEARN_ORACLE_QUOTE_DECIMALS);
        priceQuote.valid = true;
    }

    return priceQuote;
}
