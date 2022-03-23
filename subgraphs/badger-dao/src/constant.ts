import { Address } from '@graphprotocol/graph-ts';

// default no of decimals for tokens
export const DEFAULT_DECIMALS = 18;

// no of seconds of a day
export const SECONDS_PER_DAY = 84600;

export const PROTOCOL_ID = Address.fromString(
  '0xFda7eB6f8b7a9e9fCFd348042ae675d1d652454f',
);
export const PROTOCOL_NAME = 'Badger DAO';
export const PROTOCOL_SLUG = 'badger';
export const PROTOCOL_TYPE = 'YIELD';

// null address
export const NULL_ADDRESS = Address.fromString(
  '0x0000000000000000000000000000000000000000',
);
