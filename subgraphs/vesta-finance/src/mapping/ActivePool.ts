import { Address } from "@graphprotocol/graph-ts";
import {
  ActivePoolAssetBalanceUpdated,
  ActivePoolVSTDebtUpdated,
} from "../../generated/ActivePool/ActivePool";
import { PriceFeedV1, StabilityPool } from "../../generated/templates";
import { StabilityPoolManager } from "../../generated/ActivePool/StabilityPoolManager";
import { setMarketAssetBalance, setMarketVSTDebt } from "../entities/market";
import {
  getOrCreateLendingProtocol,
  updateProtocolPriceOracle,
} from "../entities/protocol";
import {
  createStabilityPool,
  getStabilityPool,
} from "../entities/stabilitypool";
import {
  EMPTY_STRING,
  PRICE_ORACLE_V1_ADDRESS,
  STABILITY_POOL_MANAGER,
} from "../utils/constants";

/**
 * Total Asset collateral was updated
 *
 * @param event ActivePoolAssetBalanceUpdated event
 */
export function handleActivePoolAssetBalanceUpdated(
  event: ActivePoolAssetBalanceUpdated
): void {
  if (getOrCreateLendingProtocol()._priceOracle == EMPTY_STRING) {
    updateProtocolPriceOracle(PRICE_ORACLE_V1_ADDRESS);
    PriceFeedV1.create(Address.fromString(PRICE_ORACLE_V1_ADDRESS));
  }

  const asset = event.params._asset;
  if (getStabilityPool(asset) == null) {
    const stabilityPoolManagerContract = StabilityPoolManager.bind(
      Address.fromString(STABILITY_POOL_MANAGER)
    );
    const tryGetAssetStabilityPool =
      stabilityPoolManagerContract.try_getAssetStabilityPool(asset);
    if (!tryGetAssetStabilityPool.reverted) {
      const assetStabilityPool = tryGetAssetStabilityPool.value;
      StabilityPool.create(assetStabilityPool);

      createStabilityPool(asset);
    }
  }

  setMarketAssetBalance(event, asset, event.params._balance);
}

/**
 * VST debt was updated
 *
 * @param event ActivePoolVSTDebtUpdated event
 */
export function handleActivePoolVSTDebtUpdated(
  event: ActivePoolVSTDebtUpdated
): void {
  setMarketVSTDebt(event, event.params._asset, event.params._VSTDebt);
}
