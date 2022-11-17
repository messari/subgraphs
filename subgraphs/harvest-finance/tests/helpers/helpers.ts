import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { newMockCall, newMockEvent } from 'matchstick-as'
import { AddVaultAndStrategyCall } from '../../generated/Controller/ControllerContract'

import * as mocking from './mocking'
import * as asserting from './asserting'

export function toStringArray(array: string[]): string {
  return '[' + array.toString() + ']'
}

export function mockAddVaultAndStrategyCall(
  vault: Address,
  strategy: Address
): AddVaultAndStrategyCall {
  let to = Address.fromString('0x222412af183bceadefd72e4cb1b71f1889953b1c')
  let from = Address.fromString('0x0000000000000000000000000000000000000001')
  let call = newMockCall()
  call.to = to
  call.from = from
  call.inputValues = [
    new ethereum.EventParam('vault', ethereum.Value.fromAddress(vault)),
    new ethereum.EventParam('strategy', ethereum.Value.fromAddress(strategy)),
  ]

  return changetype<AddVaultAndStrategyCall>(call)
}

export { mocking, asserting }
