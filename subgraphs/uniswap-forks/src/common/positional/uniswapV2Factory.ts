import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts"
import { Pair as PairEntity, Token } from "../../../generated/schema"
import { Pair } from "../../../generated/templates"
import {
  PairCreated
} from "../../../generated/Factory/Factory"
import {
  getOrCreateAccount,
  getOrCreateMarket
} from "./common"
import { ProtocolType } from "./../constants"

export function positionalPairCreated(
  event: ethereum.Event, 
  protocolName: string,
  pairAddressHex: string,
  token0: Token,
  token1: Token,
  lpToken: Token
): void {
  let market = getOrCreateMarket(
    event,
    Address.fromString(pairAddressHex),
    protocolName,
    ProtocolType.EXCHANGE,
    [token0, token1],
    lpToken,
    []
  )

  // Create pair
  let pair = new PairEntity(pairAddressHex)
  pair.factory = getOrCreateAccount(event.address).id
  pair.token0 = token0.id
  pair.token1 = token1.id
  pair.totalSupply = BigInt.fromI32(0)
  pair.reserve0 = BigInt.fromI32(0)
  pair.reserve1 = BigInt.fromI32(0)
  pair.blockNumber = event.block.number
  pair.timestamp = event.block.timestamp
  pair.save()
}
