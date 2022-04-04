import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts';
import { Vault as  Pool } from '../../generated/schema';
import { PoolV3 } from '../../generated/poolV3_vaUSDC/PoolV3';
import { Controller } from '../../generated/controller/Controller';
import { StrategyV3 } from '../../generated/poolV3_vaUSDC/StrategyV3';
import { PriceRouter } from '../../generated/poolV3_vaUSDC/PriceRouter';
import { Erc20Token } from '../../generated/VSP/Erc20Token';

// This is using Sushiswap address for Ethereum Mainnet.
let RouterAddress = Address.fromString(
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
);
let UsdcAddress = Address.fromString(
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
);

let WEthAddress = Address.fromString(
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
);

const ControllerAddress = '0xa4F1671d3Aee73C05b552d57f2d16d3cfcBd0217';

export function getDecimalDivisor(decimals: i32): BigDecimal {
  return BigDecimal.fromString('1'.concat('0'.repeat(decimals)));
}

function getUsdPriceRate(decimals: i32, address: Address): BigDecimal | null {
  let priceRouter = PriceRouter.bind(RouterAddress);
  // Interpolation with ``not supported by AssemblyScript
  let oneUnit = BigInt.fromString('1'.concat('0'.repeat(decimals)));
  // the second parameter returns the rate
  let paths: Address[] = [address];
  if (address != WEthAddress) {
    paths.push(WEthAddress);
  }
  paths.push(UsdcAddress);
  log.info('Trying to retrieve USDC rate for address {} with decimals={}.', [
    address.toHexString(),
    decimals.toString(),
  ]);
  let ratesCall = priceRouter.try_getAmountsOut(oneUnit, paths);
  if (ratesCall.reverted) {
    log.error('failed to retrieve usdc rate for address={}, decimals={}', [
      address.toHexString(),
      decimals.toString(),
    ]);
    return null;
  }
  // divide by one unit of USDC
  return ratesCall.value.pop().toBigDecimal().div(getDecimalDivisor(6));
}

export function toUsd(
  amountIn: BigDecimal,
  decimals: i32,
  tokenAddress: Address
): BigDecimal {
  // if we are converting from Usdc, it's the same destiniy token, so we return the same value
  if (tokenAddress == UsdcAddress) {
    return amountIn;
  }
  // if the amount to convert is 0, then
  if (amountIn === BigDecimal.fromString('0')) {
    return amountIn;
  }
  let usdRate = getUsdPriceRate(decimals, tokenAddress);
  if (usdRate == null) {
    log.info('Cannot convert {} from address={} to USDC as rate was null', [
      amountIn.toString(),
      tokenAddress.toHexString(),
    ]);
    return BigDecimal.fromString('0');
  }
  log.info('USDC rate for address={} is {}', [
    tokenAddress.toHexString(),
    usdRate.toString(),
  ]);
  // explicit cast required
  return amountIn.times(usdRate as BigDecimal);
}

export function getStrategyAddress(poolAddress: Address): Address {
  let controller = Controller.bind(Address.fromString(ControllerAddress));
  return controller.strategy(poolAddress);
}

export function getStrategy(poolAddress: Address): StrategyV3 {
  let strategyAddress = getStrategyAddress(poolAddress);
  return StrategyV3.bind(strategyAddress);
}

// using this implementation because .includes() fails in comparison
// and closures are not supported in AssemblyScript (so we can't use .some())
export function hasStrategy(addresses: Address[], toFound: Address): bool {
  for (let i = 0, k = addresses.length; i < k; ++i) {
    let found = addresses[i] == toFound;
    if (found) {
      log.info('Address {} found in the list of strategies', [
        toFound.toHexString(),
      ]);
      return true;
    }
  }
  log.info('Address {} not found in the list of strategies', [
    toFound.toHexString(),
  ]);
  return false;
}

export function getShareToTokenRateV3(pool: PoolV3): BigDecimal {
  return pool
    .pricePerShare()
    .toBigDecimal()
    .div(getDecimalDivisor(pool.decimals()));
}

export function getPoolV3(address: string): Pool {
  let pool = Pool.load(address);
  if (pool != null) {
    log.info('Returning Pool query for address {}', [address]);
    return pool as Pool;
  }
  log.info('Creating new instance of poolV3 for address {}', [address]);
  let poolV3 = PoolV3.bind(Address.fromString(address));
  let newPool = new Pool(address);
  let zeroString = BigDecimal.fromString('0');
  newPool.totalDebt = BigInt.fromString('0');
  newPool.totalDebtUsd = zeroString;
  newPool.totalSupply = BigInt.fromString('0');
  newPool.totalSupplyUsd = zeroString;
  newPool.totalRevenue = zeroString;
  newPool.totalRevenueUsd = zeroString;
  newPool.protocolRevenue = zeroString;
  newPool.protocolRevenueUsd = zeroString;
  newPool.supplySideRevenue = zeroString;
  newPool.supplySideRevenueUsd = zeroString;
  newPool.poolName = poolV3.name();
  newPool.poolToken = poolV3.symbol();
  newPool.poolTokenDecimals = poolV3.decimals();
  newPool.poolVersion = 2;
  let token = Erc20Token.bind(poolV3.token());
  newPool.collateralToken = token.symbol();
  newPool.collateralTokenDecimals = token.decimals();
  return newPool;
}

export function getPoolV3(address: string): Pool {
  let pool = Pool.load(address);
  if (pool != null) {
    log.info('Returning Pool query for address {}', [address]);
    // Casting required because here we know poolsQuery is not null, but the AssemblyScript compiler
    // is not picking it up
    return pool as Pool;
  }
  log.info('Creating new instance of poolV3 for address {}', [address]);
  let poolV3 = PoolV3.bind(Address.fromString(address));
  let newPool = new Pool(address);
  let zeroString = BigDecimal.fromString('0');
  newPool.totalDebt = BigInt.fromString('0');
  newPool.totalDebtUsd = zeroString;
  newPool.totalSupply = BigInt.fromString('0');
  newPool.totalSupplyUsd = zeroString;
  newPool.totalRevenue = zeroString;
  newPool.totalRevenueUsd = zeroString;
  newPool.protocolRevenue = zeroString;
  newPool.protocolRevenueUsd = zeroString;
  newPool.supplySideRevenue = zeroString;
  newPool.supplySideRevenueUsd = zeroString;
  newPool.poolName = poolV3.name();
  newPool.poolToken = poolV3.symbol();
  newPool.poolTokenDecimals = poolV3.decimals();
  newPool.poolVersion = 3;
  let token = Erc20Token.bind(poolV3.token());
  newPool.collateralToken = token.symbol();
  newPool.collateralTokenDecimals = token.decimals();
  return newPool;
}