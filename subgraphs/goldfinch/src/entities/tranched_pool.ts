/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import {
  TranchedPool,
  JuniorTrancheInfo,
  SeniorTrancheInfo,
  CreditLine,
  PoolToken,
} from "../../generated/schema";
import {
  TranchedPool as TranchedPoolContract,
  DepositMade,
} from "../../generated/templates/TranchedPool/TranchedPool";
import { GoldfinchConfig as GoldfinchConfigContract } from "../../generated/templates/TranchedPool/GoldfinchConfig";
import {
  SECONDS_PER_DAY,
  GFI_DECIMALS,
  USDC_DECIMALS,
  SECONDS_PER_YEAR,
  CONFIG_KEYS_ADDRESSES,
  CONFIG_KEYS_NUMBERS,
  FIDU_DECIMALS,
} from "../common/constants";
import { getOrInitUser } from "./user";
import { getOrInitCreditLine, initOrUpdateCreditLine } from "./credit_line";
import {
  getTotalDeposited,
  isV1StyleDeal,
  estimateJuniorAPY,
  getEstimatedSeniorPoolInvestment,
  getJuniorDeposited,
  getCreatedAtOverride,
} from "./helpers";
import {
  bigDecimalToBigInt,
  bigIntMin,
  ceil,
  getAddressFromConfig,
  isAfterV2_2,
  VERSION_BEFORE_V2_2,
  VERSION_V2_2,
} from "../common/utils";
import { getBackerRewards } from "./backer_rewards";
import { BackerRewards as BackerRewardsContract } from "../../generated/BackerRewards/BackerRewards";
import { getOrInitSeniorPoolStatus } from "./senior_pool";

export function updatePoolCreditLine(
  address: Address,
  timestamp: BigInt
): void {
  const contract = TranchedPoolContract.bind(address);
  const tranchedPool = getOrInitTranchedPool(address, timestamp);

  const creditLineAddress = contract.creditLine().toHexString();
  const creditLine = initOrUpdateCreditLine(
    Address.fromString(creditLineAddress),
    timestamp
  );

  tranchedPool.creditLine = creditLine.id;
  tranchedPool.save();
}

export function handleDeposit(event: DepositMade): void {
  const backer = getOrInitUser(event.params.owner);

  const tranchedPool = getOrInitTranchedPool(
    event.address,
    event.block.timestamp
  );
  const juniorTrancheInfo = JuniorTrancheInfo.load(
    `${event.address.toHexString()}-${event.params.tranche.toString()}`
  );
  if (juniorTrancheInfo) {
    juniorTrancheInfo.principalDeposited =
      juniorTrancheInfo.principalDeposited.plus(event.params.amount);
    juniorTrancheInfo.save();
  }

  if (!tranchedPool.backers.includes(backer.id)) {
    const addresses = tranchedPool.backers;
    addresses.push(backer.id);
    tranchedPool.backers = addresses;
    tranchedPool.numBackers = addresses.length;
  }

  tranchedPool.estimatedTotalAssets = tranchedPool.estimatedTotalAssets.plus(
    event.params.amount
  );
  tranchedPool.juniorDeposited = tranchedPool.juniorDeposited.plus(
    event.params.amount
  );
  const creditLine = CreditLine.load(tranchedPool.creditLine);
  if (!creditLine) {
    throw new Error(
      `Missing credit line for tranched pool ${tranchedPool.id} while handling deposit`
    );
  }
  const limit = !creditLine.limit.isZero()
    ? creditLine.limit
    : creditLine.maxLimit;
  tranchedPool.remainingCapacity = limit.minus(
    tranchedPool.estimatedTotalAssets
  );

  tranchedPool.save();

  updatePoolCreditLine(event.address, event.block.timestamp);
}

export function getOrInitTranchedPool(
  poolAddress: Address,
  timestamp: BigInt
): TranchedPool {
  let tranchedPool = TranchedPool.load(poolAddress.toHexString());
  if (!tranchedPool) {
    tranchedPool = initOrUpdateTranchedPool(poolAddress, timestamp);
  }
  return tranchedPool;
}

