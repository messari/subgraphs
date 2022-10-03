import {BigInt} from "@graphprotocol/graph-ts"

export const V2_2_MIGRATION_TIME = "1643943600"
export const BACKER_REWARDS_EPOCH = "1644021439"
export const FIDU_DECIMALS = BigInt.fromString("1000000000000000000") // 18 zeroes
export const GFI_DECIMALS = BigInt.fromString("1000000000000000000") // 18 zeroes
export const USDC_DECIMALS = BigInt.fromString("1000000") // 6 zeroes
export const SECONDS_PER_DAY = BigInt.fromString("86400")
export const SECONDS_PER_YEAR = BigInt.fromString("31536000")

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
