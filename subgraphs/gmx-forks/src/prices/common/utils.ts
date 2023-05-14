import {
  BigInt,
  Address,
  ethereum,
  dataSource,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import * as XDAI from "../config/gnosis";
import * as AURORA from "../config/aurora";
import * as FANTOM from "../config/fantom";
import * as POLYGON from "../config/polygon";
import * as MAINNET from "../config/mainnet";
import * as HARMONY from "../config/harmony";
import * as MOONBEAM from "../config/moonbeam";
import * as OPTIMISM from "../config/optimism";
import * as AVALANCHE from "../config/avalanche";
import * as ARBITRUM_ONE from "../config/arbitrum";

import * as constants from "./constants";
import { Configurations, ContractInfo } from "./types";
import { _ERC20 } from "../../../generated/templates/MlpManagerTemplate/_ERC20";

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
  const network = dataSource.network();

  if (network == XDAI.NETWORK_STRING) {
    return new XDAI.config();
  } else if (network == AURORA.NETWORK_STRING) {
    return new AURORA.config();
  } else if (network == FANTOM.NETWORK_STRING) {
    return new FANTOM.config();
  } else if (network == POLYGON.NETWORK_STRING) {
    return new POLYGON.config();
  } else if (network == MAINNET.NETWORK_STRING) {
    return new MAINNET.config();
  } else if (network == HARMONY.NETWORK_STRING) {
    return new HARMONY.config();
  } else if (network == MOONBEAM.NETWORK_STRING) {
    return new MOONBEAM.config();
  } else if (network == OPTIMISM.NETWORK_STRING) {
    return new OPTIMISM.config();
  } else if (network == AVALANCHE.NETWORK_STRING) {
    return new AVALANCHE.config();
  } else if (network == ARBITRUM_ONE.NETWORK_STRING) {
    return new ARBITRUM_ONE.config();
  }

  return new MAINNET.config();
}
