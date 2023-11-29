export namespace TransactionType {
  export const DEPOSIT = "DEPOSIT";
  export const WITHDRAW = "WITHDRAW";
  export const BORROW = "BORROW";
  export const SWAP = "SWAP";
  export const COLLATERAL_IN = "COLLATERAL_IN";
  export const COLLATERAL_OUT = "COLLATERAL_OUT";
  export const LIQUIDATE = "LIQUIDATE";
}
export type TransactionType = string;

export namespace PositionType {
  export const LONG = "LONG";
  export const SHORT = "SHORT";
}
export type PositionType = string;

export namespace EventType {
  export const DEPOSIT = "DEPOSIT";
  export const WITHDRAW = "WITHDRAW";
  export const SWAP = "SWAP";
  export const LIQUIDATE = "LIQUIDATE";
}
export type EventType = string;

export namespace ActivityType {
  export const LIQUIDATOR = "LIQUIDATOR";
  export const LIQUIDATEE = "LIQUIDATEE";
  export const DEPOSIT = "DEPOSIT";
  export const BORROW = "BORROW";
}
export type ActivityType = string;
