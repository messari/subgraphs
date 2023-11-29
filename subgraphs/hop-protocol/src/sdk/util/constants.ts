import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

////////////////////

///// Versions /////
////////////////////

export const PROTOCOL_NAME = "Uniswap v2";
export const PROTOCOL_SLUG = "uniswap-v2";

////////////////////////
///// Schema Enums /////
////////////////////////

// The network names corresponding to the Network enum in the schema.
// They also correspond to the ones in `dataSource.network()` after converting to lower case.
// See below for a complete list:
// https://thegraph.com/docs/en/hosted-service/what-is-hosted-service/#supported-networks-on-the-hosted-service
export namespace Network {
  export const ARBITRUM_ONE = "ARBITRUM_ONE";
  export const ARBITRUM_NOVA = "ARBITRUM_NOVA";
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

  // other networks
  export const UBIQ = "UBIQ";
  export const SONGBIRD = "SONGBIRD";
  export const ELASTOS = "ELASTOS";
  export const KARDIACHAIN = "KARDIACHAIN";
  export const CRONOS = "CRONOS";
  export const RSK = "RSK";
  export const TELOS = "TELOS";
  export const XDC = "XDC";
  export const ZYX = "ZYX";
  export const CSC = "CSC";
  export const SYSCOIN = "SYSCOIN";
  export const GOCHAIN = "GOCHAIN";
  export const ETHEREUMCLASSIC = "ETHEREUMCLASSIC";
  export const OKEXCHAIN = "OKEXCHAIN";
  export const HOO = "HOO";
  export const METER = "METER";
  export const NOVA_NETWORK = "NOVA_NETWORK";
  export const TOMOCHAIN = "TOMOCHAIN";
  export const VELAS = "VELAS";
  export const THUNDERCORE = "THUNDERCORE";
  export const HECO = "HECO";
  export const XDAIARB = "XDAIARB";
  export const ENERGYWEB = "ENERGYWEB";
  export const HPB = "HPB";
  export const BOBA = "BOBA";
  export const KUCOIN = "KUCOIN";
  export const SHIDEN = "SHIDEN";
  export const THETA = "THETA";
  export const SX = "SX";
  export const CANDLE = "CANDLE";
  export const ASTAR = "ASTAR";
  export const CALLISTO = "CALLISTO";
  export const WANCHAIN = "WANCHAIN";
  export const METIS = "METIS";
  export const ULTRON = "ULTRON";
  export const STEP = "STEP";
  export const DOGECHAIN = "DOGECHAIN";
  export const RONIN = "RONIN";
  export const KAVA = "KAVA";
  export const IOTEX = "IOTEX";
  export const XLC = "XLC";
  export const NAHMII = "NAHMII";
  export const TOMBCHAIN = "TOMBCHAIN";
  export const CANTO = "CANTO";
  export const KLAYTN = "KLAYTN";
  export const EVMOS = "EVMOS";
  export const SMARTBCH = "SMARTBCH";
  export const BITGERT = "BITGERT";
  export const FUSION = "FUSION";
  export const OHO = "OHO";
  export const ARB_NOVA = "ARB_NOVA";
  export const OASIS = "OASIS";
  export const REI = "REI";
  export const REICHAIN = "REICHAIN";
  export const GODWOKEN = "GODWOKEN";
  export const POLIS = "POLIS";
  export const KEKCHAIN = "KEKCHAIN";
  export const VISION = "VISION";
  export const HARMONY = "HARMONY";
  export const PALM = "PALM";
  export const CURIO = "CURIO";

  export const UNKNOWN_NETWORK = "UNKNOWN_NETWORK";
}
export type Network = string;

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
  export const FIXED = "FIXED";
}

export namespace InterestRateSide {
  export const LENDER = "LENDER";
  export const BORROWER = "BORROWER";
}

export namespace PositionSide {
  export const LENDER = "LENDER";
  export const BORROWER = "BORROWER";
}

export namespace UsageType {
  export const DEPOSIT = "DEPOSIT";
  export const WITHDRAW = "WITHDRAW";
  export const SWAP = "SWAP";
}
export namespace RewardTokenType {
  export const DEPOSIT = "DEPOSIT";
  export const BORROW = "BORROW";
}
export type RewardTokenType = string;
export const BIGINT_MINUS_ONE = BigInt.fromI32(-1);

