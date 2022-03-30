import {
  ethereum,
  BigDecimal,
  BigInt,
  TypedMap,
  Address,
} from "@graphprotocol/graph-ts";

////////////////////////
///// Schema Enums /////
////////////////////////

export namespace Network {
  export const AVALANCHE = "AVALANCHE";
  export const AURORA = "AURORA";
  export const BSC = "BSC";
  export const CELO = "CELO";
  export const CRONOS = "CRONOS";
  export const ETHEREUM = "ETHEREUM";
  export const FANTOM = "FANTOM";
  export const HARMONY = "HARMONY";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const OPTIMISM = "OPTIMISM";
  export const POLYGON = "POLYGON";
  export const XDAI = "XDAI";
}

export namespace ProtocolType {
  export const EXCHANGE = "EXCHANGE";
  export const LENDING = "LENDING";
  export const YIELD = "YIELD";
  export const BRIDGE = "BRIDGE";
  export const GENERIC = "GENERIC";
}

export namespace RewardTokenType {
  export const DEPOSIT = "DEPOSIT";
  export const BORROW = "BORROW";
}

export namespace PoolType {
  export const META = "META";
  export const PLAIN = "PLAIN";
  export const LENDING = "LENDING";
}

export function getOrNull<T>(result: ethereum.CallResult<T>): T | null {
  return result.reverted ? null : result.value;
}

export function toDecimal(value: BigInt, decimals: u32): BigDecimal {
  let precision = BigInt.fromI32(10)
    .pow(<u8>decimals)
    .toBigDecimal();

  return value.divDecimal(precision);
}

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const ETH_TOKEN_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
export const REGISTRY_ADDRESS = "0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5";
export const FACTORY_ADDRESS = "0xB9fC157394Af804a3578134A6585C0dc9cc990d4";

export const DEFAULT_DECIMALS = 18;
export const USDC_DECIMALS = 6;
export const USDC_DENOMINATOR = BigDecimal.fromString("100000");
export const FEE_DENOMINATOR = BigInt.fromI32(10 ** 10);
export const FEE_DECIMALS = 10;
export let BIGINT_ZERO = BigInt.fromI32(0);
export let BIGINT_ONE = BigInt.fromI32(1);
export let BIGINT_MAX = BigInt.fromString(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935"
);
export let BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export let BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export let MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));
export let DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const SECONDS_PER_DAY = 60 * 60 * 24;
export let MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export let MS_PER_YEAR = DAYS_PER_YEAR.times(
  new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000))
);

////////////

export class PoolInfo {
  coins: Address[];
  underlyingCoins: Address[];
  balances: BigInt[];
}

// for some contracts it's not possible to get LP token address or coin count
// from pool contract, so static mapping is defined here
export class PoolStaticInfo {
  poolAddress: string;
  lpTokenAddress: string;
  coinCount: i32;
  poolType: string;
  is_v1: boolean;
  rewardTokens: string[];

  constructor(
    poolAddress: string,
    lpTokenAddress: string,
    coinCount: i32,
    poolType: string,
    is_v1: boolean,
    rewardTokens: string[]
  ) {
    this.poolAddress = poolAddress;
    this.lpTokenAddress = lpTokenAddress;
    this.coinCount = coinCount;
    this.poolType = poolType;
    this.is_v1 = is_v1;
    this.rewardTokens = rewardTokens;
  }
}

