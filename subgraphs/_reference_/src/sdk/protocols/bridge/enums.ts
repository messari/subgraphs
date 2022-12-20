export namespace BridgePermissionType {
  export const WHITELIST = "WHITELIST";
  export const PERMISSIONLESS = "PERMISSIONLESS";
  export const PRIVATE = "PRIVATE";
}
export type BridgePermissionType = string;

export namespace BridgePoolType {
  export const LOCK_RELEASE = "LOCK_RELEASE";
  export const BURN_MINT = "BURN_MINT";
  export const LIQUIDITY = "LIQUIDITY";
}
export type BridgePoolType = string;

export namespace TransferType {
  export const MINT = "MINT";
  export const BURN = "BURN";
  export const LOCK = "LOCK";
  export const RELEASE = "RELEASE";
}
export type TransferType = string;

export namespace TransactionType {
  export const LIQUIDITY_DEPOSIT = "LIQUIDITY_DEPOSIT";
  export const LIQUIDITY_WITHDRAW = "LIQUIDITY_WITHDRAW";
  export const TRANSFER_IN = "TRANSFER_IN";
  export const TRANSFER_OUT = "TRANSFER_OUT";
  export const MESSAGE_SENT = "MESSAGE_SENT";
  export const MESSAGE_RECEIVED = "MESSAGE_RECEIVED";
  export const OTHER = "OTHER";
}
export type TransactionType = string;

export namespace CrosschainTokenType {
  export const WRAPPED = "WRAPPED";
  export const CANONICAL = "CANONICAL";
}
export type CrosschainTokenType = string;
