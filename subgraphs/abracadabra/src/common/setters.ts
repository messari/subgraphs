import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Market, LiquidateProxy, Token } from "../../generated/schema";
import {
  Cauldron,
  LogRemoveCollateral,
} from "../../generated/templates/Cauldron/Cauldron";
import {
  getOrCreateInterestRate,
  getOrCreateLendingProtocol,
  getOrCreateToken,
} from "./getters";
import {
  BIGDECIMAL_ZERO,
  BIGDECIMAL_ONE,
  BIGINT_ZERO,
  BIGDECIMAL_ONE_HUNDRED,
  SECONDS_PER_YEAR,
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
  InterestRateSide,
  InterestRateType,
  AVAX_JOE_BAR_MARKET_ADDRESS,
} from "./constants";
import { bigIntToBigDecimal } from "./utils/numbers";

export function updateProtocolMarketList(marketAddress: string): void {
  const protocol = getOrCreateLendingProtocol();
  const marketIDList = protocol.marketIDList;
  marketIDList.push(marketAddress);
  protocol.marketIDList = marketIDList;
  protocol.save();
}

export function createMarket(
  marketAddress: string,
  blockNumber: BigInt,
  blockTimestamp: BigInt
): void {
  const MarketEntity = new Market(marketAddress);
  const MarketContract = Cauldron.bind(Address.fromString(marketAddress));
  const collateralCall = MarketContract.try_collateral();
  const protocol = getOrCreateLendingProtocol();
  if (!collateralCall.reverted) {
    const inputToken = getOrCreateToken(collateralCall.value);
    MarketEntity.protocol = protocol.id;
    MarketEntity.inputToken = inputToken.id;
    MarketEntity.totalValueLockedUSD = BIGDECIMAL_ZERO;
    MarketEntity.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    MarketEntity.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    MarketEntity.inputTokenBalance = BIGINT_ZERO;
    MarketEntity.outputTokenSupply = BIGINT_ZERO;
    MarketEntity.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    MarketEntity.createdTimestamp = blockTimestamp;
    MarketEntity.createdBlockNumber = blockNumber;
    MarketEntity.maximumLTV = BIGDECIMAL_ZERO;
    MarketEntity.inputTokenPriceUSD = inputToken.lastPriceUSD!;
    MarketEntity.liquidationThreshold = BIGDECIMAL_ZERO;
    MarketEntity.liquidationPenalty = BIGDECIMAL_ZERO;
    MarketEntity.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    MarketEntity.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    MarketEntity.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    MarketEntity.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    MarketEntity.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    MarketEntity.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    MarketEntity.rates = [];
    MarketEntity.positionCount = 0;
    MarketEntity.openPositionCount = 0;
    MarketEntity.closedPositionCount = 0;
    MarketEntity.lendingPositionCount = 0;
    MarketEntity.borrowingPositionCount = 0;
    MarketEntity.name = inputToken.name + " Market";
    MarketEntity.isActive = true;
    MarketEntity.canUseAsCollateral = true;
    MarketEntity.canBorrowFrom = true;
    const interestRate = getOrCreateInterestRate(MarketEntity.id);
    interestRate.side = InterestRateSide.BORROW;
    interestRate.type = InterestRateType.STABLE;
    if (marketAddress.toLowerCase() == YV_USDT_MARKET.toLowerCase()) {
      MarketEntity.maximumLTV = bigIntToBigDecimal(
        BigInt.fromI32(LOW_RISK_COLLATERAL_RATE),
        COLLATERIZATION_RATE_PRECISION
      ).times(BIGDECIMAL_ONE_HUNDRED);
      MarketEntity.liquidationPenalty = bigIntToBigDecimal(
        BigInt.fromI32(LOW_RISK_LIQUIDATION_PENALTY),
        COLLATERIZATION_RATE_PRECISION
      )
        .minus(BIGDECIMAL_ONE)
        .times(BIGDECIMAL_ONE_HUNDRED);
      MarketEntity.liquidationThreshold = bigIntToBigDecimal(
        BigInt.fromI32(LOW_RISK_COLLATERAL_RATE),
        COLLATERIZATION_RATE_PRECISION
      ).times(BIGDECIMAL_ONE_HUNDRED);
      interestRate.rate = bigIntToBigDecimal(
        BigInt.fromI32(LOW_RISK_INTEREST_RATE),
        DEFAULT_DECIMALS
      )
        .times(SECONDS_PER_YEAR)
        .times(BIGDECIMAL_ONE_HUNDRED);
      interestRate.save();
      MarketEntity.rates = [interestRate.id];
    } else if (marketAddress.toLowerCase() == YV_WETH_MARKET.toLowerCase()) {
      MarketEntity.maximumLTV = bigIntToBigDecimal(
        BigInt.fromI32(HIGH_RISK_COLLATERAL_RATE),
        COLLATERIZATION_RATE_PRECISION
      ).times(BIGDECIMAL_ONE_HUNDRED);
      MarketEntity.liquidationPenalty = bigIntToBigDecimal(
        BigInt.fromI32(HIGH_RISK_LIQUIDATION_PENALTY),
        COLLATERIZATION_RATE_PRECISION
      )
        .minus(BIGDECIMAL_ONE)
        .times(BIGDECIMAL_ONE_HUNDRED);
      MarketEntity.liquidationThreshold = bigIntToBigDecimal(
        BigInt.fromI32(HIGH_RISK_COLLATERAL_RATE),
        COLLATERIZATION_RATE_PRECISION
      ).times(BIGDECIMAL_ONE_HUNDRED);
      interestRate.rate = bigIntToBigDecimal(
        BigInt.fromI32(HIGH_RISK_INTEREST_RATE),
        DEFAULT_DECIMALS
      )
        .times(SECONDS_PER_YEAR)
        .times(BIGDECIMAL_ONE_HUNDRED);
      interestRate.save();
      MarketEntity.rates = [interestRate.id];
    } else if (marketAddress.toLowerCase() == YV_YFI_MARKET.toLowerCase()) {
      MarketEntity.maximumLTV = bigIntToBigDecimal(
        BigInt.fromI32(HIGH_RISK_COLLATERAL_RATE),
        COLLATERIZATION_RATE_PRECISION
      ).times(BIGDECIMAL_ONE_HUNDRED);
      MarketEntity.liquidationPenalty = bigIntToBigDecimal(
        BigInt.fromI32(HIGH_RISK_LIQUIDATION_PENALTY),
        COLLATERIZATION_RATE_PRECISION
      )
        .minus(BIGDECIMAL_ONE)
        .times(BIGDECIMAL_ONE_HUNDRED);
      MarketEntity.liquidationThreshold = bigIntToBigDecimal(
        BigInt.fromI32(HIGH_RISK_COLLATERAL_RATE),
        COLLATERIZATION_RATE_PRECISION
      ).times(BIGDECIMAL_ONE_HUNDRED);
      interestRate.rate = bigIntToBigDecimal(
        BigInt.fromI32(HIGH_RISK_INTEREST_RATE),
        DEFAULT_DECIMALS
      )
        .times(SECONDS_PER_YEAR)
        .times(BIGDECIMAL_ONE_HUNDRED);
      interestRate.save();
      MarketEntity.rates = [interestRate.id];
    } else if (marketAddress.toLowerCase() == YV_USDC_MARKET.toLowerCase()) {
      MarketEntity.maximumLTV = bigIntToBigDecimal(
        BigInt.fromI32(STABLE_RISK_COLLATERAL_RATE),
        COLLATERIZATION_RATE_PRECISION
      ).times(BIGDECIMAL_ONE_HUNDRED);
      MarketEntity.liquidationPenalty = bigIntToBigDecimal(
        BigInt.fromI32(LOW_RISK_LIQUIDATION_PENALTY),
        COLLATERIZATION_RATE_PRECISION
      )
        .minus(BIGDECIMAL_ONE)
        .times(BIGDECIMAL_ONE_HUNDRED);
      MarketEntity.liquidationThreshold = bigIntToBigDecimal(
        BigInt.fromI32(STABLE_RISK_COLLATERAL_RATE),
        COLLATERIZATION_RATE_PRECISION
      ).times(BIGDECIMAL_ONE_HUNDRED);
      interestRate.rate = bigIntToBigDecimal(
        BigInt.fromI32(LOW_RISK_INTEREST_RATE),
        DEFAULT_DECIMALS
      )
        .times(SECONDS_PER_YEAR)
        .times(BIGDECIMAL_ONE_HUNDRED);
      interestRate.save();
      MarketEntity.rates = [interestRate.id];
    } else if (marketAddress.toLowerCase() == XSUSHI_MARKET.toLowerCase()) {
      MarketEntity.maximumLTV = bigIntToBigDecimal(
        BigInt.fromI32(HIGH_RISK_COLLATERAL_RATE),
        COLLATERIZATION_RATE_PRECISION
      ).times(BIGDECIMAL_ONE_HUNDRED);
      MarketEntity.liquidationPenalty = bigIntToBigDecimal(
        BigInt.fromI32(HIGH_RISK_LIQUIDATION_PENALTY),
        COLLATERIZATION_RATE_PRECISION
      )
        .minus(BIGDECIMAL_ONE)
        .times(BIGDECIMAL_ONE_HUNDRED);
      MarketEntity.liquidationThreshold = bigIntToBigDecimal(
        BigInt.fromI32(HIGH_RISK_COLLATERAL_RATE),
        COLLATERIZATION_RATE_PRECISION
      ).times(BIGDECIMAL_ONE_HUNDRED);
      interestRate.rate = bigIntToBigDecimal(
        BigInt.fromI32(HIGH_RISK_INTEREST_RATE),
        DEFAULT_DECIMALS
      )
        .times(SECONDS_PER_YEAR)
        .times(BIGDECIMAL_ONE_HUNDRED);
      interestRate.save();
      MarketEntity.rates = [interestRate.id];
    } else {
      const maximumLTVCall = MarketContract.try_COLLATERIZATION_RATE();
      const liquidationPenaltyCall =
        MarketContract.try_LIQUIDATION_MULTIPLIER();
      const accrueInfoCall = MarketContract.try_accrueInfo();
      if (
        !maximumLTVCall.reverted &&
        !liquidationPenaltyCall.reverted &&
        !accrueInfoCall.reverted
      ) {
        MarketEntity.maximumLTV = bigIntToBigDecimal(
          maximumLTVCall.value,
          COLLATERIZATION_RATE_PRECISION
        ).times(BIGDECIMAL_ONE_HUNDRED);
        MarketEntity.liquidationPenalty = bigIntToBigDecimal(
          liquidationPenaltyCall.value,
          COLLATERIZATION_RATE_PRECISION
        )
          .minus(BIGDECIMAL_ONE)
          .times(BIGDECIMAL_ONE_HUNDRED);
        MarketEntity.liquidationThreshold = bigIntToBigDecimal(
          maximumLTVCall.value,
          COLLATERIZATION_RATE_PRECISION
        ).times(BIGDECIMAL_ONE_HUNDRED);
        interestRate.rate = bigIntToBigDecimal(
          accrueInfoCall.value.value2,
          DEFAULT_DECIMALS
        )
          .times(SECONDS_PER_YEAR)
          .times(BIGDECIMAL_ONE_HUNDRED);
        interestRate.save();
        MarketEntity.rates = [interestRate.id];
      }
    }
    const oracleCall = MarketContract.try_oracle();
    if (!oracleCall.reverted) {
      MarketEntity.priceOracle = oracleCall.value;
    }
  }
  MarketEntity.save();
  protocol.totalPoolCount = protocol.totalPoolCount + 1;
  protocol.save();
  updateProtocolMarketList(marketAddress);
}