export function initOrUpdateTranchedPool(
  address: Address,
  timestamp: BigInt
): TranchedPool {
  let tranchedPool = TranchedPool.load(address.toHexString());
  const isCreating = !tranchedPool;
  if (!tranchedPool) {
    tranchedPool = new TranchedPool(address.toHexString());
  }

  const poolContract = TranchedPoolContract.bind(address);
  const goldfinchConfigContract = GoldfinchConfigContract.bind(
    poolContract.config()
  );
  const seniorPoolAddress = goldfinchConfigContract.getAddress(
    BigInt.fromI32(CONFIG_KEYS_ADDRESSES.SeniorPool)
  );

  let version: string = VERSION_BEFORE_V2_2;
  let numSlices = BigInt.fromI32(1);
  let totalDeployed: BigInt = BigInt.fromI32(0);
  let fundableAt: BigInt = BigInt.fromI32(0);
  if (timestamp && isAfterV2_2(timestamp)) {
    const callResult = poolContract.try_numSlices();
    if (callResult.reverted) {
      log.warning("numSlices reverted for pool {}", [address.toHexString()]);
    } else {
      // Assuming that a pool is a v2_2 pool if requests work
      numSlices = callResult.value;
      version = VERSION_V2_2;
    }
    const callTotalDeployed = poolContract.try_totalDeployed();
    if (callTotalDeployed.reverted) {
      log.warning("totalDeployed reverted for pool {}", [
        address.toHexString(),
      ]);
    } else {
      totalDeployed = callTotalDeployed.value;
      // Assuming that a pool is a v2_2 pool if requests work
      version = VERSION_V2_2;
    }
    const callFundableAt = poolContract.try_fundableAt();
    if (callFundableAt.reverted) {
      log.warning("fundableAt reverted for pool {}", [address.toHexString()]);
    } else {
      fundableAt = callFundableAt.value;
      // Assuming that a pool is a v2_2 pool if requests work
      version = VERSION_V2_2;
    }
  }

  let counter = 1;
  const juniorTranches: JuniorTrancheInfo[] = [];
  const seniorTranches: SeniorTrancheInfo[] = [];
  for (let i = 0; i < numSlices.toI32(); i++) {
    const seniorTrancheInfo = poolContract.getTranche(BigInt.fromI32(counter));
    const seniorId = `${address.toHexString()}-${seniorTrancheInfo.id.toString()}`;
    let seniorTranche = SeniorTrancheInfo.load(seniorId);
    if (!seniorTranche) {
      seniorTranche = new SeniorTrancheInfo(seniorId);
    }
    seniorTranche.trancheId = BigInt.fromI32(counter);
    seniorTranche.lockedUntil = seniorTrancheInfo.lockedUntil;
    seniorTranche.tranchedPool = address.toHexString();
    seniorTranche.principalDeposited = seniorTrancheInfo.principalDeposited;
    seniorTranche.principalSharePrice = seniorTrancheInfo.principalSharePrice;
    seniorTranche.interestSharePrice = seniorTrancheInfo.interestSharePrice;
    seniorTranche.save();
    seniorTranches.push(seniorTranche);

    counter++;

    const juniorTrancheInfo = poolContract.getTranche(BigInt.fromI32(counter));

    const juniorId = `${address.toHexString()}-${juniorTrancheInfo.id.toString()}`;
    let juniorTranche = JuniorTrancheInfo.load(juniorId);
    if (!juniorTranche) {
      juniorTranche = new JuniorTrancheInfo(juniorId);
    }
    juniorTranche.trancheId = BigInt.fromI32(counter);
    juniorTranche.lockedUntil = juniorTrancheInfo.lockedUntil;
    juniorTranche.tranchedPool = address.toHexString();
    juniorTranche.principalSharePrice = juniorTrancheInfo.principalSharePrice;
    juniorTranche.interestSharePrice = juniorTrancheInfo.interestSharePrice;
    juniorTranche.principalDeposited = juniorTrancheInfo.principalDeposited;
    juniorTranche.save();
    juniorTranches.push(juniorTranche);

    counter++;
  }

  tranchedPool.juniorFeePercent = poolContract.juniorFeePercent();
  tranchedPool.reserveFeePercent = BigInt.fromI32(100).div(
    goldfinchConfigContract.getNumber(
      BigInt.fromI32(CONFIG_KEYS_NUMBERS.ReserveDenominator)
    )
  );
  tranchedPool.estimatedSeniorPoolContribution =
    getEstimatedSeniorPoolInvestment(address, version, seniorPoolAddress);
  tranchedPool.totalDeposited = getTotalDeposited(
    address,
    juniorTranches,
    seniorTranches
  );
  tranchedPool.estimatedTotalAssets = tranchedPool.totalDeposited.plus(
    tranchedPool.estimatedSeniorPoolContribution
  );
  tranchedPool.juniorDeposited = getJuniorDeposited(juniorTranches);
  tranchedPool.isPaused = poolContract.paused();
  tranchedPool.isV1StyleDeal = isV1StyleDeal(address);
  tranchedPool.version = version;
  tranchedPool.totalDeployed = totalDeployed;
  const createdAtOverride = getCreatedAtOverride(address);
  tranchedPool.createdAt = createdAtOverride
    ? createdAtOverride
    : poolContract.createdAt();
  tranchedPool.fundableAt = fundableAt.isZero()
    ? tranchedPool.createdAt
    : fundableAt;

  const creditLineAddress = poolContract.creditLine().toHexString();
  const creditLine = getOrInitCreditLine(
    Address.fromString(creditLineAddress),
    timestamp
  );
  tranchedPool.creditLine = creditLine.id;
  const limit = !creditLine.limit.isZero()
    ? creditLine.limit
    : creditLine.maxLimit;
  tranchedPool.remainingCapacity = limit.minus(
    tranchedPool.estimatedTotalAssets
  );
  // This can happen in weird cases where the senior pool investment causes a pool to overfill
  if (tranchedPool.remainingCapacity.lt(BigInt.zero())) {
    tranchedPool.remainingCapacity = BigInt.zero();
  }
  if (isCreating) {
    tranchedPool.backers = [];
    tranchedPool.tokens = [];
    tranchedPool.numBackers = 0;
    tranchedPool.estimatedJuniorApyFromGfiRaw = BigDecimal.zero();
    tranchedPool.principalAmountRepaid = BigInt.zero();
    tranchedPool.interestAmountRepaid = BigInt.zero();
    // V1 style deals do not have a leverage ratio because all capital came from the senior pool
    if (tranchedPool.isV1StyleDeal) {
      tranchedPool.estimatedLeverageRatio = null;
    } else {
      tranchedPool.estimatedLeverageRatio = getLeverageRatioFromConfig(
        goldfinchConfigContract
      );
    }
  }

  const getAllowedUIDTypes_callResult = poolContract.try_getAllowedUIDTypes();
  if (!getAllowedUIDTypes_callResult.reverted) {
    const allowedUidInts = getAllowedUIDTypes_callResult.value;
    const allowedUidStrings: string[] = [];
    for (let i = 0; i < allowedUidInts.length; i++) {
      const uidType = allowedUidInts[i];
      if (uidType.equals(BigInt.fromI32(0))) {
        allowedUidStrings.push("NON_US_INDIVIDUAL");
      } else if (uidType.equals(BigInt.fromI32(1))) {
        allowedUidStrings.push("US_ACCREDITED_INDIVIDUAL");
      } else if (uidType.equals(BigInt.fromI32(2))) {
        allowedUidStrings.push("US_NON_ACCREDITED_INDIVIDUAL");
      } else if (uidType.equals(BigInt.fromI32(3))) {
        allowedUidStrings.push("US_ENTITY");
      } else if (uidType.equals(BigInt.fromI32(4))) {
        allowedUidStrings.push("NON_US_ENTITY");
      }
    }
    tranchedPool.allowedUidTypes = allowedUidStrings;
  } else {
    // by default, assume everything except US non-accredited individual is allowed
    tranchedPool.allowedUidTypes = [
      "NON_US_INDIVIDUAL",
      "US_ACCREDITED_INDIVIDUAL",
      "US_ENTITY",
      "NON_US_ENTITY",
    ];
  }

  tranchedPool.estimatedJuniorApy = estimateJuniorAPY(tranchedPool);
  tranchedPool.initialInterestOwed = calculateInitialInterestOwed(creditLine);
  tranchedPool.save();

  if (isCreating) {
    const seniorPoolStatus = getOrInitSeniorPoolStatus();
    const tpl = seniorPoolStatus.tranchedPools;
    tpl.push(tranchedPool.id);
    seniorPoolStatus.tranchedPools = tpl;
    seniorPoolStatus.save();
  }
  calculateApyFromGfiForAllPools();

  return tranchedPool;
}