//////////////////////////////
///// Ethereum Addresses /////
//////////////////////////////

export const ETH_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

export const UNISWAP_V2_FACTORY = "0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f";

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
export const SIX = 6;
export const THREE = 3;
export const FOUR = 4;
export const BIGINT_TWO = BigInt.fromI32(2);
export const BIGINT_FOUR = BigInt.fromI32(2);
export const BIGINT_HUNDRED = BigInt.fromI32(100);
export const BIGINT_THOUSAND = BigInt.fromI32(1000);
export const BIGINT_TEN_THOUSAND = BigInt.fromI32(10000);
export const BIGINT_TEN_TO_EIGHTEENTH = BigInt.fromString("10").pow(18);
export const BIGINT_TEN_TO_SIX = BigInt.fromString("10").pow(6);
export const EIGHTY_SIX_FOUR_HUNDRED = 86400;
export const BIGINT_MAX = BigInt.fromString(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935"
);

export const INT_NEGATIVE_ONE = -1 as i32;
export const INT_ZERO = 0 as i32;
export const INT_ONE = 1 as i32;
export const INT_TWO = 2 as i32;
export const INT_FOUR = 4 as i32;

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export const BIGDECIMAL_TWO = new BigDecimal(BIGINT_TWO);
export const BIGDECIMAL_MINUS_ONE = new BigDecimal(BIGINT_MINUS_ONE);

export const MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));

/////////////////////
///// Date/Time /////
/////////////////////

export const SECONDS_PER_DAY = 60 * 60 * 24; // 86400
export const SECONDS_PER_HOUR = 60 * 60; // 3600
export const MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export const DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const MS_PER_YEAR = DAYS_PER_YEAR.times(
  new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000))
);

export const SECONDS_PER_DAY_BI = BigInt.fromI32(SECONDS_PER_DAY);
export const SECONDS_PER_HOUR_BI = BigInt.fromI32(SECONDS_PER_HOUR);

////////////////
///// Misc /////
////////////////

export const ETH_SYMBOL = "ETH";
export const ETH_NAME = "Ether";

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString("1");
  for (let i = BIGINT_ZERO; i.lt(decimals as BigInt); i = i.plus(BIGINT_ONE)) {
    bd = bd.times(BigDecimal.fromString("10"));
  }
  return bd;
}

export function exponentToBigInt(n: i32): BigInt {
  return BigInt.fromI32(10).pow(n as u8);
}
export const PRECISION = BigInt.fromString("100000000000000000");

// return 0 if denominator is 0 in division
export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
  if (amount1.equals(BIGDECIMAL_ZERO)) {
    return BIGDECIMAL_ZERO;
  } else {
    return amount0.div(amount1);
  }
}

export const FACTORY_ADDRESS = "0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f";
export const TRADING_FEE = BigDecimal.fromString("3");
export const PROTOCOL_FEE_TO_ON = BigDecimal.fromString("0.5");
export const LP_FEE_TO_ON = BigDecimal.fromString("2.5");
export const PROTOCOL_FEE_TO_OFF = BigDecimal.fromString("0.0");
export const LP_FEE_TO_OFF = BigDecimal.fromString("3");

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// source: https://github.com/hop-protocol/hop/blob/develop/packages/core/src/addresses/mainnet.ts

export namespace XdaiBridge {
  export const USDC = "0x25d8039bb044dc227f741a9e381ca4ceae2e6ae8";
  export const USDT = "0xfd5a186a7e8453eb867a360526c5d987a00acac2";
  export const MATIC = "0x7ac71c29fedf94bac5a5c9ab76e1dd12ea885ccc";
  export const DAI = "0x0460352b91d7cf42b0e1c1c30f06b602d9ef2238";
  export const ETH = "0xd8926c12c0b2e5cd40cfda49ecaff40252af491b";
}
export namespace XdaiAmm {
  export const USDC = "0x5c32143c8b198f392d01f8446b754c181224ac26";
  export const USDT = "0x3aa637d6853f1d9a9354fe4301ab852a88b237e7";
  export const MATIC = "0xaa30d6bba6285d0585722e2440ff89e23ef68864";
  export const DAI = "0x24afdca4653042c6d08fb1a754b2535dacf6eb24";
  export const ETH = "0x4014dc015641c08788f15bd6eb20da4c47d936d8";
}

