import * as BSC from "../config/bsc";
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

import { Configurations } from "./types";
import * as constants from "./constants";
import * as TEMPLATE from "../config/template";
import { _ERC20 } from "../../../generated/TroveManager/_ERC20";
import { Address, BigInt, dataSource, ethereum } from "@graphprotocol/graph-ts";

export function isNullAddress(tokenAddr: Address): boolean {
  return tokenAddr.equals(constants.NULL.TYPE_ADDRESS);
}

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
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
  } else if (network == BSC.NETWORK_STRING) {
    return new BSC.config();
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

  return new TEMPLATE.config();
}
