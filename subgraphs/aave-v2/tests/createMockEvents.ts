import { Address, ByteArray, Bytes, DataSourceContext, ethereum, log } from "@graphprotocol/graph-ts"
import { LendingPoolAddressesProvider, ProxyCreated } from "../generated/templates/LendingPoolAddressesProvider/LendingPoolAddressesProvider"
import { createMockedFunction, newMockEvent } from "matchstick-as"
import { startIndexingLendingPool, startIndexingLendingPoolConfigurator } from "../src/mappings/lendingPoolAddressProvider"
import { initMarket, fetchProtocolEntity, initToken } from "../src/mappings/utilFunctions"
import { Market, Token } from "../generated/schema"
import { ReserveInitialized } from "../generated/templates/LendingPoolConfigurator/LendingPoolConfigurator"

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
  const idParamBytes: Bytes = Bytes.fromUTF8(idParamStr)

  let idParam = new ethereum.EventParam('id', ethereum.Value.fromBytes(idParamBytes));
  let addressParam = new ethereum.EventParam('address', ethereum.Value.fromAddress(Address.fromString("0x311bb771e4f8952e6da169b425e7e92d6ac45756")))

  newProxyCreatedEvent.parameters.push(idParam)
  newProxyCreatedEvent.parameters.push(addressParam)

  return newProxyCreatedEvent
}

export function handleProxyCreated(event: ProxyCreated): void {
  // Event handler for lending pool or configurator contract creation
  let pool = event.params.id.toString();
  let address = event.params.newAddress;
  log.info('pool:,' + pool + '- address: '+ address.toHexString()+ ' in handleProxyCreated', [pool, address.toHexString()])
  const context = initiateContext(event.address);

  if (pool == "LENDING_POOL") {
    startIndexingLendingPool(address, context);
  } else if (pool == "LENDING_POOL_CONFIGURATOR") {
    startIndexingLendingPoolConfigurator(address, context);
  }
}


function initiateContext(addrProvider: Address): DataSourceContext {
  // Add Lending Pool/Market address, price oracle contract address, and protocol id to the context for general accessibility
  // Need to verify that context is accessible from any file importing dataSource? or just scripts for templates directly called to createWithContext


  const lendingProtocol = fetchProtocolEntity('aave-v2');
  const context = new DataSourceContext();
  context.setString("protocolId", lendingProtocol.id);
  return context
}

// export function mockResInitEvent(): ReserveInitialized {
//   let mockEvent = newMockEvent()
//   let newProxyCreatedEvent = new ReserveInitialized(
//     Address.fromString("0xb53c1a33016b2dc2ff3653530bff1848a515c8c5"),
//     mockEvent.logIndex,
//     mockEvent.transactionLogIndex,
//     mockEvent.logType,
//     mockEvent.block,
//     mockEvent.transaction,
//     mockEvent.parameters
//   )
//   newProxyCreatedEvent.parameters = new Array()
//   const idParamStr: string = ("LENDING_POOL_CONFIGURATOR")
//   const idParamBytes: Bytes = Bytes.fromUTF8(idParamStr)

//   let idParam = new ethereum.EventParam('id', ethereum.Value.fromBytes(idParamBytes));
//   let addressParam = new ethereum.EventParam('address', ethereum.Value.fromAddress(Address.fromString("0x311bb771e4f8952e6da169b425e7e92d6ac45756")))

//   newProxyCreatedEvent.parameters.push(idParam)
//   newProxyCreatedEvent.parameters.push(addressParam)

//   return newProxyCreatedEvent
// }

// export function handleReserveInitialized(event: ReserveInitialized): void {
//   // This function handles market/lending pool/reserve creation
//   // Attempt to load the market implementation using the loadMarket() function
//   const marketAddr =  '0xb53c1a33016b2dc2ff3653530bff1848a515c8c5';
//   log.info('MarketAddr From Context in lendingPoolConfigurator.ts handleReserveInitialized: ' + marketAddr , [marketAddr])
//   let market = Market.load(marketAddr);
//   if (market === null) {

//     // If the market entity has not been created yet, send the following data to the createMarket function to initialize a new implementation of a Market entity
//     // The lending pool asset and corresponding aToken asset are loaded or created as an implementation of a Token entity
//     const token = initToken(event.params.asset);
//     const aToken = initToken(event.params.aToken);
//     // The input token, which would be the event token implemented above
//     const inputTokens: Token[] = [token];
//     // Output token is the corresponding aToken
//     const outputToken = aToken;
//     // rewardTokens array initiated as empty
//     // The reward token address is pulled from the contract in the handleATokenInitialized event handler in the aToken.ts mapping script
//     const rewardTokens: Token[] = [];
//     market = createMarket(
//         event,
//         marketAddr,
//         inputTokens,
//         outputToken,
//         rewardTokens
//     );
//     log.info('CREATED? ' + market.id + market.createdBlockNumber.toHexString(), [marketAddr])
//   }
// }
