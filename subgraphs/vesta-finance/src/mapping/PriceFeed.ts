import { Address, dataSource, ethereum, log } from "@graphprotocol/graph-ts";
import {
  LastGoodPriceUpdated,
  RegisteredNewOracle,
} from "../../generated/PriceFeedV1/PriceFeedV1";
import {
  TokenPriceUpdated,
  OracleAdded,
} from "../../generated/PriceFeedV2/PriceFeedV2";
import { StabilityPoolManager as StabilityPoolManagerContract } from "../../generated/PriceFeedV2/StabilityPoolManager";
import { StabilityPool as StabilityPoolTemplate } from "../../generated/templates";
import { getOrCreateStabilityPool } from "../entities/market";
import { getOrCreateAssetToken, setCurrentAssetPrice } from "../entities/token";
import {
  STABILITYPOOL_ASSET,
  STABILITY_POOL_MANAGER,
} from "../utils/constants";

/**
 * Emitted whenever latest Asset price is fetched from oracle v1
 *
 * @param event LastGoodPriceUpdated event
 */
export function handleLastGoodPriceUpdated(event: LastGoodPriceUpdated): void {
  setCurrentAssetPrice(
    event.block.number,
    event.params.token,
    event.params._lastGoodPrice
  );
}

/**
 * Emitted whenever latest Asset price is fetched from oracle v2
 *
 * @param event TokenPriceUpdated event
 */
export function handleTokenPriceUpdated(event: TokenPriceUpdated): void {
  setCurrentAssetPrice(
    event.block.number,
    event.params._token,
    event.params._price
  );
}

export function handleRegisteredNewOracle(event: RegisteredNewOracle): void {
  _CreateStabilityPool(event.params.token, event);
}

export function handleOracleAdded(event: OracleAdded): void {
  _CreateStabilityPool(event.params._token, event);
}

/*
// ideally, StabilityPool should be created as data source by StabilityPoolManager,
// But StabilityPoolManager emits no events
// and hosted service does not support callhander for arbitrum-one
// Here we utilize the fact that AdminContract calls both vestaParameters.priceFeed().addOracle
// and stabilityPoolManager.addStabilityPool(_asset, proxyAddress);
// inside [addNewCollateral()](https://github.com/vesta-finance/vesta-protocol-v1/blob/0e89ca77659d14e53f052d5b83d4a7d3aac9ba25/contracts/AdminContract.sol#L78-L99)
*/
export function _CreateStabilityPool(
  asset: Address,
  event: ethereum.Event
): void {
  const stabilityPoolMgrContract = StabilityPoolManagerContract.bind(
    Address.fromString(STABILITY_POOL_MANAGER)
  );
  const tryGetAssetStabilityPool =
    stabilityPoolMgrContract.try_getAssetStabilityPool(asset);
  if (tryGetAssetStabilityPool.reverted) {
    log.error(
      "[_CreateStabilityPool]StabilityPoolManagerContract.try_getAssetStabilityPool reverted at tx {}",
      [event.transaction.hash.toHexString()]
    );
    return;
  }
  const poolAddress = tryGetAssetStabilityPool.value;

  getOrCreateAssetToken(asset);
  getOrCreateStabilityPool(poolAddress, asset, event);

  const context = dataSource.context();
  context.setString(STABILITYPOOL_ASSET, asset.toHexString());
  StabilityPoolTemplate.createWithContext(poolAddress, context);
}
