import { Address, BigInt, dataSource, ethereum } from "@graphprotocol/graph-ts";

import {
  getMarket,
  getOrCreateFinancialsDailySnapshot,
  getOrCreateStableBorrowerInterestRate,
  getOrCreateToken,
} from "./getters";
import {
  updateFinancialsDailySnapshotRevenue,
  updateMarketDailySnapshotRevenue,
  updateMarketHourlySnapshotRevenue,
} from "./snapshot";
import {
  BIGDECIMAL_MINUS_ONE,
  BIGDECIMAL_TWO,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  Network,
  PERFORMANCE_MANAGER_ADDRESS,
  SECONDS_PER_YEAR,
  UsageType,
} from "../utils/constants";
import { uppercaseNetwork } from "../utils/strings";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "../utils/numbers";

import {
  Account,
  LendingProtocol,
  Market,
  Token,
} from "../../generated/schema";
import { PerformanceFeeManager } from "../../generated/templates/Vault/PerformanceFeeManager";

export function updateUsage(protocol: LendingProtocol, user: Address): void {
  const accountId = user.toHexString();
  let account = Account.load(accountId);
  if (!account) {
    account = new Account(accountId);
    account.save();

    protocol.cumulativeUniqueUsers += 1;
  }
}

export function updateRevenue(
  protocol: LendingProtocol,
  market: Market,
  token: Token,
  amount: BigInt
): void {
  const amountUSD = bigIntToBigDecimal(amount, token.decimals).times(
    token.lastPriceUSD!
  );
  market.cumulativeTotalRevenueUSD =
    market.cumulativeTotalRevenueUSD.plus(amountUSD);
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(amountUSD);

  market.cumulativeSupplySideRevenueUSD =
    market.cumulativeTotalRevenueUSD.div(BIGDECIMAL_TWO);
  market.cumulativeProtocolSideRevenueUSD =
    market.cumulativeTotalRevenueUSD.div(BIGDECIMAL_TWO);
  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.div(BIGDECIMAL_TWO);
  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.div(BIGDECIMAL_TWO);
}

export function updateDepositBalance(
  protocol: LendingProtocol,
  market: Market,
  token: Token,
  amount: BigInt,
  usageType: string
): void {
  market.inputTokenBalance = market.inputTokenBalance.plus(amount);

  let amountUSD = bigIntToBigDecimal(amount, token.decimals).times(
    token.lastPriceUSD!
  );
  if (usageType == UsageType.DEPOSIT) {
    market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(amountUSD);
    protocol.cumulativeDepositUSD =
      protocol.cumulativeDepositUSD.plus(amountUSD);
  } else if (usageType == UsageType.LIQUIDATE) {
    amountUSD = amountUSD.times(BIGDECIMAL_MINUS_ONE);
    market.cumulativeLiquidateUSD =
      market.cumulativeLiquidateUSD.plus(amountUSD);
    protocol.cumulativeLiquidateUSD =
      protocol.cumulativeLiquidateUSD.plus(amountUSD);
  }
}

export function updateBorrowBalance(
  protocol: LendingProtocol,
  market: Market,
  token: Token,
  amount: BigInt,
  usageType: string
): void {
  market._borrowBalance = market._borrowBalance.plus(amount);

  if (usageType == UsageType.BORROW) {
    const amountUSD = bigIntToBigDecimal(amount, token.decimals).times(
      token.lastPriceUSD!
    );
    market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(amountUSD);
    protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(amountUSD);
  }
}

export function updateUSDValues(
  protocol: LendingProtocol,
  event: ethereum.Event
): void {
  let protocolTVL = BIGDECIMAL_ZERO;
  let protocolTotalDepositBalanceUSD = BIGDECIMAL_ZERO;
  let protocolTotalBorrowBalanceUSD = BIGDECIMAL_ZERO;

  const allMarkets = protocol._markets;
  for (let i = 0; i < allMarkets.length; i++) {
    const market = getMarket(Address.fromString(allMarkets[i]));

    if (event.block.number.minus(market._lastUpdateBlockNumber) > BIGINT_ZERO) {
      const token = getOrCreateToken(
        Address.fromString(market.inputToken),
        event
      );
      const borrowToken = getOrCreateToken(
        Address.fromString(market._borrowToken),
        event
      );

      market.inputTokenPriceUSD = token.lastPriceUSD!;
      market.totalValueLockedUSD = bigIntToBigDecimal(
        market.inputTokenBalance,
        token.decimals
      ).times(market.inputTokenPriceUSD);
      protocolTVL = protocolTVL.plus(market.totalValueLockedUSD);

      market.totalDepositBalanceUSD = market.totalValueLockedUSD;
      protocolTotalDepositBalanceUSD = protocolTotalDepositBalanceUSD.plus(
        market.totalDepositBalanceUSD
      );
      market.totalBorrowBalanceUSD = bigIntToBigDecimal(
        market._borrowBalance,
        borrowToken.decimals
      ).times(borrowToken.lastPriceUSD!);
      protocolTotalBorrowBalanceUSD = protocolTotalBorrowBalanceUSD.plus(
        market.totalBorrowBalanceUSD
      );

      // Performance Fee
      let performanceFeeDelta = BIGINT_ZERO;
      if (
        [
          Network.ARBITRUM_ONE,
          Network.MAINNET,
          Network.MATIC,
          Network.OPTIMISM,
        ].includes(uppercaseNetwork(dataSource.network()))
      ) {
        const performanceFeeManagerContract = PerformanceFeeManager.bind(
          Address.fromString(
            PERFORMANCE_MANAGER_ADDRESS.get(
              uppercaseNetwork(dataSource.network())
            )
          )
        );
        const tokenBalancesCall =
          performanceFeeManagerContract.try_tokenBalances(
            Address.fromString(market.inputToken)
          );
        if (!tokenBalancesCall.reverted) {
          performanceFeeDelta = tokenBalancesCall.value.minus(
            market._performanceFee
          );
          market._performanceFee = tokenBalancesCall.value;
        }
      }

      // Interest Fee
      const borrowIR = getOrCreateStableBorrowerInterestRate(market.id);
      const interestFeePerSecond = bigDecimalToBigInt(
        bigIntToBigDecimal(market._borrowBalance, borrowToken.decimals)
          .times(borrowIR.rate)
          .div(SECONDS_PER_YEAR)
      );
      const timestampDelta = event.block.timestamp.minus(
        market._lastUpdateTimestamp
      );
      const interestFeeDelta = interestFeePerSecond.times(timestampDelta);
      market._interestFee = market._interestFee.plus(interestFeeDelta);

      const feeDelta = performanceFeeDelta.plus(interestFeeDelta);
      if (feeDelta > BIGINT_ZERO) {
        updateRevenue(protocol, market, token, feeDelta);
        updateMarketHourlySnapshotRevenue(market, token, feeDelta, event);
        updateMarketDailySnapshotRevenue(market, token, feeDelta, event);
        updateFinancialsDailySnapshotRevenue(protocol, token, feeDelta, event);
      }

      market._lastUpdateTimestamp = event.block.timestamp;
      market._lastUpdateBlockNumber = event.block.number;
      market.save();
    }
  }
  protocol.totalValueLockedUSD = protocolTVL;
  protocol.totalDepositBalanceUSD = protocolTotalDepositBalanceUSD;
  protocol.totalBorrowBalanceUSD = protocolTotalBorrowBalanceUSD;
  protocol.save();

  const snapshot = getOrCreateFinancialsDailySnapshot(protocol, event);
  snapshot.save();
}
