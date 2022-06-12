import { Address, BigDecimal, BigInt, TypedMap } from "@graphprotocol/graph-ts";
import { UniswapPair__getReservesResult } from "../../../generated/UniswapV2Factory/UniswapPair";
import { SushiSwapPair__getReservesResult } from "../../../generated/UniswapV2Factory/SushiSwapPair";

///////////////////////////////////////////////////////////////////////////
/////////////////////////////////// COMMON ////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGINT_TEN_THOUSAND = BigInt.fromI32(10000);

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);

export const DEFAULT_USDC_DECIMALS = BIGINT_TEN.pow(6);
export const DEFAULT_DECIMALS = BigInt.fromI32(18);

export const ZERO_ADDRESS_STRING = "0x0000000000000000000000000000000000000000";
export const ZERO_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);


///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_CALCULATIONS_ADDRESS_MAP = new TypedMap<string, Address>();
CURVE_CALCULATIONS_ADDRESS_MAP.set(
  "mainnet",
  Address.fromString("0x25BF7b72815476Dd515044F9650Bf79bAd0Df655") // CURVE_REGISTRY_MAINNET
);

export const CURVE_REGISTRY_ADDRESS_MAP = new TypedMap<string, Address>();
CURVE_REGISTRY_ADDRESS_MAP.set(
  "mainnet",
  Address.fromString("0x7D86446dDb609eD0F5f8684AcF30380a356b2B4c") // CURVE_REGISTRY_MAINNET
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// SUSHISWAP CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const SUSHISWAP_DEFAULT_RESERVE_CALL = new SushiSwapPair__getReservesResult(
  BIGINT_ZERO,
  BIGINT_ZERO,
  BIGINT_ZERO
);

export const SUSHISWAP_CALCULATIONS_ADDRESS_MAP = new TypedMap<string, Address>();
SUSHISWAP_CALCULATIONS_ADDRESS_MAP.set(
  "mainnet",
  Address.fromString('0x8263e161A855B644f582d9C164C66aABEe53f927') // CALCULATIONS_SUSHISWAP_MAINNET
);

export const SUSHISWAP_ROUTER_ADDRESSES = new TypedMap<string, Address>();
SUSHISWAP_ROUTER_ADDRESSES.set(
  'routerV1',
  Address.fromString("0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F") // SUSHISWAP_ROUTER_V1_MAINNET
)
SUSHISWAP_ROUTER_ADDRESSES.set(
  'routerV2',
  Address.fromString("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D") // SUSHISWAP_ROUTER_V2_MAINNET
)

export const SUSHISWAP_ROUTER_ADDRESS_MAP = new TypedMap<string, TypedMap<string, Address>>();
SUSHISWAP_ROUTER_ADDRESS_MAP.set(
  "mainnet",
  SUSHISWAP_ROUTER_ADDRESSES // SUSHISWAP_ROUTER_MAINNET
);

///////////////////////////////////////////////////////////////////////////
//////////////////////////// UNISWAP CONTRACT /////////////////////////////
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
///////////////////////////// YEARNLENS CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_CONTRACT_ADDRESS = new Map<string, string>();
YEARN_LENS_CONTRACT_ADDRESS.set(
  "mainnet",
  "0x83d95e0d5f402511db06817aff3f9ea88224b030"  // YEARN_LENS_ORACLE_ADDRESS
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CHAINLINK CONTRACT //////////////////////////
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
///////////////////////////////// HELPERS /////////////////////////////////
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
