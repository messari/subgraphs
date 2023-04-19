import { Address } from "@graphprotocol/graph-ts";
import { UnderlyingTokenMapping } from "../../../generated/schema";
import { ReserveDataUpdated } from "../../../generated/templates/LendingPool/LendingPool";
import { MORPHO_AAVE_V2_ADDRESS, ReserveUpdateParams } from "../../constants";
import {
  fetchAssetPrice,
  fetchMorphoPositionsAaveV2,
  getAaveProtocol,
} from "./fetchers";
import { getMarket, getOrInitToken } from "../../utils/initializers";
import { _handleReserveUpdate } from "../common";

/**
 * Updates the reserve data for the given reserve
 * Since Morpho use indexes to approximate the P2P rates, we can assume that the P2P rates are updated each time the reserve data is updated
 * @param event
 */
export function handleReserveDataUpdated(event: ReserveDataUpdated): void {
  const tokenMapping = UnderlyingTokenMapping.load(event.params.reserve);
  if (!tokenMapping) return; // Not a Morpho market
  const aTokenAddress = Address.fromBytes(tokenMapping.aToken);

  const market = getMarket(aTokenAddress);
  const inputToken = getOrInitToken(event.params.reserve);
  const protocol = getAaveProtocol(MORPHO_AAVE_V2_ADDRESS);

  // update the token price frequently
  const tokenPrice = fetchAssetPrice(market);
  market.inputTokenPriceUSD = tokenPrice;
  inputToken.lastPriceUSD = tokenPrice;
  market.save();
  inputToken.save();

  const params = new ReserveUpdateParams(
    event,
    market.id,
    protocol,
    event.params.liquidityIndex,
    event.params.variableBorrowIndex,
    event.params.liquidityRate,
    event.params.variableBorrowRate
  );

  const morphoPositions = fetchMorphoPositionsAaveV2(market);
  _handleReserveUpdate(params, morphoPositions, market);
}
