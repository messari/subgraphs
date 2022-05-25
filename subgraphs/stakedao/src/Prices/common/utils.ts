import * as constants from "./constants";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { PriceOracleERC20 } from "../../../generated/Controller/PriceOracleERC20";

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function getTokenDecimals(tokenAddr: Address): BigInt {
  const token = PriceOracleERC20.bind(tokenAddr);

  let decimals = readValue<BigInt>(
    token.try_decimals(),
    constants.DEFAULT_DECIMALS
  );

  return decimals;
}
