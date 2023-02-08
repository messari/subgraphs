import { Bytes, log } from "@graphprotocol/graph-ts";
import { InstanceDeployed } from "../../../generated//PoolManagerFactory/PoolManagerFactory";
import { PoolManager as PoolManagerTemplate } from "../../../generated/templates";
import { PoolManager } from "../../../generated/templates//PoolManager//PoolManager";
import { Pool } from "../../../generated/templates/PoolManager/Pool";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  InterestRateSide,
  InterestRateType,
  TokenType,
} from "../../../src/sdk/constants";
import { DataManager } from "../../../src/sdk/manager";
import { TokenManager } from "../../../src/sdk/token";
import { getProtocolData } from "./constants";

//
// Pool created event
export function handleManagerInstanceDeployed(event: InstanceDeployed): void {
  PoolManagerTemplate.create(event.params.instance_);

  const poolManagerContract = PoolManager.bind(event.params.instance_);
  const tryPool = poolManagerContract.try_pool();
  if (tryPool.reverted) {
    log.error(
      "[handleManagerInstanceDeployed] PoolManager contract {} does not have a pool",
      [event.params.instance_.toHexString()]
    );
    return;
  }
  const poolContract = Pool.bind(tryPool.value);
  const outputToken = new TokenManager(
    Bytes.fromHexString(tryPool.value.toHexString()),
    event,
    TokenType.REBASING
  );

  const tryInputToken = poolContract.try_asset();
  if (tryInputToken.reverted) {
    log.error(
      "[handleManagerInstanceDeployed] Pool contract {} does not have an asset",
      [tryPool.value.toHexString()]
    );
    return;
  }

  const manager = new DataManager(
    Bytes.fromHexString(tryPool.value.toHexString()),
    Bytes.fromHexString(tryInputToken.value.toHexString()),
    event,
    getProtocolData()
  );

  const market = manager.getMarket();
  manager.getOrUpdateRate(
    InterestRateSide.BORROWER,
    InterestRateType.FIXED,
    BIGDECIMAL_ZERO
  );
  manager.getOrUpdateRate(
    InterestRateSide.LENDER,
    InterestRateType.VARIABLE,
    BIGDECIMAL_ZERO
  );

  // update market with maple specifics
  market.name = outputToken.getToken().name;
  market.outputToken = outputToken.getToken().id;
  market.outputTokenSupply = BIGINT_ZERO;
  market.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  market.exchangeRate = BIGDECIMAL_ZERO; // exchange rate = (inputTokenBalance / outputTokenSupply) OR (totalAssets() / totalSupply())
  market.isActive = false; // controlled with setAsActive
  market.canBorrowFrom = false; // controlled with setAsActive
  market.canUseAsCollateral = false; // collateral is posted during loans separate from any deposits
  market.borrowedToken = Bytes.fromHexString(tryInputToken.value.toHexString());
  market.stableBorrowedTokenBalance = BIGINT_ZERO;
  market.save();
  // TODO: price oracle?
}
