import { Address, Bytes, BigInt, BigDecimal } from '@graphprotocol/graph-ts';
import { Pool, TokenPrice, Balancer, PoolHistoricalLiquidity, LatestPrice } from '../../generated/schema';
import { ZERO_BD, PRICING_ASSETS, USD_STABLE_ASSETS, ONE_BD, WETH, ZERO_ADDRESS } from './helpers/constants';
import { hasVirtualSupply, PoolType } from './helpers/pools';
import { createPoolSnapshot, getBalancerSnapshot, getToken, loadPoolToken } from './helpers/misc';

export function isPricingAsset(asset: Address): boolean {
  for (let i: i32 = 0; i < PRICING_ASSETS.length; i++) {
    if (PRICING_ASSETS[i] == asset) return true;
  }
  return false;
}

export function getPreferentialPricingAsset(assets: Address[]): Address {
  // Assumes PRICING_ASSETS are sorted by order of preference
  for (let i: i32 = 0; i < PRICING_ASSETS.length; i++) {
    if (assets.includes(PRICING_ASSETS[i])) return PRICING_ASSETS[i];
  }
  return ZERO_ADDRESS;
}

export function updatePoolLiquidity(poolId: string, block: BigInt, pricingAsset: Address, timestamp: i32): boolean {
  let pool = Pool.load(poolId);
  if (pool == null) return false;

  let tokensList: Bytes[] = pool.tokensList;
  if (tokensList.length < 2) return false;
  if (hasVirtualSupply(pool) && pool.address == pricingAsset) return false;

  let poolValue: BigDecimal = ZERO_BD;

  for (let j: i32 = 0; j < tokensList.length; j++) {
    let tokenAddress: Address = Address.fromString(tokensList[j].toHexString());

    let poolToken = loadPoolToken(poolId, tokenAddress);
    if (poolToken == null) continue;

    if (tokenAddress == pricingAsset) {
      poolValue = poolValue.plus(poolToken.balance);
      continue;
    }
    let poolTokenQuantity: BigDecimal = poolToken.balance;

    let price: BigDecimal = ZERO_BD;
    let latestPriceId = getLatestPriceId(tokenAddress, pricingAsset);
    let latestPrice = LatestPrice.load(latestPriceId);

    // note that we can only meaningfully report liquidity once assets are traded with
    // the pricing asset
    if (latestPrice) {
      // value in terms of priceableAsset
      price = latestPrice.price;
    } else if (pool.poolType == PoolType.StablePhantom) {
      // try to estimate token price in terms of pricing asset
      let pricingAssetInUSD = valueInUSD(ONE_BD, pricingAsset);
      let currentTokenInUSD = valueInUSD(ONE_BD, tokenAddress);

      if (pricingAssetInUSD.equals(ZERO_BD) || currentTokenInUSD.equals(ZERO_BD)) {
        continue;
      }

      price = currentTokenInUSD.div(pricingAssetInUSD);
    }

    // Exclude virtual supply from pool value
    if (hasVirtualSupply(pool) && pool.address == tokenAddress) {
      continue;
    }

    if (price.gt(ZERO_BD)) {
      let poolTokenValue = price.times(poolTokenQuantity);
      poolValue = poolValue.plus(poolTokenValue);
    }
  }

  let oldPoolLiquidity: BigDecimal = pool.totalLiquidity;
  let newPoolLiquidity: BigDecimal = valueInUSD(poolValue, pricingAsset) || ZERO_BD;
  let liquidityChange: BigDecimal = newPoolLiquidity.minus(oldPoolLiquidity);

  // If the pool isn't empty but we have a zero USD value then it's likely that we have a bad pricing asset
  // Don't commit any changes and just report the failure.
  if (poolValue.gt(ZERO_BD) != newPoolLiquidity.gt(ZERO_BD)) {
    return false;
  }

  // Take snapshot of pool state
  let phlId = getPoolHistoricalLiquidityId(poolId, pricingAsset, block);
  let phl = new PoolHistoricalLiquidity(phlId);
  phl.poolId = poolId;
  phl.pricingAsset = pricingAsset;
  phl.block = block;
  phl.poolTotalShares = pool.totalShares;
  phl.poolLiquidity = poolValue;
  phl.poolShareValue = pool.totalShares.gt(ZERO_BD) ? poolValue.div(pool.totalShares) : ZERO_BD;
  phl.save();

  // Update pool stats
  pool.totalLiquidity = newPoolLiquidity;
  pool.save();

  // Create or update pool daily snapshot
  createPoolSnapshot(pool, timestamp);

  // Update global stats
  let vault = Balancer.load('2') as Balancer;
  vault.totalLiquidity = vault.totalLiquidity.plus(liquidityChange);
  vault.save();

  let vaultSnapshot = getBalancerSnapshot(vault.id, timestamp);
  vaultSnapshot.totalLiquidity = vault.totalLiquidity;
  vaultSnapshot.save();

  return true;
}

