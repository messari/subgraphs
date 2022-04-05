import { Address, ethereum } from "@graphprotocol/graph-ts"
import {
    Token,
    DexAmmProtocol,
    LiquidityPool,
} from "../../generated/schema"

import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from './tokens'
import {
    BIGDECIMAL_ZERO,
    Network,
    INT_ZERO,
    VAULT_ADDRESS,
    ProtocolType,
    SECONDS_PER_DAY,
    DEFAULT_DECIMALS,
    BIGINT_ZERO
} from "../common/constants"

export function getOrCreateDex(): DexAmmProtocol {
    let protocol = DexAmmProtocol.load(VAULT_ADDRESS)

    if (protocol === null) {
        protocol = new DexAmmProtocol(VAULT_ADDRESS)
        protocol.name = "Balancer V2"
        protocol.schemaVersion = "0.0.2"
        protocol.subgraphVersion = "0.0.2"
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

export function createPool(id: string, address: Address, blockInfo: ethereum.Block): void {
    let pool = new LiquidityPool(id)
    let outputToken = getOrCreateToken(address)
    pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    pool.totalVolumeUSD = BIGDECIMAL_ZERO;
    pool.inputTokenBalances = [BIGINT_ZERO];
    pool.outputTokenSupply = BIGINT_ZERO;
    pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    pool.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    pool.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];
    pool.createdBlockNumber = blockInfo.number
    pool.createdTimestamp = blockInfo.timestamp
    pool.outputToken = outputToken.id
    pool.save()
}
