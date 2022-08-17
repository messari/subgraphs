import * as MAINNET from "../config/mainnet";
import * as FANTOM from "../config/fantom";
import * as ARBITRUM_ONE from "../config/arbitrumOne";

import { Address, BigDecimal, BigInt, TypedMap } from "@graphprotocol/graph-ts";
import { UniswapPair__getReservesResult } from "../../../generated/Vault/UniswapPair";
import { SushiSwapPair__getReservesResult } from "../../../generated/Vault/SushiSwapPair";

///////////////////////////////////////////////////////////////////////////
/////////////////////////////////// COMMON ////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGINT_TEN_THOUSAND = BigInt.fromI32(10000);

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);

export const DEFAULT_USDC_DECIMALS = 6;
export const DEFAULT_DECIMALS = BigInt.fromI32(18);

export const ZERO_ADDRESS_STRING = "0x0000000000000000000000000000000000000000";

export const ZERO_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000000");
export const CHAIN_LINK_USD_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000348");

export const WHITELIST_TOKENS_LIST: string[] = [
  "WETH",
  "USDT",
  "DAI",
  "USDC",
  "ETH",
  "WBTC",
  "EURS",
  "LINK",
  "gfUSDT",
  "WFTM",
  "fBTC",
  "FRAX",
  "CRV",
];

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_CALCULATIONS_ADDRESS_MAP = new TypedMap<string, Address>();
CURVE_CALCULATIONS_ADDRESS_MAP.set(MAINNET.NETWORK_STRING, MAINNET.CURVE_CALCULATIONS_ADDRESS);
CURVE_CALCULATIONS_ADDRESS_MAP.set(FANTOM.NETWORK_STRING, FANTOM.CURVE_CALCULATIONS_ADDRESS);
CURVE_CALCULATIONS_ADDRESS_MAP.set(ARBITRUM_ONE.NETWORK_STRING, ARBITRUM_ONE.CURVE_CALCULATIONS_ADDRESS);

export const CURVE_REGISTRY_ADDRESS_MAP = new TypedMap<string, Address>();
CURVE_REGISTRY_ADDRESS_MAP.set(MAINNET.NETWORK_STRING, MAINNET.CURVE_REGISTRY_ADDRESS);
CURVE_REGISTRY_ADDRESS_MAP.set(FANTOM.NETWORK_STRING, FANTOM.CURVE_REGISTRY_ADDRESS);
CURVE_REGISTRY_ADDRESS_MAP.set(ARBITRUM_ONE.NETWORK_STRING, ARBITRUM_ONE.CURVE_REGISTRY_ADDRESS);

export const CURVE_POOL_REGISTRY_ADDRESS_MAP = new TypedMap<string, Address>();
CURVE_POOL_REGISTRY_ADDRESS_MAP.set(MAINNET.NETWORK_STRING, MAINNET.CURVE_POOL_REGISTRY_ADDRESS);
CURVE_POOL_REGISTRY_ADDRESS_MAP.set(FANTOM.NETWORK_STRING, FANTOM.CURVE_POOL_REGISTRY_ADDRESS);
CURVE_POOL_REGISTRY_ADDRESS_MAP.set(ARBITRUM_ONE.NETWORK_STRING, ARBITRUM_ONE.CURVE_POOL_REGISTRY_ADDRESS);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// SUSHISWAP CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const SUSHISWAP_DEFAULT_RESERVE_CALL = new SushiSwapPair__getReservesResult(
  BIGINT_ZERO,
  BIGINT_ZERO,
  BIGINT_ZERO,
);

export const SUSHISWAP_CALCULATIONS_ADDRESS_MAP = new TypedMap<string, Address>();
SUSHISWAP_CALCULATIONS_ADDRESS_MAP.set(MAINNET.NETWORK_STRING, MAINNET.SUSHISWAP_CALCULATIONS_ADDRESS);
SUSHISWAP_CALCULATIONS_ADDRESS_MAP.set(FANTOM.NETWORK_STRING, FANTOM.SUSHISWAP_CALCULATIONS_ADDRESS);
SUSHISWAP_CALCULATIONS_ADDRESS_MAP.set(ARBITRUM_ONE.NETWORK_STRING, ARBITRUM_ONE.SUSHISWAP_CALCULATIONS_ADDRESS);

export const SUSHISWAP_WETH_ADDRESS = new TypedMap<string, Address>();
SUSHISWAP_WETH_ADDRESS.set(MAINNET.NETWORK_STRING, MAINNET.SUSHISWAP_WETH_ADDRESS);
SUSHISWAP_WETH_ADDRESS.set(FANTOM.NETWORK_STRING, FANTOM.SUSHISWAP_WETH_ADDRESS);
SUSHISWAP_WETH_ADDRESS.set(ARBITRUM_ONE.NETWORK_STRING, ARBITRUM_ONE.SUSHISWAP_WETH_ADDRESS);

