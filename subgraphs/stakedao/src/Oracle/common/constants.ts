import { Address, BigDecimal, BigInt, TypedMap } from "@graphprotocol/graph-ts";
import { UniswapPair__getReservesResult } from "../../../generated/Controller/UniswapPair";
import { SushiSwapPair__getReservesResult } from "../../../generated/Controller/SushiSwapPair";

///////////////////////////////////////////////////////////////////////////
//////////////////////////////////? COMMON ?///////////////////////////////
///////////////////////////////////////////////////////////////////////////

// export const MAINNET_ETH_NULL_ADDRESS = Address.fromString(
//   "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
// );
// export const MAINNET_USDC_ADDRESS = Address.fromString(
//   "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
// );
// export const MAINNET_WETH_ADDRESS = Address.fromString(
//   "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
// );

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);

export const DEFAULT_DECIMALS = BigInt.fromI32(18);

export const ZERO_ADDRESS_STRING = "0x0000000000000000000000000000000000000000";
export const ZERO_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);


///////////////////////////////////////////////////////////////////////////
////////////////////////////? CURVE CONTRACT ?/////////////////////////////
///////////////////////////////////////////////////////////////////////////


export const CURVE_CONTRACT_ADDRESSES = new TypedMap<string, Address>();
CURVE_CONTRACT_ADDRESSES.set(
  "mainnet",
  Address.fromString("0x7D86446dDb609eD0F5f8684AcF30380a356b2B4c") // CURVE_REGISTRY_MAINNET
);

///////////////////////////////////////////////////////////////////////////
////////////////////////////? SUSHISWAP CONTRACT ?///////////////////////////
///////////////////////////////////////////////////////////////////////////

export const SUSHISWAP_DEFAULT_RESERVE_CALL = new SushiSwapPair__getReservesResult(
  BIGINT_ZERO,
  BIGINT_ZERO,
  BIGINT_ZERO
);

export const SUSHISWAP_CONTRACT_ADDRESSES = new TypedMap<string, Address>();
SUSHISWAP_CONTRACT_ADDRESSES.set(
  "mainnet",
  Address.fromString("0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F") // SUSHISWAP_ROUTER_MAINNET
);

///////////////////////////////////////////////////////////////////////////
////////////////////////////? UNISWAP CONTRACT ?///////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_DEFAULT_RESERVE_CALL = new UniswapPair__getReservesResult(
  BIGINT_ZERO,
  BIGINT_ZERO,
  BIGINT_ZERO
);

export const UNISWAP_CONTRACT_ADDRESSES = new TypedMap<string, Address>();
UNISWAP_CONTRACT_ADDRESSES.set(
  "mainnet",
  Address.fromString("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D") // UNISWAP_ROUTER_MAINNET
);

///////////////////////////////////////////////////////////////////////////
////////////////////////////? CHAINLINK CONTRACT ?/////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CHAIN_LINK_USD_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000348"
);

export const CHAIN_LINK_CONTRACT_ADDRESS = new Map<string, Address>();
CHAIN_LINK_CONTRACT_ADDRESS.set(
  "mainnet",
  Address.fromString("0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf")
);

///////////////////////////////////////////////////////////////////////////
////////////////////////////////? HELPERS ?////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const WHITELIST_TOKENS_FORMAT = new TypedMap<string, Address>();
export const WHITELIST_TOKENS_LIST: string[] = [
  "WETH",
  "USDT",
  "DAI",
  "USDC",
  "ETH",
  "WBTC",
  "EURS",
  "LINK",
];

export const WHITELIST_TOKENS_MAINNET = new TypedMap<string, Address>();
WHITELIST_TOKENS_MAINNET.set(
  "WETH",
  Address.fromString("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2")
);
WHITELIST_TOKENS_MAINNET.set(
  "USDT",
  Address.fromString("0xdac17f958d2ee523a2206206994597c13d831ec7")
);
WHITELIST_TOKENS_MAINNET.set(
  "DAI",
  Address.fromString("0x6b175474e89094c44da98b954eedeac495271d0f")
);
WHITELIST_TOKENS_MAINNET.set(
  "USDC",
  Address.fromString("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48")
);
WHITELIST_TOKENS_MAINNET.set(
  "ETH",
  Address.fromString("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE")
);
WHITELIST_TOKENS_MAINNET.set(
  "WBTC",
  Address.fromString("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599")
);
WHITELIST_TOKENS_MAINNET.set(
  "EURS",
  Address.fromString("0xdB25f211AB05b1c97D595516F45794528a807ad8")
);
WHITELIST_TOKENS_MAINNET.set(
  "LINK",
  Address.fromString("0x514910771AF9Ca656af840dff83E8264EcF986CA")
);

export const WHITELIST_TOKENS_MAP = new TypedMap<
  string,
  TypedMap<string, Address>
>();
WHITELIST_TOKENS_MAP.set("mainnet", WHITELIST_TOKENS_MAINNET);
WHITELIST_TOKENS_MAP.set("bnb", WHITELIST_TOKENS_FORMAT);
WHITELIST_TOKENS_MAP.set("matic", WHITELIST_TOKENS_FORMAT);
WHITELIST_TOKENS_MAP.set("fantom", WHITELIST_TOKENS_FORMAT);
WHITELIST_TOKENS_MAP.set("avalanche", WHITELIST_TOKENS_FORMAT);
