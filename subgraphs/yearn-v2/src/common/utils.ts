import * as constants from "../common/constants";
import { VaultFee } from "../../generated/schema";
import { BigInt, Address, ethereum } from "@graphprotocol/graph-ts";
import { ERC20 as ERC20Contract } from "../../generated/Registry_v1/ERC20";

export function getTimestampInMillis(block: ethereum.Block): BigInt {
  return block.timestamp.times(BigInt.fromI32(1000));
}

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function getTokenDecimals(tokenAddr: Address): BigInt {
  const token = ERC20Contract.bind(tokenAddr);

  let decimals = readValue<BigInt>(
    token.try_decimals(),
    constants.DEFAULT_DECIMALS
  );

  return decimals;
}

export function createFeeType(
  feeId: string,
  feeType: string,
  feePercentage: BigInt
): void {
  const fees = new VaultFee(feeId);

  fees.feeType = feeType;
  fees.feePercentage = feePercentage
    .toBigDecimal()
    .div(constants.BIGDECIMAL_HUNDRED);

  fees.save();
}
