import { BigInt, near } from "@graphprotocol/graph-ts";
import {
  Market,
  MarketDailySnapshot,
  MarketHourlySnapshot,
  FinancialsDailySnapshot,
} from "../../generated/schema";
import { compound } from "../utils/compound";
import { updateApr } from "../utils/rates";
import { getOrCreateToken } from "../helpers/token";
import { BI_ZERO, BD_BI, BD_ZERO } from "../utils/const";

export function updateMarket(
  market: Market,
  dailySnapshot: MarketDailySnapshot,
  hourlySnapshot: MarketHourlySnapshot,
  protocolDailySnapshot: FinancialsDailySnapshot,
  receipt: near.ReceiptWithOutcome
): void {
  const token = getOrCreateToken(market.inputToken);

  /*** update apr and compound values ***/
  updateApr(market, receipt);
  const revenues = compound(market, receipt);
  const protocolRevenue = revenues[0].times(market.inputTokenPriceUSD).div(
    BigInt.fromI32(10)
      .pow((token.decimals + token.extraDecimals) as u8)
      .toBigDecimal()
  );
  const supplyRevenue = revenues[1].times(market.inputTokenPriceUSD).div(
    BigInt.fromI32(10)
      .pow((token.decimals + token.extraDecimals) as u8)
      .toBigDecimal()
  );

  // inputTokenPriceUSD
  market.inputTokenPriceUSD = token.lastPriceUSD!;

  // totalDepositBalanceUSD
  market.inputTokenBalance = BD_BI(market._totalDeposited);
  market.totalDepositBalanceUSD = market.inputTokenBalance
    .toBigDecimal()
    .div(
      BigInt.fromI32(10)
        .pow((token.decimals + token.extraDecimals) as u8)
        .toBigDecimal()
    )
    .times(market.inputTokenPriceUSD);

  // totalValueLockedUSD
  market.totalValueLockedUSD = market.totalDepositBalanceUSD;

  // cumulativeSupplySideRevenueUSD, cumulativeTotalRevenueUSD
  market.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD.plus(protocolRevenue);
  market.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD.plus(supplyRevenue);
  market.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD
    .plus(protocolRevenue)
    .plus(supplyRevenue);

  dailySnapshot.dailySupplySideRevenueUSD =
    dailySnapshot.dailySupplySideRevenueUSD.plus(supplyRevenue);
  dailySnapshot.dailyProtocolSideRevenueUSD =
    dailySnapshot.dailyProtocolSideRevenueUSD.plus(protocolRevenue);
  dailySnapshot.dailyTotalRevenueUSD = dailySnapshot.dailyTotalRevenueUSD.plus(
    supplyRevenue.plus(protocolRevenue)
  );

  hourlySnapshot.hourlySupplySideRevenueUSD =
    hourlySnapshot.hourlySupplySideRevenueUSD.plus(supplyRevenue);
  hourlySnapshot.hourlyProtocolSideRevenueUSD =
    hourlySnapshot.hourlyProtocolSideRevenueUSD.plus(protocolRevenue);
  hourlySnapshot.hourlyTotalRevenueUSD =
    hourlySnapshot.hourlyTotalRevenueUSD.plus(
      supplyRevenue.plus(protocolRevenue)
    );

  protocolDailySnapshot.dailySupplySideRevenueUSD =
    protocolDailySnapshot.dailySupplySideRevenueUSD.plus(supplyRevenue);
  protocolDailySnapshot.dailyProtocolSideRevenueUSD =
    protocolDailySnapshot.dailyProtocolSideRevenueUSD.plus(protocolRevenue);
  protocolDailySnapshot.dailyTotalRevenueUSD =
    protocolDailySnapshot.dailyTotalRevenueUSD.plus(
      supplyRevenue.plus(protocolRevenue)
    );

  // totalBorrowBalanceUSD
  market.totalBorrowBalanceUSD = market._totalBorrowed
    .div(
      BigInt.fromI32(10)
        .pow((token.decimals + token.extraDecimals) as u8)
        .toBigDecimal()
    )
    .times(market.inputTokenPriceUSD);

  // exchangeRate
  market.inputTokenPriceUSD = token.lastPriceUSD!;
  if (market.outputTokenSupply.gt(BI_ZERO)) {
    market.exchangeRate = market.inputTokenBalance
      .toBigDecimal()
      .div(market.outputTokenSupply.toBigDecimal());
  } else {
    market.exchangeRate = BD_ZERO;
  }
  // outputTokenPriceUSD
  market.outputTokenPriceUSD = market.exchangeRate!.times(
    market.inputTokenPriceUSD
  );
}