export function createLiquidateEvent(event: LogRemoveCollateral): void {
  const liquidation = new LiquidateProxy(
    "liquidate-" +
      event.transaction.hash.toHexString() +
      "-" +
      event.transactionLogIndex.toString()
  );
  liquidation.amount = event.params.share;
  liquidation.save();
}

// Update token price using the exchange rate
// update on the market and token
export function updateTokenPrice(
  rate: BigInt,
  token: Token,
  market: Market,
  blockNumber: BigInt
): void {
  let priceUSD = BIGDECIMAL_ZERO;
  if (rate != BIGINT_ZERO) {
    priceUSD = BIGDECIMAL_ONE.div(bigIntToBigDecimal(rate, token.decimals));
  }

  // fix avax JoeBar price discrepency
  // the exchange rate is way too low
  // it seems like it should be offset by 6 (instead of 18) until 6431888
  // this only affects one deposit
  if (
    market.id.toLowerCase() == AVAX_JOE_BAR_MARKET_ADDRESS.toLowerCase() &&
    blockNumber.lt(BigInt.fromI32(6431889))
  ) {
    priceUSD = BIGDECIMAL_ONE.div(bigIntToBigDecimal(rate, 6));
  }

  // update market
  market.inputTokenPriceUSD = priceUSD;
  market.save();

  // update token
  token.lastPriceUSD = priceUSD;
  token.lastPriceBlockNumber = blockNumber;
  token.save();
}
