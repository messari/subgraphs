// helper functions for ./mappings.ts

import { 
    Token,
    LendingProtocol,
    Market,
    Deposit,
    Withdraw,
    Borrow1,
    Repay,
    Liquidation,
    
} from "../types/schema"

import { 
    MARKET_LIST,
    ADDRESS_ZERO
 } from "../common/addresses"
import {
    NETWORK_ETHEREUM,
    PROTOCOL_TYPE_LENDING,
    PROTOCOL_NAME,
    PROTOCOL_SLUG
} from "../common/constants"
import { Address } from "@graphprotocol/graph-ts"

// find market address
export function findMarketAddress(address: Address | null): Address {
    if (address == null) {
        return ADDRESS_ZERO
    }
    MARKET_LIST.forEach(function (mktAddress) {
        if (mktAddress == address) {
            return mktAddress
        }
    });
    return ADDRESS_ZERO
}

// TODO: helper for converting uni time to days

// TODO: create new market

// create a LendingProtocol based off params
export function createLendingProtocol(
    protocolId: string,
    protocolName: string,
    protocolSlug: string,
    network: string,
    protocolType: string
): LendingProtocol {
    let lendingProtocol = new LendingProtocol(protocolId)
    lendingProtocol.name = protocolName
    lendingProtocol.slug = protocolSlug
    lendingProtocol.network = network
    lendingProtocol.type = protocolType

    // create empty lists that will be populated each day
    lendingProtocol.usageMetrics = []
    lendingProtocol.financialMetrics = []

    return lendingProtocol
}

// TODO: create function to get usd price
