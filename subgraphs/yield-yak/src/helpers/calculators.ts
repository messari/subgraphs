import { Address, BigInt, BigDecimal, bigInt, log } from '@graphprotocol/graph-ts'
import { DEFUALT_AMOUNT, USDC_ADDRESS, WAVAX_CONTRACT_ADDRESS, YAK_ROUTER_ADDRESS, ZERO_ADDRESS, ZERO_BIGDECIMAL } from '../utils/constants';
import { YakRouter } from '../../generated/YakRouter/YakRouter';
import { convertBINumToDesiredDecimals } from './converters';
import { YakStrategyV2 } from '../../generated/YakStrategyV2/YakStrategyV2';

export function calculatePriceInUSD(tokenAddress: Address, amount: BigInt): BigDecimal {
    let avaxAddress = ZERO_ADDRESS;
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
    let yakRouter = YakRouter.bind(yakRouterAddress);
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
    let dexStrategyV4Contract = YakStrategyV2.bind(contractAddress);
    let OutputTokenPriceInUSD: BigDecimal;
    if (dexStrategyV4Contract.try_depositToken().reverted || dexStrategyV4Contract.try_getSharesForDepositTokens(DEFUALT_AMOUNT).reverted) {
      OutputTokenPriceInUSD = ZERO_BIGDECIMAL;
      return OutputTokenPriceInUSD;
    } else {
      let depositTokenPrice: BigDecimal = calculatePriceInUSD(dexStrategyV4Contract.depositToken(), DEFUALT_AMOUNT);
      let getSharesForDepositToken: BigInt = dexStrategyV4Contract.getSharesForDepositTokens(DEFUALT_AMOUNT);
      let getSharesForDepositTokenInDecimal: BigDecimal = convertBINumToDesiredDecimals(getSharesForDepositToken, 18);
      if (getSharesForDepositTokenInDecimal != ZERO_BIGDECIMAL) {
        OutputTokenPriceInUSD = depositTokenPrice.div(getSharesForDepositTokenInDecimal);
      } else {
        OutputTokenPriceInUSD = ZERO_BIGDECIMAL;
      }
    }
    return OutputTokenPriceInUSD;
  }