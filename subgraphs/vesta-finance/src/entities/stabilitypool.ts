import {
  Address,
  BigDecimal,
  ethereum,
  log,
  BigInt,
} from "@graphprotocol/graph-ts";
import { PriceFeedV1 } from "../../generated/PriceFeedV1/PriceFeedV1";
import {
  BIGDECIMAL_ONE,
  PRICE_ORACLE_V1_ADDRESS,
  VST_ADDRESS,
} from "../utils/constants";
import { bigIntToBigDecimal } from "../utils/numbers";
import { getOrCreateStabilityPool } from "./market";
import { getOrCreateLendingProtocol } from "./protocol";
import { getOrCreateAssetToken } from "./token";

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

function getVSTTokenPrice(event: ethereum.Event): BigDecimal {
  const protocol = getOrCreateLendingProtocol();
  const priceFeedAddress = protocol._priceOracle
    ? protocol._priceOracle
    : PRICE_ORACLE_V1_ADDRESS;

  const priceFeedContract = PriceFeedV1.bind(
    Address.fromString(priceFeedAddress)
  );
  const lastGoodPriceResult = priceFeedContract.try_lastGoodPrice(
    Address.fromString(VST_ADDRESS)
  );

  let VSTPrice = BIGDECIMAL_ONE;
  if (lastGoodPriceResult.reverted) {
    log.warning(
      "[getVSTTokenPrice]Querying price for VST token with Price Feed {} failed at tx {}; Price set to 1.0",
      [priceFeedAddress, event.transaction.hash.toString()]
    );
  } else {
    //convert to decimals with 18 decimals
    VSTPrice = bigIntToBigDecimal(lastGoodPriceResult.value, 18);
  }

  return VSTPrice;
}