// use lower case!
export const TRIPOOL_POOL = "0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7";
export const TRIPOOL_LP_TOKEN = "0x6c3f90f043a72fa612cbac8115ee7e52bde6e490";
export const AAVE_POOL = "0xdebf20617708857ebe4f679508e7b7863a8a8eee";
export const AAVE_LP_TOKEN = "0xfd2a8fa60abd58efe3eee34dd494cd491dc14900";
export const Y_POOL = "0x45f783cce6b7ff23b2ab2d70e416cdb7d6055f51";
export const Y_LP_TOKEN = "0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8";
export const SUSD_POOL = "0xa5407eae9ba41422680e2e00537571bcc53efbfd";
export const SUSD_LP_TOKEN = "0xc25a3a3b969415c80451098fa907ec722572917f";
export const BUSD_POOL = "0x79a8c46dea5ada233abaffd40f3a0a2b1e5a4f27";
export const BUSD_LP_TOKEN = "0x3b3ac5386837dc563660fb6a0937dfaa5924333b";
export const PAX_POOL = "0x06364f10b501e868329afbc005b3492902d6c763";
export const PAX_LP_TOKEN = "0xd905e2eaebe188fc92179b6350807d8bd91db0d8";
export const COMPOUND_POOL = "0xa2b47e3d5c44877cca798226b7b8118f9bfb7a56";
export const COMPOUND_LP_TOKEN = "0x845838df265dcd2c412a1dc9e959c7d08537f8a2";
export const IRONBANK_POOL = "0x2dded6da1bf5dbdf597c45fcfaa3194e53ecfeaf";
export const IRONBANK_LP_TOKEN = "0x5282a4ef67d9c33135340fb3289cc1711c13638c";
export const HUSD_POOL = "0x3ef6a01a0f81d6046290f3e2a8c5b843e738e604";
export const HUSD_LP_TOKEN = "0x5b5cfe992adac0c9d48e05854b2d91c73a003858";
export const USDK_POOL = "0x3e01dd8a5e1fb3481f0f589056b428fc308af0fb";
export const USDK_LP_TOKEN = "0x97e2768e8e73511ca874545dc5ff8067eb19b787";
export const MUSD_POOL = "0x8474ddbe98f5aa3179b3b3f5942d724afcdec9f6";
export const MUSD_LP_TOKEN = "0x1aef73d49dedc4b1778d0706583995958dc862e6";
export const USDP_POOL = "0x42d7025938bec20b69cbae5a77421082407f053a";
export const USDP_LP_TOKEN = "0x7eb40e450b9655f4b3cc4259bcc731c63ff55ae6";
export const DUSD_POOL = "0x8038c01a0390a8c547446a0b2c18fc9aefecc10c";
export const DUSD_LP_TOKEN = "0x3a664ab939fd8482048609f652f9a0b0677337b9";
export const RSV_POOL = "0xc18cc39da8b11da8c3541c598ee022258f9744da";
export const RSV_LP_TOKEN = "0xc2ee6b0334c261ed60c72f6054450b61b8f18e35";
export const UST_POOL = "0x890f4e345b1daed0367a877a1612f86a1f86985f";
export const UST_LP_TOKEN = "0x94e131324b6054c0d789b190b2dac504e4361b53";
export const GUSD_POOL = "0x4f062658eaaf2c1ccf8c8e36d6824cdf41167956";
export const GUSD_LP_TOKEN = "0xd2967f45c4f384deea880f807be904762a3dea07";
export const USDN_POOL = "0x0f9cb53ebe405d49a0bbdbd291a65ff571bc83e1";
export const USDN_LP_TOKEN = "0x4f3e8f405cf5afc05d68142f3783bdfe13811522";
export const EURS_POOL = "0x0ce6a5ff5217e38315f87032cf90686c96627caa";
export const EURS_LP_TOKEN = "0x194ebd173f6cdace046c53eacce9b953f28411d1";
export const REN_POOL = "0x93054188d876f558f4a66b2ef1d97d16edf0895b";
export const REN_LP_TOKEN = "0x49849c98ae39fff122806c06791fa73784fb3675";
export const HBTC_POOL = "0x4ca9b3063ec5866a4b82e437059d2c43d1be596f";
export const HBTC_LP_TOKEN = "0xb19059ebb43466c323583928285a49f558e572fd";
export const SBTC_POOL = "0x7fc77b5c7614e1533320ea6ddc2eb61fa00a9714";
export const SBTC_LP_TOKEN = "0x075b1bb99792c9e1041ba13afef80c91a1e70fb3";
export const OBTC_POOL = "0xd81da8d904b52208541bade1bd6595d8a251f8dd";
export const OBTC_LP_TOKEN = "0x2fe94ea3d5d4a175184081439753de15aef9d614";
export const BBTC_POOL = "0x071c661b4deefb59e2a3ddb20db036821eee8f4b";
export const BBTC_LP_TOKEN = "0x410e3e86ef427e30b9235497143881f717d93c2a";
export const PBTC_POOL = "0x7f55dde206dbad629c080068923b36fe9d6bdbef";
export const PBTC_LP_TOKEN = "0xde5331ac4b3630f94853ff322b66407e0d6331e8";
export const TBTC_POOL = "0xc25099792e9349c7dd09759744ea681c7de2cb66";
export const TBTC_LP_TOKEN = "0x64eda51d3ad40d56b9dfc5554e06f94e1dd786fd";
export const LUSD_POOL = "0xed279fdd11ca84beef15af5d39bb4d4bee23f0ca";
export const LUSD_LP_TOKEN = "0xed279fdd11ca84beef15af5d39bb4d4bee23f0ca";
export const FRAX_POOL = "0xd632f22692fac7611d2aa1c0d552930d43caed3b";
export const FRAX_LP_TOKEN = "0xd632f22692fac7611d2aa1c0d552930d43caed3b";
export const BUSDv2_POOL = "0x4807862aa8b2bf68830e4c8dc86d0e9a998e085a";
export const BUSDv2_LP_TOKEN = "0x4807862aa8b2bf68830e4c8dc86d0e9a998e085a";
export const ALUSD_POOL = "0x43b4fdfd4ff969587185cdb6f0bd875c5fc83f8c";
export const ALUSD_LP_TOKEN = "0x43b4fdfd4ff969587185cdb6f0bd875c5fc83f8c";
export const SAAVE_POOL = "0xeb16ae0052ed37f479f7fe63849198df1765a733";
export const SAAVE_LP_TOKEN = "0x02d341ccb60faaf662bc0554d13778015d1b285c";
export const SETH_POOL = "0xc5424b857f758e906013f3555dad202e4bdb4567";
export const SETH_LP_TOKEN = "0xa3d87fffce63b53e0d54faa1cc983b7eb0b74a9c";
export const STETH_POOL = "0xdc24316b9ae028f1497c275eb9192a3ea0f67022";
export const STETH_LP_TOKEN = "0x06325440d014e39736583c165c2963ba99faf14e";
export const ANKRETH_POOL = "0xa96a65c051bf88b4095ee1f2451c2a9d43f53ae2";
export const ANKRETH_LP_TOKEN = "0xaa17a236f2badc98ddc0cf999abb47d47fc0a6cf";
export const RETH_POOL = "0xf9440930043eb3997fc70e1339dbb11f341de7a8";
export const RETH_LP_TOKEN = "0x53a901d48795c58f485cbb38df08fa96a24669d5";
export const LINK_POOL = "0xf178c0b5bb7e7abf4e12a4838c7b7c5ba2c623c0";
export const LINK_LP_TOKEN = "0xcee60cfa923170e4f8204ae08b4fa6a3f5656f3a";
export const LINKUSD_POOL = "0xe7a24ef0c5e95ffb0f6684b813a78f2a3ad7d171";
export const LINKUSD_LP_TOKEN = "0x6d65b498cb23deaba52db31c93da9bffb340fb8f";
export const TRICRYPTO_POOL = "0x80466c64868e1ab14a1ddf27a676c3fcbe638fe5";
export const TRICRYPTO_LP_TOKEN = "0xca3d75ac011bf5ad07a98d02f18225f9bd9a6bdf";
export const TRICRYPTO_2_POOL = "0xd51a44d3fae010294c616388b506acda1bfaae46";
export const TRICRYPTO_2_LP_TOKEN =
  "0xc4ad29ba4b3c580e6d59105fff484999997675ff";