export namespace XdaiToken {
  export const USDC = "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83";
  export const USDT = "0x4ecaba5870353805a9f068101a40e0f32ed605c6";
  export const MATIC = "0x7122d7661c4564b7c6cd4878b06766489a6028a2";
  export const DAI = "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d";
  export const ETH = "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1";
}

export namespace XdaiHtoken {
  export const USDC = "0x9ec9551d4a1a1593b0ee8124d98590cc71b3b09d";
  export const USDT = "0x91f8490ec27cbb1b2faedd29c2ec23011d7355fb";
  export const MATIC = "0xe38faf9040c7f09958c638bbdb977083722c5156";
  export const DAI = "0xb1ea9fed58a317f81eeefc18715dd323fdef45c4";
  export const ETH = "0xc46f2004006d4c770346f60a7baa3f1cc67dfd1c";
}
export namespace XdaiRewardToken {
  export const USDC_A = "0x5d13179c5fa40b87d53ff67ca26245d3d5b2f872";
  export const USDC_B = "0x636a7ee78facd079dabc8f81eda1d09aa9d440a7";
  export const USDT_A = "0x2c2ab81cf235e86374468b387e241df22459a265";
  export const USDT_B = "0x3d4cc8a61c7528fd86c55cfe061a78dcba48edd1";
  export const DAI_A = "0x12a3a66720dd925fa93f7c895bc20ca9560adfe7";
  export const DAI_B = "0xbf7a02d963b23d84313f07a04ad663409cee5a92";
  export const ETH_A = "0xc61ba16e864efbd06a9fe30aab39d18b8f63710a";
  export const ETH_B = "0x712f0cf37bdb8299d0666727f73a5caba7c1c24c";
}
export namespace MainnetToken {
  export const USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
  export const USDT = "0xdac17f958d2ee523a2206206994597c13d831ec7";
  export const MATIC = "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0";
  export const DAI = "0x6b175474e89094c44da98b954eedeac495271d0f";
  export const ETH = ZERO_ADDRESS;
  export const SNX = "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f";
  export const sUSD = "0x57ab1ec28d129707052df4df418d58a2d46d5f51";
  export const rETH = "0xae78736cd615f374d3085123a210448e74fc6393";
  export const MAGIC = "0xb0c7a3ba49c7a6eaba6cd4a96c55a1391070ac9a";
}

export namespace MainnetBridge {
  export const USDC = "0x3666f603cc164936c1b87e207f36beba4ac5f18a";
  export const USDT = "0x3e4a3a4796d16c0cd582c382691998f7c06420b6";
  export const MATIC = "0x22b1cbb8d98a01a3b71d034bb899775a76eb1cc2";
  export const DAI = "0x3d4cc8a61c7528fd86c55cfe061a78dcba48edd1";
  export const ETH = "0xb8901acb165ed027e32754e0ffe830802919727f";
  export const SNX = "0x893246facf345c99e4235e5a7bbee7404c988b96";
  export const sUSD = "0x36443fc70e073fe9d50425f82a3ee19fef697d62";
  export const rETH = "0x87269b23e73305117d0404557badc459ced0dbec";
  export const MAGIC = "0xf074540eb83c86211f305e145eb31743e228e57d";
}

export namespace ArbitrumBridge {
  export const USDC = "0x0e0e3d2c5c292161999474247956ef542cabf8dd";
  export const USDT = "0x72209fe68386b37a40d6bca04f78356fd342491f";
  export const DAI = "0x7ac115536fe3a185100b2c4de4cb328bf3a58ba6";
  export const ETH = "0x3749c4f034022c39ecaffaba182555d4508caccc";
  export const rETH = "0xc315239cfb05f1e130e7e28e603cea4c014c57f0";
  export const MAGIC = "0xea5abf2c909169823d939de377ef2bf897a6ce98";
}
export namespace ArbitrumAmm {
  export const USDC = "0x10541b07d8ad2647dc6cd67abd4c03575dade261";
  export const USDT = "0x18f7402b673ba6fb5ea4b95768aabb8aad7ef18a";
  export const DAI = "0xa5a33ab9063395a90ccbea2d86a62eccf27b5742";
  export const ETH = "0x652d27c0f72771ce5c76fd400edd61b406ac6d97";
  export const rETH = "0x0ded0d521ac7b0d312871d18ea4fde79f03ee7ca";
  export const MAGIC = "0x50a3a623d00fd8b8a4f3cbc5aa53d0bc6fa912dd";
}

