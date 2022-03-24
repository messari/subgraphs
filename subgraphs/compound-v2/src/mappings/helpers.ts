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
    ADDRESS_ZERO,
    COMPTROLLER_ADDRESS,
    PRICE_ORACLE1_ADDRESS
 } from "../common/addresses"
import {
    NETWORK_ETHEREUM,
    PROTOCOL_TYPE_LENDING,
    PROTOCOL_NAME,
    PROTOCOL_SLUG
} from "../common/constants"
import { Address, BigDecimal } from "@graphprotocol/graph-ts"

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

// TODO: update market

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

// get price of erc20 tokens (NOT eth)
function getTokenPrice(
    blockNumber: i32,
    eventAddress: Address,
    assetAddress: Address,
    assetDecimals: i32
): BigDecimal {
    let lendingProtocol = LendingProtocol.load(COMPTROLLER_ADDRESS.toHexString())
    let oracle2Address = lendingProtocol?._priceOracle as Address
    let underlyingPrice: BigDecimal
    let oracle1Address = PRICE_ORACLE1_ADDRESS

    /**
     * Note: The first Price oracle was only used for the first ~100 blocks:
     *    https://etherscan.io/address/0x02557a5E05DeFeFFD4cAe6D83eA3d173B272c904
     * 
     */
}
