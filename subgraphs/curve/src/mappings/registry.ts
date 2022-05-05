import { Address, dataSource, ethereum, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { MainRegistry, PoolAdded } from "../../generated/MainRegistry/MainRegistry";
import { LiquidityPool, LiquidityPoolFee } from "../../generated/schema";
import { StableSwap } from "../../generated/templates/Pool/StableSwap";
import { getOrCreateDexAmm, getOrCreateToken } from "../common/getters";
import { ERC20 } from "../../generated/MainRegistry/ERC20";
import { bigIntToBigDecimal, divBigDecimal } from "../common/utils/numbers";
import {
  ASSET_TYPES,
  BIGDECIMAL_HUNDRED,
  BIGINT_CRV_LP_TOKEN_DECIMALS,
  BIGINT_ZERO,
  DEFAULT_DECIMALS,
  LiquidityPoolFeeType,
  POOL_LP_TOKEN_MAP,
} from "../common/constants";
import { BIGDECIMAL_ZERO, BIGINT_TEN } from "../prices/common/constants";
//import { getTokenPriceForAssetType } from "../prices";
//import { getLpTokenPriceUSD } from "../prices/curve/lppricing";
import { setPoolAssetType, setPoolBalances, setPoolCoins, setPoolFees, setPoolLPToken, setPoolName, setPoolTokenWeights, setTokenPrices } from "../common/setters";

/*
import { AddressProvider } from "../../generated/AddressProvider/AddressProvider"
import * as constants from "../prices/common/constants"


export function getCurveRegistryAddress(network:string): Address {
  const addressProvider = AddressProvider.bind(
    constants.CURVE_ADDRESS_PROVIDER_MAP.get(network)!
  );
  return addressProvider.get_registry()
}
*/


export function getOrCreatePool(address: Address, registryAddress: Address, event: ethereum.Event): LiquidityPool {
  let liquidityPool = LiquidityPool.load(address.toHexString());
  log.debug("tx = {}", [event.transaction.hash.toHexString()]);
  if (!liquidityPool) {
    liquidityPool = new LiquidityPool(address.toHexString());
    liquidityPool.protocol = getOrCreateDexAmm().id;
    setPoolCoins(liquidityPool); // saves coins to liquidity input tokens list
    setPoolBalances(liquidityPool); // set input token balances
    setPoolLPToken(liquidityPool, registryAddress); // saves lpToken to liquidity output token
    setPoolTokenWeights(liquidityPool);
    setPoolName(liquidityPool, registryAddress);
    setPoolAssetType(liquidityPool, registryAddress);
    setTokenPrices(liquidityPool,event);
    /*for (let i = 0; i < coinCount[0].toI32(); ++i) {
      let tokenAddress = coins![i];
      let coinBalance = coinBalances![i];
      if (tokenAddress && coinBalance) {
        let token = getOrCreateToken(tokenAddress);
        inputTokens.push(token.id);
        inputTokensBalances.push(coinBalance);
        inputTokensBalancesDecimalized.push(bigIntToBigDecimal(coinBalance, token.decimals));
        sum = sum.plus(bigIntToBigDecimal(coinBalance, token.decimals));
        
        let tokenPriceUSD = getTokenPriceForAssetType(
          Address.fromString(token.id),
          liquidityPool,
          dataSource.network(),
        );
        token.lastPriceUSD = tokenPriceUSD.div(BIGINT_TEN.pow(BigInt.fromI32(6).toI32() as u8).toBigDecimal());
        liquidityPool.totalValueLockedUSD = liquidityPool.totalValueLockedUSD.plus(
          tokenPriceUSD.times(bigIntToBigDecimal(coinBalance, token.decimals)),
        );
        log.debug("tokenPriceUSD = {}, coinBalance = {}, totalValueLockedUSD = {}", [
          tokenPriceUSD.toString(),
          coinBalance.toString(),
          liquidityPool.totalValueLockedUSD.toString(),
        ]);
        token.save();
        
      }
    }*/

    //liquidityPool.outputTokenPriceUSD = lpTokenPrice;

    // handle fees
    log.warning("set fees call at {}",[event.transaction.hash.toHexString()]);
    setPoolFees(liquidityPool, registryAddress, event);

    liquidityPool.rewardTokens = [];
    liquidityPool.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    liquidityPool.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];
    liquidityPool.stakedOutputTokenAmount = BIGINT_ZERO;
    
    liquidityPool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    liquidityPool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    liquidityPool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    liquidityPool.createdBlockNumber = event.block.number;
    liquidityPool.createdTimestamp = event.block.timestamp;
    liquidityPool.save();
  }
  return liquidityPool;
}

export function handlePoolAdded(event: PoolAdded): void {
  let registryAddress = event.address;
  getOrCreatePool(event.params.pool, registryAddress, event);
}