export namespace ArbitrumToken {
  export const USDC = "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8";
  export const USDT = "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9";
  export const DAI = "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1";
  export const ETH = "0x82af49447d8a07e3bd95bd0d56f35241523fbab1";
  export const rETH = "0xec70dcb4a1efa46b8f2d97c310c9c4790ba5ffa8";
  export const MAGIC = "0x539bde0d7dbd336b79148aa742883198bbf60342";
}

export namespace ArbitrumHtoken {
  export const USDC = "0x0ce6c85cf43553de10fc56ceca0aef6ff0dd444d";
  export const USDT = "0x12e59c59d282d2c00f3166915bed6dc2f5e2b5c7";
  export const DAI = "0x46ae9bab8cea96610807a275ebd36f8e916b5c61";
  export const ETH = "0xda7c0de432a9346bb6e96ac74e3b61a36d8a77eb";
  export const rETH = "0x588bae9c85a605a7f14e551d144279984469423b";
  export const MAGIC = "0xc315239cfb05f1e130e7e28e603cea4c014c57f0";
}

export namespace ArbitrumRewardToken {
  export const USDC = "0xb0cabfe930642ad3e7decdc741884d8c3f7ebc70";
  export const USDT = "0x9dd8685463285ad5a94d2c128bda3c5e8a6173c8";
  export const DAI = "0xd4d28588ac1d9ef272aa29d4424e3e2a03789d1e";
  export const ETH = "0x755569159598f3702bdd7dff6233a317c156d3dd";
  export const rETH = "0x3d4cad734b464ed6edcf6254c2a3e5fa5d449b32";
  export const MAGIC = "0x4e9840f3c1ff368a10731d15c11516b9fe7e1898";
}

export namespace OptimismBridge {
  export const USDC = "0xa81d244a1814468c734e5b4101f7b9c0c577a8fc";
  export const USDT = "0x46ae9bab8cea96610807a275ebd36f8e916b5c61";
  export const DAI = "0x7191061d5d4c60f598214cc6913502184baddf18";
  export const ETH = "0x83f6244bd87662118d96d9a6d44f09dfff14b30e";
  export const SNX = "0x1990bc6dfe2ef605bfc08f5a23564db75642ad73";
  export const rETH = "0xa0075e8ce43dcb9970cb7709b9526c1232cc39c2";
  export const sUSD = "0x33fe5bb8da466da55a8a32d6ade2bb104e2c5201";
}
export namespace OptimismAmm {
  export const USDC = "0x3c0ffaca566fccfd9cc95139fef6cba143795963";
  export const USDT = "0xec4b41af04cf917b54aeb6df58c0f8d78895b5ef";
  export const DAI = "0xf181ed90d6cfac84b8073fdea6d34aa744b41810";
  export const ETH = "0xaa30d6bba6285d0585722e2440ff89e23ef68864";
  export const rETH = "0x9dd8685463285ad5a94d2c128bda3c5e8a6173c8";
  export const sUSD = "0x8d4063e82a4db8cdaed46932e1c71e03ca69bede";
  export const SNX = "0x1990bc6dfe2ef605bfc08f5a23564db75642ad73";
}

export namespace OptimismToken {
  export const USDC = "0x7f5c764cbc14f9669b88837ca1490cca17c31607";
  export const USDT = "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58";
  export const DAI = "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1";
  export const sUSD = "0x8c6f28f2f1a3c87f0f938b96d27520d9751ec8d9";
  export const ETH = "0x4200000000000000000000000000000000000006";
  export const rETH = "0x9bcef72be871e61ed4fbbc7630889bee758eb81d";
  export const SNX = "0x8700daec35af8ff88c16bdf0418774cb3d7599b4";
}

export namespace OptimismHtoken {
  export const USDC = "0x25d8039bb044dc227f741a9e381ca4ceae2e6ae8";
  export const USDT = "0x2057c8ecb70afd7bee667d76b4cd373a325b1a20";
  export const DAI = "0x56900d66d74cb14e3c86895789901c9135c95b16";
  export const ETH = "0xe38faf9040c7f09958c638bbdb977083722c5156";
  export const SNX = "0x13b7f51bd865410c3acc4d56083c5b56ab38d203";
  export const rETH = "0x755569159598f3702bdd7dff6233a317c156d3dd";
  export const sUSD = "0x6f03052743cd99ce1b29265e377e320cd24eb632";
}

