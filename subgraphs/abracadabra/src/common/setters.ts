import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Market, _LiquidationCache } from "../../generated/schema";
import { cauldron } from "../../generated/templates/cauldron/cauldron";
import { getOrCreateLendingProtocol, getOrCreateToken } from "./getters";
import {
  BIGDECIMAL_ZERO,
  BIGDECIMAL_ONE,
  BIGINT_ZERO,
  SECONDS_PER_YEAR,
  MIM,
  XSUSHI_MARKET,
  YV_USDC_MARKET,
  YV_YFI_MARKET,
  YV_WETH_MARKET,
  YV_USDT_MARKET,
  COLLATERIZATION_RATE_PRECISION,
  DEFAULT_DECIMALS,
  LOW_RISK_COLLATERAL_RATE,
  HIGH_RISK_COLLATERAL_RATE,
  STABLE_RISK_COLLATERAL_RATE,
  LOW_RISK_INTEREST_RATE,
  HIGH_RISK_INTEREST_RATE,
  LOW_RISK_LIQUIDATION_PENALTY,
  HIGH_RISK_LIQUIDATION_PENALTY,
} from "../common/constants";
import { bigIntToBigDecimal } from "./utils/numbers";
import { LogRemoveCollateral } from "../../generated/templates/cauldron/cauldron";

export function updateProtocolMarketList(marketAddress: string): void {
  let protocol = getOrCreateLendingProtocol();
  let marketIdList = protocol.marketIdList;
  marketIdList.push(marketAddress);
  protocol.marketIdList = marketIdList;
  protocol.save();
}

