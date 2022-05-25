import { Address, BigDecimal, BigInt, TypedMap } from "@graphprotocol/graph-ts";
import { UniswapPair__getReservesResult } from "../../../generated/Booster/UniswapPair";
import { SushiSwapPair__getReservesResult } from "../../../generated/Booster/SushiSwapPair";

///////////////////////////////////////////////////////////////////////////
/////////////////////////////////// COMMON ////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGINT_TEN_THOUSAND = BigInt.fromI32(10000);

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_1E18 = BIGINT_TEN.pow(18).toBigDecimal();

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
  Address.fromString("0x25BF7b72815476Dd515044F9650Bf79bAd0Df655") // CALCULATIONS_CURVE_MAINNET
);
CURVE_CALCULATIONS_ADDRESS_MAP.set(
  "fantom",
  Address.fromString("0x0b53e9df372e72d8fdcdbedfbb56059957a37128") // CALCULATIONS_CURVE_FANTOM
);
CURVE_CALCULATIONS_ADDRESS_MAP.set(
  "arbitrum-one",
  Address.fromString("0x26f698491daf32771217abc1356dae48c7230c75") // CALCULATIONS_CURVE_ARBITRUM_ONE
);

export const CURVE_REGISTRY_ADDRESS_MAP = new TypedMap<string, Address>();
CURVE_REGISTRY_ADDRESS_MAP.set(
  "mainnet",
  Address.fromString("0x7D86446dDb609eD0F5f8684AcF30380a356b2B4c") // CURVE_REGISTRY_MAINNET
);
CURVE_REGISTRY_ADDRESS_MAP.set(
  "fantom",
  Address.fromString("0x0f854EA9F38ceA4B1c2FC79047E9D0134419D5d6") // CURVE_REGISTRY_FANTOM
);
CURVE_REGISTRY_ADDRESS_MAP.set(
  "arbitrum-one",
  Address.fromString("0x445FE580eF8d70FF569aB36e80c647af338db351") // CURVE_REGISTRY_ARBITRUM_ONE
);

export const CURVE_POOL_REGISTRY_ADDRESS_MAP = new TypedMap<string, Address>();
CURVE_POOL_REGISTRY_ADDRESS_MAP.set(
  "mainnet",
  Address.fromString("0x8F942C20D02bEfc377D41445793068908E2250D0") // CURVE_POOL_REGISTRY_MAINNET
);
CURVE_POOL_REGISTRY_ADDRESS_MAP.set(
  "fantom",
  Address.fromString("0x4fb93D7d320E8A263F22f62C2059dFC2A8bCbC4c") // CURVE_POOL_REGISTRY_FANTOM
);
CURVE_POOL_REGISTRY_ADDRESS_MAP.set(
  "arbitrum-one",
  Address.fromString("0x0E9fBb167DF83EdE3240D6a5fa5d40c6C6851e15") // CURVE_POOL_REGISTRY_ARBITRUM_ONE
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// SUSHISWAP CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const SUSHISWAP_DEFAULT_RESERVE_CALL = new SushiSwapPair__getReservesResult(
  BIGINT_ZERO,
  BIGINT_ZERO,
  BIGINT_ZERO
);

export const SUSHISWAP_CALCULATIONS_ADDRESS_MAP = new TypedMap<
  string,
  Address
>();
SUSHISWAP_CALCULATIONS_ADDRESS_MAP.set(
  "mainnet",
  Address.fromString("0x8263e161A855B644f582d9C164C66aABEe53f927") // CALCULATIONS_SUSHISWAP_MAINNET
);
SUSHISWAP_CALCULATIONS_ADDRESS_MAP.set(
  "fantom",
  Address.fromString("0xec7Ac8AC897f5082B2c3d4e8D2173F992A097F24") // CALCULATIONS_SUSHISWAP_FANTOM
);
SUSHISWAP_CALCULATIONS_ADDRESS_MAP.set(
  "arbitrum-one",
  Address.fromString("0xec7Ac8AC897f5082B2c3d4e8D2173F992A097F24") // CALCULATIONS_SUSHISWAP_ARBITRUM_ONE
);

export const SUSHISWAP_ROUTER_ADDRESS_MAINNET = new TypedMap<string, Address>();
SUSHISWAP_ROUTER_ADDRESS_MAINNET.set(
  "routerV1",
  Address.fromString("0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F") // SUSHISWAP_ROUTER_V1_MAINNET
);
SUSHISWAP_ROUTER_ADDRESS_MAINNET.set(
  "routerV2",
  Address.fromString("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D") // SUSHISWAP_ROUTER_V2_MAINNET
);

export const SUSHISWAP_ROUTER_ADDRESS_FANTOM = new TypedMap<string, Address>();
SUSHISWAP_ROUTER_ADDRESS_FANTOM.set(
  "routerV1",
  Address.fromString("0x1b02da8cb0d097eb8d57a175b88c7d8b47997506") // SUSHISWAP_ROUTER_V1_FANTOM
);
SUSHISWAP_ROUTER_ADDRESS_FANTOM.set(
  "routerV2",
  Address.fromString("0x1b02da8cb0d097eb8d57a175b88c7d8b47997506") // SUSHISWAP_ROUTER_V2_FANTOM
);

