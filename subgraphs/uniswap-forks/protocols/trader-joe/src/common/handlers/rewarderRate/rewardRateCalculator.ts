import {
  Address,
  BigInt,
  BigDecimal,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  _MasterChef,
  _MasterChefRewarder,
  _MasterChefStakingPool,
  _RewarderProbe,
  LiquidityPool,
} from "../../../../../../generated/schema";
import { Rewarder } from "../../../../../../generated/MasterChefV2/Rewarder";
import {
  BIGINT_ZERO,
  BIGINT_ONE,
  BIGINT_TEN,
  BIGINT_HUNDRED,
  ZERO_ADDRESS,
  BIGDECIMAL_TEN,
  BIGDECIMAL_HUNDRED,
} from "../../../../../../src/common/constants";
import { MasterChefV2TraderJoe } from "../../../../../../generated/MasterChefV2/MasterChefV2TraderJoe";

// RewarderCalculator can be used to estimate the rewardRate of masterchef rewarders.
// It defaults to getting the rate from the contract if available, and if not it will estimate it from
// the increase in accrued rewards for some randomly chose accounts.
export class RewarderCalculator {
  private mc: _MasterChef;
  private rewarder: _MasterChefRewarder;
  private contract: Rewarder;

  constructor(mc: _MasterChef, rewarder: _MasterChefRewarder) {
    this.mc = mc;
    this.rewarder = rewarder;
    this.contract = Rewarder.bind(Address.fromString(rewarder.id));
  }

  public static attemptToRetrieveRewardRate(contract: Rewarder): BigInt | null {
    let tokenPerSecCall = contract.try_tokenPerSec();
    if (tokenPerSecCall.reverted) {
      return null;
    }

    return tokenPerSecCall.value;
  }

  // calculateRewarderRate will happen once every 6 hours.
  // There are 2 ways of calculating the reward rate:
  //   1. If the rewarder contract exposes `tokenPerSec`, we'll use that.
  //   2. If it doesn't, then the crazy math explained below:
  //
  // As deposits accumulate on the masterchef contract we'll be probing 5 different accounts which have deposited recently
  // and calculate the delta of calling pendingRewards. That delta, together with the total LP supply staked, the amount
  // of LP from the user, and the time elapsed gives us a good estimation on what the reward rate is. It is more precise if
  // the total LP staked doesn't vary much in that interval. So if it changes by more than 10 percent in a given interval
  // we'll discard the calculation. The interval we'll use for the calculation will be of 100 blocks.
  calculateRewarderRate(
    event: ethereum.Event,
    user: Address,
    isDeposit: boolean
  ): void {
    if (!this.shouldRecalculate(event)) {
      return;
    }

    if (this.rewarder.canRetrieveRate) {
      this.updateRewarderRateFromContract();
      return;
    }

    this.rewarder._rewardRateCalculationInProgress = true;
    this.rewarder.save();

    this.probeUser(event, user, isDeposit);

    if (!this.readyToCalculate(event)) {
      return;
    }

    this.computeRate(event);
  }

  private shouldRecalculate(event: ethereum.Event): boolean {
    if (this.rewarder._rewardRateCalculationInProgress) {
      return true;
    }

    const recalcInterval = BigInt.fromI32(3600 * 4); // 4 hours
    return event.block.timestamp
      .minus(this.rewarder.rateCalculatedAt)
      .gt(recalcInterval);
  }

  private updateRewarderRateFromContract(): void {
    let rate = RewarderCalculator.attemptToRetrieveRewardRate(this.contract);
    if (!rate) {
      log.error("rewarder rate is retrievable but failed to retrieve: {}", [
        this.rewarder.id,
      ]);
      return;
    }

    this.rewarder.tokenPerSec = rate;
    this.rewarder.save();
  }

  // readyToCalculate will return true if there are probes available and at least one of them
  // was taken more than 100 blocks ago.
  private readyToCalculate(event: ethereum.Event): boolean {
    const calculationInterval = BIGINT_HUNDRED; // 100 blocks

    if (!this.rewarder._probes) {
      return false;
    }

    for (let i = 0; i < this.rewarder._probes!.length; i++) {
      let probe = _RewarderProbe.load(this.rewarder._probes![i])!;
      if (event.block.number.minus(probe.blockNum).gt(calculationInterval)) {
        return true;
      }
    }
    return false;
  }

