import { log } from '@graphprotocol/graph-ts';
import { clearStore, test, assert, logStore } from 'matchstick-as/assembly/index'
import { LendingProtocol } from '../generated/schema';
import { handleProxyCreated } from './createMockEvents'
import { getLendingPoolFromCtx, getProtocolIdFromCtx, initMarket } from '../src/mappings/utilFunctions';
import { mockProxyCreatedEvent } from './createMockEvents';
import { BIGDECIMAL_ZERO } from '../src/common/constants';


  test('Test lending pool/protocol init', () => {
    // Initialise

    // Call mappings
    let mockEvent = mockProxyCreatedEvent()
    log.info("id, newAddress, address", [mockEvent.params.id.toString(), mockEvent.params.newAddress.toHexString(), mockEvent.address.toHexString()])

    const market = initMarket(
      mockEvent.block.number,
      mockEvent.block.timestamp,
      mockEvent.params.asset.toHexString(),
    );
    handleProxyCreated(mockEvent)

    assert.fieldEquals("LendingProtocol", 'aave-v2', "totalFeesUSD", BIGDECIMAL_ZERO.toString())

    logStore()

    // log.info("proto, lendingpool", [contextProtocol, contextLendingPool])
    clearStore()
  })

