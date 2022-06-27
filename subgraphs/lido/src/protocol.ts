import { Protocol } from "../generated/schema";
import { BIGDECIMAL_ZERO } from "./utils/constants";
import { BigDecimal } from "@graphprotocol/graph-ts";

import {
    PROTOCOL_NAME,
    PROTOCOL_SLUG,
    PROTOCOL_SCHEMA_VERSION,
    PROTOCOL_SUBGRAPH_VERSION,
    PROTOCOL_METHODOLOGY_VERSION,
    PROTOCOL_CONTRACT,
    Network,
    ProtocolType,
} from "./utils/constants";

export function getOrCreateProtocol(): Protocol {
    let protocol = Protocol.load(PROTOCOL_CONTRACT);

    if (!protocol) {
        protocol = new Protocol(PROTOCOL_CONTRACT);

        protocol.name = PROTOCOL_NAME;
        protocol.slug = PROTOCOL_SLUG;
        protocol.schemaVersion = PROTOCOL_SCHEMA_VERSION;
        protocol.subgraphVersion = PROTOCOL_SUBGRAPH_VERSION;
        protocol.methodologyVersion = PROTOCOL_METHODOLOGY_VERSION;

        protocol.network = Network.MAINNET;
        protocol.type = ProtocolType.GENERIC;
        protocol.totalPoolCount = 1; // 

        protocol.save();
    }

    return protocol;
}

export function updateProtocolTotalValueLockedUSD(): void {
    let totalValueLockedUSD = BIGDECIMAL_ZERO;
    // single vault, no loop needed
    // totalValueLockedUSD
    // calculate sum of deposits
    // calculate sum of deposits to ETH2 deposit contract from "LIDO + stETH" contract

}