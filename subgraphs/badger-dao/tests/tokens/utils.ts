import { Address, ethereum } from '@graphprotocol/graph-ts';
import { createMockedFunction, newMockEvent } from 'matchstick-as';
import { Transfer } from '../../generated/templates/Token/ERC20';

export const mockTransferFunctions = (
  address: Address,
  name: string,
  symbol: string,
  decimal: i32,
): void => {
  createMockedFunction(address, 'name', 'name():(string)').returns([
    ethereum.Value.fromString(name),
  ]);
  createMockedFunction(address, 'symbol', 'symbol():(string)').returns([
    ethereum.Value.fromString(symbol),
  ]);
  createMockedFunction(address, 'decimals', 'decimals():(uint8)').returns([
    ethereum.Value.fromI32(decimal),
  ]);
};

export const createTransferEvent = (): Transfer => {
  let mockEvent = newMockEvent();
  let transferEvent = new Transfer(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
  );

  transferEvent.parameters = new Array();
  let from = new ethereum.EventParam(
    'from',
    ethereum.Value.fromAddress(
      Address.fromString('0x7c98C2DEc5038f00A2cbe8b7A64089f9c0b51991'),
    ),
  );
  let to = new ethereum.EventParam(
    'to',
    ethereum.Value.fromAddress(
      Address.fromString('0x7c98C2DEc5038f00A2cbe8b7A64089f9c0b51991'),
    ),
  );
  let value = new ethereum.EventParam('value', ethereum.Value.fromI32(19));

  transferEvent.parameters.push(from);
  transferEvent.parameters.push(to);
  transferEvent.parameters.push(value);
  return transferEvent;
};
