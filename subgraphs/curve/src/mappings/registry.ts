import { Address, dataSource, ethereum, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts"
import { MainRegistry, PoolAdded } from "../../generated/MainRegistry/MainRegistry"
import { LiquidityPool, LiquidityPoolFee } from "../../generated/schema"
import { StableSwap } from "../../generated/templates/Pool/StableSwap"
import { getOrCreateDexAmm, getOrCreateToken } from "../common/getters"
import { ERC20 } from "../../generated/MainRegistry/ERC20"
import { bigIntToBigDecimal, divBigDecimal } from "../common/utils/numbers"
import { BIGDECIMAL_HUNDRED, BIGINT_CRV_LP_TOKEN_DECIMALS, DEFAULT_DECIMALS, LiquidityPoolFeeType } from "../common/constants"
import { BIGDECIMAL_ZERO, BIGINT_TEN } from "../prices/common/constants"
import { getUsdPrice, getUsdPricePerToken } from "../prices"
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
    let liquidityPool = LiquidityPool.load(address.toHexString())
    log.debug("tx = {}", [event.transaction.hash.toHexString()])
    if (liquidityPool == null) {
      liquidityPool = new LiquidityPool(address.toHexString());
      let registryContract = MainRegistry.bind(registryAddress)
      let coinCount = registryContract.get_n_coins(address) // coinCount[0] = coins, coinCount[1] = underlying_coins
      let coins = registryContract.get_coins(address);
      let coinBalances = registryContract.get_balances(address);
      //let stableSwapContract = StableSwap.bind(address);
      let lpToken = getOrCreateToken(registryContract.get_lp_token(address));
      
      //let assetType = registryContract.get_pool_asset_type(address);
      //liquidityPool.assetType = assetType;
      liquidityPool.protocol = getOrCreateDexAmm().id;

      let poolNameCall = registryContract.try_get_pool_name(address);
      if (!poolNameCall.reverted){
        liquidityPool.name = poolNameCall.value;
      } else {
        liquidityPool.name = lpToken.name;
      }
      liquidityPool.symbol = lpToken.symbol;

      let inputTokens = liquidityPool.inputTokens;
      let inputTokensBalances = liquidityPool.inputTokenBalances;
      let inputTokensBalancesDecimalized = new Array as BigDecimal[];
      liquidityPool.totalValueLockedUSD = BIGDECIMAL_ZERO;
      let sum = BIGDECIMAL_ZERO;
      for (let i = 0; i < coinCount[0].toI32(); ++i) {
        let tokenAddress = coins![i]
        let coinBalance = coinBalances![i]
        if (tokenAddress && coinBalance){
          let token = getOrCreateToken(tokenAddress)
          inputTokens.push(token.id)
          inputTokensBalances.push(coinBalance)
          inputTokensBalancesDecimalized.push(bigIntToBigDecimal(coinBalance, token.decimals))
          sum = sum.plus(bigIntToBigDecimal(coinBalance, token.decimals))
          let tokenPriceUSDCall = getUsdPricePerToken(tokenAddress);
          if (!tokenPriceUSDCall.reverted) {
            let tokenPriceUSD = tokenPriceUSDCall.usdPrice;
            token.lastPriceUSD = tokenPriceUSD.div(BIGINT_TEN.pow(BigInt.fromI32(6).toI32() as u8).toBigDecimal());
            liquidityPool.totalValueLockedUSD = liquidityPool.totalValueLockedUSD.plus(tokenPriceUSD.times(bigIntToBigDecimal(coinBalance,token.decimals)));
            log.debug("tokenPriceUSD = {}, coinBalance = {}, totalValueLockedUSD = {}", [tokenPriceUSD.toString(), coinBalance.toString(), liquidityPool.totalValueLockedUSD.toString()])
            token.save();
          }
        }
      }
      let inputTokenWeights = liquidityPool.inputTokenWeights
      for (let i = 0; i < inputTokensBalancesDecimalized.length; ++i) {
        let tokenWeight = divBigDecimal(BIGDECIMAL_HUNDRED.times(inputTokensBalancesDecimalized[i]),sum)
        inputTokenWeights.push(tokenWeight)
      }
      liquidityPool.inputTokenWeights = inputTokenWeights;
      liquidityPool.inputTokens = inputTokens;
      liquidityPool.inputTokenBalances = inputTokensBalances;
      
      liquidityPool.outputToken = lpToken.id;
      let lpTokenPrice =  getUsdPrice(Address.fromString(lpToken.id),BIGINT_CRV_LP_TOKEN_DECIMALS);
      liquidityPool.outputTokenSupply = ERC20.bind(Address.fromString(lpToken.id)).totalSupply();
      liquidityPool.outputTokenPriceUSD = lpTokenPrice
    
      // handle fees
      let fees = registryContract.get_fees(address);
      let totalFee = bigIntToBigDecimal(fees[0],8);
      let adminFee = bigIntToBigDecimal(fees[1],8);

      let tradingFee = new LiquidityPoolFee(LiquidityPoolFeeType.FIXED_TRADING_FEE + "-" + address.toHexString());
      tradingFee.feePercentage = totalFee
      tradingFee.feeType = LiquidityPoolFeeType.FIXED_TRADING_FEE
      tradingFee.save();

      let protocolFee = new LiquidityPoolFee(LiquidityPoolFeeType.FIXED_PROTOCOL_FEE + "-" + address.toHexString());
      protocolFee.feePercentage = adminFee.times(totalFee)
      protocolFee.feeType = LiquidityPoolFeeType.FIXED_PROTOCOL_FEE
      protocolFee.save();

      let lpFee = new LiquidityPoolFee(LiquidityPoolFeeType.FIXED_LP_FEE + "-" + address.toHexString());
      lpFee.feePercentage = totalFee.minus(adminFee.times(totalFee))
      lpFee.feeType = LiquidityPoolFeeType.FIXED_PROTOCOL_FEE
      lpFee.save();

      liquidityPool.fees = [tradingFee.id, protocolFee.id, lpFee.id]

      liquidityPool.createdBlockNumber = event.block.number;
      liquidityPool.createdTimestamp = event.block.timestamp;

      liquidityPool.totalValueLockedUSD = BIGDECIMAL_ZERO;
      liquidityPool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
      lpToken.save()
      liquidityPool.save()
    }
    return liquidityPool
  }

export function handlePoolAdded(event: PoolAdded): void {
  let registryAddress = dataSource.address();
  getOrCreatePool(event.params.pool, registryAddress, event)
}