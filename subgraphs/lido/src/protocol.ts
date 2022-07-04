import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Protocol } from "../generated/schema";
import {
    PROTOCOL_NAME,
    PROTOCOL_SLUG,
    PROTOCOL_SCHEMA_VERSION,
    PROTOCOL_SUBGRAPH_VERSION,
    PROTOCOL_METHODOLOGY_VERSION,
    PROTOCOL_ID,
    Network,
    BIGINT_ZERO,
    ProtocolType,
    BIGDECIMAL_ZERO
} from "./utils/constants";

// TODO: Do we want to allow the protocol contract as a param?
export function getOrCreateProtocol(): Protocol {
    let protocol = Protocol.load(PROTOCOL_ID);

    if (!protocol) {
        protocol = new Protocol(PROTOCOL_ID);

        protocol.name = PROTOCOL_NAME;
        protocol.slug = PROTOCOL_SLUG;
        protocol.schemaVersion = PROTOCOL_SCHEMA_VERSION;
        protocol.subgraphVersion = PROTOCOL_SUBGRAPH_VERSION;
        protocol.methodologyVersion = PROTOCOL_METHODOLOGY_VERSION;
        protocol.network = Network.MAINNET;
        protocol.type = ProtocolType.GENERIC;

        // Quantitative Data
        protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
        protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
        protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
        protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
        protocol.cumulativeUniqueUsers = 0;
        protocol.totalPoolCount = 0;

        protocol.save();
    }

    return protocol;
}
