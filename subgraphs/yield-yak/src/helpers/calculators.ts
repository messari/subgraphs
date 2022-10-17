import { Address, BigInt, BigDecimal, bigInt, log } from '@graphprotocol/graph-ts'
import { USDC_ADDRESS, YAK_ROUTER_ADDRESS, ZERO_BIGDECIMAL } from '../utils/constants';

export function calculatePriceInUSD(tokenAddress: Address, amount: BigInt): BigDecimal {
    let avaxAddress: Address = Address.fromString("0x0000000000000000000000000000000000000000");
    let tokenPriceInUSDWithDecimal: BigDecimal;
    if (tokenAddress == avaxAddress) {
      tokenAddress = Address.fromString("0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7");
    }
  
    tokenPriceInUSDWithDecimal = pathFinder("2", amount, tokenAddress)
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
    let yakRouter = YakR.bind(yakRouterAddress);
    let tokenPriceInUSDWithDecimal: BigDecimal;
    if (yakRouter.try_findBestPath(amount, tokenAddress, usdcAddress, BigInt.fromString(pathLenght)).reverted) {
      log.info('findBestPath reverted {}', [yakRouter.try_findBestPath(amount, tokenAddress, usdcAddress, BigInt.fromString(pathLenght)).reverted.toString()]);
      tokenPriceInUSDWithDecimal = ZERO_BIGDECIMAL;
    } else {
      let tokenPriceInUSDStructure: YakRouter__findBestPathResultValue0Struct = yakRouter.findBestPath(amount, tokenAddress, usdcAddress, bigInt.fromString(pathLenght));
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