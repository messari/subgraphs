import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { SeniorPool, SeniorPoolStatus } from "../../generated/schema";
import { SeniorPool as SeniorPoolContract } from "../../generated/SeniorPool/SeniorPool";
import { Fidu as FiduContract } from "../../generated/SeniorPool/Fidu";
import { USDC as UsdcContract } from "../../generated/SeniorPool/USDC";
import {
  BIGINT_ZERO,
  CONFIG_KEYS_ADDRESSES,
  SECONDS_PER_YEAR,
} from "../common/constants";
import { calculateEstimatedInterestForTranchedPool } from "./helpers";
import { getStakingRewards } from "./staking_rewards";
import { bigDecimalToBigInt, getAddressFromConfig } from "../common/utils";
import {
  USDC_DECIMALS,
  GFI_DECIMALS,
  FIDU_DECIMALS,
} from "../common/constants";

export function getOrInitSeniorPool(address: Address): SeniorPool {
  let seniorPool = SeniorPool.load(address.toHexString());
  if (!seniorPool) {
    seniorPool = new SeniorPool(address.toHexString());
    seniorPool.investmentsMade = [];

    const poolStatus = getOrInitSeniorPoolStatus();

    seniorPool.latestPoolStatus = poolStatus.id;
    seniorPool.save();
  }
  return seniorPool as SeniorPool;
}

export const SENIOR_POOL_STATUS_ID = "1";
export function getOrInitSeniorPoolStatus(): SeniorPoolStatus {
  let poolStatus = SeniorPoolStatus.load(SENIOR_POOL_STATUS_ID);
  if (!poolStatus) {
    poolStatus = new SeniorPoolStatus(SENIOR_POOL_STATUS_ID);
    poolStatus.rawBalance = new BigInt(0);
    poolStatus.compoundBalance = new BigInt(0);
    poolStatus.balance = new BigInt(0);
    poolStatus.totalShares = new BigInt(0);
    poolStatus.sharePrice = new BigInt(0);
    poolStatus.totalPoolAssets = new BigInt(0);
    poolStatus.totalPoolAssetsUsdc = new BigInt(0);
    poolStatus.totalLoansOutstanding = new BigInt(0);
    poolStatus.cumulativeWritedowns = new BigInt(0);
    poolStatus.cumulativeDrawdowns = new BigInt(0);
    poolStatus.estimatedTotalInterest = BigDecimal.zero();
    poolStatus.estimatedApy = BigDecimal.zero();
    poolStatus.estimatedApyFromGfiRaw = BigDecimal.zero();
    poolStatus.defaultRate = new BigInt(0);
    poolStatus.tranchedPools = [];
    poolStatus.usdcBalance = BigInt.zero();
    poolStatus.save();
  }
  return poolStatus;
}

export function updateEstimatedApyFromGfiRaw(): void {
  const stakingRewards = getStakingRewards();
  const seniorPoolStatus = getOrInitSeniorPoolStatus();
  if (seniorPoolStatus.sharePrice != BigInt.zero()) {
    seniorPoolStatus.estimatedApyFromGfiRaw =
      stakingRewards.currentEarnRatePerToken
        .times(BigInt.fromI32(SECONDS_PER_YEAR))
        .toBigDecimal()
        .times(FIDU_DECIMALS) // This might be better thought of as the share-price mantissa, which happens to be the same as `FIDU_DECIMALS`.
        .div(seniorPoolStatus.sharePrice.toBigDecimal())
        .div(GFI_DECIMALS);
    seniorPoolStatus.save();
  }
}

