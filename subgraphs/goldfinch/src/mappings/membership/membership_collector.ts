import { EpochFinalized } from "../../../generated/MembershipCollector/MembershipCollector";
import {
  Market,
  Membership,
  MembershipEpoch,
  MembershipRewardDisbursement,
} from "../../../generated/schema";
import { getOrInitMembershipRoster } from "./membership_vault";
import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import {
  getGFIPrice,
  getOrCreateProtocol,
  getOrCreateRewardToken,
} from "../../common/getters";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  DAYS_PER_EPOCH,
  GFI_ADDRESS,
  GFI_DECIMALS,
  MEMBERSHIP_VAULT_ADDRESS,
  RewardTokenType,
} from "../../common/constants";
import { MembershipVault } from "../../../generated/MembershipVault/MembershipVault";
import { bigDecimalToBigInt } from "../../common/utils";

export function handleEpochFinalized(event: EpochFinalized): void {
  const epoch = new MembershipEpoch(event.params.epoch.toString());
  epoch.epoch = event.params.epoch;
  epoch.totalRewards = event.params.totalRewards;
  epoch.finalizedAt = event.block.timestamp.toI32();
  epoch.save();

  // Create a MembershipRewardDisbursement entity for each member (this is used for the line graph at the top of /membership)
  const membershipRoster = getOrInitMembershipRoster();
  for (let i = 0; i < membershipRoster.members.length; i++) {
    const membership = Membership.load(membershipRoster.members[i]);
    if (!membership) {
      continue;
    }
    // create the disbursement
    const disbursement = new MembershipRewardDisbursement(
      `${event.params.epoch.toString()}-${membership.id}`
    );
    disbursement.user = membership.user;
    disbursement.epoch = event.params.epoch;
    disbursement.rewards = membershipRoster.eligibleScoreTotal.isZero()
      ? BigInt.zero()
      : membership.eligibleScore
          .times(event.params.totalRewards)
          .div(membershipRoster.eligibleScoreTotal);
    disbursement.allocatedAt = event.block.timestamp.toI32();
    disbursement.save();

    // update eligibleScore for each member
    membership.eligibleScore = membership.nextEpochScore;
    membership.save();
  }
  membershipRoster.eligibleScoreTotal = membershipRoster.nextEpochScoreTotal;
  membershipRoster.save();
  //Original official goldfinch subgraph code above

  const protocol = getOrCreateProtocol();
  const marketIDs = protocol._marketIDs!;

  const membershipVaultContract = MembershipVault.bind(
    Address.fromString(MEMBERSHIP_VAULT_ADDRESS)
  );
  const toalEligibleAmountResult = membershipVaultContract.try_totalAtEpoch(
    event.params.epoch
  );
  if (toalEligibleAmountResult.reverted) {
    log.error(
      "[handleEpochFinalized]MembershipVaultContract.totalAtEpochcall({}) call reverted tx {}; skip reward emission calculation",
      [event.params.epoch.toString(), event.transaction.hash.toHexString()]
    );
    return;
  }

  const toalEligibleAmount = toalEligibleAmountResult.value;
  for (let i = 0; i < marketIDs.length; i++) {
    const mktID = marketIDs[i];
    const mkt = Market.load(mktID);
    if (!mkt) {
      log.error("[]markt {} does not exist tx {}", [
        mktID,
        event.transaction.hash.toHexString(),
      ]);
      return;
    }

    if (
      !mkt._membershipRewardEligibleAmount ||
      mkt._membershipRewardEligibleAmount!.le(BIGINT_ZERO)
    ) {
      continue;
    }

    const BD_DAYS_PER_EPOCH = BigDecimal.fromString(DAYS_PER_EPOCH.toString());
    let mktGFIRewardAmount = bigDecimalToBigInt(
      event.params.totalRewards
        .times(mkt._membershipRewardEligibleAmount!)
        .div(toalEligibleAmount)
        .divDecimal(BD_DAYS_PER_EPOCH) // normalize to daily emission amount
    );
    const GFIpriceUSD = getGFIPrice(event);
    let mktGFIRewardUSD = GFIpriceUSD
      ? mktGFIRewardAmount.divDecimal(GFI_DECIMALS).times(GFIpriceUSD)
      : BIGDECIMAL_ZERO;
    if (!mkt.rewardTokens || mkt.rewardTokens!.length == 0) {
      const rewardTokenAddress = Address.fromString(GFI_ADDRESS);
      const rewardToken = getOrCreateRewardToken(
        rewardTokenAddress,
        RewardTokenType.DEPOSIT
      );
      mkt.rewardTokens = [rewardToken.id];
    }

    // the reward is on top of backer rewards and staking rewards
    // so we add to them if they already exist
    if (
      mkt.rewardTokenEmissionsAmount &&
      mkt.rewardTokenEmissionsAmount!.length > 0
    ) {
      mktGFIRewardAmount = mktGFIRewardAmount.plus(
        mkt.rewardTokenEmissionsAmount![0]
      );
      mktGFIRewardUSD = mktGFIRewardUSD.plus(mkt.rewardTokenEmissionsUSD![0]);
    }
    mkt.rewardTokenEmissionsAmount = [mktGFIRewardAmount];
    mkt.rewardTokenEmissionsUSD = [mktGFIRewardUSD];

    // init _membershipRewardEligibleAmount for next epoch
    mkt._membershipRewardEligibleAmount = mkt._membershipRewardNextEpochAmount;

    mkt.save();
  }
}
