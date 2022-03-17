import { assert, test } from 'matchstick-as';
import { handleTransfer } from '../../src/handlers/tokens';
import { createTransferEvent, mockTransferFunctions } from './utils';

test('testing for badger and iBTC types', () => {
  let transferEvent = createTransferEvent();
  mockTransferFunctions(transferEvent.address, 'Badger', 'BADGER', 1338);
  handleTransfer(transferEvent);

  const id = transferEvent.address.toHex();
  assert.fieldEquals('Token', id, 'id', id);
  assert.fieldEquals('Token', id, 'name', 'Badger');
  assert.fieldEquals('Token', id, 'symbol', 'BADGER');
  assert.fieldEquals('Token', id, 'decimals', '1338');
});
