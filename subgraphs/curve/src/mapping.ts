import { NewAddressIdentifier, AddressModified } from '../generated/AddressProvider/AddressProvider'
import {
  ADDRESS_ZERO,
  UNKNOWN_METAPOOLS,
  BIG_INT_ZERO,
  EARLY_V2_POOLS,
  LENDING,
  LENDING_POOLS, BIG_INT_ONE, REGISTRY_V1, CATCHUP_BLOCK, STABLE_FACTORY, METAPOOL_FACTORY, LP_TOKEN_POOL_MAP
} from './common/constants/index'
import { BigInt, dataSource } from '@graphprotocol/graph-ts/index'
import { Factory, LiquidityPool, Registry } from '../generated/schema'
import {
  CryptoFactoryTemplate,
  CryptoRegistryTemplate,
  CurvePoolTemplate,
  RegistryTemplate,
  StableFactoryTemplate,
} from '../generated/templates'
import { Address, Bytes, log } from '@graphprotocol/graph-ts'
import { MainRegistry, PoolAdded, Set_liquidity_gaugesCall } from '../generated/AddressProvider/MainRegistry'
import { createNewFactoryPool, createNewPool, isLendingPool } from './services/pools'
import { createNewRegistryPool } from './services/pools'
import { MetaPool } from '../generated/templates/RegistryTemplate/MetaPool'
import { TokenExchange, TokenExchangeUnderlying } from '../generated/templates/CurvePoolTemplate/CurvePool'
import { handleExchange } from './services/swaps'
import { LiquidityGaugeDeployed, MetaPoolDeployed, PlainPoolDeployed } from '../generated/AddressProvider/StableFactory'
import { getFactory } from './services/factory'
import { getPlatform } from './services/platform'
import { AddLiquidity, RemoveLiquidity, RemoveLiquidityImbalance, RemoveLiquidityOne } from '../generated/templates/RegistryTemplate/CurvePool'
import { CurveLendingPool, NewFee } from '../generated/templates/CurvePoolTemplate/CurveLendingPool'
import { getLiquidityPool, getOrCreateToken, getPoolFee } from './common/getters'
import { BIGDECIMAL_ONE_HUNDRED, FEE_DENOMINATOR_DECIMALS, LiquidityPoolFeeType, Network, ZERO_ADDRESS } from './common/constants'
import { bigIntToBigDecimal } from './common/utils/numbers'
import { handleLiquidityFees, updateFinancials, updatePool, updatePoolMetrics, updateUsageMetrics } from './common/metrics'
import { StableFactory } from '../generated/templates/CryptoFactoryTemplate/StableFactory'
import { setGaugeData } from './services/gauges/helpers'
import { CurvePoolAvax } from '../generated/templates/CurvePoolTemplate/CurvePoolAvax'
import { catchUp } from './services/catchup'
import { handleLiquidityEvent, handleLiquidityRemoveOne } from './services/liquidity'
import { setPoolBalances } from './common/setters'
import { Add_existing_metapoolsCall } from '../generated/templates/CryptoFactoryTemplate/StableFactory'
import { catchUpRegistryMainnet } from './services/catchup'


export function addAddress(providedId: BigInt, addedAddress: Address, block: BigInt, timestamp: BigInt, hash: Bytes): void {
  const platform = getPlatform()
  if (!platform.catchup && (block > CATCHUP_BLOCK)) {
    platform.catchup = true
    platform.save()
    catchUpRegistryMainnet()
  }
  if (providedId == BIG_INT_ZERO) {
    let mainRegistry = Registry.load(addedAddress.toHexString())
    if (!mainRegistry) {
      log.info('New main registry added: {}', [addedAddress.toHexString()])
      mainRegistry = new Registry(addedAddress.toHexString())
      mainRegistry.save()
      RegistryTemplate.create(addedAddress)
      if (dataSource.network().toLowerCase() == Network.AVALANCHE.toLowerCase()){
        catchUp(addedAddress, false, 1, block, timestamp, hash)
      }
    }
  } else if (providedId == BigInt.fromString('3')) {
    let stableFactory = Factory.load(addedAddress.toHexString())
    if (!stableFactory) {
      log.info('New stable factory added: {}', [addedAddress.toHexString()])
      stableFactory = getFactory(addedAddress, 1)
      stableFactory.save()
      StableFactoryTemplate.create(addedAddress)
      if (dataSource.network().toLowerCase() == Network.AVALANCHE.toLowerCase()){
        catchUp(addedAddress, true, 1, block, timestamp, hash)
      }
    }
  } else if (providedId == BigInt.fromString('5')) {
    let cryptoRegistry = Registry.load(addedAddress.toHexString())
    if (!cryptoRegistry) {
      log.info('New crypto registry added: {}', [addedAddress.toHexString()])
      cryptoRegistry = new Registry(addedAddress.toHexString())
      cryptoRegistry.save()
      CryptoRegistryTemplate.create(addedAddress)
      if (dataSource.network().toLowerCase() == Network.AVALANCHE.toLowerCase()){
        catchUp(addedAddress, false, 2, block, timestamp, hash)
      }
    }
  } else if (providedId == BigInt.fromString('6')) {
    let cryptoFactory = Factory.load(addedAddress.toHexString())
    if (!cryptoFactory) {
      log.info('New crypto v2 factory added: {}', [addedAddress.toHexString()])
      cryptoFactory = getFactory(addedAddress, 2)
      cryptoFactory.save()
      CryptoFactoryTemplate.create(addedAddress)
      if (dataSource.network().toLowerCase() == Network.AVALANCHE.toLowerCase()){
        catchUp(addedAddress, true, 2, block, timestamp, hash)
      }
    }
  }
}

