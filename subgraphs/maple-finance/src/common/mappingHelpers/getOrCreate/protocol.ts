import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

import { LendingProtocol, _PoolFactory } from "../../../../generated/schema";

import {
    PROTOCOL_ID,
    PROTOCOL_INITIAL_TREASURY_FEE,
    PROTOCOL_LENDING_TYPE,
    PROTOCOL_METHODOLOGY_VERSION,
    PROTOCOL_NAME,
    PROTOCOL_NETWORK,
    PROTOCOL_RISK_TYPE,
    PROTOCOL_SCHEMA_VERSION,
    PROTOCOL_SLUG,
    PROTOCOL_SUBGRAPH_VERSION,
    PROTOCOL_TYPE,
    ZERO_BD,
    ZERO_I32
} from "../../constants";

export function getOrCreateProtocol(): LendingProtocol {
    let protocol = LendingProtocol.load(PROTOCOL_ID);

    if (!protocol) {
        protocol = new LendingProtocol(PROTOCOL_ID);

        protocol.name = PROTOCOL_NAME;
        protocol.slug = PROTOCOL_SLUG;
        protocol.schemaVersion = PROTOCOL_SCHEMA_VERSION;
        protocol.subgraphVersion = PROTOCOL_SUBGRAPH_VERSION;
        protocol.methodologyVersion = PROTOCOL_METHODOLOGY_VERSION;
        protocol.network = PROTOCOL_NETWORK;
        protocol.type = PROTOCOL_TYPE;
        protocol.lendingType = PROTOCOL_LENDING_TYPE;
        protocol.riskType = PROTOCOL_RISK_TYPE;
        protocol.mintedTokens = new Array<string>();
        protocol.cumulativeUniqueUsers = ZERO_I32;
        protocol.totalValueLockedUSD = ZERO_BD;
        protocol.protocolControlledValueUSD = ZERO_BD;
        protocol.cumulativeSupplySideRevenueUSD = ZERO_BD;
        protocol.cumulativeProtocolSideRevenueUSD = ZERO_BD;
        protocol.cumulativeTotalRevenueUSD = ZERO_BD;
        protocol.totalDepositBalanceUSD = ZERO_BD;
        protocol.cumulativeDepositUSD = ZERO_BD;
        protocol.totalBorrowBalanceUSD = ZERO_BD;
        protocol.cumulativeBorrowUSD = ZERO_BD;
        protocol.cumulativeLiquidateUSD = ZERO_BD;
        protocol.mintedTokenSupplies = new Array<BigInt>();
        protocol.totalPoolCount = ZERO_I32;

        protocol._treasuryFee = PROTOCOL_INITIAL_TREASURY_FEE;

        protocol.save();
    }

    return protocol;
}

/**
 * Get the pool factory at poolFactoryAddress, or create it if it doesn't exist
 */
export function getOrCreatePoolFactory(event: ethereum.Event, poolFactoryAddress: Address): _PoolFactory {
    let poolFactory = _PoolFactory.load(poolFactoryAddress.toHexString());

    if (!poolFactory) {
        poolFactory = new _PoolFactory(poolFactoryAddress.toHexString());

        poolFactory.creationTimestamp = event.block.timestamp;
        poolFactory.creationBlockNumber = event.block.number;

        poolFactory.save();
    }

    return poolFactory;
}
