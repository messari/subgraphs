import { BigDecimal, BigInt, TypedMap, Address } from "@graphprotocol/graph-ts";

////////////////////////
///// Schema Enums /////
////////////////////////

// The network names corresponding to the Network enum in the schema.
// They also correspond to the ones in `dataSource.network()` after converting to lower case.
// See below for a complete list:
// https://thegraph.com/docs/en/hosted-service/what-is-hosted-service/#supported-networks-on-the-hosted-service
export namespace Network {
  export const ARBITRUM_ONE = "ARBITRUM_ONE";
  export const AVALANCHE = "AVALANCHE";
  export const AURORA = "AURORA";
  export const BSC = "BSC"; // aka BNB Chain
  export const CELO = "CELO";
  export const MAINNET = "MAINNET"; // Ethereum mainnet
  export const FANTOM = "FANTOM";
  export const FUSE = "FUSE";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const NEAR_MAINNET = "NEAR_MAINNET";
  export const OPTIMISM = "OPTIMISM";
  export const MATIC = "MATIC"; // aka Polygon
  export const XDAI = "XDAI"; // aka Gnosis Chain
}

export namespace ProtocolType {
  export const EXCHANGE = "EXCHANGE";
  export const LENDING = "LENDING";
  export const YIELD = "YIELD";
  export const BRIDGE = "BRIDGE";
  export const GENERIC = "GENERIC";
}

export namespace VaultFeeType {
  export const MANAGEMENT_FEE = "MANAGEMENT_FEE";
  export const PERFORMANCE_FEE = "PERFORMANCE_FEE";
  export const DEPOSIT_FEE = "DEPOSIT_FEE";
  export const WITHDRAWAL_FEE = "WITHDRAWAL_FEE";
}

export namespace LiquidityPoolFeeType {
  export const FIXED_TRADING_FEE = "FIXED_TRADING_FEE";
  export const TIERED_TRADING_FEE = "TIERED_TRADING_FEE";
  export const DYNAMIC_TRADING_FEE = "DYNAMIC_TRADING_FEE";
  export const FIXED_LP_FEE = "FIXED_LP_FEE";
  export const DYNAMIC_LP_FEE = "DYNAMIC_LP_FEE";
  export const FIXED_PROTOCOL_FEE = "FIXED_PROTOCOL_FEE";
  export const DYNAMIC_PROTOCOL_FEE = "DYNAMIC_PROTOCOL_FEE";
}

export namespace RewardTokenType {
  export const DEPOSIT = "DEPOSIT";
  export const BORROW = "BORROW";
}

export namespace LendingType {
  export const CDP = "CDP";
  export const POOLED = "POOLED";
}

export namespace RiskType {
  export const GLOBAL = "GLOBAL";
  export const ISOLATED = "ISOLATED";
}

export namespace InterestRateType {
  export const STABLE = "STABLE";
  export const VARIABLE = "VARIABLE";
  export const FIXED_TERM = "FIXED_TERM";
}

export namespace InterestRateSide {
  export const LENDER = "LENDER";
  export const BORROWER = "BORROWER";
}

//////////////////////////////
///// Ethereum Addresses /////
//////////////////////////////

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE".toLowerCase();

export const UNISWAP_V2_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

export const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
export const USDC_WETH_PAIR = "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc"; // created 10008355
export const DAI_WETH_PAIR = "0xa478c2975ab1ea89e8196811f51a7b7ade33eb11"; // created block 10042267
export const USDT_WETH_PAIR = "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"; // created block 10093341

////////////////////////
///// Type Helpers /////
////////////////////////

export const DEFAULT_DECIMALS = 18;

export const USDC_DECIMALS = 6;
export const USDC_DENOMINATOR = BigDecimal.fromString("1000000");

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TWO = BigInt.fromI32(2);
export const BIGINT_HUNDRED = BigInt.fromI32(100);
export const BIGINT_THOUSAND = BigInt.fromI32(1000);
export const BIGINT_MAX = BigInt.fromString(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935",
);

export const INT_NEGATIVE_ONE = -1 as i32;
export const INT_ZERO = 0 as i32;
export const INT_ONE = 1 as i32;
export const INT_TWO = 2 as i32;
export const INT_FOUR = 4 as i32;

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export const BIGDECIMAL_TWO = new BigDecimal(BIGINT_TWO);
export const BIGDECIMAL_HUNDRED = new BigDecimal(BIGINT_HUNDRED);

export const MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));

/////////////////////
///// Date/Time /////
/////////////////////

