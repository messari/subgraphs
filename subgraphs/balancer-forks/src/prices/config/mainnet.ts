import * as constants from "../common/constants";
import { Configurations } from "../common/types";
import { Address, BigInt } from "@graphprotocol/graph-ts";

export const NETWORK_STRING = "mainnet";

///////////////////////////////////////////////////////////////////////////
///////////////////// CALCULATIONS/ORACLE CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_CONTRACT_ADDRESS = Address.fromString(
  "0x83d95e0d5f402511db06817aff3f9ea88224b030"
);
export const CHAIN_LINK_CONTRACT_ADDRESS = Address.fromString(
  "0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf"
);
export const AAVE_ORACLE_CONTRACT_ADDRESS = constants.NULL.TYPE_ADDRESS;
export const SUSHISWAP_CALCULATIONS_ADDRESS = Address.fromString(
  "0x8263e161A855B644f582d9C164C66aABEe53f927"
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_CALCULATIONS_ADDRESS = Address.fromString(
  "0x25BF7b72815476Dd515044F9650Bf79bAd0Df655"
);

export const CURVE_REGISTRY_ADDRESSES: Address[] = [
  Address.fromString("0x7D86446dDb609eD0F5f8684AcF30380a356b2B4c"),
  Address.fromString("0x8F942C20D02bEfc377D41445793068908E2250D0"),
];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// UNISWAP FORKS CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_FORKS_ROUTER_ADDRESSES: Address[] = [
  Address.fromString("0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"), // SushiSwap
  Address.fromString("0x7a250d5630b4cf539739df2c5dacb4c659f2488d"), // Uniswap
];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// BLACKLISTED TOKENS ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_BLACKLIST: Address[] = [];
export const AAVE_ORACLE_BLACKLIST: Address[] = [];
export const CURVE_CALCULATIONS_BLACKSLIST: Address[] = [];
export const SUSHI_CALCULATIONS_BLACKSLIST: Address[] = [];

///////////////////////////////////////////////////////////////////////////
//////////////////////////// HARDCODED STABLES ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const HARDCODED_STABLES: Address[] = [
  Address.fromString("0x5f98805a4e8be255a32880fdec7f6728c6568ba0"), // LUSD Token
  Address.fromString("0x8f4063446f5011bc1c9f79a819efe87776f23704"), // bb-f-DAI
  Address.fromString("0xb0f75e97a114a4eb4a425edc48990e6760726709"), // bb-f-LUSD
  Address.fromString("0xc8c79fcd0e859e7ec81118e91ce8e4379a481ee6"), // bb-f-fei
  Address.fromString("0xd997f35c9b1281b82c8928039d14cddab5e13c20"), // bb-f-USD
  Address.fromString("0x7b50775383d3d6f0215a8f290f2c9e2eebbeceb2"), // bb-a-USD old
  Address.fromString("0x4fd63966879300cafafbb35d157dc5229278ed23"), // bb-a-USD
  Address.fromString("0x9210f1204b5a24742eba12f710636d76240df3d0"), // bb-a-USDC deprecated
  Address.fromString("0x804cdb9116a10bb78768d3252355a1b18067bf8f"), // bb-a-DAI deprecated
  Address.fromString("0x2bbf681cc4eb09218bee85ea2a5d3d13fa40fc0c"), // bb-a-USDT deprecated
  Address.fromString("0x652d486b80c461c397b0d95612a404da936f3db3"), // bb-a-USDC old
  Address.fromString("0xa3823e50f20982656557a4a6a9c06ba5467ae908"), // bb-a-DAI old
  Address.fromString("0xe6bcc79f328eec93d4ec8f7ed35534d9ab549faa"), // bb-a-USDT old
  Address.fromString("0x82698aecc9e28e9bb27608bd52cf57f704bd1b83"), // bb-a-USDC
  Address.fromString("0xae37d54ae477268b9997d4161b96b8200755935c"), // bb-a-DAI
  Address.fromString("0x2f4eb100552ef93840d5adc30560e5513dfffacb"), // bb-a-USDT
];

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// HELPERS /////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const USDC_TOKEN_DECIMALS = BigInt.fromI32(6);

export const ETH_ADDRESS = Address.fromString(
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
);
export const WETH_ADDRESS = Address.fromString(
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
);
export const USDC_ADDRESS = Address.fromString(
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
);

export class config implements Configurations {
  yearnLens(): Address {
    return YEARN_LENS_CONTRACT_ADDRESS;
  }
  chainLink(): Address {
    return CHAIN_LINK_CONTRACT_ADDRESS;
  }
  yearnLensBlacklist(): Address[] {
    return YEARN_LENS_BLACKLIST;
  }

  aaveOracle(): Address {
    return AAVE_ORACLE_CONTRACT_ADDRESS;
  }
  aaveOracleBlacklist(): Address[] {
    return AAVE_ORACLE_BLACKLIST;
  }

  curveCalculations(): Address {
    return CURVE_CALCULATIONS_ADDRESS;
  }
  curveCalculationsBlacklist(): Address[] {
    return CURVE_CALCULATIONS_BLACKSLIST;
  }

  sushiCalculations(): Address {
    return SUSHISWAP_CALCULATIONS_ADDRESS;
  }
  sushiCalculationsBlacklist(): Address[] {
    return SUSHI_CALCULATIONS_BLACKSLIST;
  }

  uniswapForks(): Address[] {
    return UNISWAP_FORKS_ROUTER_ADDRESSES;
  }
  curveRegistry(): Address[] {
    return CURVE_REGISTRY_ADDRESSES;
  }

  hardcodedStables(): Address[] {
    return HARDCODED_STABLES;
  }

  ethAddress(): Address {
    return ETH_ADDRESS;
  }
  wethAddress(): Address {
    return WETH_ADDRESS;
  }
  usdcAddress(): Address {
    return USDC_ADDRESS;
  }

  usdcTokenDecimals(): BigInt {
    return USDC_TOKEN_DECIMALS;
  }
}
