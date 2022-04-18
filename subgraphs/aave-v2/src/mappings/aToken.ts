import {
  Burn,
  Mint
} from '../../generated/templates/AToken/AToken';

import {
  getOutputTokenSupply
} from './utilFunctions';

import { log } from '@graphprotocol/graph-ts';

// THE MINT/BURN HANDLERS ARE WHAT MANAGE THE OUTPUT TOKEN SUPPLY
// The mint/burn handlers are essentially extensions of deposit/withdraw events to manage the aToken/outputToken

export function handleATokenMint(event: Mint): void {
  // Event handler for AToken mints. This gets triggered upon deposits
  log.info('MINTING ATOKEN: ' + event.address.toHexString(), []);
  getOutputTokenSupply(event);
}

export function handleATokenBurn(event: Burn): void {
  // Event handler for AToken burns. This gets triggered upon withdraws
  log.info('BURNING ATOKEN: ' + event.address.toHexString(), []);
  getOutputTokenSupply(event);
}
