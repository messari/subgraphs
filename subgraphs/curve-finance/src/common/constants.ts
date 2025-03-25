import { Address, BigDecimal, BigInt, TypedMap } from "@graphprotocol/graph-ts";

////////////////////////
///// Schema Enums /////
////////////////////////

// The network names corresponding to the Network enum in the schema.
// They also correspond to the ones in `dataSource.network()` after converting to lower case.
// See below for a complete list:
// https://thegraph.com/docs/en/hosted-service/what-is-hosted-service/#supported-networks-on-the-hosted-service
export namespace Network {
  export const ARBITRUM_ONE = "ARBITRUM_ONE";
  export const ARWEAVE_MAINNET = "ARWEAVE_MAINNET";
  export const AVALANCHE = "AVALANCHE";
  export const BOBA = "BOBA";
  export const AURORA = "AURORA";
  export const BSC = "BSC"; // aka BNB Chain
  export const CELO = "CELO";
  export const COSMOS = "COSMOS";
  export const CRONOS = "CRONOS";
  export const MAINNET = "MAINNET"; // Ethereum mainnet
  export const FANTOM = "FANTOM";
  export const FUSE = "FUSE";
  export const HARMONY = "HARMONY";
  export const JUNO = "JUNO";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const NEAR_MAINNET = "NEAR_MAINNET";
  export const OPTIMISM = "OPTIMISM";
  export const OSMOSIS = "OSMOSIS";
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

export namespace UsageType {
  export const DEPOSIT = "DEPOSIT";
  export const WITHDRAW = "WITHDRAW";
  export const SWAP = "SWAP";
}

export namespace RewardIntervalType {
  export const BLOCK = "BLOCK";
  export const TIMESTAMP = "TIMESTAMP";
}

export namespace NULL {
  export const TYPE_STRING = "0x0000000000000000000000000000000000000000";
  export const TYPE_ADDRESS = Address.fromString(TYPE_STRING);
}

export namespace Protocol {
  export const NAME = "Curve Finance";
  export const SLUG = "curve-finance";
  export const NETWORK = Network.MAINNET;
  export const SCHEMA_VERSION = "1.3.0";
  export const SUBGRAPH_VERSION = "1.0.0";
  export const METHODOLOGY_VERSION = "1.0.0";
}

export const SECONDS_PER_HOUR = 60 * 60;
export const SECONDS_PER_DAY = 60 * 60 * 24;
export const MAX_BPS = BigInt.fromI32(10000);
export const DEFAULT_DECIMALS = BigInt.fromI32(18);

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGINT_HUNDRED = BigInt.fromI32(100);
export const BIGINT_NEGATIVE_ONE = BigInt.fromString("-1");

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_HUNDRED = BigDecimal.fromString("100");
export const BIGDECIMAL_POINT_FOUR = BigDecimal.fromString("0.4");
export const BIGDECIMAL_NEGATIVE_ONE = BigDecimal.fromString("-1");
export const BIG_DECIMAL_SECONDS_PER_DAY = BigDecimal.fromString("86400");

export const FEE_DENOMINATOR_BIGINT = BIGINT_TEN.pow(10);
export const FEE_DENOMINATOR = BigDecimal.fromString("10000000000");
export const NUMBER_OF_WEEKS_DENOMINATOR = BigInt.fromI32(604800);

export const DEFAULT_POOL_FEE = BigInt.fromString("4000000");
export const DEFAULT_ADMIN_FEE = BigInt.fromString("5000000000");

export const PRICE_CACHING_BLOCKS = BigInt.fromI32(6000);

export const CURVE_ADDRESS_PROVIDER = Address.fromString(
  "0x0000000022d53366457f9d5e68ec105046fc4383",
);

// Missing Name and Symbol for the ETH token
export const ETH_ADDRESS = Address.fromString(
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
);

export const PROTOCOL_ID = Address.fromString(
  "0x0000000022D53366457F9d5E68Ec105046FC4383",
);
export const POOL_INFO_ADDRESS = Address.fromString(
  "0xe64608E223433E8a03a1DaaeFD8Cb638C14B552C",
);
export const GAUGE_CONTROLLER_ADDRESS = Address.fromString(
  "0x2f50d538606fa9edd2b11e2446beb18c9d5846bb",
);
export const CRV_TOKEN_ADDRESS = Address.fromString(
  "0xd533a949740bb3306d119cc777fa900ba034cd52",
);

export const POOL_REGISTRIES: Address[] = [
  Address.fromString("0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5"), // PoolRegistry
  Address.fromString("0x7d86446ddb609ed0f5f8684acf30380a356b2b4c"), // PoolRegistryV2
  Address.fromString("0xB9fC157394Af804a3578134A6585C0dc9cc990d4"), // MetapoolFactory
  Address.fromString("0x8F942C20D02bEfc377D41445793068908E2250D0"), // CryptoSwapRegistry
  Address.fromString("0xF18056Bbd320E96A48e3Fbf8bC061322531aac99"), // CryptoPoolFactory
  Address.fromString("0x0c0e5f2ff0ff18a3be9b835635039256dc4b4963"), // CurveTricryptoFactory
];

export const HARDCODED_METAPOOLS: Address[] = [];

export const HARDCODED_BASEPOOLS_LP_TOKEN: Address[] = [
  Address.fromString("0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490"), // 3crv
  Address.fromString("0x075b1bb99792c9E1041bA13afEf80C91a1e70fB3"), // renbtc
  Address.fromString("0xC25a3A3b969415c80451098fa907EC722572917F"), // susd
  Address.fromString("0x3B3Ac5386837Dc563660FB6a0937DFAa5924333B"), // busd
  Address.fromString("0x845838DF265Dcd2c412A1Dc9e959c7d08537f8a2"), // compound
  Address.fromString("0xb19059ebb43466C323583928285a49f558E572Fd"), // hbtc
  Address.fromString("0xD905e2eaeBe188fc92179b6350807D8bd91Db0D8"), // pax
  Address.fromString("0x49849C98ae39Fff122806C06791Fa73784FB3675"), // ren
  Address.fromString("0xA3D87FffcE63B53E0d54fAa1cc983B7eB0b74A9c"), // seth
  Address.fromString("0x9fC689CCaDa600B6DF723D9E47D84d76664a1F23"), // usdt
  Address.fromString("0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8"), // y
  Address.fromString("0x3a664Ab939FD8482048609f652f9a0B0677337B9"), // dusd
  Address.fromString("0xD2967f45c4f384DEEa880F807Be904762a3DeA07"), // gusd
  Address.fromString("0x5B5CFE992AdAC0C9D48E05854B2d91C73a003858"), // husd
  Address.fromString("0x6D65b498cb23deAba52db31c93Da9BFFb340FB8F"), // linkusd
  Address.fromString("0x1AEf73d49Dedc4b1778d0706583995958Dc862e6"), // musd
  Address.fromString("0xC2Ee6b0334C261ED60C72f6054450b61B8f18E35"), // rsv
  Address.fromString("0x97E2768e8E73511cA874545DC5Ff8067eB19B787"), // usdk
  Address.fromString("0x4f3E8F405CF5aFC05D68142F3783bDfE13811522"), // usdn
];

export const HARDCODED_MISSING_OLD_POOLS = new TypedMap<Address, Address>();
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7"), // 3pool
  Address.fromString("0x6c3f90f043a72fa612cbac8115ee7e52bde6e490"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x79a8c46dea5ada233abaffd40f3a0a2b1e5a4f27"), // busd
  Address.fromString("0x3b3ac5386837dc563660fb6a0937dfaa5924333b"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0xdebf20617708857ebe4f679508e7b7863a8a8eee"), // aave
  Address.fromString("0xfd2a8fa60abd58efe3eee34dd494cd491dc14900"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0xa96a65c051bf88b4095ee1f2451c2a9d43f53ae2"), // aeth
  Address.fromString("0xaa17a236f2badc98ddc0cf999abb47d47fc0a6cf"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0xa2b47e3d5c44877cca798226b7b8118f9bfb7a56"), // compound
  Address.fromString("0x845838df265dcd2c412a1dc9e959c7d08537f8a2"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x0ce6a5ff5217e38315f87032cf90686c96627caa"), // eurs
  Address.fromString("0x194ebd173f6cdace046c53eacce9b953f28411d1"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x4ca9b3063ec5866a4b82e437059d2c43d1be596f"), // hbtc
  Address.fromString("0xb19059ebb43466c323583928285a49f558e572fd"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x2dded6da1bf5dbdf597c45fcfaa3194e53ecfeaf"), // ib
  Address.fromString("0x5282a4ef67d9c33135340fb3289cc1711c13638c"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0xf178c0b5bb7e7abf4e12a4838c7b7c5ba2c623c0"), // link
  Address.fromString("0xcee60cfa923170e4f8204ae08b4fa6a3f5656f3a"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x06364f10b501e868329afbc005b3492902d6c763"), // pax
  Address.fromString("0xd905e2eaebe188fc92179b6350807d8bd91db0d8"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x93054188d876f558f4a66b2ef1d97d16edf0895b"), // ren
  Address.fromString("0x49849c98ae39fff122806c06791fa73784fb3675"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0xeb16ae0052ed37f479f7fe63849198df1765a733"), // saave
  Address.fromString("0x02d341ccb60faaf662bc0554d13778015d1b285c"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x7fc77b5c7614e1533320ea6ddc2eb61fa00a9714"), // sbtc
  Address.fromString("0x075b1bb99792c9e1041ba13afef80c91a1e70fb3"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0xc5424b857f758e906013f3555dad202e4bdb4567"), // seth
  Address.fromString("0xa3d87fffce63b53e0d54faa1cc983b7eb0b74a9c"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0xdc24316b9ae028f1497c275eb9192a3ea0f67022"), // steth
  Address.fromString("0x06325440d014e39736583c165c2963ba99faf14e"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0xa5407eae9ba41422680e2e00537571bcc53efbfd"), // susd
  Address.fromString("0xc25a3a3b969415c80451098fa907ec722572917f"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x52ea46506b9cc5ef470c5bf89f17dc28bb35d85c"), // usdt
  Address.fromString("0x9fc689ccada600b6df723d9e47d84d76664a1f23"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x45f783cce6b7ff23b2ab2d70e416cdb7d6055f51"), // y
  Address.fromString("0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x8038c01a0390a8c547446a0b2c18fc9aefecc10c"), // dusd
  Address.fromString("0x3a664ab939fd8482048609f652f9a0b0677337b9"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x4f062658eaaf2c1ccf8c8e36d6824cdf41167956"), // gusd
  Address.fromString("0xd2967f45c4f384deea880f807be904762a3dea07"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x3ef6a01a0f81d6046290f3e2a8c5b843e738e604"), // husd
  Address.fromString("0x5b5cfe992adac0c9d48e05854b2d91c73a003858"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0xe7a24ef0c5e95ffb0f6684b813a78f2a3ad7d171"), // linkusd
  Address.fromString("0x6d65b498cb23deaba52db31c93da9bffb340fb8f"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x8474ddbe98f5aa3179b3b3f5942d724afcdec9f6"), // musd
  Address.fromString("0x1aef73d49dedc4b1778d0706583995958dc862e6"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0xc18cc39da8b11da8c3541c598ee022258f9744da"), // rsv
  Address.fromString("0xc2ee6b0334c261ed60c72f6054450b61b8f18e35"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x3e01dd8a5e1fb3481f0f589056b428fc308af0fb"), // usdk
  Address.fromString("0x97e2768e8e73511ca874545dc5ff8067eb19b787"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x0f9cb53ebe405d49a0bbdbd291a65ff571bc83e1"), // usdn
  Address.fromString("0x4f3e8f405cf5afc05d68142f3783bdfe13811522"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x42d7025938bec20b69cbae5a77421082407f053a"), // usdp
  Address.fromString("0x7eb40e450b9655f4b3cc4259bcc731c63ff55ae6"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x890f4e345b1daed0367a877a1612f86a1f86985f"), // ust
  Address.fromString("0x94e131324b6054c0d789b190b2dac504e4361b53"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x071c661b4deefb59e2a3ddb20db036821eee8f4b"), // bbtc
  Address.fromString("0x410e3e86ef427e30b9235497143881f717d93c2a"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0xd81da8d904b52208541bade1bd6595d8a251f8dd"), // obtc
  Address.fromString("0x2fe94ea3d5d4a175184081439753de15aef9d614"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x7f55dde206dbad629c080068923b36fe9d6bdbef"), // pbtc
  Address.fromString("0xde5331ac4b3630f94853ff322b66407e0d6331e8"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0xc25099792e9349c7dd09759744ea681c7de2cb66"), // tbtc
  Address.fromString("0x64eda51d3ad40d56b9dfc5554e06f94e1dd786fd"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0xecd5e75afb02efa118af914515d6521aabd189f1"), // tusd
  Address.fromString("0xecd5e75afb02efa118af914515d6521aabd189f1"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x4807862aa8b2bf68830e4c8dc86d0e9a998e085a"), // busdv2
  Address.fromString("0x4807862aa8b2bf68830e4c8dc86d0e9a998e085a"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0xf9440930043eb3997fc70e1339dbb11f341de7a8"), // reth
  Address.fromString("0x53a901d48795c58f485cbb38df08fa96a24669d5"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x43b4fdfd4ff969587185cdb6f0bd875c5fc83f8c"), // alusd
  Address.fromString("0x43b4fdfd4ff969587185cdb6f0bd875c5fc83f8c"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x80466c64868e1ab14a1ddf27a676c3fcbe638fe5"), // tricrypto
  Address.fromString("0xca3d75ac011bf5ad07a98d02f18225f9bd9a6bdf"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x618788357d0ebd8a37e763adab3bc575d54c2c7d"), // rai
  Address.fromString("0x6ba5b4e438fa0aaf7c1bd179285af65d13bd3d90"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x5a6a4d54456819380173272a5e8e9b9904bdf41b"), // mim
  Address.fromString("0x5a6a4d54456819380173272a5e8e9b9904bdf41b"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0xfd5db7463a3ab53fd211b4af195c5bccc1a03890"), // eurt
  Address.fromString("0xfd5db7463a3ab53fd211b4af195c5bccc1a03890"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x4e0915c88bc70750d68c481540f081fefaf22273"), // 4pool
  Address.fromString("0x4e0915c88bc70750d68c481540f081fefaf22273"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x1005f7406f32a61bd760cfa14accd2737913d546"), // 2pool
  Address.fromString("0x1005f7406f32a61bd760cfa14accd2737913d546"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0xdcef968d416a41cdac0ed8702fac8128a64241a2"), // Curve.fi FRAX&#x2F;USDC
  Address.fromString("0x3175df0976dfa876431c2e9ee6bc45b65d3473cc"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0xd632f22692fac7611d2aa1c0d552930d43caed3b"), // frax
  Address.fromString("0xd632f22692fac7611d2aa1c0d552930d43caed3b"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0xed279fdd11ca84beef15af5d39bb4d4bee23f0ca"), // lusd
  Address.fromString("0xed279fdd11ca84beef15af5d39bb4d4bee23f0ca"),
);
HARDCODED_MISSING_OLD_POOLS.set(
  Address.fromString("0x2e60cf74d81ac34eb21eeff58db4d385920ef419"), // oldcontract
  Address.fromString("0xed279fdd11ca84beef15af5d39bb4d4bee23f0ca"),
);
