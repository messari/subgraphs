import { BigInt, log, store } from "@graphprotocol/graph-ts";
import {
  TokenBurned,
  TokenMinted,
  TokenRedeemed,
  Transfer,
  TokenPrincipalWithdrawn,
} from "../../generated/PoolTokens/PoolTokens";
import {
  TranchedPool,
  PoolToken,
  User,
  CallableLoan,
} from "../../generated/schema";
import { getOrInitUser } from "../entities/user";
import { deleteZapAfterClaimMaybe } from "../entities/zapper";
import { removeFromList } from "../common/utils";
import { getOrCreatePoolToken } from "../common/getters";

export function handleTokenBurned(event: TokenBurned): void {
  const token = PoolToken.load(event.params.tokenId.toString());
  if (!token) {
    return;
  }
  store.remove("PoolToken", event.params.tokenId.toString());
}

export function handleTokenMinted(event: TokenMinted): void {
  const marketID = event.params.pool.toHexString();
  const tokenId = event.params.tokenId.toString();
  const _poolToken = getOrCreatePoolToken(tokenId, marketID);
  log.info("[handleTokenMinted]poolToken({}, {})", [
    _poolToken.id,
    _poolToken.market,
  ]);

  //
  const tranchedPool = TranchedPool.load(event.params.pool.toHexString());
  const callableLoan = CallableLoan.load(event.params.pool.toHexString());
  const user = getOrInitUser(event.params.owner);
  if (tranchedPool || callableLoan) {
    const token = new PoolToken(event.params.tokenId.toString());
    token.mintedAt = event.block.timestamp;
    token.user = user.id;
    token.tranche = event.params.tranche;
    token.principalAmount = event.params.amount;
    token.principalRedeemed = BigInt.zero();
    token.principalRedeemable = token.principalAmount;
    token.interestRedeemed = BigInt.zero();
    token.interestRedeemable = BigInt.zero();
    token.rewardsClaimable = BigInt.zero();
    token.rewardsClaimed = BigInt.zero();
    token.stakingRewardsClaimable = BigInt.zero();
    token.stakingRewardsClaimed = BigInt.zero();
    token.isCapitalCalled = false;

    if (tranchedPool) {
      token.loan = tranchedPool.id;
      tranchedPool.tokens = tranchedPool.tokens.concat([token.id]);
      tranchedPool.save();
    } else if (callableLoan) {
      token.loan = callableLoan.id;
      callableLoan.tokens = callableLoan.tokens.concat([token.id]);
      callableLoan.save();
    }
    token.save();
    user.poolTokens = user.poolTokens.concat([token.id]);
    user.save();
  }
}

export function handleTokenRedeemed(event: TokenRedeemed): void {
  const token = PoolToken.load(event.params.tokenId.toString());
  if (!token) {
    return;
  }
  token.interestRedeemable = token.interestRedeemable.minus(
    event.params.interestRedeemed
  );
  token.interestRedeemed = token.interestRedeemed.plus(
    event.params.interestRedeemed
  );
  token.principalRedeemable = token.principalRedeemable.minus(
    event.params.principalRedeemed
  );
  token.principalRedeemed = token.principalRedeemed.plus(
    event.params.principalRedeemed
  );
  token.save();
}

function isUserFullyWithdrawnFromPool(user: User, loanId: string): boolean {
  for (let i = 0; i < user.poolTokens.length; i++) {
    const token = assert(PoolToken.load(user.poolTokens[i]));
    if (token.loan == loanId && !token.principalAmount.isZero()) {
      return false;
    }
  }
  return true;
}

export function handleTokenPrincipalWithdrawn(
  event: TokenPrincipalWithdrawn
): void {
  const token = PoolToken.load(event.params.tokenId.toString());
  if (!token) {
    return;
  }
  token.principalAmount = token.principalAmount.minus(
    event.params.principalWithdrawn
  );
  token.principalRedeemable = token.principalRedeemable.minus(
    event.params.principalWithdrawn
  );
  token.save();
  if (token.principalAmount.isZero()) {
    const tranchedPool = TranchedPool.load(event.params.pool.toHexString());
    const callableLoan = CallableLoan.load(event.params.pool.toHexString());
    const user = assert(User.load(event.params.owner.toHexString()));
    if (tranchedPool && isUserFullyWithdrawnFromPool(user, tranchedPool.id)) {
      tranchedPool.backers = removeFromList(tranchedPool.backers, user.id);
      tranchedPool.numBackers = tranchedPool.backers.length;
      tranchedPool.save();
    } else if (
      callableLoan &&
      isUserFullyWithdrawnFromPool(user, callableLoan.id)
    ) {
      callableLoan.backers = removeFromList(callableLoan.backers, user.id);
      callableLoan.numBackers = callableLoan.backers.length;
      callableLoan.save();
    }
  }
}

export function handleTransfer(event: Transfer): void {
  const tokenId = event.params.tokenId.toString();
  const token = PoolToken.load(tokenId);
  if (!token) {
    return;
  }
  const oldOwner = getOrInitUser(event.params.from);
  const newOwner = getOrInitUser(event.params.to);
  oldOwner.poolTokens = removeFromList(oldOwner.poolTokens, tokenId);
  oldOwner.save();
  newOwner.poolTokens = newOwner.poolTokens.concat([tokenId]);
  newOwner.save();
  token.user = newOwner.id;
  token.save();
  deleteZapAfterClaimMaybe(event);
}