export const SUSHISWAP_ROUTER_ADDRESS_MAP = new TypedMap<string, TypedMap<string, Address>>();
SUSHISWAP_ROUTER_ADDRESS_MAP.set(MAINNET.NETWORK_STRING, MAINNET.SUSHISWAP_ROUTER_ADDRESS);
SUSHISWAP_ROUTER_ADDRESS_MAP.set(FANTOM.NETWORK_STRING, FANTOM.SUSHISWAP_ROUTER_ADDRESS);
SUSHISWAP_ROUTER_ADDRESS_MAP.set(ARBITRUM_ONE.NETWORK_STRING, ARBITRUM_ONE.SUSHISWAP_ROUTER_ADDRESS);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// UNISWAP CONTRACT ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_DEFAULT_RESERVE_CALL = new UniswapPair__getReservesResult(BIGINT_ZERO, BIGINT_ZERO, BIGINT_ZERO);

export const UNISWAP_ROUTER_CONTRACT_ADDRESSES = new TypedMap<string, TypedMap<string, Address>>();
UNISWAP_ROUTER_CONTRACT_ADDRESSES.set(MAINNET.NETWORK_STRING, MAINNET.UNISWAP_ROUTER_ADDRESS);
UNISWAP_ROUTER_CONTRACT_ADDRESSES.set(FANTOM.NETWORK_STRING, FANTOM.SPOOKY_SWAP_ROUTER_ADDRESS);
UNISWAP_ROUTER_CONTRACT_ADDRESSES.set(ARBITRUM_ONE.NETWORK_STRING, ARBITRUM_ONE.UNISWAP_ROUTER_ADDRESS);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// YEARNLENS CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_CONTRACT_ADDRESS = new Map<string, string>();
YEARN_LENS_CONTRACT_ADDRESS.set(MAINNET.NETWORK_STRING, MAINNET.YEARN_LENS_CONTRACT_ADDRESS);
YEARN_LENS_CONTRACT_ADDRESS.set(FANTOM.NETWORK_STRING, FANTOM.YEARN_LENS_CONTRACT_ADDRESS);
YEARN_LENS_CONTRACT_ADDRESS.set(ARBITRUM_ONE.NETWORK_STRING, ARBITRUM_ONE.YEARN_LENS_CONTRACT_ADDRESS);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CHAINLINK CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CHAIN_LINK_CONTRACT_ADDRESS = new Map<string, Address>();
CHAIN_LINK_CONTRACT_ADDRESS.set(MAINNET.NETWORK_STRING, MAINNET.CHAIN_LINK_CONTRACT_ADDRESS);
CHAIN_LINK_CONTRACT_ADDRESS.set(FANTOM.NETWORK_STRING, FANTOM.CHAIN_LINK_CONTRACT_ADDRESS);
CHAIN_LINK_CONTRACT_ADDRESS.set(ARBITRUM_ONE.NETWORK_STRING, ARBITRUM_ONE.CHAIN_LINK_CONTRACT_ADDRESS);

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// HELPERS /////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const WHITELIST_TOKENS_MAP = new TypedMap<string, TypedMap<string, Address>>();
WHITELIST_TOKENS_MAP.set(MAINNET.NETWORK_STRING, MAINNET.WHITELIST_TOKENS);
WHITELIST_TOKENS_MAP.set(FANTOM.NETWORK_STRING, FANTOM.WHITELIST_TOKENS);
WHITELIST_TOKENS_MAP.set(ARBITRUM_ONE.NETWORK_STRING, ARBITRUM_ONE.WHITELIST_TOKENS);


export const USD_PEGGED_TOKENS: string[] = [
  "0x5f98805a4e8be255a32880fdec7f6728c6568ba0",
  "0x8f4063446f5011bc1c9f79a819efe87776f23704",
  "0xb0f75e97a114a4eb4a425edc48990e6760726709",
  "0xc8c79fcd0e859e7ec81118e91ce8e4379a481ee6",
  "0xd997f35c9b1281b82c8928039d14cddab5e13c20",
  "0x2bbf681cc4eb09218bee85ea2a5d3d13fa40fc0c",
  "0x7b50775383d3d6f0215a8f290f2c9e2eebbeceb2",
  "0x804cdb9116a10bb78768d3252355a1b18067bf8f",
  "0x9210f1204b5a24742eba12f710636d76240df3d0",
  "0x4fd63966879300cafafbb35d157dc5229278ed23",
  "0x652d486b80c461c397b0d95612a404da936f3db3",
  "0xa3823e50f20982656557a4a6a9c06ba5467ae908",
  "0xe6bcc79f328eec93d4ec8f7ed35534d9ab549faa"
];