export function createMarket(marketAddress: string, blockNumber: BigInt, blockTimestamp: BigInt): void {
  let MarketEntity = new Market(marketAddress);
  let MarketContract = cauldron.bind(Address.fromString(marketAddress));
  let collateralCall = MarketContract.try_collateral();
  if (!collateralCall.reverted) {
    let inputToken = getOrCreateToken(collateralCall.value);
    MarketEntity.protocol = getOrCreateLendingProtocol().id;
    MarketEntity.inputTokens = [inputToken.id];
    MarketEntity.outputToken = MIM;
    MarketEntity.totalValueLockedUSD = BIGDECIMAL_ZERO;
    MarketEntity.totalVolumeUSD = BIGDECIMAL_ZERO;
    MarketEntity.inputTokenBalances = [BIGINT_ZERO];
    MarketEntity.outputToken = getOrCreateToken(Address.fromString(MIM)).id;
    MarketEntity.outputTokenSupply = BIGINT_ZERO;
    MarketEntity.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    MarketEntity.createdTimestamp = blockTimestamp;
    MarketEntity.createdBlockNumber = blockNumber;
    MarketEntity.name = inputToken.name + " Market";
    MarketEntity.isActive = true;
    MarketEntity.canUseAsCollateral = true;
    MarketEntity.canBorrowFrom = true;

    if (marketAddress.toLowerCase() == YV_USDT_MARKET.toLowerCase()) {
      MarketEntity.maximumLTV = bigIntToBigDecimal(
        BigInt.fromI32(LOW_RISK_COLLATERAL_RATE),
        COLLATERIZATION_RATE_PRECISION,
      );
      MarketEntity.liquidationPenalty = bigIntToBigDecimal(
        BigInt.fromI32(LOW_RISK_LIQUIDATION_PENALTY),
        COLLATERIZATION_RATE_PRECISION,
      ).minus(BIGDECIMAL_ONE);
      MarketEntity.liquidationThreshold = bigIntToBigDecimal(
        BigInt.fromI32(LOW_RISK_COLLATERAL_RATE),
        COLLATERIZATION_RATE_PRECISION,
      );
      MarketEntity.stableBorrowRate = bigIntToBigDecimal(
        BigInt.fromI32(LOW_RISK_INTEREST_RATE),
        DEFAULT_DECIMALS,
      ).times(SECONDS_PER_YEAR);
    } else if (marketAddress.toLowerCase() == YV_WETH_MARKET.toLowerCase()) {
      MarketEntity.maximumLTV = bigIntToBigDecimal(
        BigInt.fromI32(HIGH_RISK_COLLATERAL_RATE),
        COLLATERIZATION_RATE_PRECISION,
      );
      MarketEntity.liquidationPenalty = bigIntToBigDecimal(
        BigInt.fromI32(HIGH_RISK_LIQUIDATION_PENALTY),
        COLLATERIZATION_RATE_PRECISION,
      ).minus(BIGDECIMAL_ONE);
      MarketEntity.liquidationThreshold = bigIntToBigDecimal(
        BigInt.fromI32(HIGH_RISK_COLLATERAL_RATE),
        COLLATERIZATION_RATE_PRECISION,
      );
      MarketEntity.stableBorrowRate = bigIntToBigDecimal(
        BigInt.fromI32(HIGH_RISK_INTEREST_RATE),
        DEFAULT_DECIMALS,
      ).times(SECONDS_PER_YEAR);
    } else if (marketAddress.toLowerCase() == YV_YFI_MARKET.toLowerCase()) {
      MarketEntity.maximumLTV = bigIntToBigDecimal(
        BigInt.fromI32(HIGH_RISK_COLLATERAL_RATE),
        COLLATERIZATION_RATE_PRECISION,
      );
      MarketEntity.liquidationPenalty = bigIntToBigDecimal(
        BigInt.fromI32(HIGH_RISK_LIQUIDATION_PENALTY),
        COLLATERIZATION_RATE_PRECISION,
      ).minus(BIGDECIMAL_ONE);
      MarketEntity.liquidationThreshold = bigIntToBigDecimal(
        BigInt.fromI32(HIGH_RISK_COLLATERAL_RATE),
        COLLATERIZATION_RATE_PRECISION,
      );
      MarketEntity.stableBorrowRate = bigIntToBigDecimal(
        BigInt.fromI32(HIGH_RISK_INTEREST_RATE),
        DEFAULT_DECIMALS,
      ).times(SECONDS_PER_YEAR);
    } else if (marketAddress.toLowerCase() == YV_USDC_MARKET.toLowerCase()) {
      MarketEntity.maximumLTV = bigIntToBigDecimal(
        BigInt.fromI32(STABLE_RISK_COLLATERAL_RATE),
        COLLATERIZATION_RATE_PRECISION,
      );
      MarketEntity.liquidationPenalty = bigIntToBigDecimal(
        BigInt.fromI32(LOW_RISK_LIQUIDATION_PENALTY),
        COLLATERIZATION_RATE_PRECISION,
      ).minus(BIGDECIMAL_ONE);
      MarketEntity.liquidationThreshold = bigIntToBigDecimal(
        BigInt.fromI32(STABLE_RISK_COLLATERAL_RATE),
        COLLATERIZATION_RATE_PRECISION,
      );
      MarketEntity.stableBorrowRate = bigIntToBigDecimal(
        BigInt.fromI32(LOW_RISK_INTEREST_RATE),
        DEFAULT_DECIMALS,
      ).times(SECONDS_PER_YEAR);
    } else if (marketAddress.toLowerCase() == XSUSHI_MARKET.toLowerCase()) {
      MarketEntity.maximumLTV = bigIntToBigDecimal(
        BigInt.fromI32(HIGH_RISK_COLLATERAL_RATE),
        COLLATERIZATION_RATE_PRECISION,
      );
      MarketEntity.liquidationPenalty = bigIntToBigDecimal(
        BigInt.fromI32(HIGH_RISK_LIQUIDATION_PENALTY),
        COLLATERIZATION_RATE_PRECISION,
      ).minus(BIGDECIMAL_ONE);
      MarketEntity.liquidationThreshold = bigIntToBigDecimal(
        BigInt.fromI32(HIGH_RISK_COLLATERAL_RATE),
        COLLATERIZATION_RATE_PRECISION,
      );
      MarketEntity.stableBorrowRate = bigIntToBigDecimal(
        BigInt.fromI32(HIGH_RISK_INTEREST_RATE),
        DEFAULT_DECIMALS,
      ).times(SECONDS_PER_YEAR);
    } else {
      let maximumLTVCall = MarketContract.try_COLLATERIZATION_RATE();
      let liquidationPenaltyCall = MarketContract.try_LIQUIDATION_MULTIPLIER();
      let accrueInfoCall = MarketContract.try_accrueInfo();
      if (!maximumLTVCall.reverted && !liquidationPenaltyCall.reverted && !accrueInfoCall.reverted) {
        MarketEntity.maximumLTV = bigIntToBigDecimal(maximumLTVCall.value, COLLATERIZATION_RATE_PRECISION);
        MarketEntity.liquidationPenalty = bigIntToBigDecimal(
          liquidationPenaltyCall.value,
          COLLATERIZATION_RATE_PRECISION,
        ).minus(BIGDECIMAL_ONE);
        MarketEntity.liquidationThreshold = bigIntToBigDecimal(maximumLTVCall.value, COLLATERIZATION_RATE_PRECISION);
        MarketEntity.stableBorrowRate = bigIntToBigDecimal(accrueInfoCall.value.value2, DEFAULT_DECIMALS).times(
          SECONDS_PER_YEAR,
        );
      }
    }
    MarketEntity.depositRate = BIGDECIMAL_ZERO;
    MarketEntity.variableBorrowRate = BIGDECIMAL_ZERO;
  }
  MarketEntity.save();
  updateProtocolMarketList(marketAddress);
}

export function createCachedLiquidation(event: LogRemoveCollateral): void {
  let liquidation = new _LiquidationCache(
    "_Liquidation-" + event.transaction.hash.toHexString() + "_" + event.transactionLogIndex.toString(),
  );
  liquidation.amountCollateral = event.params.share;
  liquidation.save();
}
