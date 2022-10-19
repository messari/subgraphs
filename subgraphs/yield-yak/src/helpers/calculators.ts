import { Address, BigInt, BigDecimal, bigInt, log, bigDecimal } from '@graphprotocol/graph-ts'
import { DEFUALT_AMOUNT, USDC_ADDRESS, WAVAX_CONTRACT_ADDRESS, YAK_ROUTER_ADDRESS, ZERO_ADDRESS, ZERO_BIGDECIMAL } from '../utils/constants';
import { YakRouter } from '../../generated/YakRouter/YakRouter';
import { convertBINumToDesiredDecimals } from './converters';
import { YakStrategyV2 } from '../../generated/YakStrategyV2/YakStrategyV2';
import { defineVault } from '../utils/initial';

export function calculatePriceInUSD(tokenAddress: Address, amount: BigInt): BigDecimal {
    const avaxAddress = ZERO_ADDRESS;
    if (tokenAddress == avaxAddress) {
      tokenAddress = WAVAX_CONTRACT_ADDRESS;
    }
  
    let tokenPriceInUSDWithDecimal = pathFinder("2", amount, tokenAddress)
    if (tokenPriceInUSDWithDecimal == ZERO_BIGDECIMAL) {
      log.debug('Cant find 2 lenght path,searching 3 length path for {}', [tokenAddress.toHexString()]);
      tokenPriceInUSDWithDecimal = pathFinder("3", amount, tokenAddress)
    }
    if (tokenPriceInUSDWithDecimal == ZERO_BIGDECIMAL) {
      log.debug('Cant find 3 lenght path,searching 4 length path for {}', [tokenAddress.toHexString()]);
      tokenPriceInUSDWithDecimal = pathFinder("4", amount, tokenAddress)
    }
    return tokenPriceInUSDWithDecimal;
  }

  export function pathFinder(pathLenght: string, amount: BigInt, tokenAddress: Address): BigDecimal {
    const usdcAddress = USDC_ADDRESS;
    const yakRouterAddress = YAK_ROUTER_ADDRESS;
    const yakRouter = YakRouter.bind(yakRouterAddress);
    let tokenPriceInUSDWithDecimal: BigDecimal;
    if (yakRouter.try_findBestPath(amount, tokenAddress, usdcAddress, BigInt.fromString(pathLenght)).reverted) {
      log.info('findBestPath reverted {}', [yakRouter.try_findBestPath(amount, tokenAddress, usdcAddress, BigInt.fromString(pathLenght)).reverted.toString()]);
      tokenPriceInUSDWithDecimal = ZERO_BIGDECIMAL;
    } else {
      const tokenPriceInUSDStructure = yakRouter.findBestPath(amount, tokenAddress, usdcAddress, bigInt.fromString(pathLenght));
      if (tokenPriceInUSDStructure.amounts.length == 0) {
        tokenPriceInUSDWithDecimal = ZERO_BIGDECIMAL;
        log.info('Rout Cant find a best route {}', [tokenPriceInUSDStructure.amounts.length.toString()])
      } else {
        if (tokenPriceInUSDStructure.path[tokenPriceInUSDStructure.amounts.length - 1] == usdcAddress) {
          tokenPriceInUSDWithDecimal = convertBINumToDesiredDecimals(tokenPriceInUSDStructure.amounts[tokenPriceInUSDStructure.amounts.length - 1], 6);
        } else {
          tokenPriceInUSDWithDecimal = ZERO_BIGDECIMAL;
          log.info('Router Cant find a best route to USDC {}', [tokenPriceInUSDStructure.amounts.length.toString()])
        }
      }
    }
    
    return tokenPriceInUSDWithDecimal
  }

  export function calculateOutputTokenPriceInUSD(contractAddress: Address): BigDecimal {
    const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);
    let outputTokenPriceInUSD: BigDecimal;
    if (yakStrategyV2Contract.try_depositToken().reverted || yakStrategyV2Contract.try_getSharesForDepositTokens(DEFUALT_AMOUNT).reverted) {
      outputTokenPriceInUSD = ZERO_BIGDECIMAL;
      return outputTokenPriceInUSD;
    } else {
      const depositTokenPrice: BigDecimal = calculatePriceInUSD(yakStrategyV2Contract.depositToken(), DEFUALT_AMOUNT);
      const getSharesForDepositToken: BigInt = yakStrategyV2Contract.getSharesForDepositTokens(DEFUALT_AMOUNT);
      const getSharesForDepositTokenInDecimal: BigDecimal = convertBINumToDesiredDecimals(getSharesForDepositToken, 18);
      if (getSharesForDepositTokenInDecimal != ZERO_BIGDECIMAL) {
        outputTokenPriceInUSD = depositTokenPrice.div(getSharesForDepositTokenInDecimal);
      } else {
        outputTokenPriceInUSD = ZERO_BIGDECIMAL;
      }
    }
    return outputTokenPriceInUSD;
  }

  export function distributedRewardCalculator(contractAddress: Address, 
    timestamp: BigInt, 
    blockNumber: BigInt, 
    newTotalSupply: BigInt): BigInt {
    const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);
    let depositTokenPrice: BigDecimal;
    if (yakStrategyV2Contract.try_depositToken().reverted) {
        depositTokenPrice = ZERO_BIGDECIMAL;
    } else {
        depositTokenPrice = calculatePriceInUSD(yakStrategyV2Contract.depositToken(), DEFUALT_AMOUNT);
    }
    const vault = defineVault(contractAddress, timestamp, blockNumber);
    const beforeReinvestSupply = vault.outputTokenSupply;
    const distributedReward: BigInt = newTotalSupply.minus(beforeReinvestSupply!);
    return distributedReward;
}

