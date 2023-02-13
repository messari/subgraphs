export namespace TransactionType {
  export const DEPOSIT = "DEPOSIT";
  export const WITHDRAW = "WITHDRAW";
  export const BORROW = "BORROW";
  export const COLLATERAL_IN = "COLLATERAL_IN";
  export const COLLATERAL_OUT = "COLLATERAL_OUT";
}
export type TransactionType = string;

export namespace PositionType {
  export const LONG = "LONG";
  export const SHORT = "SHORT";
  export const OPEN = "OPEN";
  export const CLOSED = "CLOSED";
}
export type PositionType = string;


