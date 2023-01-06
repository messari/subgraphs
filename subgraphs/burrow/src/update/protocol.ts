import { Market } from "../../generated/schema";
import { BD_ZERO } from "../utils/const";
import { getOrCreateProtocol } from "../helpers/protocol";
import { BigInt } from "@graphprotocol/graph-ts";
import { getOrCreateToken } from "../helpers/token";

export function updateProtocol(): void {
  const protocol = getOrCreateProtocol();

  protocol.totalValueLockedUSD = BD_ZERO;
  protocol.cumulativeSupplySideRevenueUSD = BD_ZERO;
  protocol.cumulativeProtocolSideRevenueUSD = BD_ZERO;
  protocol.cumulativeTotalRevenueUSD = BD_ZERO;
  protocol.totalDepositBalanceUSD = BD_ZERO;
  protocol.cumulativeDepositUSD = BD_ZERO;
  protocol.totalBorrowBalanceUSD = BD_ZERO;
  protocol.cumulativeBorrowUSD = BD_ZERO;
  protocol.cumulativeLiquidateUSD = BD_ZERO;
  protocol.openPositionCount = 0;
  protocol.cumulativePositionCount = 0;

  for (let i = 0; i < protocol._marketIds.length; i++) {
    const market = Market.load(protocol._marketIds[i]);
    if (market) {
      const token = getOrCreateToken(market.inputToken);
      // totalValueLockedUSD
      protocol.totalValueLockedUSD = protocol.totalValueLockedUSD
        .plus(market.totalValueLockedUSD)
        .plus(
          market._totalReserved.times(market.inputTokenPriceUSD).div(
            BigInt.fromI32(10)
              .pow((token.decimals + token.extraDecimals) as u8)
              .toBigDecimal()
          )
        );
      // cumulativeSupplySideRevenueUSD
      protocol.cumulativeSupplySideRevenueUSD =
        protocol.cumulativeSupplySideRevenueUSD.plus(
          market.cumulativeSupplySideRevenueUSD
        );
      // cumulativeProtocolSideRevenueUSD
      protocol.cumulativeProtocolSideRevenueUSD =
        protocol.cumulativeProtocolSideRevenueUSD.plus(
          market.cumulativeProtocolSideRevenueUSD
        );
      // cumulativeTotalRevenueUSD
      protocol.cumulativeTotalRevenueUSD =
        protocol.cumulativeTotalRevenueUSD.plus(
          market.cumulativeTotalRevenueUSD
        );
      // totalDepositBalanceUSD
      protocol.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD.plus(
        market.totalDepositBalanceUSD
      );
      // cumulativeDepositUSD
      protocol.cumulativeDepositUSD = protocol.cumulativeDepositUSD.plus(
        market.cumulativeDepositUSD
      );
      // totalBorrowBalanceUSD
      protocol.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD.plus(
        market.totalBorrowBalanceUSD
      );
      // cumulativeBorrowUSD
      protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(
        market.cumulativeBorrowUSD
      );
      // cumulativeLiquidateUSD
      protocol.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD.plus(
        market.cumulativeLiquidateUSD
      );
      // openPositionCount
      protocol.openPositionCount =
        protocol.openPositionCount + market.openPositionCount;
      // cumulativePositionCount
      protocol.cumulativePositionCount =
        protocol.cumulativePositionCount +
        market.openPositionCount +
        market.closedPositionCount;
    }
  }

  protocol.save();
}