export const SECONDS_PER_DAY = 60 * 60 * 24; // 86400
export const MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export const DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const MS_PER_YEAR = DAYS_PER_YEAR.times(new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000)));

////////////////
///// Misc /////
////////////////

export const ETH_SYMBOL = "ETH";
export const ETH_NAME = "Ether";

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////
export const CURVE_REGISTRY_V1_MAINNET = "0x7D86446dDb609eD0F5f8684AcF30380a356b2B4c".toLowerCase();
export const CURVE_REGISTRY_V2_MAINNET = "0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5".toLowerCase();

export const CURVE_REGISTRY_MAP = new TypedMap<string, TypedMap<string, Address>>();
//CURVE_REGISTRY_MAP.set("mainnet", WHITELIST_TOKENS_MAINNET);

export const BIGINT_CRV_LP_TOKEN_DECIMALS = BigInt.fromI32(1000000);

export const ASSET_TYPES = new Map<string, i32>();
ASSET_TYPES.set("0x06364f10b501e868329afbc005b3492902d6c763", 0);
ASSET_TYPES.set("0x071c661b4deefb59e2a3ddb20db036821eee8f4b", 2);
ASSET_TYPES.set("0x0ce6a5ff5217e38315f87032cf90686c96627caa", 3);
ASSET_TYPES.set("0x0f9cb53ebe405d49a0bbdbd291a65ff571bc83e1", 0);
ASSET_TYPES.set("0x2dded6da1bf5dbdf597c45fcfaa3194e53ecfeaf", 0);
ASSET_TYPES.set("0x3e01dd8a5e1fb3481f0f589056b428fc308af0fb", 0);
ASSET_TYPES.set("0x3ef6a01a0f81d6046290f3e2a8c5b843e738e604", 0);
ASSET_TYPES.set("0x42d7025938bec20b69cbae5a77421082407f053a", 0);
ASSET_TYPES.set("0x43b4fdfd4ff969587185cdb6f0bd875c5fc83f8c", 0);
ASSET_TYPES.set("0x45f783cce6b7ff23b2ab2d70e416cdb7d6055f51", 0);
ASSET_TYPES.set("0x4807862aa8b2bf68830e4c8dc86d0e9a998e085a", 0);
ASSET_TYPES.set("0x4ca9b3063ec5866a4b82e437059d2c43d1be596f", 2);
ASSET_TYPES.set("0x4f062658eaaf2c1ccf8c8e36d6824cdf41167956", 0);
ASSET_TYPES.set("0x52ea46506b9cc5ef470c5bf89f17dc28bb35d85c", 0);
ASSET_TYPES.set("0x79a8c46dea5ada233abaffd40f3a0a2b1e5a4f27", 0);
ASSET_TYPES.set("0x7f55dde206dbad629c080068923b36fe9d6bdbef", 2);
ASSET_TYPES.set("0x7fc77b5c7614e1533320ea6ddc2eb61fa00a9714", 2);
ASSET_TYPES.set("0x8038c01a0390a8c547446a0b2c18fc9aefecc10c", 0);
ASSET_TYPES.set("0x80466c64868e1ab14a1ddf27a676c3fcbe638fe5", 4);
ASSET_TYPES.set("0x8474ddbe98f5aa3179b3b3f5942d724afcdec9f6", 0);
ASSET_TYPES.set("0x890f4e345b1daed0367a877a1612f86a1f86985f", 0);
ASSET_TYPES.set("0x93054188d876f558f4a66b2ef1d97d16edf0895b", 2);
ASSET_TYPES.set("0xa2b47e3d5c44877cca798226b7b8118f9bfb7a56", 0);
ASSET_TYPES.set("0xa5407eae9ba41422680e2e00537571bcc53efbfd", 0);
ASSET_TYPES.set("0xa96a65c051bf88b4095ee1f2451c2a9d43f53ae2", 1);
ASSET_TYPES.set("0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7", 0);
ASSET_TYPES.set("0xc18cc39da8b11da8c3541c598ee022258f9744da", 0);
ASSET_TYPES.set("0xc25099792e9349c7dd09759744ea681c7de2cb66", 2);
ASSET_TYPES.set("0xc5424b857f758e906013f3555dad202e4bdb4567", 1);
ASSET_TYPES.set("0xd51a44d3fae010294c616388b506acda1bfaae46", 0);
ASSET_TYPES.set("0xd632f22692fac7611d2aa1c0d552930d43caed3b", 0);
ASSET_TYPES.set("0xd81da8d904b52208541bade1bd6595d8a251f8dd", 2);
ASSET_TYPES.set("0xdc24316b9ae028f1497c275eb9192a3ea0f67022", 1);
ASSET_TYPES.set("0xdebf20617708857ebe4f679508e7b7863a8a8eee", 0);
ASSET_TYPES.set("0xeb16ae0052ed37f479f7fe63849198df1765a733", 0);
ASSET_TYPES.set("0xecd5e75afb02efa118af914515d6521aabd189f1", 0);
ASSET_TYPES.set("0xed279fdd11ca84beef15af5d39bb4d4bee23f0ca", 0);
ASSET_TYPES.set("0xf178c0b5bb7e7abf4e12a4838c7b7c5ba2c623c0", 3);
ASSET_TYPES.set("0xf9440930043eb3997fc70e1339dbb11f341de7a8", 1);
ASSET_TYPES.set("0xfd5db7463a3ab53fd211b4af195c5bccc1a03890", 3);
ASSET_TYPES.set("0x9d0464996170c6b9e75eed71c68b99ddedf279e8", 3);
ASSET_TYPES.set("0xc4c319e2d4d66cca4464c0c2b32c9bd23ebe784e", 1);
ASSET_TYPES.set("0xfbdca68601f835b27790d98bbb8ec7f05fdeaa9b", 2);