export function valueInETH(value: BigDecimal, pricingAsset: Address): BigDecimal {
  let ethValue = ZERO_BD;

  let pricingAssetInETH = LatestPrice.load(getLatestPriceId(pricingAsset, WETH));

  if (pricingAssetInETH != null) {
    ethValue = value.times(pricingAssetInETH.price);
  }

  return ethValue;
}

export function valueInUSD(value: BigDecimal, pricingAsset: Address): BigDecimal {
  let usdValue = ZERO_BD;

  if (isUSDStable(pricingAsset)) {
    usdValue = value;
  } else {
    // convert to USD
    for (let i: i32 = 0; i < USD_STABLE_ASSETS.length; i++) {
      let pricingAssetInUSD = LatestPrice.load(getLatestPriceId(pricingAsset, USD_STABLE_ASSETS[i]));
      if (pricingAssetInUSD != null) {
        usdValue = value.times(pricingAssetInUSD.price);
        break;
      }
    }
  }

  // if there's no price in USD
  if (usdValue.equals(ZERO_BD)) {
    // try to convert it first to ETH
    const ethValue = valueInETH(value, pricingAsset);

    if (ethValue.gt(ZERO_BD)) {
      // then convert value in ETH to USD
      usdValue = valueInUSD(ethValue, WETH);
    }
  }

  return usdValue;
}

export function swapValueInUSD(
  tokenInAddress: Address,
  tokenAmountIn: BigDecimal,
  tokenOutAddress: Address,
  tokenAmountOut: BigDecimal
): BigDecimal {
  let swapValueUSD = ZERO_BD;

  if (isUSDStable(tokenOutAddress)) {
    swapValueUSD = valueInUSD(tokenAmountOut, tokenOutAddress);
  } else if (isUSDStable(tokenInAddress)) {
    swapValueUSD = valueInUSD(tokenAmountIn, tokenInAddress);
  } else {
    let tokenInSwapValueUSD = valueInUSD(tokenAmountIn, tokenInAddress);
    let tokenOutSwapValueUSD = valueInUSD(tokenAmountOut, tokenOutAddress);
    let divisor =
      tokenInSwapValueUSD.gt(ZERO_BD) && tokenOutSwapValueUSD.gt(ZERO_BD) ? BigDecimal.fromString('2') : ONE_BD;
    swapValueUSD = tokenInSwapValueUSD.plus(tokenOutSwapValueUSD).div(divisor);
  }

  return swapValueUSD;
}

export function getLatestPriceId(tokenAddress: Address, pricingAsset: Address): string {
  return tokenAddress.toHexString().concat('-').concat(pricingAsset.toHexString());
}

export function updateLatestPrice(tokenPrice: TokenPrice): void {
  let tokenAddress = Address.fromString(tokenPrice.asset.toHexString());
  let pricingAsset = Address.fromString(tokenPrice.pricingAsset.toHexString());

  let latestPriceId = getLatestPriceId(tokenAddress, pricingAsset);
  let latestPrice = LatestPrice.load(latestPriceId);

  if (latestPrice == null) {
    latestPrice = new LatestPrice(latestPriceId);
    latestPrice.asset = tokenPrice.asset;
    latestPrice.pricingAsset = tokenPrice.pricingAsset;
  }

  latestPrice.block = tokenPrice.block;
  latestPrice.poolId = tokenPrice.poolId;
  latestPrice.price = tokenPrice.price;
  latestPrice.save();

  let token = getToken(tokenAddress);
  token.latestPrice = latestPrice.id;
  token.save();
}

function getPoolHistoricalLiquidityId(poolId: string, tokenAddress: Address, block: BigInt): string {
  return poolId.concat('-').concat(tokenAddress.toHexString()).concat('-').concat(block.toString());
}

export function isUSDStable(asset: Address): boolean {
  for (let i: i32 = 0; i < USD_STABLE_ASSETS.length; i++) {
    if (USD_STABLE_ASSETS[i] == asset) return true;
  }
  return false;
}
