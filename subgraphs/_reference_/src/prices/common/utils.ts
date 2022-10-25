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
import { _ERC20 } from "../../../generated/UniswapV2Factory/_ERC20";
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

type NetworkConfig = typeof TEMPLATE

export class Config implements Configurations {
  config: NetworkConfig;

  constructor(config: NetworkConfig) {
    this.config = config;
  }

  network(): string {
    return this.config.NETWORK_STRING;
  }

  yearnLens(): Address {
    return this.config.YEARN_LENS_CONTRACT_ADDRESS;
  }
  chainLink(): Address {
    return this.config.CHAIN_LINK_CONTRACT_ADDRESS;
  }
  yearnLensBlacklist(): Address[] {
    return this.config.YEARN_LENS_BLACKLIST;
  }

  aaveOracle(): Address {
    return this.config.AAVE_ORACLE_CONTRACT_ADDRESS;
  }
  aaveOracleBlacklist(): Address[] {
    return this.config.AAVE_ORACLE_BLACKLIST;
  }

  curveCalculations(): Address {
    return this.config.CURVE_CALCULATIONS_ADDRESS;
  }
  curveCalculationsBlacklist(): Address[] {
    return this.config.CURVE_CALCULATIONS_BLACKSLIST;
  }

  sushiCalculations(): Address {
    return this.config.SUSHISWAP_CALCULATIONS_ADDRESS;
  }
  sushiCalculationsBlacklist(): Address[] {
    return this.config.SUSHI_CALCULATIONS_BLACKSLIST;
  }

  uniswapForks(): Address[] {
    return this.config.UNISWAP_FORKS_ROUTER_ADDRESSES;
  }
  curveRegistry(): Address[] {
    return this.config.CURVE_REGISTRY_ADDRESSES;
  }

  hardcodedStables(): Address[] {
    return this.config.HARDCODED_STABLES;
  }

  ethAddress(): Address {
    return this.config.ETH_ADDRESS;
  }
  wethAddress(): Address {
    return this.config.WETH_ADDRESS;
  }
  usdcAddress(): Address {
    return this.config.USDC_ADDRESS;
  }

  usdcTokenDecimals(): BigInt {
    return this.config.USDC_TOKEN_DECIMALS;
  }
}

export function getConfig(): Configurations {
  const network = dataSource.network();

  if (network == XDAI.NETWORK_STRING) {
    return new Config(XDAI);
  } else if (network == AURORA.NETWORK_STRING) {
    return new Config(AURORA);
  } else if (network == BSC.NETWORK_STRING) {
    return new Config(BSC);
  } else if (network == FANTOM.NETWORK_STRING) {
    return new Config(FANTOM);
  } else if (network == POLYGON.NETWORK_STRING) {
    return new Config(POLYGON);
  } else if (network == MAINNET.NETWORK_STRING) {
    return new Config(MAINNET);
  } else if (network == HARMONY.NETWORK_STRING) {
    return new Config(HARMONY);
  } else if (network == MOONBEAM.NETWORK_STRING) {
    return new Config(MOONBEAM);
  } else if (network == OPTIMISM.NETWORK_STRING) {
    return new Config(OPTIMISM);
  } else if (network == AVALANCHE.NETWORK_STRING) {
    return new Config(AVALANCHE);
  } else if (network == ARBITRUM_ONE.NETWORK_STRING) {
    return new Config(ARBITRUM_ONE);
  }

  return new Config(TEMPLATE);
}
