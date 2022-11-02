import { BigInt } from "@graphprotocol/graph-ts";

export const V2_2_MIGRATION_TIME = "1643943600";
export const BACKER_REWARDS_EPOCH = "1644021439";
export const FIDU_DECIMALS = BigInt.fromString("1000000000000000000"); // 18 zeroes
export const GFI_DECIMALS = BigInt.fromString("1000000000000000000"); // 18 zeroes
export const USDC_DECIMALS = BigInt.fromString("1000000"); // 6 zeroes
export const SECONDS_PER_DAY = BigInt.fromString("86400");
export const SECONDS_PER_YEAR = BigInt.fromString("31536000");

// This config represents the enum config on protocol/core/ConfigOptions.sol where order is fixed
// (search for `library ConfigOptions` and `CONFIG_KEYS_BY_TYPE`)
export enum CONFIG_KEYS_NUMBERS {
  TransactionLimit = 0,
  TotalFundsLimit = 1,
  MaxUnderwriterLimit = 2,
  ReserveDenominator = 3,
  WithdrawFeeDenominator = 4,
  LatenessGracePeriodInDays = 5,
  LatenessMaxDays = 6,
  DrawdownPeriodInSeconds = 7,
  TransferRestrictionPeriodInDays = 8,
  LeverageRatio = 9,
}
export enum CONFIG_KEYS_ADDRESSES {
  Pool = 0,
  CreditLineImplementation = 1,
  GoldfinchFactory = 2,
  CreditDesk = 3,
  Fidu = 4,
  USDC = 5,
  TreasuryReserve = 6,
  ProtocolAdmin = 7,
  OneInch = 8,
  // TrustedForwarder is deprecated because we no longer use GSN
  TrustedForwarder = 9,
  CUSDCContract = 10,
  GoldfinchConfig = 11,
  PoolTokens = 12,
  TranchedPoolImplementation = 13,
  SeniorPool = 14,
  SeniorPoolStrategy = 15,
  MigratedTranchedPoolImplementation = 16,
  BorrowerImplementation = 17,
  GFI = 18,
  Go = 19,
  BackerRewards = 20,
  StakingRewards = 21,
}

export const INVALID_POOLS = new Set<string>();
INVALID_POOLS.add("0x0e2e11dc77bbe75b2b65b57328a8e4909f7da1eb");
INVALID_POOLS.add("0x4b2ae066681602076adbe051431da7a3200166fd");
INVALID_POOLS.add("0x6b42b1a43abe9598052bb8c21fd34c46c9fbcb8b");
INVALID_POOLS.add("0x7bdf2679a9f3495260e64c0b9e0dfeb859bad7e0");
INVALID_POOLS.add("0x95715d3dcbb412900deaf91210879219ea84b4f8");
INVALID_POOLS.add("0xa49506632ce8ec826b0190262b89a800353675ec");
INVALID_POOLS.add("0xfce88c5d0ec3f0cb37a044738606738493e9b450");
