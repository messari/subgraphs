import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import {
  LendingProtocol,
  UnderlyingTokenMapping,
} from "../../../../generated/schema";
import { ReserveDataUpdated } from "../../../../generated/templates/LendingPool/LendingPool";
import { MORPHO_AAVE_V2_ADDRESS } from "../../../../src/constants";
import { fetchAssetPrice } from "./fetchers";
import {
  getMarket,
  getOrInitLendingProtocol,
  getOrInitToken,
} from "../../../../src/utils/initializers";
import { _handleReserveUpdate } from "../common";

export class ReserveUpdateParams {
  constructor(
    public readonly event: ethereum.Event,
    public readonly marketAddress: Bytes,
    public readonly protocol: LendingProtocol,
    public readonly reserveSupplyIndex: BigInt,
    public readonly reserveBorrowIndex: BigInt,

    public readonly poolSupplyRate: BigInt,
    public readonly poolBorrowRate: BigInt
  ) {}
}

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
  const protocol = getOrInitLendingProtocol(MORPHO_AAVE_V2_ADDRESS);

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
  _handleReserveUpdate(params);
}
