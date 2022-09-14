import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { Token } from "../../../../generated/schema";
import { YearnOracle } from "../../../../generated/templates/Pool/YearnOracle";

import { YEARN_ORACLE_ADDRESS, YEARN_ORACLE_QUOTE_DECIMALS } from "../../constants";
import { parseUnits } from "../../utils";

/**
 * Get a quote in USD from yearn oracle for token, this quote is only valid if valid is true.
 * If invalid, the value of the quote will be ZERO_BD
 * @param token token to get the quote for
 * @returns quote
 */
export function yearnOracleGetTokenPriceInUSD(token: Token): BigDecimal | null {
    const yearnOracleContract = YearnOracle.bind(YEARN_ORACLE_ADDRESS);

    const getLatestPriceCall = yearnOracleContract.try_getPriceUsdcRecommended(Address.fromString(token.id));

    let price: BigDecimal | null = null;

    if (!getLatestPriceCall.reverted) {
        const rawQuote = getLatestPriceCall.value;
        price = parseUnits(rawQuote, YEARN_ORACLE_QUOTE_DECIMALS);
    }

    return price;
}
