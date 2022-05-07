import { Address, BigDecimal, BigInt, TypedMap } from "@graphprotocol/graph-ts";
import { UniswapPair__getReservesResult } from "../../../generated/MainRegistry/UniswapPair";
import { SushiSwapPair__getReservesResult } from "../../../generated/MainRegistry/SushiSwapPair";

///////////////////////////////////////////////////////////////////////////
/////////////////////////////////// COMMON ////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGINT_TEN_THOUSAND = BigInt.fromI32(10000);

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);

export const DEFAULT_USDC_DECIMALS = BIGINT_TEN.pow(6);
export const DEFAULT_DECIMALS = BigInt.fromI32(18);
export const BIG_DECIMAL_1E18 = new BigInt(10).pow(18).toBigDecimal();
export const BIG_DECIMAL_1E8 = new BigInt(10).pow(8).toBigDecimal();
export const BIG_DECIMAL_1E6 = new BigInt(10).pow(6).toBigDecimal();

export const ZERO_ADDRESS_STRING = "0x0000000000000000000000000000000000000000";
export const ZERO_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000000");

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////
export const CURVE_ADDRESS_PROVIDER_MAINNET = "0x0000000022d53366457f9d5e68ec105046fc4383".toLowerCase();
export const CURVE_REGISTRY_V1_MAINNET = "0x7D86446dDb609eD0F5f8684AcF30380a356b2B4c".toLowerCase();

export const CURVE_CALCULATIONS_ADDRESS_MAP = new TypedMap<string, Address>();
CURVE_CALCULATIONS_ADDRESS_MAP.set(
  "mainnet",
  Address.fromString("0x25BF7b72815476Dd515044F9650Bf79bAd0Df655"), // CURVE_REGISTRY_MAINNET
);

export const CURVE_REGISTRY_ADDRESS_MAP = new TypedMap<string, Address>();
CURVE_REGISTRY_ADDRESS_MAP.set(
  "mainnet",
  Address.fromString(CURVE_REGISTRY_V1_MAINNET), // CURVE_REGISTRY_MAINNET
);

export const CURVE_ADDRESS_PROVIDER_MAP = new TypedMap<string, Address>();
CURVE_ADDRESS_PROVIDER_MAP.set(
  "mainnet",
  Address.fromString(CURVE_ADDRESS_PROVIDER_MAINNET), // CURVE_ADDRESS_PROVIDER_MAINNET
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// SUSHISWAP CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const SUSHISWAP_DEFAULT_RESERVE_CALL = new SushiSwapPair__getReservesResult(
  BIGINT_ZERO,
  BIGINT_ZERO,
  BIGINT_ZERO,
);

export const SUSHISWAP_CALCULATIONS_ADDRESS_MAP = new TypedMap<string, Address>();
SUSHISWAP_CALCULATIONS_ADDRESS_MAP.set(
  "mainnet",
  Address.fromString("0x8263e161A855B644f582d9C164C66aABEe53f927"), // CALCULATIONS_SUSHISWAP_MAINNET
);

export const SUSHISWAP_ROUTER_ADDRESSES = new TypedMap<string, Address>();
SUSHISWAP_ROUTER_ADDRESSES.set(
  "routerV1",
  Address.fromString("0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"), // SUSHISWAP_ROUTER_V1_MAINNET
);
SUSHISWAP_ROUTER_ADDRESSES.set(
  "routerV2",
  Address.fromString("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"), // SUSHISWAP_ROUTER_V2_MAINNET
);

export const SUSHISWAP_ROUTER_ADDRESS_MAP = new TypedMap<string, TypedMap<string, Address>>();
SUSHISWAP_ROUTER_ADDRESS_MAP.set(
  "mainnet",
  SUSHISWAP_ROUTER_ADDRESSES, // SUSHISWAP_ROUTER_MAINNET
);

///////////////////////////////////////////////////////////////////////////
//////////////////////////// UNISWAP CONTRACT /////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_DEFAULT_RESERVE_CALL = new UniswapPair__getReservesResult(BIGINT_ZERO, BIGINT_ZERO, BIGINT_ZERO);

