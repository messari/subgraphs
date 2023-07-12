import * as constants from "./constants";
import * as MAINNET from "../config/mainnet";
import { Configurations, ContractInfo } from "./types";
import { _ERC20 } from "../../../generated/templates/Strategy/_ERC20";
import { BigInt, Address, ethereum, BigDecimal } from "@graphprotocol/graph-ts";

export function isNullAddress(tokenAddr: Address): boolean {
  return tokenAddr.equals(constants.NULL.TYPE_ADDRESS) ? true : false;
}

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function absBigDecimal(value: BigDecimal): BigDecimal {
  if (value.lt(constants.BIGDECIMAL_ZERO))
    return value.times(constants.BIGDECIMAL_NEG_ONE);
  return value;
}

export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
  if (amount1.equals(constants.BIGDECIMAL_ZERO)) {
    return constants.BIGDECIMAL_ZERO;
  } else {
    return amount0.div(amount1);
  }
}

export function exponentToBigDecimal(decimals: i32): BigDecimal {
  return constants.BIGINT_TEN.pow(decimals as u8).toBigDecimal();
}

export function getContract(
  contractInfo: ContractInfo | null,
  block: ethereum.Block | null = null
): Address | null {
  if (!contractInfo || (block && contractInfo.startBlock.gt(block.number)))
    return null;

  return contractInfo.address;
}

export function getTokenName(tokenAddr: Address): string {
  const tokenContract = _ERC20.bind(tokenAddr);
  const name = readValue<string>(tokenContract.try_name(), "");

  return name;
}

export function getTokenDecimals(tokenAddr: Address): BigInt {
  const tokenContract = _ERC20.bind(tokenAddr);

  const decimals = readValue<BigInt>(
    tokenContract.try_decimals(),
    constants.DEFAULT_DECIMALS
  );

  return decimals;
}

export function getTokenSupply(tokenAddr: Address): BigInt {
  const tokenContract = _ERC20.bind(tokenAddr);

  const totalSupply = readValue<BigInt>(
    tokenContract.try_totalSupply(),
    constants.BIGINT_ONE
  );

  return totalSupply;
}
export function getConfig(): Configurations {
  return new MAINNET.config();
}