export namespace OptimismRewardToken {
  export const USDC = "0xf587b9309c603feedf0445af4d3b21300989e93a";
  export const USDT = "0xaeb1b49921e0d2d96fcdbe0d486190b2907b3e0b";
  export const DAI = "0x392b9780cfd362bd6951edfa9ebc31e68748b190";
  export const ETH = "0x95d6a95becfd98a7032ed0c7d950ff6e0fa8d697";
  export const SNX_A = "0x25a5a48c35e75bd2eff53d94f0bb60d5a00e36ea";
  export const SNX_B = "0x09992dd7b32f7b35d347de9bdaf1919a57d38e82";
  export const rETH = "0x266e2dc3c4c59e42aa07afee5b09e964cffe6778";
  export const sUSD_A = "0x2935008ee9943f859c4fbb863c5402ffc06f462e";
  export const sUSD_B = "0x25fb92e505f752f730cad0bd4fa17ece4a384266";
}

export namespace ArbitrumNovaBridge {
  export const ETH = "0x8796860ca1677bf5d54ce5a348fe4b779a8212f3";
  export const MAGIC = "0xe638433e2c1df5f7a3a21b0a6b5c4b37278e55dc";
}

export namespace ArbitrumNovaAmm {
  export const ETH = "0xd6bfb71b5ad5fd378cac15c72d8652e3b8d542c4";
  export const MAGIC = "0x40c8fdff725b20862e22953affa0bbaf42d4b467";
}

export namespace ArbitrumNovaToken {
  export const ETH = "0x722e8bdd2ce80a4422e880164f2079488e115365";
  export const MAGIC = "0xe8936ac97a85d708d5312d52c30c18d4533b8a9c";
}

export namespace ArbitrumNovaHtoken {
  export const ETH = "0xba9d3040e79ec1e27c67fe8b184f552fe9398f07";
  export const MAGIC = "0xe3b4a0a9904d75a0334893989d06814ad969d80f";
}

export namespace ArbitrumNovaRewardToken {
  export const MAGIC = "0xeb35dac45077319042d62a735aa0f9edd1f01fa6";
}

export namespace PolygonBridge {
  export const USDC = "0x25d8039bb044dc227f741a9e381ca4ceae2e6ae8";
  export const USDT = "0x6c9a1acf73bd85463a46b0afc076fbdf602b690b";
  export const DAI = "0xecf268be00308980b5b3fcd0975d47c4c8e1382a";
  export const ETH = "0xb98454270065a31d71bf635f6f7ee6a518dfb849";
  export const MATIC = "0x553bc791d746767166fa3888432038193ceed5e2";
}
export namespace PolygonAmm {
  export const USDC = "0x5c32143c8b198f392d01f8446b754c181224ac26";
  export const USDT = "0xb2f7d27b21a69a033f85c42d5eb079043baadc81";
  export const DAI = "0x25fb92e505f752f730cad0bd4fa17ece4a384266";
  export const ETH = "0x266e2dc3c4c59e42aa07afee5b09e964cffe6778";
  export const MATIC = "0x3d4cc8a61c7528fd86c55cfe061a78dcba48edd1";
}

export namespace PolygonToken {
  export const USDC = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
  export const USDT = "0xc2132d05d31c914a87c6611c10748aeb04b58e8f";
  export const DAI = "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063";
  export const ETH = "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619";
  export const MATIC = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";
}

export namespace PolygonHtoken {
  export const USDC = "0x9ec9551d4a1a1593b0ee8124d98590cc71b3b09d";
  export const USDT = "0x9f93aca246f457916e49ec923b8ed099e313f763";
  export const DAI = "0xb8901acb165ed027e32754e0ffe830802919727f";
  export const ETH = "0x1fdeaf938267ca43388ed1fdb879eaf91e920c7a";
  export const MATIC = "0x712f0cf37bdb8299d0666727f73a5caba7c1c24c";
}
export namespace PolygonRewardToken {
  export const USDC_A = "0x7811737716942967ae6567b26a5051cc72af550e";
  export const USDC_B = "0x2c2ab81cf235e86374468b387e241df22459a265";
  export const USDT_A = "0x297e5079df8173ae1696899d3eacd708f0af82ce";
  export const USDT_B = "0x07932e9a5ab8800922b2688fb1fa0daad8341772";
  export const DAI_A = "0xd6dc6f69f81537fe9decc18152b7005b45dc2ee7";
  export const DAI_B = "0x4aeb0b5b1f3e74314a7fa934db090af603e8289b";
  export const MATIC = "0x7deebcad1416110022f444b03aeb1d20eb4ea53f";
  export const ETH_A = "0xaa7b3a4a084e6461d486e53a03cf45004f0963b7";
  export const ETH_B = "0x7bceda1db99d64f25efa279bb11ce48e15fda427";
}