// TODO leverage ratio should really be expressed as a BigDecimal https://linear.app/goldfinch/issue/GFI-951/leverage-ratio-should-be-expressed-as-bigdecimal-in-subgraph
export function getLeverageRatioFromConfig(
  goldfinchConfigContract: GoldfinchConfigContract
): BigInt {
  return bigDecimalToBigInt(
    goldfinchConfigContract
      .getNumber(BigInt.fromI32(CONFIG_KEYS_NUMBERS.LeverageRatio))
      .divDecimal(FIDU_DECIMALS)
  );
}

class Repayment {
  tranchedPoolAddress: string;
  timestamp: BigInt;
  interestAmount: BigInt;
  constructor(
    tranchedPoolAddress: string,
    timestamp: BigInt,
    interestAmount: BigInt
  ) {
    this.tranchedPoolAddress = tranchedPoolAddress;
    this.timestamp = timestamp;
    this.interestAmount = interestAmount;
  }

  toString(): string {
    return `{ tranchedPoolAddress: ${
      this.tranchedPoolAddress
    }, timestamp: ${this.timestamp.toString()}, interestAmount: $${this.interestAmount.toString()} }`;
  }
}

class GfiRewardOnInterest {
  tranchedPoolAddress: string;
  timestamp: BigInt;
  gfiAmount: BigDecimal;
  constructor(
    tranchedPoolAddress: string,
    timestamp: BigInt,
    gfiAmount: BigDecimal
  ) {
    this.tranchedPoolAddress = tranchedPoolAddress;
    this.timestamp = timestamp;
    this.gfiAmount = gfiAmount;
  }
  toString(): string {
    return `{ tranchedPoolAddress: ${
      this.tranchedPoolAddress
    }, timestamp: ${this.timestamp.toString()}, gfiAmount: ${this.gfiAmount.toString()}}`;
  }
}