export const POOL_GAUGE_MAP = new TypedMap<string, string>();
export const POOL_LP_TOKEN_MAP = new TypedMap<string, string>();

POOL_GAUGE_MAP.set("0xA2B47E3D5c44877cca798226B7B8118F9BFb7A56".toLowerCase(),"0x7ca5b0a2910B33e9759DC7dDB0413949071D7575".toLowerCase());
POOL_LP_TOKEN_MAP.set("0xA2B47E3D5c44877cca798226B7B8118F9BFb7A56".toLowerCase(),"0x845838DF265Dcd2c412A1Dc9e959c7d08537f8a2".toLowerCase());

POOL_GAUGE_MAP.set("0x52EA46506B9CC5Ef470C5bf89f17Dc28bB35D85C".toLowerCase(),"0xBC89cd85491d81C6AD2954E6d0362Ee29fCa8F53".toLowerCase());
POOL_LP_TOKEN_MAP.set("0x52EA46506B9CC5Ef470C5bf89f17Dc28bB35D85C".toLowerCase(),"0x52EA46506B9CC5Ef470C5bf89f17Dc28bB35D85C".toLowerCase());

POOL_GAUGE_MAP.set("0x45F783CCE6B7FF23B2ab2D70e416cdb7D6055f51".toLowerCase(),"0xFA712EE4788C042e2B7BB55E6cb8ec569C4530c1".toLowerCase());
POOL_LP_TOKEN_MAP.set("0x45F783CCE6B7FF23B2ab2D70e416cdb7D6055f51".toLowerCase(),"0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8".toLowerCase());

POOL_GAUGE_MAP.set("0x79a8C46DeA5aDa233ABaFFD40F3A0A2B1e5A4F27".toLowerCase(),"0x69Fb7c45726cfE2baDeE8317005d3F94bE838840".toLowerCase());
POOL_LP_TOKEN_MAP.set("0x79a8C46DeA5aDa233ABaFFD40F3A0A2B1e5A4F27".toLowerCase(),"0x3B3Ac5386837Dc563660FB6a0937DFAa5924333B".toLowerCase());

POOL_GAUGE_MAP.set("0xA5407eAE9Ba41422680e2e00537571bcC53efBfD".toLowerCase(),"0xA90996896660DEcC6E997655E065b23788857849".toLowerCase());
POOL_LP_TOKEN_MAP.set("0xA5407eAE9Ba41422680e2e00537571bcC53efBfD".toLowerCase(),"0xC25a3A3b969415c80451098fa907EC722572917F".toLowerCase());

POOL_GAUGE_MAP.set("0x06364f10B501e868329afBc005b3492902d6C763".toLowerCase(),"0x64E3C23bfc40722d3B649844055F1D51c1ac041d".toLowerCase());
POOL_LP_TOKEN_MAP.set("0x06364f10B501e868329afBc005b3492902d6C763".toLowerCase(),"0xD905e2eaeBe188fc92179b6350807D8bd91Db0D8".toLowerCase());

POOL_GAUGE_MAP.set("0x93054188d876f558f4a66B2EF1d97d16eDf0895B".toLowerCase(),"0xB1F2cdeC61db658F091671F5f199635aEF202CAC".toLowerCase());
POOL_LP_TOKEN_MAP.set("0x93054188d876f558f4a66B2EF1d97d16eDf0895B".toLowerCase(),"0x49849C98ae39Fff122806C06791Fa73784FB3675".toLowerCase());

