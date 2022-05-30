import { Address } from "@graphprotocol/graph-ts";
import { Token } from "../../../../generated/schema";
import {
    CHAIN_LINK_ORACLE_ADDRESS,
    CHAIN_LINK_ORACLE_QUOTE_DECIMALS,
    CHAIN_LINK_USD_ADDRESS,
    ZERO_BD
} from "../../constants";
import { ChainLinkOracle } from "../../../../generated/templates/Pool/ChainLinkOracle";

import { PriceQuote } from "../../types";
import { parseUnits } from "../../utils";

/**
 * Get a quote in USD from chain link oracle for token, this quote is only valid if valid is true.
 * If invalid, the value of the quote will be ZERO_BD
 * @param token token to get the quote for
 * @returns quote
 */
export function chainlinkOracleGetTokenPriceInUSD(token: Token): PriceQuote {
    const chainLinkContract = ChainLinkOracle.bind(CHAIN_LINK_ORACLE_ADDRESS);

    const latestRoundDataCall = chainLinkContract.try_latestRoundData(
        Address.fromString(token.id),
        CHAIN_LINK_USD_ADDRESS
    );

    const priceQuote: PriceQuote = {
        value: ZERO_BD,
        valid: false
    };

    if (!latestRoundDataCall.reverted) {
        const rawQuote = latestRoundDataCall.value.value1;
        priceQuote.value = parseUnits(rawQuote, CHAIN_LINK_ORACLE_QUOTE_DECIMALS);
        priceQuote.valid = true;
    }

    return priceQuote;
}
