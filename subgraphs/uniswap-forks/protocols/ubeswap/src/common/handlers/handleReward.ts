import {
  BigInt,
  ethereum,
  Address,
} from "@graphprotocol/graph-ts";
import { LiquidityPool, Token, _HelperStore } from "../../../../../generated/schema";
import { UniswapV2Pair } from "../../../../../generated/templates/StakingRewards/UniswapV2Pair";
import {
  INT_ZERO,
  DEFAULT_DECIMALS,
  BIGINT_ZERO,
  BIGDECIMAL_ZERO
} from "../../../../../src/common/constants";
import { getOrCreateToken } from "../../../../../src/common/getters";
import {
  findNativeTokenPerToken,
  updateNativeTokenPriceInUSD,
} from "../../../../../src/price/price";
import { convertTokenToDecimal } from "../../../../../src/common/utils/utils";

export function handleStakedImpl(
  event: ethereum.Event,
  amount: BigInt
): void {
  // Return if pool does not exist
  let pool = LiquidityPool.load(event.address.toHexString());
  if (!pool) {
    return;
  }
  let stakeToken = getOrCreatePair(pool.inputTokens[0]);
  pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.plus(amount);
  let nativeToken = updateNativeTokenPriceInUSD();
  stakeToken.lastPriceUSD = findNativeTokenPerToken(stakeToken, nativeToken);
  if (stakeToken.lastPriceUSD) {
    pool.totalValueLockedUSD = convertTokenToDecimal(pool.stakedOutputTokenAmount!, stakeToken.decimals).times(stakeToken.lastPriceUSD!);
  }

  pool.save();
}

export function handleWithdrawnImpl(
  event: ethereum.Event,
  amount: BigInt
): void {
  //Return if pool does not exist
  let pool = LiquidityPool.load(event.address.toHexString());
  if (!pool) {
    return;
  }
  let stakeToken = getOrCreatePair(pool.inputTokens[0]);
  pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.minus(amount);
  let nativeToken = updateNativeTokenPriceInUSD();
  stakeToken.lastPriceUSD = findNativeTokenPerToken(stakeToken, nativeToken);
  if (stakeToken.lastPriceUSD) {
    pool.totalValueLockedUSD = convertTokenToDecimal(pool.stakedOutputTokenAmount!, stakeToken.decimals).times(stakeToken.lastPriceUSD!);
  }
  pool.save();
}

export function handleRewardPaidImpl(
  event: ethereum.Event,
  amount: BigInt
): void {
  // Return if pool does not exist
  let pool = LiquidityPool.load(event.address.toHexString());
  if (!pool) {
    return;
  }
  let nativeToken = updateNativeTokenPriceInUSD();
  let rewardToken = getOrCreateToken(pool.rewardTokens![INT_ZERO]);
  rewardToken.lastPriceUSD = findNativeTokenPerToken(rewardToken, nativeToken);
  pool.rewardTokenEmissionsAmount![0] = pool.rewardTokenEmissionsAmount![0].plus(amount);
  pool.rewardTokenEmissionsUSD![0] = convertTokenToDecimal(pool.rewardTokenEmissionsAmount![0], rewardToken.decimals).times(rewardToken.lastPriceUSD!);
  nativeToken.save();
  rewardToken.save();
  pool.save();
}

export function getOrCreatePair(address: string): Token {
  let token = Token.load(address);
  if (!token) {
    token = new Token(address);
    let erc20Contract = UniswapV2Pair.bind(Address.fromString(address));
    let decimals = erc20Contract.try_decimals();
    // Using try_cause some values might be missing
    let name = erc20Contract.try_name();
    let symbol = erc20Contract.try_symbol();
    // TODO: add overrides for name and symbol
    token.decimals = decimals.reverted ? DEFAULT_DECIMALS : decimals.value;
    token.name = name.reverted ? "Ubeswap LP Token" : name.value;
    token.symbol = symbol.reverted ? "ULP" : symbol.value;
    token.lastPriceUSD = BIGDECIMAL_ZERO;
    token.lastPriceBlockNumber = BIGINT_ZERO;
    token.save();
  }
  return token as Token;
}