export function calculateApyFromGfiForAllPools(): void {
  const backerRewards = getBackerRewards();
  // Bail out early if the backer rewards parameters aren't populated yet
  if (
    backerRewards.totalRewards == BigInt.zero() ||
    backerRewards.maxInterestDollarsEligible == BigInt.zero()
  ) {
    return;
  }
  const seniorPoolStatus = getOrInitSeniorPoolStatus();
  const tranchedPoolList = seniorPoolStatus.tranchedPools;
  let repaymentSchedules: Repayment[] = [];
  for (let i = 0; i < tranchedPoolList.length; i++) {
    const tranchedPool = TranchedPool.load(tranchedPoolList[i]);
    if (!tranchedPool) {
      continue;
    }
    const creditLine = CreditLine.load(tranchedPool.creditLine);
    if (!creditLine || !creditLine.isEligibleForRewards) {
      continue;
    }
    const schedule = getApproximateRepaymentSchedule(tranchedPool);
    repaymentSchedules = repaymentSchedules.concat(schedule);
  }
  repaymentSchedules.sort(repaymentComparator);

  const rewardsSchedules = estimateRewards(
    repaymentSchedules,
    backerRewards.totalRewards,
    backerRewards.maxInterestDollarsEligible
  );
  const summedRewardsByTranchedPool = new Map<string, BigDecimal>();
  for (let i = 0; i < rewardsSchedules.length; i++) {
    const reward = rewardsSchedules[i];
    const tranchedPoolAddress = reward.tranchedPoolAddress;
    if (summedRewardsByTranchedPool.has(tranchedPoolAddress)) {
      const currentSum = summedRewardsByTranchedPool.get(tranchedPoolAddress);
      summedRewardsByTranchedPool.set(
        tranchedPoolAddress,
        currentSum.plus(reward.gfiAmount)
      );
    } else {
      summedRewardsByTranchedPool.set(tranchedPoolAddress, reward.gfiAmount);
    }
  }
  const gfiPerPrincipalDollar = calculateAnnualizedGfiRewardsPerPrincipalDollar(
    summedRewardsByTranchedPool
  );
  for (let i = 0; i < gfiPerPrincipalDollar.keys().length; i++) {
    const tranchedPoolAddress = gfiPerPrincipalDollar.keys()[i];
    const tranchedPool = TranchedPool.load(tranchedPoolAddress as string);
    if (!tranchedPool) {
      continue;
    }
    tranchedPool.estimatedJuniorApyFromGfiRaw = gfiPerPrincipalDollar
      .get(tranchedPoolAddress)
      .div(GFI_DECIMALS);
    tranchedPool.save();
  }
}