export function handleNewAddressIdentifier(event: NewAddressIdentifier): void {
  const providedId = event.params.id
  const addedAddress = event.params.addr
  addAddress(providedId, addedAddress, event.block.number, event.block.timestamp, event.transaction.hash)
}

export function handleAddressModified(event: AddressModified): void {
  const providedId = event.params.id
  const addedAddress = event.params.new_address
  addAddress(providedId, addedAddress, event.block.number, event.block.timestamp, event.transaction.hash)
}

export function getLpToken(pool: Address, registryAddress: Address): Address {
  const registry = MainRegistry.bind(registryAddress)
  let lpTokenResult = registry.try_get_lp_token(pool)
  if (lpTokenResult.reverted) {
    lpTokenResult = CurvePoolAvax.bind(pool).try_lp_token();
    if (!lpTokenResult.reverted) {
      return lpTokenResult.value
    }
    if (LP_TOKEN_POOL_MAP.has(pool.toHexString().toLowerCase())) {
      return LP_TOKEN_POOL_MAP.get(pool.toHexString())
    }
    log.warning('getLpToken reverted: {}', [pool.toHexString()])
  }
  return lpTokenResult.reverted ? pool : lpTokenResult.value
}

// Ensures that when starting to track a metapool, we also track its base pool
// This is mainly due to an issue with 3pool on mainnet where the pool was added
// to the registry BEFORE the registry was added to the address indexer
// Note: the assumption is that the base pool has indeed been added to the SAME
// registry before.
export function ensureBasePoolTracking(pool: Address, eventAddress: Address, timestamp: BigInt, block: BigInt, tx: Bytes, gauge: Address): void {
  log.warning('Ensure base pool tracking for {}', [pool.toHexString()])
  const basePool = LiquidityPool.load(pool.toHexString())
  if (!basePool) {
    log.warning('New missing base pool {} added from registry', [pool.toHexString()])
    const isLending = isLendingPool(pool)
    const basePoolLending = isLending ? pool : ADDRESS_ZERO // if it's a lending pool, it's the pool itself (virtual base pool)
    const poolType = isLending ? LENDING : REGISTRY_V1
    createNewRegistryPool(
      pool,
      basePoolLending,
      getLpToken(pool, eventAddress),
      false,
      false,
      poolType,
      timestamp,
      block,
      tx,
      gauge,
      eventAddress
    )
  }
}