export function updatePoolStatus(event: ethereum.Event): void {
  const seniorPoolAddress = event.address;
  const seniorPool = getOrInitSeniorPool(seniorPoolAddress);

  const seniorPoolContract = SeniorPoolContract.bind(seniorPoolAddress);
  const fidu_contract = FiduContract.bind(
    getAddressFromConfig(seniorPoolContract, CONFIG_KEYS_ADDRESSES.Fidu)
  );
  const usdc_contract = UsdcContract.bind(
    getAddressFromConfig(seniorPoolContract, CONFIG_KEYS_ADDRESSES.USDC)
  );

  const sharePrice = seniorPoolContract.sharePrice();
  // SENIOR POOL implement was upgraded with this transaction and deprecated compoundBalance()
  // https://etherscan.io/tx/0x0d54c34ffa6a11afd95d42e69f7c171b38b99b3157d26812db165415e4e3b5c4
  const compoundBalanceResult = seniorPoolContract.try_compoundBalance();
  const compoundBalance = getOrElse<BigInt>(compoundBalanceResult, BIGINT_ZERO);
  const totalLoansOutstanding = seniorPoolContract.totalLoansOutstanding();
  const totalSupply = fidu_contract.totalSupply();
  const totalPoolAssets = totalSupply.times(sharePrice);
  const totalPoolAssetsUsdc = bigDecimalToBigInt(
    totalPoolAssets
      .toBigDecimal()
      .times(USDC_DECIMALS)
      .div(FIDU_DECIMALS)
      .div(FIDU_DECIMALS)
  );
  const balance = seniorPoolContract
    .assets()
    .minus(seniorPoolContract.totalLoansOutstanding())
    .plus(seniorPoolContract.totalWritedowns());
  const rawBalance = balance;

  const poolStatus = SeniorPoolStatus.load(
    seniorPool.latestPoolStatus
  ) as SeniorPoolStatus;
  poolStatus.compoundBalance = compoundBalance;
  poolStatus.totalLoansOutstanding = totalLoansOutstanding;
  poolStatus.totalShares = totalSupply;
  poolStatus.balance = balance;
  poolStatus.sharePrice = sharePrice;
  poolStatus.rawBalance = rawBalance;
  poolStatus.usdcBalance = usdc_contract.balanceOf(seniorPoolAddress);
  poolStatus.totalPoolAssets = totalPoolAssets;
  poolStatus.totalPoolAssetsUsdc = totalPoolAssetsUsdc;
  poolStatus.save();
  recalculateSeniorPoolAPY(poolStatus);
  updateEstimatedApyFromGfiRaw();

  seniorPool.latestPoolStatus = poolStatus.id;
  seniorPool.save();
}

export function updatePoolInvestments(
  seniorPoolAddress: Address,
  tranchedPoolAddress: Address
): void {
  const seniorPool = getOrInitSeniorPool(seniorPoolAddress);
  const investments = seniorPool.investmentsMade;
  investments.push(tranchedPoolAddress.toHexString());
  seniorPool.investmentsMade = investments;
  seniorPool.save();
}

export function recalculateSeniorPoolAPY(poolStatus: SeniorPoolStatus): void {
  let estimatedTotalInterest = BigDecimal.zero();
  for (let i = 0; i < poolStatus.tranchedPools.length; i++) {
    const tranchedPoolId = poolStatus.tranchedPools[i];
    if (!tranchedPoolId) {
      continue;
    }
    estimatedTotalInterest = estimatedTotalInterest.plus(
      calculateEstimatedInterestForTranchedPool(tranchedPoolId)
    );
  }
  poolStatus.estimatedTotalInterest = estimatedTotalInterest;

  if (poolStatus.totalPoolAssets.notEqual(BigInt.zero())) {
    // The goofy-looking math here is required to get things in the right units for arithmetic
    const totalPoolAssetsInDollars = poolStatus.totalPoolAssets
      .toBigDecimal()
      .div(FIDU_DECIMALS)
      .div(FIDU_DECIMALS)
      .times(USDC_DECIMALS);
    const estimatedApy = estimatedTotalInterest.div(totalPoolAssetsInDollars);
    poolStatus.estimatedApy = estimatedApy;
  }

  poolStatus.save();
}

function getOrElse<T>(result: ethereum.CallResult<T>, defaultValue: T): T {
  if (result.reverted) {
    return defaultValue;
  }
  return result.value;
}