export const SUSHISWAP_ROUTER_ADDRESS_ARBITRUM_ONE = new TypedMap<
  string,
  Address
>();
SUSHISWAP_ROUTER_ADDRESS_ARBITRUM_ONE.set(
  "routerV1",
  Address.fromString("0x1b02da8cb0d097eb8d57a175b88c7d8b47997506") // SUSHISWAP_ROUTER_V1_ARBITRUM_ONE
);
SUSHISWAP_ROUTER_ADDRESS_ARBITRUM_ONE.set(
  "routerV2",
  Address.fromString("0x0000000000000000000000000000000000000000") // SUSHISWAP_ROUTER_V2_ARBITRUM_ONE
);

export const SUSHISWAP_WETH_ADDRESS = new TypedMap<string, Address>();
SUSHISWAP_WETH_ADDRESS.set(
  "mainnet",
  Address.fromString("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2") // SUSHISWAP_WETH_ADDRESS_MAINNET
);
SUSHISWAP_WETH_ADDRESS.set(
  "fantom",
  Address.fromString("0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83") // SUSHISWAP_WFTM_ADDRESS_FANTOM
);
SUSHISWAP_WETH_ADDRESS.set(
  "fantom",
  Address.fromString("0x82af49447d8a07e3bd95bd0d56f35241523fbab1") // SUSHISWAP_WETH_ADDRESS_ARBITRUM_ONE
);

export const SUSHISWAP_ROUTER_ADDRESS_MAP = new TypedMap<
  string,
  TypedMap<string, Address>
>();
SUSHISWAP_ROUTER_ADDRESS_MAP.set(
  "mainnet",
  SUSHISWAP_ROUTER_ADDRESS_MAINNET // SUSHISWAP_ROUTER_MAINNET
);
SUSHISWAP_ROUTER_ADDRESS_MAP.set(
  "fantom",
  SUSHISWAP_ROUTER_ADDRESS_FANTOM // SUSHISWAP_ROUTER_FANTOM
);
SUSHISWAP_ROUTER_ADDRESS_MAP.set(
  "arbitrum-one",
  SUSHISWAP_ROUTER_ADDRESS_ARBITRUM_ONE // SUSHISWAP_ROUTER_ARBITRUM_ONE
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// UNISWAP CONTRACT ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_DEFAULT_RESERVE_CALL = new UniswapPair__getReservesResult(
  BIGINT_ZERO,
  BIGINT_ZERO,
  BIGINT_ZERO
);

export const UNISWAP_ROUTER_ADDRESS_MAINNET = new TypedMap<string, Address>();
UNISWAP_ROUTER_ADDRESS_MAINNET.set(
  "routerV1",
  Address.fromString("0x7a250d5630b4cf539739df2c5dacb4c659f2488d") // UNISWAP_ROUTER_V1_MAINNET
);
UNISWAP_ROUTER_ADDRESS_MAINNET.set(
  "routerV2",
  Address.fromString("0x0000000000000000000000000000000000000000") // UNISWAP_ROUTER_V2_MAINNET
);

export const SPOOKY_SWAP_ROUTER_ADDRESS_FANTOM = new TypedMap<
  string,
  Address
>();
SPOOKY_SWAP_ROUTER_ADDRESS_FANTOM.set(
  "routerV1",
  Address.fromString("0xbe4fc72f8293f9d3512d58b969c98c3f676cb957") // SPOOKY_SWAP_ROUTER_V1_FANTOM
);
SPOOKY_SWAP_ROUTER_ADDRESS_FANTOM.set(
  "routerV2",
  Address.fromString("0x0000000000000000000000000000000000000000") // SPOOKY_SWAP_ROUTER_V2_FANTOM
);

export const UNISWAP_ROUTER_CONTRACT_ADDRESSES = new TypedMap<
  string,
  TypedMap<string, Address>