export namespace BaseBridge {
  export const USDC = "0x46ae9bab8cea96610807a275ebd36f8e916b5c61";
  export const ETH = "0x3666f603cc164936c1b87e207f36beba4ac5f18a";
}
export namespace BaseAmm {
  export const USDC = "0x022c5ce6f1add7423268d41e08df521d5527c2a0";
  export const ETH = "0x0ce6c85cf43553de10fc56ceca0aef6ff0dd444d";
}
export namespace BaseToken {
  export const USDC = "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca";
  export const ETH = "0x4200000000000000000000000000000000000006";
}
export namespace BaseHToken {
  export const USDC = "0x74fa978eaffa312bc92e76df40fcc1bfe7637aeb";
  export const ETH = "0xc1985d7a3429cdc85e59e2e4fcc805b857e6ee2e";
}
export namespace BaseRewardToken {
  export const USDC = "0x7ac115536fe3a185100b2c4de4cb328bf3a58ba6";
  export const ETH = "0x12e59c59d282d2c00f3166915bed6dc2f5e2b5c7";
}

export namespace LineaBridge {
  export const ETH = "0xcbb852a6274e03fa00fb4895de0463f66df27a11";
}
export namespace LineaAmm {
  export const ETH = "0x2935173357c010f8b56c8719a44f9fbdda90f67c";
}
export namespace LineaToken {
  export const ETH = "0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f";
}
export namespace LineaHToken {
  export const ETH = "0xdc38c5af436b9652225f92c370a011c673fa7ba5";
}
export namespace LineaRewardToken {
  export const ETH = "0xa50395bdeaca7062255109fede012efe63d6d402";
}

export const priceTokens = [
  OptimismToken.USDC,
  OptimismToken.USDT,
  OptimismToken.sUSD,
  OptimismToken.DAI,
  OptimismHtoken.USDT,
  OptimismHtoken.USDC,
  OptimismHtoken.DAI,
  OptimismHtoken.sUSD,

  XdaiToken.USDC,
  XdaiHtoken.USDC,
  XdaiToken.USDT,
  XdaiHtoken.USDT,
  XdaiToken.DAI,
  XdaiHtoken.DAI,

  PolygonToken.USDC,
  PolygonToken.USDT,
  PolygonHtoken.USDC,
  PolygonHtoken.USDT,
  PolygonToken.DAI,
  PolygonHtoken.DAI,

  ArbitrumToken.USDT,
  ArbitrumToken.USDC,
  ArbitrumHtoken.USDT,
  ArbitrumHtoken.USDC,
  ArbitrumToken.DAI,
  ArbitrumHtoken.DAI,
];

export const MESSENGER_ADDRESSES = [
  "0x25ace71c97b33cc4729cf772ae268934f7ab5fa1", //OPTIMISM_L1
  "0x4200000000000000000000000000000000000007", //OPTIMISM_L2
  "0x4c36d2919e407f0cc2ee3c993ccf8ac26d9ce64e", //XDAI_L1
  "0x75df5af045d91108662d8080fd1fefad6aa0bb59", //XDAI_L2
  "0x4dbd4fc535ac27206064b68ffcf827b0a60bab3f", //ARBITRUM_L1
];
export const OPTIMISM_GENESIS_HASHES = [
  "0x9168732d683634ce7155a8f6cbc6a1798582ccfa830a4351939d7343cbef675f", //ETH
  "0xb164734917a3ab5987544d99f6a5875a95bbb30d57c30dfec8db8d13789490ee", //USDC
  "0xa392dd41af7be095e026578a0c756e949fbef19a0ca5da6da4cf7ea409fd52f6", //USDT
  "0x657e0c1d2500f62f3027c59bd24bf1495e4ecb99ab50739b3d44cdc64a96a289", //DAI
  "0xb496953b1c04dd8e6ea5bb009b613870afd7848d56d1f56d7ebbb076bd0916cc", //SNX
  "0xee86691a2a4854a472734e98c72c2a8763a7927ba0019d4b4c58d56bd2b3d9bd", //SUSD
];

