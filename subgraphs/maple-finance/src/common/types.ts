import { BigDecimal } from "@graphprotocol/graph-ts";

export interface PriceQuote {
    valid: boolean;
    value: BigDecimal;
}
