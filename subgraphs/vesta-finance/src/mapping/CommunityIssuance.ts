import { ethereum, Address, log, BigDecimal } from "@graphprotocol/graph-ts";
import {
  TotalVSTAIssuedUpdated,
  CommunityIssuance,
} from "../../generated/CommunityIssuance/CommunityIssuance";
import {
  getOrCreateMarket,
  getOrCreateMarketHourlySnapshot,
  getOrCreateMarketSnapshot,
} from "../entities/market";
import {
  BALANCER_POOL_CREATED_BLOCK,
  BAL_VSTA_WETH_POOL_ADDRESS,
  BAL_WETH_WBTC_USDC_POOL_ADDRESS,
  BIGDECIMAL_ZERO,
  MINUTES_PER_DAY,
  RewardTokenType,
  USDC_ADDRESS,
  VSTA_ADDRESS,
  WETH_ADDRESS,
} from "../utils/constants";
import { RewardToken } from "../../generated/schema";
import { WeightedPool as WeightedPoolContract } from "../../generated/CommunityIssuance/WeightedPool";
import { Vault as VaultContract } from "../../generated/CommunityIssuance/Vault";
import { getOrCreateAssetToken } from "../entities/token";
import { exponentToBigDecimal } from "../utils/numbers";

/*
 * Update reward emssion
 *
 * @param event TotalVSTAIssuedUpdated event
 *
 */
export function handleTotalVSTAIssuedUpdated(
  event: TotalVSTAIssuedUpdated
): void {
  calculateDailyVestaRewards(event, event.params.stabilityPool);
}

function calculateDailyVestaRewards(
  event: ethereum.Event,
  pool: Address
): void {
  const market = getOrCreateMarket(pool);
  const contract = CommunityIssuance.bind(event.address);
  const stabilityPoolRewardsResult = contract.try_stabilityPoolRewards(pool);
  if (stabilityPoolRewardsResult.reverted) {
    log.error(
      "[calculateDailyVestaRewards]CommunityIssuance.stabilityPoolRewards() reverted for tx {}",
      [event.transaction.hash.toHexString()]
    );
    return;
  }
  const VSTAToken = getOrCreateAssetToken(Address.fromString(VSTA_ADDRESS));
  const rewardTokens = market.rewardTokens;
  if (!rewardTokens || rewardTokens.length == 0) {
    let rewardToken = RewardToken.load(VSTA_ADDRESS);
    if (!rewardToken) {
      rewardToken = new RewardToken(VSTA_ADDRESS);
      rewardToken.token = VSTAToken.id;
      rewardToken.type = RewardTokenType.DEPOSIT;
      rewardToken.save();
    }
    market.rewardTokens = [rewardToken.id];
  }

  const rewardTokenEmissionAmount = stabilityPoolRewardsResult.value
    .getRewardDistributionPerMin()
    .times(MINUTES_PER_DAY);
  const VSTAPriceUSD = getVSTATokenPrice(event);
  let rewardTokenEmissionsUSD = BIGDECIMAL_ZERO;
  if (VSTAPriceUSD) {
    rewardTokenEmissionsUSD = rewardTokenEmissionAmount
      .divDecimal(exponentToBigDecimal(VSTAToken.decimals))
      .times(VSTAPriceUSD);
    VSTAToken.lastPriceUSD = VSTAPriceUSD;
    VSTAToken.lastPriceBlockNumber = event.block.number;
    VSTAToken.save();
  }
  market.rewardTokenEmissionsAmount = [rewardTokenEmissionAmount];
  market.rewardTokenEmissionsUSD = [rewardTokenEmissionsUSD];
  market.save();

  getOrCreateMarketSnapshot(event, market);
  getOrCreateMarketHourlySnapshot(event, market);
}

function getVSTATokenPrice(event: ethereum.Event): BigDecimal | null {
  if (event.block.number.lt(BALANCER_POOL_CREATED_BLOCK)) {
    return null;
  }
  const VSTAPriceInWETH = getToken0PriceInToken1(
    BAL_VSTA_WETH_POOL_ADDRESS,
    VSTA_ADDRESS,
    WETH_ADDRESS
  );

  const WETHPriceInUSD = getToken0PriceInToken1(
    BAL_WETH_WBTC_USDC_POOL_ADDRESS,
    WETH_ADDRESS,
    USDC_ADDRESS
  );

  if (!VSTAPriceInWETH || !WETHPriceInUSD) {
    return null;
  }
  const VSTAPriceInUSD = VSTAPriceInWETH.times(WETHPriceInUSD);
  log.info("[getVSTATokenPrice]VSTA Price USD={} at timestamp {}", [
    VSTAPriceInUSD.toString(),
    event.block.timestamp.toString(),
  ]);

  return VSTAPriceInUSD;
}

function getToken0PriceInToken1(
  poolAddress: string,
  token0: string,
  token1: string
): BigDecimal | null {
  const poolContract = WeightedPoolContract.bind(
    Address.fromString(poolAddress)
  );
  const vaultAddressResult = poolContract.try_getVault();
  if (vaultAddressResult.reverted) {
    return null;
  }
  const vaultContract = VaultContract.bind(vaultAddressResult.value);

  const weightsResult = poolContract.try_getNormalizedWeights();
  if (weightsResult.reverted) {
    return null;
  }
  const poolIDResult = poolContract.try_getPoolId();
  if (poolIDResult.reverted) {
    return null;
  }
  const poolTokensResult = vaultContract.try_getPoolTokens(poolIDResult.value);
  if (poolTokensResult.reverted) {
    return null;
  }
  const poolTokenAddrs = poolTokensResult.value.getTokens();
  const poolTokenBalances = poolTokensResult.value.getBalances();
  const token0Idx = poolTokenAddrs.indexOf(Address.fromString(token0));
  const token1Idx = poolTokenAddrs.indexOf(Address.fromString(token1));
  if (token0Idx < 0 || token1Idx < 0) {
    // token0 or token1 not found in poolTokenAddrs, should not happen
    log.error(
      "[getToken0PriceInToken1]token {} or token {} not found in poolTokens [{}]",
      [token0, token1, poolTokenAddrs.toString()]
    );
    return null;
  }
  const token0PriceInToken1 = poolTokenBalances[token1Idx]
    .times(weightsResult.value[token0Idx])
    .divDecimal(
      poolTokenBalances[token0Idx]
        .times(weightsResult.value[token1Idx])
        .toBigDecimal()
    );
  return token0PriceInToken1;
}
