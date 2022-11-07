import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { Token } from "../../../../generated/schema";
import { MapleGlobals } from "../../../../generated/templates/Pool/MapleGlobals";
import { MAPLE_GLOBALS_ADDRESS, MAPLE_GLOBALS_ORACLE_QUOTE_DECIMALS } from "../../constants";
import { parseUnits } from "../../utils";

/**
 * Get token price in USD from maples oracle
 * @param token token to get the quote for
 * @returns token price or null if no price is available
 */
export function mapleOracleGetTokenPriceInUSD(token: Token): BigDecimal | null {
    const mapleGlobalsContract = MapleGlobals.bind(MAPLE_GLOBALS_ADDRESS);

    const getLatestPriceCall = mapleGlobalsContract.try_getLatestPrice(Address.fromString(token.id));

    let value: BigDecimal | null = null;

    if (!getLatestPriceCall.reverted) {
        const rawQuote = getLatestPriceCall.value;
        value = parseUnits(rawQuote, MAPLE_GLOBALS_ORACLE_QUOTE_DECIMALS.toI32());
    }

    return value;
}
