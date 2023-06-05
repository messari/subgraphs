/* eslint-disable @typescript-eslint/no-magic-numbers */
import * as constants from "../common/constants";
import { Address, ethereum, TypedMap, BigInt } from "@graphprotocol/graph-ts";
import { Configurations, OracleConfig } from "../common/types";

export const NETWORK_STRING = "mainnet";

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_CALCULATIONS_ADDRESS = Address.fromString(
  "0x25BF7b72815476Dd515044F9650Bf79bAd0Df655"
);
export const CURVE_REGISTRY_ADDRESS = Address.fromString(
  "0x7D86446dDb609eD0F5f8684AcF30380a356b2B4c"
);
export const CURVE_POOL_REGISTRY_ADDRESS = Address.fromString(
  "0x8F942C20D02bEfc377D41445793068908E2250D0"
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// SUSHISWAP CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const SUSHISWAP_CALCULATIONS_ADDRESS = Address.fromString(
  "0x8263e161A855B644f582d9C164C66aABEe53f927"
);
export const SUSHISWAP_WETH_ADDRESS = Address.fromString(
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
);

export const SUSHISWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
SUSHISWAP_ROUTER_ADDRESS.set(
  "routerV1",
  Address.fromString("0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F")
);
SUSHISWAP_ROUTER_ADDRESS.set(
  "routerV2",
  Address.fromString("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D")
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// UNISWAP CONTRACT ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
UNISWAP_ROUTER_ADDRESS.set(
  "routerV1",
  Address.fromString("0x7a250d5630b4cf539739df2c5dacb4c659f2488d")
);
UNISWAP_ROUTER_ADDRESS.set(
  "routerV2",
  Address.fromString("0x0000000000000000000000000000000000000000")
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// YEARNLENS CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_CONTRACT_ADDRESS =
  "0x83d95e0d5f402511db06817aff3f9ea88224b030";

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CHAINLINK CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CHAIN_LINK_CONTRACT_ADDRESS = Address.fromString(
  "0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf"
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// HELPERS /////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const WHITELIST_TOKENS = new TypedMap<string, Address>();
WHITELIST_TOKENS.set(
  "WETH",
  Address.fromString("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2")
);
WHITELIST_TOKENS.set(
  "USDT",
  Address.fromString("0xdac17f958d2ee523a2206206994597c13d831ec7")
);
WHITELIST_TOKENS.set(
  "DAI",
  Address.fromString("0x6b175474e89094c44da98b954eedeac495271d0f")
);
WHITELIST_TOKENS.set(
  "USDC",
  Address.fromString("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48")
);
WHITELIST_TOKENS.set(
  "ETH",
  Address.fromString("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE")
);
WHITELIST_TOKENS.set(
  "WBTC",
  Address.fromString("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599")
);
WHITELIST_TOKENS.set(
  "EURS",
  Address.fromString("0xdB25f211AB05b1c97D595516F45794528a807ad8")
);
WHITELIST_TOKENS.set(
  "LINK",
  Address.fromString("0x514910771AF9Ca656af840dff83E8264EcF986CA")
);

class DefaultOracleConfig implements OracleConfig {
  oracleCount(): number {
    return constants.INT_ONE;
  }
  oracleOrder(): string[] {
    return [
      constants.OracleType.YEARN_LENS_ORACLE,
      constants.OracleType.CHAINLINK_FEED,
      constants.OracleType.CURVE_CALCULATIONS,
      constants.OracleType.SUSHI_CALCULATIONS,
      constants.OracleType.CURVE_ROUTER,
      constants.OracleType.UNISWAP_FORKS_ROUTER,
      constants.OracleType.SUSHI_ROUTER,
    ];
  }
}

class stETHOverride implements OracleConfig {
  oracleCount(): number {
    return constants.INT_ONE;
  }
  oracleOrder(): string[] {
    return [
      constants.OracleType.CHAINLINK_FEED,
      constants.OracleType.CURVE_CALCULATIONS,
      constants.OracleType.SUSHI_CALCULATIONS,
      constants.OracleType.CURVE_ROUTER,
      constants.OracleType.UNISWAP_FORKS_ROUTER,
      constants.OracleType.SUSHI_ROUTER,
      constants.OracleType.YEARN_LENS_ORACLE,
    ];
  }
}

export class config implements Configurations {
  getOracleConfig(
    tokenAddr: Address | null,
    block: ethereum.Block | null
  ): OracleConfig {
    if (tokenAddr || block) {
      if (
        tokenAddr &&
        [
          Address.fromString("0xae7ab96520de3a18e5e111b5eaab095312d7fe84"), // stETH
        ].includes(tokenAddr) &&
        block &&
        block.number.gt(BigInt.fromString("14019699")) &&
        block.number.lt(BigInt.fromString("14941265"))
      ) {
        return new stETHOverride();
      }
    }

    return new DefaultOracleConfig();
  }
}
