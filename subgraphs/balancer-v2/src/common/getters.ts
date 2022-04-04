import { Address, ethereum } from "@graphprotocol/graph-ts"
import {
    Token,
    DexAmmProtocol,
    LiquidityPool,
} from "../../generated/schema"

import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from './tokens'
import { BIGDECIMAL_ZERO, Network, INT_ZERO, VAULT_ADDRESSES, ProtocolType, SECONDS_PER_DAY, DEFAULT_DECIMALS } from "../common/constants"

export function getOrCreateDex(): DexAmmProtocol {
    let protocol = DexAmmProtocol.load(VAULT_ADDRESSES[Network.ETHEREUM])

    if (protocol === null) {
        protocol = new DexAmmProtocol(VAULT_ADDRESSES[Network.ETHEREUM])
        protocol.name = "Balancer V2"
        protocol.schemaVersion = "1.0.0"
        protocol.subgraphVersion = "1.0.0"
        protocol.totalValueLockedUSD = BIGDECIMAL_ZERO
        protocol.network = Network.ETHEREUM
        protocol.type = ProtocolType.EXCHANGE

        protocol.save()
    }
    return protocol
}

export function getOrCreateToken(tokenAddress: Address): Token {
    let token = Token.load(tokenAddress.toHexString())
    // fetch info if null
    if (token === null) {
        token = new Token(tokenAddress.toHexString())
        token.symbol = fetchTokenSymbol(tokenAddress)
        token.name = fetchTokenName(tokenAddress)
        token.decimals = fetchTokenDecimals(tokenAddress)
        token.save()
    }
    return token
}

export function getOrCreatePool(id: string, address?: Address): LiquidityPool {
    let pool = LiquidityPool.load(id)

    if (pool === null) {
        pool = new LiquidityPool(id)
        pool.outputToken = address!.toHexString()


        pool.save()
    }

    return pool
}