export const XDAI_L2_SIGNATURE =
  "0x5df9cc3eb93d8a9a481857a3b70a8ca966e6b80b25cf0ee2cce180ec5afa80a1"; //XDAI_L2

export const OPTIMISM_L1_SIGNATURE =
  "0xcb0f7ffd78f9aee47a248fae8db181db6eee833039123e026dcbff529522e52a"; //OPTIMISM_L1

export const OPTIMISM_L2_SIGNATURE =
  "0x4641df4a962071e12719d8c8c8e5ac7fc4d97b927346a3d7a335b1f7517e133c"; //OPTIMISM_L2

export const XDAI_L1_SIGNATURE =
  "0x27333edb8bdcd40a0ae944fb121b5e2d62ea782683946654a0f5e607a908d578"; //XDAI_L1

export const ARBITRUM_L1_SIGNATURE =
  "0xff64905f73a67fb594e0f940a8075a860db489ad991e032f48c81123eb52d60b"; //ARBITRUM_L1

export const MESSENGER_EVENT_SIGNATURES = [
  ARBITRUM_L1_SIGNATURE,
  XDAI_L1_SIGNATURE,
  OPTIMISM_L1_SIGNATURE,
  OPTIMISM_L2_SIGNATURE,
  XDAI_L2_SIGNATURE,
];
export namespace RewardTokens {
  export const HOP = "0xc5102fe9359fd9a28f877a67e36b0f050d81a3cc";
  export const OP = "0x4200000000000000000000000000000000000042";
  export const GNO = "0x9c58bacc331c9aa871afd802db6379a98e80cedb";
  export const rETH_OP = "0xc81d1f0eb955b0c020e5d5b264e1ff72c14d1401";
  export const rETH_ARB = "0xb766039cc6db368759c1e56b79affe831d0cc507";
  export const WETH = "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1";
  export const WMATIC = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";
}
export const GNO_REWARDS = [
  XdaiRewardToken.DAI_A,
  XdaiRewardToken.USDC_A,
  XdaiRewardToken.USDT_A,
  XdaiRewardToken.ETH_A,
];
export const HOP_REWARDS = [
  ArbitrumRewardToken.ETH,
  ArbitrumRewardToken.DAI,
  ArbitrumRewardToken.USDC,
  ArbitrumRewardToken.USDT,
  ArbitrumRewardToken.MAGIC,
  ArbitrumNovaRewardToken.MAGIC,
  OptimismRewardToken.DAI,
  OptimismRewardToken.SNX_A,
  OptimismRewardToken.ETH,
  OptimismRewardToken.rETH,
  OptimismRewardToken.sUSD_A,
  OptimismRewardToken.USDC,
  OptimismRewardToken.USDT,
  PolygonRewardToken.ETH_A,
  PolygonRewardToken.USDC_A,
  PolygonRewardToken.USDT_A,
  PolygonRewardToken.DAI_A,
  XdaiRewardToken.DAI_B,
  XdaiRewardToken.USDC_B,
  XdaiRewardToken.ETH_B,
  XdaiRewardToken.USDT_B,
  BaseRewardToken.USDC,
  BaseRewardToken.ETH,
];
export const OP_REWARDS = [
  OptimismRewardToken.SNX_B,
  OptimismRewardToken.sUSD_B,
];
export const RPL_REWARDS = [OptimismRewardToken.rETH, ArbitrumRewardToken.rETH];
export const WMATIC_REWARDS = [
  PolygonRewardToken.USDC_B,
  PolygonRewardToken.USDT_B,
  PolygonRewardToken.DAI_B,
  PolygonRewardToken.MATIC,
  PolygonRewardToken.ETH_B,
];
export const WETH_REWARDS = [LineaRewardToken.ETH];

export const SIX_DECIMAL_TOKENS = [
  ArbitrumToken.USDT,
  ArbitrumToken.USDC,
  OptimismToken.USDC,
  OptimismToken.USDT,
  PolygonToken.USDC,
  PolygonToken.USDT,
  XdaiToken.USDT,
  XdaiToken.USDC,
];