export const UNISWAP_CONTRACT_ADDRESSES = new TypedMap<string, Address>();
UNISWAP_CONTRACT_ADDRESSES.set(
  "mainnet",
  Address.fromString("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"), // UNISWAP_ROUTER_MAINNET
);

export const UNI_V3_FACTORY_ADDRESS = Address.fromString("0x1F98431c8aD98523631AE4a59f267346ea31F984");
export const UNI_V3_QUOTER = Address.fromString("0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6");

///////////////////////////////////////////////////////////////////////////
///////////////////////////// YEARNLENS CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_CONTRACT_ADDRESS = new Map<string, string>();
YEARN_LENS_CONTRACT_ADDRESS.set(
  "mainnet",
  "0x83d95e0d5f402511db06817aff3f9ea88224b030", // YEARN_LENS_ORACLE_ADDRESS
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CHAINLINK CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CHAIN_LINK_USD_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000348");

export const CHAIN_LINK_CONTRACT_ADDRESS = new Map<string, Address>();
CHAIN_LINK_CONTRACT_ADDRESS.set("mainnet", Address.fromString("0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf"));

// https://market.link/search/feeds
export const CHAIN_LINK_MANUAL_MAINNET = new Map<string, Address>();
CHAIN_LINK_MANUAL_MAINNET.set("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2".toLowerCase(), Address.fromString("0xF79D6aFBb6dA890132F9D7c355e3015f15F3406F".toLowerCase())); // WETH for early price sourcing
CHAIN_LINK_MANUAL_MAINNET.set("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599".toLowerCase(), Address.fromString("0xF5fff180082d6017036B771bA883025c654BC935".toLowerCase())); // WBTC for early price sourcing
CHAIN_LINK_MANUAL_MAINNET.set("0x0316EB71485b0Ab14103307bf65a021042c6d380".toLowerCase(), Address.fromString("0xF5fff180082d6017036B771bA883025c654BC935".toLowerCase())); // HBTC for early price sourcing
CHAIN_LINK_MANUAL_MAINNET.set("0xfE18be6b3Bd88A2D2A7f928d00292E7a9963CfC6".toLowerCase(), Address.fromString("0xF5fff180082d6017036B771bA883025c654BC935".toLowerCase())); // sBTC for early price sourcing
CHAIN_LINK_MANUAL_MAINNET.set("0x8064d9Ae6cDf087b1bcd5BDf3531bD5d8C537a68".toLowerCase(), Address.fromString("0xF5fff180082d6017036B771bA883025c654BC935".toLowerCase())); // oBTC for early price sourcing
CHAIN_LINK_MANUAL_MAINNET.set("0xdB25f211AB05b1c97D595516F45794528a807ad8".toLowerCase(), Address.fromString("0x25Fa978ea1a7dc9bDc33a2959B9053EaE57169B5".toLowerCase())); // EURS for early price sourcing
CHAIN_LINK_MANUAL_MAINNET.set("0xC581b735A1688071A1746c968e0798D642EDE491".toLowerCase(), Address.fromString("0x25Fa978ea1a7dc9bDc33a2959B9053EaE57169B5".toLowerCase())); // EURT for early price sourcing


export const CHAIN_LINK_MANUAL_ADDRESS = new TypedMap<string, Map<string, Address>>();
CHAIN_LINK_MANUAL_ADDRESS.set("mainnet",CHAIN_LINK_MANUAL_MAINNET);


///////////////////////////////////////////////////////////////////////////
///////////////////////////////// HELPERS /////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const WHITELIST_TOKENS_FORMAT = new TypedMap<string, Address>();
export const WHITELIST_TOKENS_LIST: string[] = ["WETH", "USDT", "DAI", "USDC", "ETH", "WBTC", "EURS", "LINK"];

export const WHITELIST_TOKENS_MAINNET = new TypedMap<string, Address>();
WHITELIST_TOKENS_MAINNET.set("WETH", Address.fromString("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"));
WHITELIST_TOKENS_MAINNET.set("USDT", Address.fromString("0xdac17f958d2ee523a2206206994597c13d831ec7"));
WHITELIST_TOKENS_MAINNET.set("DAI", Address.fromString("0x6b175474e89094c44da98b954eedeac495271d0f"));
WHITELIST_TOKENS_MAINNET.set("USDC", Address.fromString("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"));
WHITELIST_TOKENS_MAINNET.set("ETH", Address.fromString("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"));
WHITELIST_TOKENS_MAINNET.set("WBTC", Address.fromString("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"));
WHITELIST_TOKENS_MAINNET.set("EURS", Address.fromString("0xdB25f211AB05b1c97D595516F45794528a807ad8"));
WHITELIST_TOKENS_MAINNET.set("LINK", Address.fromString("0x514910771AF9Ca656af840dff83E8264EcF986CA"));
WHITELIST_TOKENS_MAINNET.set("3CRV", Address.fromString("0x6c3f90f043a72fa612cbac8115ee7e52bde6e490"));
WHITELIST_TOKENS_MAINNET.set("RKP3R", Address.fromString("0xEdB67Ee1B171c4eC66E6c10EC43EDBbA20FaE8e9"));
WHITELIST_TOKENS_MAINNET.set("CRV", Address.fromString("0xD533a949740bb3306d119CC777fa900bA034cd52"));
export const WHITELIST_TOKENS_MAP = new TypedMap<string, TypedMap<string, Address>>();
WHITELIST_TOKENS_MAP.set("mainnet", WHITELIST_TOKENS_MAINNET);
WHITELIST_TOKENS_MAP.set("bnb", WHITELIST_TOKENS_FORMAT);
WHITELIST_TOKENS_MAP.set("matic", WHITELIST_TOKENS_FORMAT);
WHITELIST_TOKENS_MAP.set("fantom", WHITELIST_TOKENS_FORMAT);
WHITELIST_TOKENS_MAP.set("avalanche", WHITELIST_TOKENS_FORMAT);

export const CRV_REPLACEMENT_TOKENS_FORMAT = new TypedMap<string, Address>();

export const CRV_REPLACEMENT_TOKENS_MAINNET = new TypedMap<string, Address>();
CRV_REPLACEMENT_TOKENS_MAINNET.set(
  // LINKUSD : LINK
  "0x0E2EC54fC0B509F445631Bf4b91AB8168230C752".toLowerCase(),
  Address.fromString("0x514910771AF9Ca656af840dff83E8264EcF986CA"),
);
CRV_REPLACEMENT_TOKENS_MAINNET.set(
  // SYNTHLINK : LINK
  "0xbBC455cb4F1B9e4bFC4B73970d360c8f032EfEE6".toLowerCase(),
  Address.fromString("0x514910771AF9Ca656af840dff83E8264EcF986CA"),
);

CRV_REPLACEMENT_TOKENS_MAINNET.set(
  // oBTC : WBTC
  "0x8064d9Ae6cDf087b1bcd5BDf3531bD5d8C537a68".toLowerCase(),
  Address.fromString("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"),
);

CRV_REPLACEMENT_TOKENS_MAINNET.set(
  // sBTC : WBTC
  "0xfE18be6b3Bd88A2D2A7f928d00292E7a9963CfC6".toLowerCase(),
  Address.fromString("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"),
);

CRV_REPLACEMENT_TOKENS_MAINNET.set(
  // HBTC : WBTC
  "0x0316EB71485b0Ab14103307bf65a021042c6d380".toLowerCase(),
  Address.fromString("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"),
);


export const CRV_REPLACEMENT_TOKENS_MAP = new TypedMap<string, TypedMap<string, Address>>();
CRV_REPLACEMENT_TOKENS_MAP.set("mainnet", CRV_REPLACEMENT_TOKENS_MAINNET);
CRV_REPLACEMENT_TOKENS_MAP.set("bnb", CRV_REPLACEMENT_TOKENS_FORMAT);
CRV_REPLACEMENT_TOKENS_MAP.set("matic", CRV_REPLACEMENT_TOKENS_FORMAT);
CRV_REPLACEMENT_TOKENS_MAP.set("fantom", CRV_REPLACEMENT_TOKENS_FORMAT);
CRV_REPLACEMENT_TOKENS_MAP.set("avalanche", CRV_REPLACEMENT_TOKENS_FORMAT);

export const RKP3R_TOKEN = "0xEdB67Ee1B171c4eC66E6c10EC43EDBbA20FaE8e9";
export const RKP3R_ADDRESS = Address.fromString(RKP3R_TOKEN);

export const CVX_CRV_LP_TOKEN = "0x9d0464996170c6b9e75eed71c68b99ddedf279e8";
export const LINK_LP_TOKEN_ADDRESS = Address.fromString("0xcee60cFa923170e4f8204AE08B4fA6A3F5656F3a");

export const EURT_TOKEN = "0xC581b735A1688071A1746c968e0798D642EDE491";
export const EURT_ADDRESS = Address.fromString(EURT_TOKEN);

// for Forex and EUR pool, map lp token to Chainlink price feed
export const EURT_LP_TOKEN = "0xfd5db7463a3ab53fd211b4af195c5bccc1a03890";
export const EURS_LP_TOKEN = "0x194ebd173f6cdace046c53eacce9b953f28411d1";
export const EURN_LP_TOKEN = "0x3fb78e61784c9c637d560ede23ad57ca1294c14a";

// Fixed forex proper
export const EUR_LP_TOKEN = "0x19b080fe1ffa0553469d20ca36219f17fcf03859";
export const JPY_LP_TOKEN = "0x8818a9bb44fbf33502be7c15c500d0c783b73067";
export const KRW_LP_TOKEN = "0x8461a004b50d321cb22b7d034969ce6803911899";
export const GBP_LP_TOKEN = "0xd6ac1cb9019137a896343da59dde6d097f710538";
export const AUD_LP_TOKEN = "0x3f1b0278a9ee595635b61817630cc19de792f506";
export const CHF_LP_TOKEN = "0x9c2c8910f113181783c249d8f6aa41b51cde0f0c";

// Mixed USDT-forex (USDT-Forex) pools
export const EURS_USDC_LP_TOKEN = "0x3d229e1b4faab62f621ef2f6a610961f7bd7b23b";
export const EURT_USDT_LP_TOKEN = "0x3b6831c0077a1e44ed0a21841c3bc4dc11bce833";

export const FOREX_ORACLES = new Map<string, Address>();
FOREX_ORACLES.set(EURT_USDT_LP_TOKEN, Address.fromString("0xb49f677943BC038e9857d61E7d053CaA2C1734C1"));
FOREX_ORACLES.set(EURS_USDC_LP_TOKEN, Address.fromString("0xb49f677943BC038e9857d61E7d053CaA2C1734C1"));
FOREX_ORACLES.set(EURT_LP_TOKEN, Address.fromString("0xb49f677943BC038e9857d61E7d053CaA2C1734C1"));
FOREX_ORACLES.set(EURS_LP_TOKEN, Address.fromString("0xb49f677943BC038e9857d61E7d053CaA2C1734C1"));
FOREX_ORACLES.set(EURN_LP_TOKEN, Address.fromString("0xb49f677943BC038e9857d61E7d053CaA2C1734C1"));
FOREX_ORACLES.set(EUR_LP_TOKEN, Address.fromString("0xb49f677943BC038e9857d61E7d053CaA2C1734C1"));
FOREX_ORACLES.set(KRW_LP_TOKEN, Address.fromString("0x01435677FB11763550905594A16B645847C1d0F3"));
FOREX_ORACLES.set(JPY_LP_TOKEN, Address.fromString("0xBcE206caE7f0ec07b545EddE332A47C2F75bbeb3"));
FOREX_ORACLES.set(GBP_LP_TOKEN, Address.fromString("0x5c0Ab2d9b5a7ed9f470386e82BB36A3613cDd4b5"));
FOREX_ORACLES.set(AUD_LP_TOKEN, Address.fromString("0x77F9710E7d0A19669A13c055F62cd80d313dF022"));
FOREX_ORACLES.set(CHF_LP_TOKEN, Address.fromString("0x449d117117838fFA61263B61dA6301AA2a88B13A"));

export const STABLECOINS_MAINNET: Address[] = [];
STABLECOINS_MAINNET.push(Address.fromString("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48".toLowerCase())) // USDC
STABLECOINS_MAINNET.push(Address.fromString("0x6b175474e89094c44da98b954eedeac495271d0f".toLowerCase())) // DAI
STABLECOINS_MAINNET.push(Address.fromString("0xdac17f958d2ee523a2206206994597c13d831ec7".toLowerCase())) // USDT
STABLECOINS_MAINNET.push(Address.fromString("0x0000000000085d4780B73119b644AE5ecd22b376".toLowerCase())) // TUSD
STABLECOINS_MAINNET.push(Address.fromString("0x4Fabb145d64652a948d72533023f6E7A623C7C53".toLowerCase())) // BUSD
STABLECOINS_MAINNET.push(Address.fromString("0x8e870d67f660d95d5be530380d0ec0bd388289e1".toLowerCase())) // USDP
STABLECOINS_MAINNET.push(Address.fromString("0x57ab1ec28d129707052df4df418d58a2d46d5f51".toLowerCase())) // sUSD



export const STABLECOINS_FORMAT = new Array<Address>();
export const STABLECOINS_MAP = new TypedMap<string, Address[]>();


STABLECOINS_MAP.set("mainnet", STABLECOINS_MAINNET);
STABLECOINS_MAP.set("bnb", STABLECOINS_FORMAT);
STABLECOINS_MAP.set("matic", STABLECOINS_FORMAT);
STABLECOINS_MAP.set("fantom", STABLECOINS_FORMAT);
STABLECOINS_MAP.set("avalanche", STABLECOINS_FORMAT);


// compound mantissa value to add to underlying decimals when decimalizing the exchange rate stored in ctoken contract
export const exchangeRateMantissa = 10;
export const usd_decimals = BIGINT_TEN.pow(BigInt.fromI32(6).toI32() as u8).toBigDecimal();

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONSTANTS //////////////////////////
///////////////////////////////////////////////////////////////////////////
export const ASSET_TYPES = new Map<string, i32>(); // lptoken, asset type
ASSET_TYPES.set("0xd905e2eaebe188fc92179b6350807d8bd91db0d8", 0);
ASSET_TYPES.set("0x410e3e86ef427e30b9235497143881f717d93c2a", 2);
ASSET_TYPES.set("0x194ebd173f6cdace046c53eacce9b953f28411d1", 3);
ASSET_TYPES.set("0x4f3e8f405cf5afc05d68142f3783bdfe13811522", 0);
ASSET_TYPES.set("0x5282a4ef67d9c33135340fb3289cc1711c13638c", 0);
ASSET_TYPES.set("0x97e2768e8e73511ca874545dc5ff8067eb19b787", 0);
ASSET_TYPES.set("0x5b5cfe992adac0c9d48e05854b2d91c73a003858", 0);
ASSET_TYPES.set("0x7eb40e450b9655f4b3cc4259bcc731c63ff55ae6", 0);
ASSET_TYPES.set("0x43b4fdfd4ff969587185cdb6f0bd875c5fc83f8c", 0);
ASSET_TYPES.set("0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8", 0);
ASSET_TYPES.set("0x4807862aa8b2bf68830e4c8dc86d0e9a998e085a", 0);
ASSET_TYPES.set("0xb19059ebb43466c323583928285a49f558e572fd", 2);
ASSET_TYPES.set("0xd2967f45c4f384deea880f807be904762a3dea07", 0);
ASSET_TYPES.set("0x9fc689ccada600b6df723d9e47d84d76664a1f23", 0);
ASSET_TYPES.set("0x3b3ac5386837dc563660fb6a0937dfaa5924333b", 0);
ASSET_TYPES.set("0xde5331ac4b3630f94853ff322b66407e0d6331e8", 2);
ASSET_TYPES.set("0x075b1bb99792c9e1041ba13afef80c91a1e70fb3", 2);
ASSET_TYPES.set("0x3a664ab939fd8482048609f652f9a0b0677337b9", 0);
ASSET_TYPES.set("0xca3d75ac011bf5ad07a98d02f18225f9bd9a6bdf", 4);
ASSET_TYPES.set("0x1aef73d49dedc4b1778d0706583995958dc862e6", 0);
ASSET_TYPES.set("0x94e131324b6054c0d789b190b2dac504e4361b53", 0);
ASSET_TYPES.set("0x49849c98ae39fff122806c06791fa73784fb3675", 2);
ASSET_TYPES.set("0x845838df265dcd2c412a1dc9e959c7d08537f8a2", 0);
ASSET_TYPES.set("0xc25a3a3b969415c80451098fa907ec722572917f", 0);
ASSET_TYPES.set("0xaa17a236f2badc98ddc0cf999abb47d47fc0a6cf", 1);
ASSET_TYPES.set("0x6c3f90f043a72fa612cbac8115ee7e52bde6e490", 0);
ASSET_TYPES.set("0xc2ee6b0334c261ed60c72f6054450b61b8f18e35", 0);
ASSET_TYPES.set("0x64eda51d3ad40d56b9dfc5554e06f94e1dd786fd", 2);
ASSET_TYPES.set("0xa3d87fffce63b53e0d54faa1cc983b7eb0b74a9c", 1);
ASSET_TYPES.set("0xd51a44d3fae010294c616388b506acda1bfaae46", 0);
ASSET_TYPES.set("0xd632f22692fac7611d2aa1c0d552930d43caed3b", 0);
ASSET_TYPES.set("0x2fe94ea3d5d4a175184081439753de15aef9d614", 2);
ASSET_TYPES.set("0x06325440d014e39736583c165c2963ba99faf14e", 1);
ASSET_TYPES.set("0xfd2a8fa60abd58efe3eee34dd494cd491dc14900", 0);
ASSET_TYPES.set("0x02d341ccb60faaf662bc0554d13778015d1b285c", 0);
ASSET_TYPES.set("0xecd5e75afb02efa118af914515d6521aabd189f1", 0);
ASSET_TYPES.set("0xed279fdd11ca84beef15af5d39bb4d4bee23f0ca", 0);
ASSET_TYPES.set("0xcee60cfa923170e4f8204ae08b4fa6a3f5656f3a", 3);
ASSET_TYPES.set("0x53a901d48795c58f485cbb38df08fa96a24669d5", 1);
ASSET_TYPES.set("0xfd5db7463a3ab53fd211b4af195c5bccc1a03890", 3);
ASSET_TYPES.set("0x9d0464996170c6b9e75eed71c68b99ddedf279e8", 3);
ASSET_TYPES.set("0xc4c319e2d4d66cca4464c0c2b32c9bd23ebe784e", 1);
ASSET_TYPES.set("0xfbdca68601f835b27790d98bbb8ec7f05fdeaa9b", 2);
ASSET_TYPES.set("0x6d65b498cb23deaba52db31c93da9bffb340fb8f", 4);

export const LP_TOKEN_POOL_MAP = new Map<string, Address>(); // lptoken, pool
LP_TOKEN_POOL_MAP.set("0xd905e2eaebe188fc92179b6350807d8bd91db0d8", Address.fromString("0x06364f10B501e868329afBc005b3492902d6C763"));
LP_TOKEN_POOL_MAP.set("0x410e3e86ef427e30b9235497143881f717d93c2a", Address.fromString("0x071c661B4DeefB59E2a3DdB20Db036821eeE8F4b"));
LP_TOKEN_POOL_MAP.set("0x194ebd173f6cdace046c53eacce9b953f28411d1", Address.fromString("0x0Ce6a5fF5217e38315f87032CF90686C96627CAA"));
LP_TOKEN_POOL_MAP.set("0x4f3e8f405cf5afc05d68142f3783bdfe13811522", Address.fromString("0x0f9cb53Ebe405d49A0bbdBD291A65Ff571bC83e1"));
LP_TOKEN_POOL_MAP.set("0x5282a4ef67d9c33135340fb3289cc1711c13638c", Address.fromString("0x2dded6Da1BF5DBdF597C45fcFaa3194e53EcfeAF"));
LP_TOKEN_POOL_MAP.set("0x97e2768e8e73511ca874545dc5ff8067eb19b787", Address.fromString("0x3E01dD8a5E1fb3481F0F589056b428Fc308AF0Fb"));
LP_TOKEN_POOL_MAP.set("0x5b5cfe992adac0c9d48e05854b2d91c73a003858", Address.fromString("0x3eF6A01A0f81D6046290f3e2A8c5b843e738E604"));
LP_TOKEN_POOL_MAP.set("0x7eb40e450b9655f4b3cc4259bcc731c63ff55ae6", Address.fromString("0x42d7025938bEc20B69cBae5A77421082407f053A"));
LP_TOKEN_POOL_MAP.set("0x43b4fdfd4ff969587185cdb6f0bd875c5fc83f8c", Address.fromString("0x43b4fdfd4ff969587185cdb6f0bd875c5fc83f8c"));
LP_TOKEN_POOL_MAP.set("0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8", Address.fromString("0x45F783CCE6B7FF23B2ab2D70e416cdb7D6055f51"));
LP_TOKEN_POOL_MAP.set("0x4807862aa8b2bf68830e4c8dc86d0e9a998e085a", Address.fromString("0x4807862aa8b2bf68830e4c8dc86d0e9a998e085a"));
LP_TOKEN_POOL_MAP.set("0xb19059ebb43466c323583928285a49f558e572fd", Address.fromString("0x4CA9b3063Ec5866A4B82E437059D2C43d1be596F"));
LP_TOKEN_POOL_MAP.set("0xd2967f45c4f384deea880f807be904762a3dea07", Address.fromString("0x4f062658EaAF2C1ccf8C8e36D6824CDf41167956"));
LP_TOKEN_POOL_MAP.set("0x9fc689ccada600b6df723d9e47d84d76664a1f23", Address.fromString("0x52EA46506B9CC5Ef470C5bf89f17Dc28bB35D85C"));
LP_TOKEN_POOL_MAP.set("0x3b3ac5386837dc563660fb6a0937dfaa5924333b", Address.fromString("0x79a8C46DeA5aDa233ABaFFD40F3A0A2B1e5A4F27"));
LP_TOKEN_POOL_MAP.set("0xde5331ac4b3630f94853ff322b66407e0d6331e8", Address.fromString("0x7F55DDe206dbAD629C080068923b36fe9D6bDBeF"));
LP_TOKEN_POOL_MAP.set("0x075b1bb99792c9e1041ba13afef80c91a1e70fb3", Address.fromString("0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714"));
LP_TOKEN_POOL_MAP.set("0x3a664ab939fd8482048609f652f9a0b0677337b9", Address.fromString("0x8038C01A0390a8c547446a0b2c18fc9aEFEcc10c"));
LP_TOKEN_POOL_MAP.set("0xca3d75ac011bf5ad07a98d02f18225f9bd9a6bdf", Address.fromString("0x80466c64868E1ab14a1Ddf27A676C3fcBE638Fe5"));
LP_TOKEN_POOL_MAP.set("0x1aef73d49dedc4b1778d0706583995958dc862e6", Address.fromString("0x8474DdbE98F5aA3179B3B3F5942D724aFcdec9f6"));
LP_TOKEN_POOL_MAP.set("0x94e131324b6054c0d789b190b2dac504e4361b53", Address.fromString("0x890f4e345B1dAED0367A877a1612f86A1f86985f"));
LP_TOKEN_POOL_MAP.set("0x49849c98ae39fff122806c06791fa73784fb3675", Address.fromString("0x93054188d876f558f4a66B2EF1d97d16eDf0895B"));
LP_TOKEN_POOL_MAP.set("0x845838df265dcd2c412a1dc9e959c7d08537f8a2", Address.fromString("0xA2B47E3D5c44877cca798226B7B8118F9BFb7A56"));
LP_TOKEN_POOL_MAP.set("0xc25a3a3b969415c80451098fa907ec722572917f", Address.fromString("0xA5407eAE9Ba41422680e2e00537571bcC53efBfD"));
LP_TOKEN_POOL_MAP.set("0xaa17a236f2badc98ddc0cf999abb47d47fc0a6cf", Address.fromString("0xA96A65c051bF88B4095Ee1f2451C2A9d43F53Ae2"));
LP_TOKEN_POOL_MAP.set("0x6c3f90f043a72fa612cbac8115ee7e52bde6e490", Address.fromString("0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7"));
LP_TOKEN_POOL_MAP.set("0xc2ee6b0334c261ed60c72f6054450b61b8f18e35", Address.fromString("0xC18cC39da8b11dA8c3541C598eE022258F9744da"));
LP_TOKEN_POOL_MAP.set("0x64eda51d3ad40d56b9dfc5554e06f94e1dd786fd", Address.fromString("0xC25099792E9349C7DD09759744ea681C7de2cb66"));
LP_TOKEN_POOL_MAP.set("0xa3d87fffce63b53e0d54faa1cc983b7eb0b74a9c", Address.fromString("0xc5424B857f758E906013F3555Dad202e4bdB4567"));
LP_TOKEN_POOL_MAP.set("0xd51a44d3fae010294c616388b506acda1bfaae46", Address.fromString("0xd51a44d3fae010294c616388b506acda1bfaae46"));
LP_TOKEN_POOL_MAP.set("0xd632f22692fac7611d2aa1c0d552930d43caed3b", Address.fromString("0xd632f22692fac7611d2aa1c0d552930d43caed3b"));
LP_TOKEN_POOL_MAP.set("0x2fe94ea3d5d4a175184081439753de15aef9d614", Address.fromString("0xd81dA8D904b52208541Bade1bD6595D8a251F8dd"));
LP_TOKEN_POOL_MAP.set("0x06325440d014e39736583c165c2963ba99faf14e", Address.fromString("0xDC24316b9AE028F1497c275EB9192a3Ea0f67022"));
LP_TOKEN_POOL_MAP.set("0xfd2a8fa60abd58efe3eee34dd494cd491dc14900", Address.fromString("0xDeBF20617708857ebe4F679508E7b7863a8A8EeE"));
LP_TOKEN_POOL_MAP.set("0x02d341ccb60faaf662bc0554d13778015d1b285c", Address.fromString("0xEB16Ae0052ed37f479f7fe63849198Df1765a733"));
LP_TOKEN_POOL_MAP.set("0xecd5e75afb02efa118af914515d6521aabd189f1", Address.fromString("0xecd5e75afb02efa118af914515d6521aabd189f1"));
LP_TOKEN_POOL_MAP.set("0xed279fdd11ca84beef15af5d39bb4d4bee23f0ca", Address.fromString("0xed279fdd11ca84beef15af5d39bb4d4bee23f0ca"));
LP_TOKEN_POOL_MAP.set("0xcee60cfa923170e4f8204ae08b4fa6a3f5656f3a", Address.fromString("0xF178C0b5Bb7e7aBF4e12A4838C7b7c5bA2C623c0"));
LP_TOKEN_POOL_MAP.set("0x53a901d48795c58f485cbb38df08fa96a24669d5", Address.fromString("0xF9440930043eb3997fc70e1339dBb11F341de7A8"));
LP_TOKEN_POOL_MAP.set("0xfd5db7463a3ab53fd211b4af195c5bccc1a03890", Address.fromString("0xfd5db7463a3ab53fd211b4af195c5bccc1a03890"));
LP_TOKEN_POOL_MAP.set("0x9d0464996170c6b9e75eed71c68b99ddedf279e8", Address.fromString("0x9d0464996170c6b9e75eed71c68b99ddedf279e8"));
LP_TOKEN_POOL_MAP.set("0xc4c319e2d4d66cca4464c0c2b32c9bd23ebe784e", Address.fromString("0xc4c319e2d4d66cca4464c0c2b32c9bd23ebe784e"));
LP_TOKEN_POOL_MAP.set("0xfbdca68601f835b27790d98bbb8ec7f05fdeaa9b", Address.fromString("0xfbdca68601f835b27790d98bbb8ec7f05fdeaa9b"));
LP_TOKEN_POOL_MAP.set("0x6d65b498cb23deaba52db31c93da9bffb340fb8f", Address.fromString("0xE7a24EF0C5e95Ffb0f6684b813A78F2a3AD7D171"));