export let addressToPool = new TypedMap<string, PoolStaticInfo>();
addressToPool.set(
  TRIPOOL_POOL,
  new PoolStaticInfo(TRIPOOL_POOL, TRIPOOL_LP_TOKEN, 3, "PLAIN", false, [])
);
addressToPool.set(
  AAVE_POOL,
  new PoolStaticInfo(AAVE_POOL, AAVE_LP_TOKEN, 3, "LENDING", false, [])
);
addressToPool.set(
  Y_POOL,
  new PoolStaticInfo(Y_POOL, Y_LP_TOKEN, 4, "LENDING", true, [])
);
addressToPool.set(
  SUSD_POOL,
  new PoolStaticInfo(SUSD_POOL, SUSD_LP_TOKEN, 4, "LENDING", true, [])
);
addressToPool.set(
  BUSD_POOL,
  new PoolStaticInfo(BUSD_POOL, BUSD_LP_TOKEN, 4, "LENDING", true, [])
);
addressToPool.set(
  PAX_POOL,
  new PoolStaticInfo(PAX_POOL, PAX_LP_TOKEN, 4, "LENDING", true, [])
);
addressToPool.set(
  COMPOUND_POOL,
  new PoolStaticInfo(COMPOUND_POOL, COMPOUND_LP_TOKEN, 2, "LENDING", true, [])
);
addressToPool.set(
  IRONBANK_POOL,
  new PoolStaticInfo(IRONBANK_POOL, IRONBANK_LP_TOKEN, 3, "LENDING", false, [])
);
addressToPool.set(
  HUSD_POOL,
  new PoolStaticInfo(HUSD_POOL, HUSD_LP_TOKEN, 2, "META", false, [])
);
addressToPool.set(
  USDK_POOL,
  new PoolStaticInfo(USDK_POOL, USDK_LP_TOKEN, 2, "META", false, [])
);
addressToPool.set(
  MUSD_POOL,
  new PoolStaticInfo(MUSD_POOL, MUSD_LP_TOKEN, 2, "META", false, [])
);
addressToPool.set(
  USDP_POOL,
  new PoolStaticInfo(USDP_POOL, USDP_LP_TOKEN, 2, "META", false, [])
);
addressToPool.set(
  DUSD_POOL,
  new PoolStaticInfo(DUSD_POOL, DUSD_LP_TOKEN, 2, "META", false, [])
);
addressToPool.set(
  RSV_POOL,
  new PoolStaticInfo(RSV_POOL, RSV_LP_TOKEN, 2, "META", false, [])
);
addressToPool.set(
  UST_POOL,
  new PoolStaticInfo(UST_POOL, UST_LP_TOKEN, 2, "META", false, [])
);
addressToPool.set(
  GUSD_POOL,
  new PoolStaticInfo(GUSD_POOL, GUSD_LP_TOKEN, 2, "META", false, [])
);
addressToPool.set(
  USDN_POOL,
  new PoolStaticInfo(USDN_POOL, USDN_LP_TOKEN, 2, "META", false, [])
);
addressToPool.set(
  EURS_POOL,
  new PoolStaticInfo(EURS_POOL, EURS_LP_TOKEN, 2, "PLAIN", false, [])
);
addressToPool.set(
  REN_POOL,
  new PoolStaticInfo(REN_POOL, REN_LP_TOKEN, 2, "PLAIN", true, [])
);
addressToPool.set(
  HBTC_POOL,
  new PoolStaticInfo(HBTC_POOL, HBTC_LP_TOKEN, 2, "PLAIN", false, [])
);
addressToPool.set(
  SBTC_POOL,
  new PoolStaticInfo(SBTC_POOL, SBTC_LP_TOKEN, 3, "PLAIN", true, [])
);
addressToPool.set(
  OBTC_POOL,
  new PoolStaticInfo(OBTC_POOL, OBTC_LP_TOKEN, 2, "META", false, [])
);
addressToPool.set(
  BBTC_POOL,
  new PoolStaticInfo(BBTC_POOL, BBTC_LP_TOKEN, 2, "META", false, [])
);
addressToPool.set(
  PBTC_POOL,
  new PoolStaticInfo(PBTC_POOL, PBTC_LP_TOKEN, 2, "META", false, [])
);
addressToPool.set(
  TBTC_POOL,
  new PoolStaticInfo(TBTC_POOL, TBTC_LP_TOKEN, 2, "META", false, [])
);
addressToPool.set(
  LUSD_POOL,
  new PoolStaticInfo(LUSD_POOL, LUSD_LP_TOKEN, 2, "META", false, [])
);
addressToPool.set(
  FRAX_POOL,
  new PoolStaticInfo(FRAX_POOL, FRAX_LP_TOKEN, 2, "META", false, [])
);
addressToPool.set(
  BUSDv2_POOL,
  new PoolStaticInfo(BUSDv2_POOL, BUSDv2_LP_TOKEN, 2, "META", false, [])
);
addressToPool.set(
  ALUSD_POOL,
  new PoolStaticInfo(ALUSD_POOL, ALUSD_LP_TOKEN, 2, "META", false, [])
);
addressToPool.set(
  SAAVE_POOL,
  new PoolStaticInfo(SAAVE_POOL, SAAVE_LP_TOKEN, 2, "LENDING", false, [])
);
addressToPool.set(
  SETH_POOL,
  new PoolStaticInfo(SETH_POOL, SETH_LP_TOKEN, 2, "PLAIN", false, [])
);
addressToPool.set(
  STETH_POOL,
  new PoolStaticInfo(STETH_POOL, STETH_LP_TOKEN, 2, "PLAIN", false, [])
);
addressToPool.set(
  ANKRETH_POOL,
  new PoolStaticInfo(ANKRETH_POOL, ANKRETH_LP_TOKEN, 2, "PLAIN", false, [])
);
addressToPool.set(
  RETH_POOL,
  new PoolStaticInfo(RETH_POOL, RETH_LP_TOKEN, 2, "PLAIN", false, [])
);
addressToPool.set(
  LINK_POOL,
  new PoolStaticInfo(LINK_POOL, LINK_LP_TOKEN, 2, "PLAIN", false, [])
);
addressToPool.set(
  LINKUSD_POOL,
  new PoolStaticInfo(LINKUSD_POOL, LINKUSD_LP_TOKEN, 2, "META", false, [])
);
addressToPool.set(
  TRICRYPTO_POOL,
  new PoolStaticInfo(TRICRYPTO_POOL, TRICRYPTO_LP_TOKEN, 3, "PLAIN", false, [])
);
addressToPool.set(
  TRICRYPTO_2_POOL,
  new PoolStaticInfo(
    TRICRYPTO_2_POOL,
    TRICRYPTO_2_LP_TOKEN,
    3,
    "PLAIN",
    false,
    []
  )
);

