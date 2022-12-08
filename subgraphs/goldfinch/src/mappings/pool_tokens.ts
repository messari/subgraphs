import { BigInt, log, store } from "@graphprotocol/graph-ts";
import {
  TokenBurned,
  TokenMinted,
  TokenRedeemed,
  Transfer,
  TokenPrincipalWithdrawn,
} from "../../generated/PoolTokens/PoolTokens";
import { TranchedPool, TranchedPoolToken, User } from "../../generated/schema";
import { getOrInitUser } from "../entities/user";
import { deleteZapAfterClaimMaybe } from "../entities/zapper";
import { removeFromList } from "../common/utils";
import { getOrCreatePoolToken } from "../common/getters";

export function handleTokenBurned(event: TokenBurned): void {
  const token = TranchedPoolToken.load(event.params.tokenId.toString());
  if (!token) {
    return;
  }
  store.remove("TranchedPoolToken", event.params.tokenId.toString());
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
  const user = getOrInitUser(event.params.owner);
  if (tranchedPool) {
    const token = new TranchedPoolToken(event.params.tokenId.toString());
    token.mintedAt = event.block.timestamp;
    token.user = user.id;
    token.tranchedPool = tranchedPool.id;
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
    token.save();

    tranchedPool.tokens = tranchedPool.tokens.concat([token.id]);
    tranchedPool.save();

    user.tranchedPoolTokens = user.tranchedPoolTokens.concat([token.id]);
    user.save();
  }
}

export function handleTokenRedeemed(event: TokenRedeemed): void {
  const token = TranchedPoolToken.load(event.params.tokenId.toString());
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

function isUserFullyWithdrawnFromPool(
  user: User,
  tranchedPool: TranchedPool
): boolean {
  for (let i = 0; i < user.tranchedPoolTokens.length; i++) {
    const token = assert(TranchedPoolToken.load(user.tranchedPoolTokens[i]));
    if (
      token.tranchedPool == tranchedPool.id &&
      !token.principalAmount.isZero()
    ) {
      return false;
    }
  }
  return true;
}

export function handleTokenPrincipalWithdrawn(
  event: TokenPrincipalWithdrawn
): void {
  const token = TranchedPoolToken.load(event.params.tokenId.toString());
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
    const tranchedPool = assert(
      TranchedPool.load(event.params.pool.toHexString())
    );
    const user = assert(User.load(event.params.owner.toHexString()));
    if (isUserFullyWithdrawnFromPool(user, tranchedPool)) {
      tranchedPool.backers = removeFromList(tranchedPool.backers, user.id);
      tranchedPool.numBackers = tranchedPool.backers.length;
      tranchedPool.save();
    }
  }
}

export function handleTransfer(event: Transfer): void {
  const tokenId = event.params.tokenId.toString();
  const token = TranchedPoolToken.load(tokenId);
  if (!token) {
    return;
  }
  const oldOwner = getOrInitUser(event.params.from);
  const newOwner = getOrInitUser(event.params.to);
  oldOwner.tranchedPoolTokens = removeFromList(
    oldOwner.tranchedPoolTokens,
    tokenId
  );
  oldOwner.save();
  newOwner.tranchedPoolTokens = newOwner.tranchedPoolTokens.concat([tokenId]);
  newOwner.save();
  token.user = newOwner.id;
  token.save();
  deleteZapAfterClaimMaybe(event);
}