export function addRegistryPool(pool: Address,
                                registry: Address,
                                block: BigInt,
                                timestamp: BigInt,
                                hash: Bytes): void {
  log.info('New pool {} added to registry at {}', [pool.toHexString(), hash.toHexString()])
  let mainRegistry = MainRegistry.bind(registry);
  let gauge = ADDRESS_ZERO
  let gaugeCall = mainRegistry.try_get_gauges(pool)
  if (!gaugeCall.reverted) {
    gauge = gaugeCall.value.value0[0]
  }

  if (isLendingPool(pool)) {
    // Lending pool
    log.info('New lending pool {} added from registry at {}', [
      pool.toHexString(),
      hash.toHexString(),
    ])
    CurvePoolTemplate.create(pool)
    const lpToken = getLpToken(pool, registry)
    const lpTokenContract = getOrCreateToken(lpToken)
    createNewPool(
      pool,
      lpToken, // lp token
      lpTokenContract.name, // pool name
      lpTokenContract.symbol, // pool symbol
      LENDING, // pool type
      false, // is metapool
      false, // is v2
      block,
      timestamp,
      pool,
      gauge,
      registry
    )
  }

  const testMetaPool = MetaPool.bind(pool)
  const testMetaPoolResult = testMetaPool.try_base_pool()
  const unknownMetapool = UNKNOWN_METAPOOLS.has(pool.toHexString())
  if (!testMetaPoolResult.reverted || unknownMetapool) {
    log.info('New meta pool {} added from registry {} at {}', [pool.toHexString(), registry.toHexString(), hash.toHexString()])
    const basePool = unknownMetapool ? UNKNOWN_METAPOOLS.get(pool.toHexString()) : testMetaPoolResult.value
    let basePoolGauge = ADDRESS_ZERO;
    let gaugeCall = mainRegistry.try_get_gauges(basePool)
    if (!gaugeCall.reverted) {
      basePoolGauge = gaugeCall.value.value0[0]
    }
    // check if we're tracking the base pool
    ensureBasePoolTracking(
      basePool,
      registry,
      timestamp,
      block,
      hash,
      basePoolGauge
    )
    createNewRegistryPool(
      pool,
      basePool,
      getLpToken(pool, registry),
      true,
      EARLY_V2_POOLS.includes(pool) ? true : false,
      // on mainnet the unknown metapools are legacy metapools deployed before the
      // contract was added to the address indexer
      UNKNOWN_METAPOOLS.has(pool.toHexString()) ? METAPOOL_FACTORY : STABLE_FACTORY,
      timestamp,
      block,
      hash,
      gauge,
      registry
    )
  } else {
    log.info('New plain pool {} added from registry at {}', [pool.toHexString(), hash.toHexString()])
    createNewRegistryPool(
      pool,
      ADDRESS_ZERO,
      getLpToken(pool, registry),
      false,
      EARLY_V2_POOLS.includes(pool) ? true : false,
      REGISTRY_V1,
      timestamp,
      block,
      hash,
      gauge,
      registry
    )
  }
}

export function handleMainRegistryPoolAdded(event: PoolAdded): void {
  addRegistryPool(
    event.params.pool,
    event.address,
    event.block.number,
    event.block.timestamp,
    event.transaction.hash
  )
}

export function handleTokenExchange(event: TokenExchange): void {
  log.info('Plain swap for pool: {} at {}', [event.address.toHexString(), event.transaction.hash.toHexString()])
  const trade = event.params
  handleExchange(
    trade.buyer,
    trade.sold_id,
    trade.bought_id,
    trade.tokens_sold,
    trade.tokens_bought,
    event.block.timestamp,
    event.block.number,
    event.address,
    event,
    false
  )
}

export function handleTokenExchangeUnderlying(event: TokenExchangeUnderlying): void {
  log.info('Underlying swap for pool: {} at {}', [event.address.toHexString(), event.transaction.hash.toHexString()])
  const trade = event.params
  handleExchange(
    trade.buyer,
    trade.sold_id,
    trade.bought_id,
    trade.tokens_sold,
    trade.tokens_bought,
    event.block.timestamp,
    event.block.number,
    event.address,
    event,
    true
  )
}

export function handleAddLiquidity(event: AddLiquidity): void {
  let pool = getLiquidityPool(event.address.toHexString())
  
  handleLiquidityEvent('deposit',pool,event.params.token_supply,event.params.token_amounts,event.params.provider,event);
  handleLiquidityFees(pool, event.params.fees, event); // liquidity fees only take on remove liquidity imbalance and add liquidity
  updatePool(pool, event); // also updates protocol tvl
  updatePoolMetrics(pool.id, event);
  updateFinancials(event); // call after protocol tvl is updated
  updateUsageMetrics(event,'deposit');
}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  let pool = getLiquidityPool(event.address.toHexString())

  handleLiquidityEvent('withdraw',pool,event.params.token_supply,event.params.token_amounts,event.params.provider,event);
  updatePool(pool, event); // also updates protocol tvl
  updatePoolMetrics(pool.id, event);
  updateFinancials(event); // call after protocol tvl is updated
  updateUsageMetrics(event,'withdraw');
}

export function handleRemoveLiquidityOne(event: RemoveLiquidityOne): void {
  let pool = getLiquidityPool(event.address.toHexString())

  handleLiquidityRemoveOne(pool,event.params.token_supply,event.params.token_amount,event.params.provider,event);
  setPoolBalances(pool);
  updatePool(pool, event); // also updates protocol tvl
  updatePoolMetrics(pool.id, event);
  updateFinancials(event); // call after protocol tvl is updated
  updateUsageMetrics(event,'withdraw');
}

export function handleRemoveLiquidityImbalance(event: RemoveLiquidityImbalance): void {
  let pool = getLiquidityPool(event.address.toHexString())
  
  handleLiquidityEvent('withdraw',pool,event.params.token_supply,event.params.token_amounts,event.params.provider,event);
  handleLiquidityFees(pool, event.params.fees, event); // liquidity fees only take on remove liquidity imbalance and add liquidity
  updatePool(pool, event); // also updates protocol tvl
  updatePoolMetrics(pool.id, event);
  updateFinancials(event); // call after protocol tvl is updated
  updateUsageMetrics(event,'withdraw');
}