export let lpTokenToPool = new TypedMap<string, string>();
lpTokenToPool.set(TRIPOOL_LP_TOKEN, TRIPOOL_POOL);
lpTokenToPool.set(AAVE_LP_TOKEN, AAVE_POOL);
lpTokenToPool.set(Y_LP_TOKEN, Y_POOL);
lpTokenToPool.set(SUSD_LP_TOKEN, SUSD_POOL);
lpTokenToPool.set(BUSD_LP_TOKEN, BUSD_POOL);
lpTokenToPool.set(PAX_LP_TOKEN, PAX_POOL);
lpTokenToPool.set(COMPOUND_LP_TOKEN, COMPOUND_POOL);
lpTokenToPool.set(IRONBANK_LP_TOKEN, IRONBANK_POOL);
lpTokenToPool.set(HUSD_LP_TOKEN, HUSD_POOL);
lpTokenToPool.set(USDK_LP_TOKEN, USDK_POOL);
lpTokenToPool.set(MUSD_LP_TOKEN, MUSD_POOL);
lpTokenToPool.set(USDP_LP_TOKEN, USDP_POOL);
lpTokenToPool.set(DUSD_LP_TOKEN, DUSD_POOL);
lpTokenToPool.set(RSV_LP_TOKEN, RSV_POOL);
lpTokenToPool.set(UST_LP_TOKEN, UST_POOL);
lpTokenToPool.set(GUSD_LP_TOKEN, GUSD_POOL);
lpTokenToPool.set(USDN_LP_TOKEN, USDN_POOL);
lpTokenToPool.set(EURS_LP_TOKEN, EURS_POOL);
lpTokenToPool.set(REN_LP_TOKEN, REN_POOL);
lpTokenToPool.set(HBTC_LP_TOKEN, HBTC_POOL);
lpTokenToPool.set(SBTC_LP_TOKEN, SBTC_POOL);
lpTokenToPool.set(OBTC_LP_TOKEN, OBTC_POOL);
lpTokenToPool.set(BBTC_LP_TOKEN, BBTC_POOL);
lpTokenToPool.set(PBTC_LP_TOKEN, PBTC_POOL);
lpTokenToPool.set(TBTC_LP_TOKEN, TBTC_POOL);
lpTokenToPool.set(LUSD_LP_TOKEN, LUSD_POOL);
lpTokenToPool.set(FRAX_LP_TOKEN, FRAX_POOL);
lpTokenToPool.set(BUSDv2_LP_TOKEN, BUSDv2_POOL);
lpTokenToPool.set(ALUSD_LP_TOKEN, ALUSD_POOL);
lpTokenToPool.set(SAAVE_LP_TOKEN, SAAVE_POOL);
lpTokenToPool.set(SETH_LP_TOKEN, SETH_POOL);
lpTokenToPool.set(STETH_LP_TOKEN, STETH_POOL);
lpTokenToPool.set(ANKRETH_LP_TOKEN, ANKRETH_POOL);
lpTokenToPool.set(RETH_LP_TOKEN, RETH_POOL);
lpTokenToPool.set(LINK_LP_TOKEN, LINK_POOL);
lpTokenToPool.set(LINKUSD_LP_TOKEN, LINKUSD_POOL);
lpTokenToPool.set(TRICRYPTO_LP_TOKEN, TRICRYPTO_POOL);
lpTokenToPool.set(TRICRYPTO_2_LP_TOKEN, TRICRYPTO_2_POOL);