// TODO tiebreaking logic
function repaymentComparator(a: Repayment, b: Repayment): i32 {
  const timeDiff = a.timestamp.minus(b.timestamp);
  return timeDiff.toI32();
}

function getApproximateRepaymentSchedule(
  tranchedPool: TranchedPool
): Repayment[] {
  const creditLine = CreditLine.load(tranchedPool.creditLine);
  if (!creditLine) {
    return [];
  }

  // When should we say that interest will start being earned on this additional balance?
  // We can't be sure exactly. There's currently no notion of a deadline for funding
  // the pool, nor hard start time of the borrowing. We'll make a reasonable supposition:
  // if the creditLine has a start time defined, use that. If it doesn't, assume the interest starts
  // 7 days after the pool became fundable (and if that value isn't populated, use the pool's creation date)
  let startTime: BigInt;
  let endTime: BigInt;
  if (
    creditLine.termStartTime != BigInt.zero() &&
    creditLine.termEndTime != BigInt.zero()
  ) {
    startTime = creditLine.termStartTime;
    endTime = creditLine.termEndTime;
  } else {
    startTime = tranchedPool.fundableAt.plus(
      BigInt.fromI32(SECONDS_PER_DAY).times(BigInt.fromString("7"))
    );
    endTime = startTime.plus(
      BigInt.fromI32(SECONDS_PER_DAY).times(creditLine.termInDays)
    );
  }

  const secondsPerPaymentPeriod = creditLine.paymentPeriodInDays.times(
    BigInt.fromI32(SECONDS_PER_DAY)
  );
  const expectedAnnualInterest = creditLine.maxLimit
    .toBigDecimal()
    .times(creditLine.interestAprDecimal);
  const repayments: Repayment[] = [];
  let periodStartTime = startTime;
  while (periodStartTime < endTime) {
    const periodEndTime = bigIntMin(
      periodStartTime.plus(secondsPerPaymentPeriod),
      endTime
    );
    const periodDuration = periodEndTime.minus(periodStartTime);
    const interestAmount = expectedAnnualInterest
      .times(periodDuration.toBigDecimal())
      .div(BigDecimal.fromString(SECONDS_PER_YEAR.toString()));
    repayments.push(
      new Repayment(
        tranchedPool.id,
        periodEndTime,
        bigDecimalToBigInt(interestAmount)
      )
    );
    periodStartTime = periodEndTime;
  }
  return repayments;
}

function estimateRewards(
  repaymentSchedules: Repayment[],
  totalGfiAvailableForBackerRewards: BigInt, // TODO instead of relying on BackerRewards.totalRewards(), manually calculate that amount using GFI total suppy and totalRewardPercentOfTotalGFI
  maxInterestDollarsEligible: BigInt
): GfiRewardOnInterest[] {
  const rewards: GfiRewardOnInterest[] = [];
  let oldTotalInterest = BigInt.zero();
  for (let i = 0; i < repaymentSchedules.length; i++) {
    const repayment = repaymentSchedules[i];
    // Need to use big numbers to get decent accuracy during integer sqrt
    let newTotalInterest = oldTotalInterest.plus(
      bigDecimalToBigInt(
        repayment.interestAmount.divDecimal(USDC_DECIMALS).times(GFI_DECIMALS)
      )
    );
    if (newTotalInterest.gt(maxInterestDollarsEligible)) {
      newTotalInterest = maxInterestDollarsEligible;
    }
    const sqrtDiff = newTotalInterest.sqrt().minus(oldTotalInterest.sqrt());
    const gfiAmount = sqrtDiff
      .times(totalGfiAvailableForBackerRewards)
      .divDecimal(maxInterestDollarsEligible.sqrt().toBigDecimal());
    rewards.push(
      new GfiRewardOnInterest(
        repayment.tranchedPoolAddress,
        repayment.timestamp,
        gfiAmount
      )
    );
    oldTotalInterest = newTotalInterest;
  }

  return rewards;
}

