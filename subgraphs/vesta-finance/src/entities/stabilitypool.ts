import { Address, ethereum, BigInt } from "@graphprotocol/graph-ts";
import { VST_ADDRESS } from "../utils/constants";
import { bigIntToBigDecimal } from "../utils/numbers";
import { getOrCreateStabilityPool } from "./market";
import { getOrCreateAssetToken, getVSTTokenPrice } from "./token";

export function updateStabilityPoolTVL(
  event: ethereum.Event,
  VSTAmount: BigInt,
  assetAmount: BigInt,
  asset: Address
): void {
  const VSTPrice = getVSTTokenPrice(event);
  const vstToken = getOrCreateAssetToken(Address.fromString(VST_ADDRESS));
  vstToken.lastPriceUSD = VSTPrice;
  vstToken.lastPriceBlockNumber = event.block.number;
  vstToken.save();

  const VSTValue = bigIntToBigDecimal(VSTAmount).times(VSTPrice);
  const assetToken = getOrCreateAssetToken(asset);
  const totalAssetValue = bigIntToBigDecimal(assetAmount).times(
    assetToken.lastPriceUSD!
  );
  const stabilityPoolTVL = VSTValue.plus(totalAssetValue);
  const stabilityPool = getOrCreateStabilityPool(event.address, asset, event);
  stabilityPool.inputTokenBalance = VSTAmount;
  stabilityPool.totalValueLockedUSD = stabilityPoolTVL;
  stabilityPool.totalDepositBalanceUSD = stabilityPoolTVL;
  stabilityPool.inputTokenPriceUSD = VSTPrice;
  stabilityPool.save();
}