POOL_GAUGE_MAP.set("0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714".toLowerCase(),"0x705350c4BcD35c9441419DdD5d2f097d7a55410F".toLowerCase());
POOL_LP_TOKEN_MAP.set("0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714".toLowerCase(),"0x075b1bb99792c9E1041bA13afEf80C91a1e70fB3".toLowerCase());

POOL_GAUGE_MAP.set("0x4CA9b3063Ec5866A4B82E437059D2C43d1be596F".toLowerCase(),"0x4c18E409Dc8619bFb6a1cB56D114C3f592E0aE79".toLowerCase());
POOL_LP_TOKEN_MAP.set("0x4CA9b3063Ec5866A4B82E437059D2C43d1be596F".toLowerCase(),"0xb19059ebb43466C323583928285a49f558E572Fd".toLowerCase());

POOL_GAUGE_MAP.set("0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7".toLowerCase(),"0xbFcF63294aD7105dEa65aA58F8AE5BE2D9d0952A".toLowerCase());
POOL_LP_TOKEN_MAP.set("0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7".toLowerCase(),"0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490".toLowerCase());

POOL_GAUGE_MAP.set("0x4f062658EaAF2C1ccf8C8e36D6824CDf41167956".toLowerCase(),"0xC5cfaDA84E902aD92DD40194f0883ad49639b023".toLowerCase());
POOL_LP_TOKEN_MAP.set("0x4f062658EaAF2C1ccf8C8e36D6824CDf41167956".toLowerCase(),"0xD2967f45c4f384DEEa880F807Be904762a3DeA07".toLowerCase());

POOL_GAUGE_MAP.set("0x3eF6A01A0f81D6046290f3e2A8c5b843e738E604".toLowerCase(),"0x2db0E83599a91b508Ac268a6197b8B14F5e72840".toLowerCase());
POOL_LP_TOKEN_MAP.set("0x3eF6A01A0f81D6046290f3e2A8c5b843e738E604".toLowerCase(),"0x5B5CFE992AdAC0C9D48E05854B2d91C73a003858".toLowerCase());

POOL_GAUGE_MAP.set("0x3E01dD8a5E1fb3481F0F589056b428Fc308AF0Fb".toLowerCase(),"0xC2b1DF84112619D190193E48148000e3990Bf627".toLowerCase());
POOL_LP_TOKEN_MAP.set("0x3E01dD8a5E1fb3481F0F589056b428Fc308AF0Fb".toLowerCase(),"0x97E2768e8E73511cA874545DC5Ff8067eB19B787".toLowerCase());

POOL_GAUGE_MAP.set("0x0f9cb53Ebe405d49A0bbdBD291A65Ff571bC83e1".toLowerCase(),"0xF98450B5602fa59CC66e1379DFfB6FDDc724CfC4".toLowerCase());
POOL_LP_TOKEN_MAP.set("0x0f9cb53Ebe405d49A0bbdBD291A65Ff571bC83e1".toLowerCase(),"0x4f3E8F405CF5aFC05D68142F3783bDfE13811522".toLowerCase());

POOL_GAUGE_MAP.set("0x8474DdbE98F5aA3179B3B3F5942D724aFcdec9f6".toLowerCase(),"0x5f626c30EC1215f4EdCc9982265E8b1F411D1352".toLowerCase());
POOL_LP_TOKEN_MAP.set("0x8474DdbE98F5aA3179B3B3F5942D724aFcdec9f6".toLowerCase(),"0x1AEf73d49Dedc4b1778d0706583995958Dc862e6".toLowerCase());

POOL_GAUGE_MAP.set("0xC18cC39da8b11dA8c3541C598eE022258F9744da".toLowerCase(),"0x4dC4A289a8E33600D8bD4cf5F6313E43a37adec7".toLowerCase());
POOL_LP_TOKEN_MAP.set("0xC18cC39da8b11dA8c3541C598eE022258F9744da".toLowerCase(),"0xC2Ee6b0334C261ED60C72f6054450b61B8f18E35".toLowerCase());

POOL_GAUGE_MAP.set("0xC25099792E9349C7DD09759744ea681C7de2cb66".toLowerCase(),"0x64eda51d3Ad40D56b9dFc5554E06F94e1Dd786Fd".toLowerCase());
POOL_LP_TOKEN_MAP.set("0xC25099792E9349C7DD09759744ea681C7de2cb66".toLowerCase(),"0xC2Ee6b0334C261ED60C72f6054450b61B8f18E35".toLowerCase());