>();
UNISWAP_ROUTER_CONTRACT_ADDRESSES.set(
  "mainnet",
  UNISWAP_ROUTER_ADDRESS_MAINNET // UNISWAP_ROUTER_MAINNET
);
UNISWAP_ROUTER_CONTRACT_ADDRESSES.set(
  "fantom",
  SPOOKY_SWAP_ROUTER_ADDRESS_FANTOM // UNISWAP FORKED SPOOKY_SWAP_FANTOM
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// YEARNLENS CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_CONTRACT_ADDRESS = new Map<string, string>();
YEARN_LENS_CONTRACT_ADDRESS.set(
  "mainnet",
  "0x83d95e0d5f402511db06817aff3f9ea88224b030" // YEARN_LENS_ORACLE_ADDRESS_MAINNET
);
YEARN_LENS_CONTRACT_ADDRESS.set(
  "fantom",
  "0x0000000000000000000000000000000000000000" // YEARN_LENS_ORACLE_ADDRESS_FANTOM
);
YEARN_LENS_CONTRACT_ADDRESS.set(
  "arbitrum-one",
  "0x0000000000000000000000000000000000000000" // YEARN_LENS_ORACLE_ADDRESS_ARBITRUM_ONE
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
CHAIN_LINK_CONTRACT_ADDRESS.set(
  "fantom",
  Address.fromString("0x0000000000000000000000000000000000000000")
);
CHAIN_LINK_CONTRACT_ADDRESS.set(
  "fantom",
  Address.fromString("0x0000000000000000000000000000000000000000")
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// HELPERS /////////////////////////////////
///////////////////////////////////////////////////////////////////////////

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

export const WHITELIST_TOKENS_FANTOM = new TypedMap<string, Address>();
WHITELIST_TOKENS_FANTOM.set(
  "WETH",
  Address.fromString("0x658b0c7613e890ee50b8c4bc6a3f41ef411208ad") // fETH
);
WHITELIST_TOKENS_FANTOM.set(
  "ETH",
  Address.fromString("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE")
);
WHITELIST_TOKENS_FANTOM.set(
  "gfUSDT",
  Address.fromString("0x940f41f0ec9ba1a34cf001cc03347ac092f5f6b5")
);
WHITELIST_TOKENS_FANTOM.set(
  "DAI",
  Address.fromString("0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e")
);
WHITELIST_TOKENS_FANTOM.set(
  "USDC",
  Address.fromString("0x04068da6c83afcfa0e13ba15a6696662335d5b75")
);
WHITELIST_TOKENS_FANTOM.set(
  "WFTM",
  Address.fromString("0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83")
);
WHITELIST_TOKENS_FANTOM.set(
  "WBTC",
  Address.fromString("0x321162Cd933E2Be498Cd2267a90534A804051b11")
);
WHITELIST_TOKENS_FANTOM.set(
  "fBTC",
  Address.fromString("0xe1146b9ac456fcbb60644c36fd3f868a9072fc6e")
);
WHITELIST_TOKENS_FANTOM.set(
  "FRAX",
  Address.fromString("0xdc301622e621166bd8e82f2ca0a26c13ad0be355")
);
WHITELIST_TOKENS_FANTOM.set(
  "LINK",
  Address.fromString("0xb3654dc3d10ea7645f8319668e8f54d2574fbdc8")
);
WHITELIST_TOKENS_FANTOM.set(
  "CRV",
  Address.fromString("0x1E4F97b9f9F913c46F1632781732927B9019C68b")
);

export const WHITELIST_TOKENS_ARBITRUM_ONE = new TypedMap<string, Address>();
WHITELIST_TOKENS_ARBITRUM_ONE.set(
  "WETH",
  Address.fromString("0x82af49447d8a07e3bd95bd0d56f35241523fbab1")
);
WHITELIST_TOKENS_ARBITRUM_ONE.set(
  "ETH",
  Address.fromString("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE")
);
WHITELIST_TOKENS_ARBITRUM_ONE.set(
  "USDT",
  Address.fromString("0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9")
);
WHITELIST_TOKENS_ARBITRUM_ONE.set(
  "DAI",
  Address.fromString("0xda10009cbd5d07dd0cecc66161fc93d7c9000da1")
);
WHITELIST_TOKENS_ARBITRUM_ONE.set(
  "USDC",
  Address.fromString("0xff970a61a04b1ca14834a43f5de4533ebddb5cc8")
);
WHITELIST_TOKENS_ARBITRUM_ONE.set(
  "WBTC",
  Address.fromString("0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f")
);
WHITELIST_TOKENS_ARBITRUM_ONE.set(
  "LINK",
  Address.fromString("0xf97f4df75117a78c1a5a0dbb814af92458539fb4")
);
WHITELIST_TOKENS_ARBITRUM_ONE.set(
  "CRV",
  Address.fromString("0x11cdb42b0eb46d95f990bedd4695a6e3fa034978")
);

export const WHITELIST_TOKENS_MAP = new TypedMap<
  string,
  TypedMap<string, Address>
>();
WHITELIST_TOKENS_MAP.set("mainnet", WHITELIST_TOKENS_MAINNET);
WHITELIST_TOKENS_MAP.set("fantom", WHITELIST_TOKENS_FANTOM);
WHITELIST_TOKENS_MAP.set("arbitrum-one", WHITELIST_TOKENS_ARBITRUM_ONE);

export const WHITELIST_TOKENS_FORMAT = new TypedMap<string, Address>();
WHITELIST_TOKENS_MAP.set("bnb", WHITELIST_TOKENS_FORMAT);
WHITELIST_TOKENS_MAP.set("matic", WHITELIST_TOKENS_FORMAT);
WHITELIST_TOKENS_MAP.set("avalanche", WHITELIST_TOKENS_FORMAT);