export function handleNewFee(event: NewFee): void {
  let pool = getLiquidityPool(event.address.toHexString());
  let tradingFee = getPoolFee(pool.id,LiquidityPoolFeeType.FIXED_TRADING_FEE);
  let protocolFee = getPoolFee(pool.id,LiquidityPoolFeeType.FIXED_PROTOCOL_FEE);
  let lpFee = getPoolFee(pool.id,LiquidityPoolFeeType.FIXED_LP_FEE);
  let totalFee = bigIntToBigDecimal(event.params.fee,FEE_DENOMINATOR_DECIMALS).times(BIGDECIMAL_ONE_HUNDRED);
  let adminFee = bigIntToBigDecimal(event.params.admin_fee,FEE_DENOMINATOR_DECIMALS).times(BIGDECIMAL_ONE_HUNDRED);
  tradingFee.feePercentage = totalFee;
  protocolFee.feePercentage = adminFee.times(totalFee);
  lpFee.feePercentage = totalFee.minus((adminFee.times(totalFee)));

  tradingFee.save();
  protocolFee.save();
  lpFee.save();
}

export function handlePlainPoolDeployed(event: PlainPoolDeployed): void {
  log.info('New factory plain pool deployed at {}', [event.transaction.hash.toHexString()])
  createNewFactoryPool(
    1,
    event.address,
    false,
    ADDRESS_ZERO,
    ADDRESS_ZERO,
    event.block.timestamp,
    event.block.number,
  )
}

export function handleMetaPoolDeployed(event: MetaPoolDeployed): void {
  let factory = StableFactory.bind(event.address);
  let gauge = ADDRESS_ZERO
  let gaugeCall = factory.try_get_gauge(event.params.base_pool);
  if (!gaugeCall.reverted) {
    gauge = gaugeCall.value;
  }
  log.info('New meta pool (version {}), basepool: {}, deployed at {}', [
    '1',
    event.params.base_pool.toHexString(),
    event.transaction.hash.toHexString(),
  ])
  // check if we're tracking the base pool
  ensureBasePoolTracking(
    event.params.base_pool,
    event.address,
    event.block.timestamp,
    event.block.number,
    event.transaction.hash,
    gauge
  )
  createNewFactoryPool(
    1,
    event.address,
    true,
    event.params.base_pool,
    ADDRESS_ZERO,
    event.block.timestamp,
    event.block.number,
  )
}

// This is needed because we keep an internal count of the number of pools in
// each factory contract's pool_list. The internal accounting, in turn, is
// needed because events don't give the address of newly deployed pool and we
// can't use pool_count to grab the latest deployed pool, because several
// pools may be deployed in the same block (in which case we'd miss all the
// previous pools aand only record the last.
// When metapools are added with this function to the regitsry, there is no
// event emitted. So we need a call handler. But this is only (so far) a mainnet
// problem - and only mainnet can handle call triggers. Hence why we need to hack
// around with mustache to avoid issues 
export function handleAddExistingMetaPools(call: Add_existing_metapoolsCall): void {

  const pools = call.inputs._pools
  const factory = Factory.load(call.to.toHexString())
  if (!factory) {
    return
  }
  for (let i = 0; i < pools.length; i++) {
    if (pools[i] == ADDRESS_ZERO) {
      break
    }
    factory.poolCount = factory.poolCount.plus(BIG_INT_ONE)
    log.info('Existing meta pool {} added to factory contract ({}) at {}', [
      pools[i].toHexString(),
      i.toString(),
      call.transaction.hash.toHexString()
    ])
  }
  factory.save()
}

export function handleSetLiquidityGauges(call: Set_liquidity_gaugesCall): void {
  let pool = LiquidityPool.load(call.inputs._pool.toHexString())
  let gauge = call.inputs._liquidity_gauges[0]
  if (!pool || gauge.equals(ADDRESS_ZERO) || (pool.gauge && pool.gauge!=ZERO_ADDRESS)) {
    return
  }
  pool.gauge = gauge.toHexString()
  pool.save();
  setGaugeData(pool)
}

export function handleLiquidityGaugeDeployed(event: LiquidityGaugeDeployed): void {
  let pool = LiquidityPool.load(event.params.pool.toHexString())
  if (!pool || (pool.gauge && pool.gauge!=ZERO_ADDRESS)) {
    return
  }
  pool.gauge = event.params.gauge.toHexString()
  pool.save();
  setGaugeData(pool)
}