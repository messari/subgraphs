import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { SimplePriceOracle } from "../../../../generated/FairLaunch/SimplePriceOracle"
import { BIGINT_ZERO, SIMPLE_ORACLE_ADDRESS, USDC_ADDRESS } from "../../../../src/utils/constants";



export const PROTOCOL_NAME = "Alpaca Finance";
export const PROTOCOL_SLUG = "alpaca-finance-lending";
export const PROTOCOL_SCHEMA_VERSION = "2.0.1";
export const PROTOCOL_SUBGRAPH_VERSION = "1.0.1";
export const PROTOCOL_METHODOLOGY_VERSION = "1.0.0";

export namespace PositionSide {
    export const LENDER = "LENDER";
    export const BORROWER = "BORROWER";
}

export const fetchPriceSimpleOracle = (tokenAddr: Address): BigInt => {
    const oracle = SimplePriceOracle.bind(Address.fromString(SIMPLE_ORACLE_ADDRESS));
    const priceResult = oracle.try_getPrice(tokenAddr, Address.fromString(USDC_ADDRESS));
    if (priceResult.reverted) {
        log.info('ORACLE REVERT ' + tokenAddr.toHexString(), [])
        return BIGINT_ZERO;
    }

    return priceResult.value.value0;
}
