import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { SimplePriceOracle } from "../../../../generated/templates/Vault/SimplePriceOracle";
import { BIGINT_ONE, BIGINT_ZERO, SIMPLE_ORACLE_ADDRESS, BUSD_ADDRESS, BIGINT_TEN_TO_EIGHTEENTH } from "../../../../src/utils/constants";

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
    if (tokenAddr.equals(Address.fromString(BUSD_ADDRESS))) {
        return BIGINT_TEN_TO_EIGHTEENTH;
    }
    const oracle = SimplePriceOracle.bind(Address.fromString(SIMPLE_ORACLE_ADDRESS));
    const priceResult = oracle.try_getPrice(tokenAddr, Address.fromString(BUSD_ADDRESS));
    if (priceResult.reverted) {
        log.info('ORACLE REVERSION ' + tokenAddr.toHexString(), [])
        return BIGINT_TEN_TO_EIGHTEENTH;
    }
    log.info('ORACLE RETURNED ' + priceResult.value.value0.toString(), [])
    return priceResult.value.value0;
}
