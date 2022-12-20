import { store, ethereum, log, BigInt, Address } from "@graphprotocol/graph-ts";

import {
  CapitalERC721Deposit,
  CapitalERC721Withdrawal,
} from "../../../generated/CapitalLedger/CapitalLedger";
import {
  VaultedStakedPosition,
  VaultedPoolToken,
  TranchedPoolToken,
  _MembershipCapitalStaked,
  _MembershipDirector,
} from "../../../generated/schema";

import {
  STAKING_REWARDS_ADDRESS,
  POOL_TOKENS_ADDRESS,
  BIGINT_ZERO,
} from "../../common/constants";
import { getOrCreateMarket } from "../../common/getters";
import {
  AdjustedHoldingsLog,
  CapitalERC721DepositLog,
  CapitalERC721WithdrawalLog,
} from "../../common/log";
import { createTransactionFromEvent } from "../../entities/helpers";

export function handleCapitalErc721Deposit(event: CapitalERC721Deposit): void {
  const assetAddress = event.params.assetAddress.toHexString();
  if (assetAddress == STAKING_REWARDS_ADDRESS) {
    const vaultedStakedPosition = new VaultedStakedPosition(
      event.params.positionId.toString()
    );
    vaultedStakedPosition.user = event.params.owner.toHexString();
    vaultedStakedPosition.usdcEquivalent = event.params.usdcEquivalent;
    vaultedStakedPosition.vaultedAt = event.block.timestamp.toI32();
    vaultedStakedPosition.seniorPoolStakedPosition =
      event.params.assetTokenId.toString();
    vaultedStakedPosition.save();

    const transaction = createTransactionFromEvent(
      event,
      "MEMBERSHIP_CAPITAL_DEPOSIT",
      event.params.owner
    );
    transaction.sentNftId = event.params.assetTokenId.toString();
    transaction.sentNftType = "STAKING_TOKEN";
    transaction.save();
  } else if (assetAddress == POOL_TOKENS_ADDRESS) {
    const vaultedPoolToken = new VaultedPoolToken(
      event.params.positionId.toString()
    );
    vaultedPoolToken.user = event.params.owner.toHexString();
    vaultedPoolToken.usdcEquivalent = event.params.usdcEquivalent;
    vaultedPoolToken.vaultedAt = event.block.timestamp.toI32();
    vaultedPoolToken.poolToken = event.params.assetTokenId.toString();
    const poolToken = assert(
      TranchedPoolToken.load(event.params.assetTokenId.toString())
    );
    vaultedPoolToken.tranchedPool = poolToken.tranchedPool;
    vaultedPoolToken.save();

    const transaction = createTransactionFromEvent(
      event,
      "MEMBERSHIP_CAPITAL_DEPOSIT",
      event.params.owner
    );
    transaction.sentNftId = event.params.assetTokenId.toString();
    transaction.sentNftType = "POOL_TOKEN";
    transaction.save();
  }
  //Original official goldfinch subgraph code above

  const logs = event.receipt!.logs;
  if (!logs) {
    log.warning(
      "[handleCapitalErc721Deposit]no logs for tx {}, skip reward emissions calculation",
      [event.transaction.hash.toHexString()]
    );
    return;
  }

  _handleERC721DepositWithdrawal(event.params.owner, logs, event);
}

export function handleCapitalErc721Withdrawal(
  event: CapitalERC721Withdrawal
): void {
  const id = event.params.positionId.toString();
  const vaultedStakedPosition = VaultedStakedPosition.load(id);
  const vaultedPoolToken = VaultedPoolToken.load(id);
  if (vaultedStakedPosition != null) {
    const transaction = createTransactionFromEvent(
      event,
      "MEMBERSHIP_CAPITAL_WITHDRAWAL",
      event.params.owner
    );
    transaction.receivedNftId = vaultedStakedPosition.seniorPoolStakedPosition;
    transaction.receivedNftType = "STAKING_TOKEN";
    transaction.save();
    store.remove("VaultedStakedPosition", id);
  } else if (vaultedPoolToken != null) {
    const transaction = createTransactionFromEvent(
      event,
      "MEMBERSHIP_CAPITAL_WITHDRAWAL",
      event.params.owner
    );
    transaction.receivedNftId = vaultedPoolToken.poolToken;
    transaction.receivedNftType = "POOL_TOKEN";
    transaction.save();
    store.remove("VaultedPoolToken", id);
  }
  //Original official goldfinch subgraph code above

  const logs = event.receipt!.logs;
  if (!logs) {
    log.warning(
      "[handleCapitalErc721Withdrawal]no logs for tx {}, skip reward emissions calculation",
      [event.transaction.hash.toHexString()]
    );
    return;
  }

  _handleERC721DepositWithdrawal(event.params.owner, logs, event);
}

