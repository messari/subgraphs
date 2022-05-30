import { BigDecimal, ethereum, log } from "@graphprotocol/graph-ts";
import { Token } from "../../../generated/schema";
import { chainlinkOracleGetTokenPriceInUSD } from "./oracles/chainlink";
import { mapleOracleGetTokenPriceInUSD } from "./oracles/maple";
import { yearnOracleGetTokenPriceInUSD } from "./oracles/yearn";

/**
 * Get the token price in USD, this will try to get price from:
 *  1) maple globals oracle - this should be sufficent for most tokens, but not necesssairy for mpl rewards tokens
 *  2) chainlink oracle
 *  3) yearn oracle
 *
 * If all fail, it will return ZERO_BI, and log and error
 */
export function getTokenPriceInUSD(token: Token, event: ethereum.Event): BigDecimal {
    // Only update if it hasn't already been updated this block
    if (token.lastPriceBlockNumber != event.block.number) {
        let quote = mapleOracleGetTokenPriceInUSD(token);

        if (!quote.valid) {
            // Maple quote failed
            quote = chainlinkOracleGetTokenPriceInUSD(token);

            if (!quote.valid) {
                // Chainlink quote failed
                quote = yearnOracleGetTokenPriceInUSD(token);

                if (!quote.valid) {
                    // Yearn quote failed
                    log.error("Unable to get token price for {}", [token.id]);
                }
            }
        }

        token.lastPriceUSD = quote.value; // ZERO_BD if invalid
        token.lastPriceBlockNumber = event.block.number;
    }

    token.save();
    return token.lastPriceUSD;
}