// ! The estimate done here is very crude. It's not as accurate as the code that lives at `ethereum/backerRewards` in the old Goldfinch client
function calculateAnnualizedGfiRewardsPerPrincipalDollar(
  summedRewardsByTranchedPool: Map<string, BigDecimal>
): Map<string, BigDecimal> {
  const rewardsPerPrincipalDollar = new Map<string, BigDecimal>();
  for (let i = 0; i < summedRewardsByTranchedPool.keys().length; i++) {
    const tranchedPoolAddress = summedRewardsByTranchedPool.keys()[i];
    const tranchedPool = TranchedPool.load(tranchedPoolAddress as string);
    if (!tranchedPool) {
      throw new Error(
        "Unable to load tranchedPool from summedRewardsByTranchedPool"
      );
    }
    const creditLine = CreditLine.load(tranchedPool.creditLine);
    if (!creditLine) {
      throw new Error(
        "Unable to load creditLine from summedRewardsByTranchedPool"
      );
    }

    let divisor: BigDecimal = BigDecimal.fromString("1");
    if (tranchedPool.estimatedLeverageRatio !== null) {
      divisor = tranchedPool
        .estimatedLeverageRatio!.plus(BigInt.fromI32(1))
        .toBigDecimal();
    }
    const juniorPrincipalDollars = creditLine.maxLimit
      .divDecimal(divisor)
      .div(USDC_DECIMALS);
    const reward = summedRewardsByTranchedPool.get(tranchedPoolAddress);
    const perPrincipalDollar = reward.div(juniorPrincipalDollars);

    const numYears = creditLine.termInDays.divDecimal(
      BigDecimal.fromString("365")
    );
    const annualizedPerPrincipalDollar = perPrincipalDollar.div(numYears);
    rewardsPerPrincipalDollar.set(
      tranchedPoolAddress,
      annualizedPerPrincipalDollar
    );
  }
  return rewardsPerPrincipalDollar;
}

// Performs a simple (not compound) interest calculation on the creditLine, using the limit as the principal amount
function calculateInitialInterestOwed(creditLine: CreditLine): BigInt {
  const principal = creditLine.limit.toBigDecimal();
  const interestRatePerDay = creditLine.interestAprDecimal.div(
    BigDecimal.fromString("365")
  );
  const termInDays = creditLine.termInDays.toBigDecimal();
  const interestOwed = principal.times(interestRatePerDay.times(termInDays));
  return ceil(interestOwed);
}

// Goes through all of the tokens for this pool and updates their rewards claimable
export function updatePoolRewardsClaimable(
  tranchedPool: TranchedPool,
  tranchedPoolContract: TranchedPoolContract
): void {
  const backerRewardsContractAddress = getAddressFromConfig(
    tranchedPoolContract,
    CONFIG_KEYS_ADDRESSES.BackerRewards
  );
  if (backerRewardsContractAddress.equals(Address.zero())) {
    return;
  }
  const backerRewardsContract = BackerRewardsContract.bind(
    backerRewardsContractAddress
  );
  const poolTokenIds = tranchedPool.tokens;
  for (let i = 0; i < poolTokenIds.length; i++) {
    const poolToken = assert(PoolToken.load(poolTokenIds[i]));
    poolToken.rewardsClaimable =
      backerRewardsContract.poolTokenClaimableRewards(
        BigInt.fromString(poolToken.id)
      );
    const stakingRewardsEarnedResult =
      backerRewardsContract.try_stakingRewardsEarnedSinceLastWithdraw(
        BigInt.fromString(poolToken.id)
      );
    if (!stakingRewardsEarnedResult.reverted) {
      poolToken.stakingRewardsClaimable = stakingRewardsEarnedResult.value;
    }
    poolToken.save();
  }
}

export function updatePoolTokensRedeemable(tranchedPool: TranchedPool): void {
  const tranchedPoolContract = TranchedPoolContract.bind(
    Address.fromString(tranchedPool.id)
  );
  const poolTokenIds = tranchedPool.tokens;
  for (let i = 0; i < poolTokenIds.length; i++) {
    const poolToken = assert(PoolToken.load(poolTokenIds[i]));
    const availableToWithdrawResult =
      tranchedPoolContract.try_availableToWithdraw(
        BigInt.fromString(poolToken.id)
      );
    if (!availableToWithdrawResult.reverted) {
      poolToken.interestRedeemable = availableToWithdrawResult.value.value0;
      poolToken.principalRedeemable = availableToWithdrawResult.value.value1;
    } else {
      log.warning(
        "availableToWithdraw reverted for pool token {} on TranchedPool {}",
        [poolToken.id, tranchedPool.id]
      );
    }
    poolToken.save();
  }
}
