import { clearStore, test, assert, logStore } from 'matchstick-as/assembly/index'
import { LendingProtocol } from '../generated/schema';
import { handleProxyCreated } from '../src/mappings/lendingPoolAddressProvider'
import { getLendingPoolFromCtx, getProtocolIdFromCtx } from '../src/mappings/utilFunctions';
import { mockProxyCreatedEvent } from './createMockEvents';


export function runTests(): void {
  test('Test lending pool/protocol init', () => {
    // Initialise


    // Call mappings
    let mockEvent = mockProxyCreatedEvent()
    // log.info("id, newAddress, address", [mockEvent.params.id.toString(), mockEvent.params.newAddress.toHexString(), mockEvent.address.toHexString()])

    handleProxyCreated(mockEvent)

    // Test protocol entity and see if context is available
    // const contextLendingPool = getLendingPoolFromCtx()
    // const contextProtocol = getProtocolIdFromCtx()

    // assert.stringEquals(contextProtocol, 'aave-v2')
    // assert.stringEquals(contextLendingPool, mockEvent.address.toHexString())

    assert.fieldEquals("LendingProtocol", mockEvent.address.toHexString(), "network", "ETHEREUM")

    logStore()

    // log.info("proto, lendingpool", [contextProtocol, contextLendingPool])
    clearStore()
  })


}