export function distributedRewardInUSDCalculator(contractAddress: Address, 
  timestamp: BigInt, 
  blockNumber: BigInt, 
  newTotalSupply: BigInt): BigDecimal {
  const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);
  let depositTokenPrice: BigDecimal;
  if (yakStrategyV2Contract.try_depositToken().reverted) {
      depositTokenPrice = ZERO_BIGDECIMAL;
  } else {
      depositTokenPrice = calculatePriceInUSD(yakStrategyV2Contract.depositToken(), DEFUALT_AMOUNT);
  }
  const distributedReward = distributedRewardCalculator(contractAddress, timestamp, blockNumber, newTotalSupply);
  let allFees: BigDecimal;
  if (yakStrategyV2Contract.try_DEV_FEE_BIPS().reverted || yakStrategyV2Contract.try_ADMIN_FEE_BIPS().reverted || yakStrategyV2Contract.try_REINVEST_REWARD_BIPS().reverted) {
      allFees = ZERO_BIGDECIMAL;
  } else {
      allFees = (yakStrategyV2Contract.DEV_FEE_BIPS().plus(yakStrategyV2Contract.ADMIN_FEE_BIPS().plus(yakStrategyV2Contract.REINVEST_REWARD_BIPS()))).toBigDecimal().div(bigDecimal.fromString("1000"));
  }
  let allDistributedReward: BigDecimal;
  if (allFees != ZERO_BIGDECIMAL) {
      allDistributedReward = distributedReward.toBigDecimal().div(allFees);
  } else {
      allDistributedReward = ZERO_BIGDECIMAL;
  }
  const distributedRewardInUSD = depositTokenPrice.times(convertBINumToDesiredDecimals(distributedReward, 18));
  return distributedRewardInUSD;
}

export function protocolRewardInUSDCalculator(contractAddress: Address, 
  timestamp: BigInt, 
  blockNumber: BigInt, 
  newTotalSupply: BigInt): BigDecimal {
  const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);
  let depositTokenPrice: BigDecimal;
  if (yakStrategyV2Contract.try_depositToken().reverted) {
      depositTokenPrice = ZERO_BIGDECIMAL;
  } else {
      depositTokenPrice = calculatePriceInUSD(yakStrategyV2Contract.depositToken(), DEFUALT_AMOUNT);
  }
  const distributedReward = distributedRewardCalculator(contractAddress, timestamp, blockNumber, newTotalSupply);
  let allFees: BigDecimal;
  if (yakStrategyV2Contract.try_DEV_FEE_BIPS().reverted || yakStrategyV2Contract.try_ADMIN_FEE_BIPS().reverted || yakStrategyV2Contract.try_REINVEST_REWARD_BIPS().reverted) {
      allFees = ZERO_BIGDECIMAL;
  } else {
      allFees = (yakStrategyV2Contract.DEV_FEE_BIPS().plus(yakStrategyV2Contract.ADMIN_FEE_BIPS().plus(yakStrategyV2Contract.REINVEST_REWARD_BIPS()))).toBigDecimal().div(bigDecimal.fromString("1000"));
  }
  let allDistributedReward: BigDecimal;
  if (allFees != ZERO_BIGDECIMAL) {
      allDistributedReward = distributedReward.toBigDecimal().div(allFees);
  } else {
      allDistributedReward = ZERO_BIGDECIMAL;
  }
  let protocolReward: BigDecimal
  if (yakStrategyV2Contract.try_ADMIN_FEE_BIPS().reverted) {
      protocolReward = ZERO_BIGDECIMAL;
  } else {
      protocolReward = allDistributedReward.times(yakStrategyV2Contract.ADMIN_FEE_BIPS().toBigDecimal()).div(bigDecimal.fromString("1000"));
  }
  const protocolRewardInUSD = depositTokenPrice.times(protocolReward);
  return protocolRewardInUSD;
}

export function allDistributedRewardInUSDCalculator(contractAddress: Address, 
  timestamp: BigInt, 
  blockNumber: BigInt, 
  newTotalSupply: BigInt): BigDecimal {
  const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);
  let depositTokenPrice: BigDecimal;
  if (yakStrategyV2Contract.try_depositToken().reverted) {
      depositTokenPrice = ZERO_BIGDECIMAL;
  } else {
      depositTokenPrice = calculatePriceInUSD(yakStrategyV2Contract.depositToken(), DEFUALT_AMOUNT);
  }
  const distributedReward = distributedRewardCalculator(contractAddress, timestamp, blockNumber, newTotalSupply);
  let allFees: BigDecimal;
  if (yakStrategyV2Contract.try_DEV_FEE_BIPS().reverted || yakStrategyV2Contract.try_ADMIN_FEE_BIPS().reverted || yakStrategyV2Contract.try_REINVEST_REWARD_BIPS().reverted) {
      allFees = ZERO_BIGDECIMAL;
  } else {
      allFees = (yakStrategyV2Contract.DEV_FEE_BIPS().plus(yakStrategyV2Contract.ADMIN_FEE_BIPS().plus(yakStrategyV2Contract.REINVEST_REWARD_BIPS()))).toBigDecimal().div(bigDecimal.fromString("1000"));
  }
  let allDistributedReward: BigDecimal;
  if (allFees != ZERO_BIGDECIMAL) {
      allDistributedReward = distributedReward.toBigDecimal().div(allFees);
  } else {
      allDistributedReward = ZERO_BIGDECIMAL;
  }
  const allDistributedRewardInUSD = depositTokenPrice.times(allDistributedReward);
  return allDistributedRewardInUSD;
}