  // probeUser user will call rewarder.pendingTokens to see how much the rewards increase
  // in the measuring interval. If the user is already in the list of probing users we'll reset
  // its value to the current one, since a new deposit will claim all accrued rewards for the user.
  // On withdrawals we remove the user from the probe list, as it might have withdrawn everything, not accruing
  // any more rewards.
  // Probe entities are reused once a rewarder hits the maximum number of probes (5).
  private probeUser(
    event: ethereum.Event,
    user: Address,
    isDeposit: boolean
  ): void {
    const MAX_PROBES = 5;

    let probes = this.rewarder._probes;
    if (!probes) {
      probes = [];
    }

    if (!isDeposit) {
      this.removeUserProbes(user);
      return;
    }

    let probe: _RewarderProbe | null = null;
    for (let i = 0; i < probes.length; i++) {
      probe = _RewarderProbe.load(probes[i])!;
      if (probe.user == user.toHexString()) {
        this.resetProbe(probe);
        break;
      }

      if (probe.user == ZERO_ADDRESS) {
        break;
      }
    }

    if (!probe) {
      if (probes.length >= MAX_PROBES) {
        return; // no more probes to take
      }

      probe = new _RewarderProbe(`${this.rewarder.id}-${probes.length}`);
      probes.push(probe.id);
    }

    let pending = this.contract.pendingTokens(user);
    let totalLPStaked = this.currentStakedLPForRewarderPool();

    probe.user = user.toHexString();
    probe.pending = pending;
    probe.blockNum = event.block.number;
    probe.timestamp = event.block.timestamp;
    probe.lpStaked = totalLPStaked;
    probe.save();

    this.rewarder._probes = probes;
    this.rewarder.save();
  }

  private currentStakedLPForRewarderPool(): BigInt {
    let sPool = _MasterChefStakingPool.load(this.rewarder.pool);
    let pool = LiquidityPool.load(sPool!.poolAddress!);
    return pool!.stakedOutputTokenAmount!;
  }

  // computeRate will go over all probes from a fiven rewarder and attempt to calculate the
  // reward rate.
  private computeRate(event: ethereum.Event): void {
    let sPool = _MasterChefStakingPool.load(this.rewarder.pool)!;
    let currentStakedLP = this.currentStakedLPForRewarderPool();

    let sum = BIGINT_ZERO;
    let validProbes = BIGINT_ZERO;
    for (let i = 0; i < this.rewarder._probes!.length; i++) {
      let probe = _RewarderProbe.load(this.rewarder._probes![i])!;
      if (event.block.number == probe.blockNum) {
        continue; // was added right now, so won't have accrued rewards
      }

      let changePercentage = currentStakedLP
        .minus(probe.lpStaked)
        .toBigDecimal()
        .div(BigDecimal.fromString(currentStakedLP.toString()))
        .times(BIGDECIMAL_HUNDRED);
      if (changePercentage.gt(BIGDECIMAL_TEN)) {
        log.error("omitting rewarder probe due to high LP change: {}", [
          probe.id,
        ]);
        // Total staked LP changed too much to be accurate. Omit this probe.
        continue;
      }

      let newPending = this.contract.pendingTokens(
        Address.fromString(probe.user)
      );
      let pendingDelta = newPending.minus(probe.pending);
      let userLP = this.getUserStakedLP(sPool, Address.fromString(probe.user));
      let elapsed = event.block.timestamp.minus(probe.timestamp);

      let denom = userLP.times(elapsed);
      if (denom.equals(BIGINT_ZERO)) {
        continue;
      }

      let rate = pendingDelta.times(currentStakedLP).div(denom);
      sum = sum.plus(rate);
      validProbes = validProbes.plus(BIGINT_ONE);
    }

    if (validProbes.equals(BIGINT_ZERO)) {
      log.warning("unable to compute rewarder rate this time: {}", [
        this.rewarder.id,
      ]);
      this.rewarder._probes = [];
      this.rewarder.save();
      return;
    }

    let averageRate = sum.div(validProbes);
    this.rewarder.tokenPerSec = averageRate;
    this.rewarder._rewardRateCalculationInProgress = false;
    this.rewarder._probes = [];
    this.rewarder.rateCalculatedAt = event.block.timestamp;
    this.rewarder.save();
  }

  private removeUserProbes(user: Address): void {
    let probes = this.rewarder._probes;
    if (!probes) {
      return;
    }

    for (let i = 0; i < probes.length; i++) {
      let probe = _RewarderProbe.load(probes[i])!;
      if (probe.user == user.toHexString()) {
        this.resetProbe(probe);
        return;
      }
    }
  }

  private resetProbe(probe: _RewarderProbe): void {
    probe.user = ZERO_ADDRESS;
    probe.save();
  }

  private getUserStakedLP(
    sPool: _MasterChefStakingPool,
    user: Address
  ): BigInt {
    let pid = sPool.id.split("-")[1];
    if (!pid) {
      return BIGINT_ZERO;
    }

    let c = MasterChefV2TraderJoe.bind(Address.fromString(this.mc.address!)); // v2 and v3 have the same definition for this method.
    let call = c.try_userInfo(BigInt.fromString(pid), user);
    if (call.reverted) {
      log.error("unable to get user staked lp: {}", [user.toHexString()]);
      return BIGINT_ZERO;
    }

    return call.value.value0;
  }
}
