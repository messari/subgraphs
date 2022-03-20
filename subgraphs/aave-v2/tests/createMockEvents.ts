import { Address, ByteArray, Bytes, ethereum } from "@graphprotocol/graph-ts"
import { ProxyCreated } from "../generated/templates/LendingPoolAddressesProvider/LendingPoolAddressesProvider"
import { newMockEvent } from "matchstick-as"

export { runTests } from "./aave.test";


export function mockProxyCreatedEvent(): ProxyCreated {
  let mockEvent = newMockEvent()
  let newProxyCreatedEvent = new ProxyCreated(
    Address.fromString("0xb53c1a33016b2dc2ff3653530bff1848a515c8c5"),
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters
  )
  newProxyCreatedEvent.parameters = new Array()

  const idParamStr: string = ("LENDING_POOL_CONFIGURATOR")
  const idparamBytes: ByteArray = new ByteArray(32)
  idparamBytes[0] = 4

  let idParam = new ethereum.EventParam('id', ethereum.Value.fromString(idParamStr))
  let addressParam = new ethereum.EventParam('address', ethereum.Value.fromAddress(Address.fromString("0x311bb771e4f8952e6da169b425e7e92d6ac45756")))

  newProxyCreatedEvent.parameters.push(idParam)
  newProxyCreatedEvent.parameters.push(addressParam)

  return newProxyCreatedEvent
}