function _handleERC721DepositWithdrawal(
  owner: Address,
  logs: ethereum.Log[],
  event: ethereum.Event
): void {
  const ownerAddress = owner.toHexString();
  let membership = _MembershipDirector.load(ownerAddress);
  if (!membership) {
    membership = new _MembershipDirector(ownerAddress);
    membership.eligibleAmount = BIGINT_ZERO;
    membership.nextEpochAmount = BIGINT_ZERO;
    membership.totalCapitalStaked = BIGINT_ZERO;
    membership.save();
  }

  const touchedMarketIDs: string[] = [];
  let eligibleAmount = BIGINT_ZERO;
  let nextEpochAmount = BIGINT_ZERO;
  let deltaTotalCapitalStaked = BIGINT_ZERO;
  for (let i = 0; i < logs.length; i++) {
    const currLog = logs.at(i);
    const deposit = CapitalERC721DepositLog.parse(currLog);
    if (deposit && deposit.owner.equals(owner)) {
      deposit.handleDeposit(currLog);
      // marketId is set if handleDeposit() is successful
      if (deposit.marketId) {
        deltaTotalCapitalStaked = deltaTotalCapitalStaked.plus(
          deposit.usdcEquivalent
        );
        if (touchedMarketIDs.indexOf(deposit.marketId) < 0) {
          touchedMarketIDs.push(deposit.marketId);
        }
      }
    }

    const withdraw = CapitalERC721WithdrawalLog.parse(currLog);
    if (withdraw && withdraw.owner.equals(owner)) {
      withdraw.handleWithdraw(currLog);
      // marketId is set if handleWithdraw() is successful
      if (withdraw.marketId) {
        deltaTotalCapitalStaked = deltaTotalCapitalStaked.minus(
          withdraw.usdcEquivalent
        );
        if (touchedMarketIDs.indexOf(withdraw.marketId) < 0) {
          touchedMarketIDs.push(withdraw.marketId);
        }
      }
    }

    const holdings = AdjustedHoldingsLog.parse(currLog);
    if (holdings && holdings.owner.equals(owner)) {
      eligibleAmount = eligibleAmount.plus(holdings.eligibleAmount);
      nextEpochAmount = nextEpochAmount.plus(holdings.nextEpochAmount);
    }
  }

  const deltaEligibleAmount = eligibleAmount.minus(membership.eligibleAmount);
  const deltaNextEpochAmount = nextEpochAmount.minus(
    membership.nextEpochAmount
  );

  if (deltaTotalCapitalStaked.le(BIGINT_ZERO)) {
    log.error("deltaTotalCapitalStaked={} <=0", [
      deltaTotalCapitalStaked.toString(),
    ]);
    return;
  }

  membership.eligibleAmount = eligibleAmount;
  membership.nextEpochAmount = nextEpochAmount;
  membership.save();

  allocateAmountToMarket(
    touchedMarketIDs,
    deltaEligibleAmount,
    deltaNextEpochAmount,
    deltaTotalCapitalStaked,
    event
  );
}

function allocateAmountToMarket(
  marketIDs: string[],
  deltaEligibleAmount: BigInt,
  deltaNextEpochAmount: BigInt,
  deltaTotalCapitalStaked: BigInt,
  event: ethereum.Event
): void {
  const txHash = event.transaction.hash.toHexString();
  for (let i = 0; i < marketIDs.length; i++) {
    const mktID = marketIDs[i];
    const stkID = `${txHash}-${mktID}`;
    const stkEntity = _MembershipCapitalStaked.load(stkID);
    if (!stkEntity) {
      log.error("_MembershipCapitalStaked {} does not exist tx {}", [
        stkID,
        txHash,
      ]);
      continue;
    }
    const mktDeltaEligibleAmount = deltaEligibleAmount
      .times(stkEntity.CapitalStakedAmount)
      .div(deltaTotalCapitalStaked);
    const mktDeltaNextEpochAmount = deltaNextEpochAmount
      .times(stkEntity.CapitalStakedAmount)
      .div(deltaTotalCapitalStaked);

    const mkt = getOrCreateMarket(mktID, event);
    mkt._membershipRewardEligibleAmount =
      mkt._membershipRewardEligibleAmount!.plus(mktDeltaEligibleAmount);
    mkt._membershipRewardNextEpochAmount =
      mkt._membershipRewardNextEpochAmount!.plus(mktDeltaNextEpochAmount);
    mkt.save();
  }
}
