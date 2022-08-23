import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

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
  export const WITHDRAWAL_FEE = "WITHDRAWAL_FEE";
  export const DEPOSIT_FEE = "DEPOSIT_FEE";
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

export const ZERO_ADDRESS_STRING = "0x0000000000000000000000000000000000000000";
export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const ZERO_ADDRESS = Address.fromString(ZERO_ADDRESS_STRING);

export const MasterPlatypus_ADDRESS = Address.fromString("0x68c5f4374228BEEdFa078e77b5ed93C28a2f713E");
export const MasterPlatypusOld_ADDRESS = Address.fromString("0xB0523f9F473812FB195Ee49BC7d2ab9873a98044");
export const MasterPlatypusFactory_ADDRESS = Address.fromString("0x7125B4211357d7C3a90F796c956c12c681146EbB");

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
export const BIGINT_TEN_TO_EIGHTEENTH = BigInt.fromString("10").pow(18);
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

export const MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));

/////////////////////
///// Date/Time /////
/////////////////////

export const SECONDS_PER_HOUR = 60 * 60; // 3600
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

export const WAVAX_ADDRESS = "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7";

export const PROTOCOL_ADMIN = "0x416a7989a964C9ED60257B064Efc3a30FE6bF2eE";

export const PTPAddress = "0x22d4002028f537599be9f666d1c4fa138522f9c8";

// Main USD Pool
export const POOL_PROXY = "0x66357dCaCe80431aee0A7507e2E361B7e2402370";

export class poolDetail {
  name: string;
  symbol: string;
  address: string;
  ignore: boolean;

  // Initialize a Token Definition with its attributes
  constructor(name: string, symbol: string, address: string, ignore: string) {
    this.address = address;
    this.symbol = symbol;
    this.name = name;
    this.ignore = ignore == "true";
  }

  static getAltPoolAddressArray(): Array<string> {
    return [
      // We comment out the main pool as we already are "watching" its events
      // As per the subgraph.yaml manifest definition
      // "0x66357dCaCe80431aee0A7507e2E361B7e2402370",
      "0xe0D166DE15665bC4B7185B2e35E847E51316E126",
      "0xB8E567fc23c39C94a1f6359509D7b43D1Fbed824",
      "0x30C30d826be87Cd0A4b90855C2F38f7FcfE4eaA7",
      "0xC828D995C686AaBA78A4aC89dfc8eC0Ff4C5be83",
      "0x4658EA7e9960D6158a261104aAA160cC953bb6ba",
      "0x39dE4e02F76Dbd4352Ec2c926D8d64Db8aBdf5b2",
      "0x233Ba46B01d2FbF1A31bDBc500702E286d6de218",
      "0x91BB10D68C72d64a7cE10482b453153eEa03322C",
      "0x27912AE6Ba9a54219d8287C3540A8969FF35500B",
      "0x853ea32391AaA14c112C645FD20BA389aB25C5e0",
      "0x3B55E45fD6bd7d4724F5c47E0d1bCaEdd059263e",
    ];
  }

  // Get all tokens with a static defintion
  static getPoolDetails(): Array<poolDetail> {
    let poolDetailArray = new Array<poolDetail>();
    let detailsJson = [
      ["Main Pool", "Main Pool", "0x66357dCaCe80431aee0A7507e2E361B7e2402370", "false"],
      ["Alt Pool UST", "UST-USDC Pool", "0xe0D166DE15665bC4B7185B2e35E847E51316E126", "false"],
      ["Alt Pool Frax", "Frax-USDC Pool", "0xB8E567fc23c39C94a1f6359509D7b43D1Fbed824", "false"],
      ["Alt Pool MIM", "MIM-USDC Pool", "0x30C30d826be87Cd0A4b90855C2F38f7FcfE4eaA7", "false"],
      ["Alt Pool YUSD", "YUSD-USDC Pool", "0xC828D995C686AaBA78A4aC89dfc8eC0Ff4C5be83", "false"],
      ["Alt Pool sAVAX", "sAVAX-AVAX Pool", "0x4658EA7e9960D6158a261104aAA160cC953bb6ba", "false"],
      ["Alt Pool BTC.b-WBTC.e", "BTC.b-WBTC.e Pool", "0x39dE4e02F76Dbd4352Ec2c926D8d64Db8aBdf5b2", "false"],
      ["Factory Pool H2O", "H2O-USDC Pool", "0x233Ba46B01d2FbF1A31bDBc500702E286d6de218", "false"],
      ["Factory Pool TSD", "TSD-USDC Pool", "0x91BB10D68C72d64a7cE10482b453153eEa03322C", "false"],
      ["Factory Pool MONEY", "MONEY-USDC Pool", "0x27912AE6Ba9a54219d8287C3540A8969FF35500B", "false"],
      ["Factory Pool dForce USX", "USX-USDC Pool", "0x89E9EFD9614621309aDA948a761D364F0236eDEA", "false"],
      ["Factory Pool MAI", "MiMatic-USDC Pool", "0x1abB6Bf97506C9B4AC985F558C4Ee6Eeb9C11F1D", "false"],

      // Ignore pools while calculating TVL not in above list
      ["Withdraw Pool MIM", "MIM-Ignore", "0x6c84f0580c8ffab0c716c87e66ab474e4bea97d9", "true"],
      ["Withdraw Pool UST", "UST-USDC-Ignore", "0xefa5d088a58a2d4ee5504102c5ffde69301527b0", "true"],
      ["Multisig (Treasury)", "Multisig-Treasury", "0x068e297e8ff74115c9e1c4b5b83b700fda5afdeb", "true"],
      ["Multisig (Incentives)", "Multisig-Incentives", "0xD2805cff8877235d9EC88F683F85A8213DC288BC", "true"],
      ["Admin (Address)", "Admin-Address", "0x416a7989a964C9ED60257B064Efc3a30FE6bF2eE", "true"],

      // Ignore all unknown pools
      ["unknown pool", "unknown pool", "unknown", "true"],
    ];
    for (let i = 0; i < detailsJson.length; i++) {
      let details = new poolDetail(detailsJson[i][0], detailsJson[i][1], detailsJson[i][2], detailsJson[i][3]);
      poolDetailArray.push(details);
    }

    return poolDetailArray;
  }

  static fromAddress(poolAddress: string): poolDetail {
    let details = this.getPoolDetails();
    for (let i = 0; i < details.length; i++) {
      if (details[i].address.toLowerCase() == poolAddress.toLowerCase()) {
        return details[i];
      }
    }
    return details[details.length - 1];
  }
}

export enum TransactionType {
  DEPOSIT,
  WITHDRAW,
  SWAP,
}
