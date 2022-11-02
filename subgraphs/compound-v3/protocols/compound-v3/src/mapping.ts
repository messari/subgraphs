import { Bytes, log } from "@graphprotocol/graph-ts";
import { CometDeployed } from "../../../generated/Configurator/Configurator";
import { Comet, Supply } from "../../../generated/templates/Comet/Comet";
import {
  getOrCreateLendingProtocol,
  getOrCreateMarket,
  getOrCreateTokenData,
} from "../../../src/utils/getters";
import { getProtocolData } from "./constants";

///////////////////////////////
///// Configurator Events /////
///////////////////////////////

export function handleCometDeployed(event: CometDeployed): void {
  const marketID = event.params.newComet;
  const protocol = getOrCreateLendingProtocol(getProtocolData());
  const market = getOrCreateMarket(
    marketID,
    protocol.id,
    event.block.timestamp,
    event.block.number
  );

  // create base token TokenData
  const tokenDataIDs = [];
  const cometContract = Comet.bind(marketID);
  const tryBaseToken = cometContract.try_baseToken();
  if (!tryBaseToken.reverted) {
    const baseTokenData = getOrCreateTokenData(marketID, tryBaseToken.value);
    baseTokenData.canUseAsCollateral = true;
    baseTokenData.canBorrowFrom = true;
    // TODO: set maxLTV, liquidationThreshold, liquidationPenalty, borrow tokens, output tokens
    baseTokenData.save();
    tokenDataIDs.push(baseTokenData.id);
  }
  // populate collateral token data
  let assetIndex = 0;
  let tryAssetInfo = cometContract.try_getAssetInfo(assetIndex);
  while (!tryAssetInfo.reverted) {
    const inputTokenID = tryAssetInfo.value.value1;
    const tokenData = getOrCreateTokenData(marketID, inputTokenID);

    // add unique TokenData fields
    tokenData.canUseAsCollateral = true;
    tokenData.maximumLTV = tryAssetInfo.value.value4;
    tokenData.liquidationThreshold = tryAssetInfo.value.value5;
    tokenData.supplyCap = tryAssetInfo.value.value7;

    // TODO add TokenOracle

    assetIndex++;
    tryAssetInfo = cometContract.try_getAssetInfo(assetIndex);
  }
}

////////////////////////
///// Comet Events /////
////////////////////////

export function handleSupply(event: Supply): void {
  // TODO: Implement
}
