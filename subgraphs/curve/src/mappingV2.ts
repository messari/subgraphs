import { log } from "@graphprotocol/graph-ts/index";
import {
  Batch_set_liquidity_gaugesCall,
  CryptoRegistry,
  PoolAdded,
  Set_liquidity_gaugesCall,
} from "../generated/AddressProvider/CryptoRegistry";
import { ADDRESS_ZERO, REGISTRY_V2 } from "./common/constants/index";
import { TokenExchange } from "../generated/templates/RegistryTemplate/CurvePoolV2";
import { createNewFactoryPool, createNewRegistryPool } from "./services/pools";
import { MetaPool } from "../generated/templates/RegistryTemplate/MetaPool";
import { getLpToken } from "./mapping";
import { handleExchange } from "./services/swaps";
import { CryptoPoolDeployed } from "../generated/templates/CryptoFactoryTemplate/CryptoFactory";
import { AddLiquidity, RemoveLiquidity, RemoveLiquidityOne } from "../generated/templates/RegistryTemplate/CurvePool";
import { updateFinancials, updatePool, updatePoolMetrics, updateUsageMetrics } from "./common/metrics";
import { getLiquidityPool } from "./common/getters";
import { LiquidityPool } from "../generated/schema";
import { setGaugeData } from "./services/gauges/helpers";
import { LiquidityGaugeDeployed } from "../generated/templates/CryptoFactoryTemplate/CryptoFactory";
import { ZERO_ADDRESS } from "./common/constants";

export function handleCryptoPoolAdded(event: PoolAdded): void {
  log.debug("New V2 factory crypto pool {} deployed at {}", [
    event.params.pool.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
  const cryptoRegistryAddress = event.address;
  const pool = event.params.pool;
  let cryptoRegistry = CryptoRegistry.bind(cryptoRegistryAddress);
  let gauge = ADDRESS_ZERO;
  let gaugeCall = cryptoRegistry.try_get_gauges(pool);
  if (!gaugeCall.reverted) {
    gauge = gaugeCall.value.value0[0];
  }
  // Useless for now, but v2 metapools may be a thing at some point
  const testMetaPool = MetaPool.bind(pool);
  const testMetaPoolResult = testMetaPool.try_base_pool();
  if (!testMetaPoolResult.reverted) {
    createNewRegistryPool(
      pool,
      testMetaPoolResult.value,
      getLpToken(pool, event.address),
      true,
      true,
      REGISTRY_V2,
      event.block.timestamp,
      event.block.number,
      event.transaction.hash,
      gauge,
      cryptoRegistryAddress,
    );
  } else {
    createNewRegistryPool(
      pool,
      ADDRESS_ZERO,
      getLpToken(pool, event.address),
      false,
      true,
      REGISTRY_V2,
      event.block.timestamp,
      event.block.number,
      event.transaction.hash,
      gauge,
      cryptoRegistryAddress,
    );
  }
}

export function handleCryptoPoolDeployed(event: CryptoPoolDeployed): void {
  log.debug("New V2 factory crypto pool deployed at {}", [event.transaction.hash.toHexString()]);
  createNewFactoryPool(
    2,
    event.address,
    false,
    ADDRESS_ZERO,
    event.params.token,
    event.block.timestamp,
    event.block.number,
  );
}

export function handleTokenExchangeV2(event: TokenExchange): void {
  log.debug("swap for v2 pool: {} at {}", [event.address.toHexString(), event.transaction.hash.toHexString()]);
  const trade = event.params;
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
    false,
  );
}

export function handleAddLiquidityV2(event: AddLiquidity): void {
  let pool = getLiquidityPool(event.address.toHexString());
  updatePool(pool, event); // also updates protocol tvl
  updatePoolMetrics(pool.id, event);
  updateFinancials(event); // call after protocol tvl is updated
  updateUsageMetrics(event, "deposit");
}

export function handleRemoveLiquidityV2(event: RemoveLiquidity): void {
  let pool = getLiquidityPool(event.address.toHexString());
  updatePool(pool, event); // also updates protocol tvl
  updatePoolMetrics(pool.id, event);
  updateFinancials(event); // call after protocol tvl is updated
  updateUsageMetrics(event, "withdraw");
}

export function handleRemoveLiquidityOneV2(event: RemoveLiquidityOne): void {
  let pool = getLiquidityPool(event.address.toHexString());
  updatePool(pool, event); // also updates protocol tvl
  updatePoolMetrics(pool.id, event);
  updateFinancials(event); // call after protocol tvl is updated
  updateUsageMetrics(event, "withdraw");
}

export function handleSetLiquidityGauges(call: Set_liquidity_gaugesCall): void {
  let pool = LiquidityPool.load(call.inputs._pool.toHexString());
  let gauge = call.inputs._liquidity_gauges[0];
  if (!pool || gauge.equals(ADDRESS_ZERO) || pool.gauge != ZERO_ADDRESS) {
    return;
  }
  pool.gauge = gauge.toHexString();
  pool.save();
  setGaugeData(pool);
}

export function handleBatchSetLiquidityGauges(call: Batch_set_liquidity_gaugesCall): void {
  const poolAddresses = call.inputs._pools;
  for (let i = 0; i < poolAddresses.length; i++) {
    let poolAddress = poolAddresses[i];
    if (poolAddress.equals(ADDRESS_ZERO)) {
      break;
    }
    let pool = LiquidityPool.load(poolAddress.toHexString());
    if (pool && (!pool.gauge || pool.gauge == ZERO_ADDRESS)) {
      let gauge = call.inputs._liquidity_gauges[i];
      if (!gauge.equals(ADDRESS_ZERO)) {
        pool.gauge = gauge.toHexString();
        pool.save();
        setGaugeData(pool);
      }
    }
  }
}

export function handleLiquidityGaugeDeployed(event: LiquidityGaugeDeployed): void {
  let pool = LiquidityPool.load(event.params.pool.toHexString());
  if (!pool || (pool.gauge && pool.gauge != ZERO_ADDRESS)) {
    return; // already set
  }
  pool.gauge = event.params.gauge.toHexString();
  pool.save();
  setGaugeData(pool);
}
