import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { Token } from "../../../../generated/schema";
import { ChainLinkOracle } from "../../../../generated/templates/Pool/ChainLinkOracle";

import { CHAIN_LINK_ORACLE_ADDRESS, CHAIN_LINK_ORACLE_QUOTE_DECIMALS, CHAIN_LINK_USD_ADDRESS } from "../../constants";
import { parseUnits } from "../../utils";

/**
 * Get token price in USD from chain link oracle
 * @param token token to get the quote for
 * @returns token price or null if no price is available
 */
export function chainlinkOracleGetTokenPriceInUSD(token: Token): BigDecimal | null {
    const chainLinkContract = ChainLinkOracle.bind(CHAIN_LINK_ORACLE_ADDRESS);

    const latestRoundDataCall = chainLinkContract.try_latestRoundData(
        Address.fromString(token.id),
        CHAIN_LINK_USD_ADDRESS
    );

    let price: BigDecimal | null = null;

    if (!latestRoundDataCall.reverted) {
        const rawQuote = latestRoundDataCall.value.value1;
        price = parseUnits(rawQuote, CHAIN_LINK_ORACLE_QUOTE_DECIMALS);
    }

    return price;
}
