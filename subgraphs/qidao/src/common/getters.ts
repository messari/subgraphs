import { Address, dataSource, ethereum, log } from "@graphprotocol/graph-ts";

import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol } from "./tokens";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_TEN,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  COLLATERAL_PRICE_DECIMALS,
  INT_ONE,
  INT_ZERO,
  InterestRateSide,
  InterestRateType,
  LendingType,
  MAI_TOKEN_ADDRESS,
  MATIC_MAXIMUM_LTV,
  Network,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  ProtocolType,
  RiskType,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  STAKEDAO_STETH_VAULT,
  YEARN_STETH_VAULT,
} from "../utils/constants";
import { bigIntToBigDecimal } from "../utils/numbers";
import { prefixID, uppercaseNetwork } from "../utils/strings";
import { addToArrayAtIndex } from "../utils/arrays";
import { Versions } from "../versions";
import { updateMetadata } from "../common/helpers";
// import { getUsdPricePerToken } from "../prices";

import {
  FinancialsDailySnapshot,
  InterestRate,
  LendingProtocol,
  Market,
  MarketDailySnapshot,
  MarketHourlySnapshot,
  Token,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
} from "../../generated/schema";
import { ERC20 } from "../../generated/templates/Vault/ERC20";
import { ERC20QiStablecoin } from "../../generated/templates/Vault/ERC20QiStablecoin";
import { QiStablecoin } from "../../generated/templates/Vault/QiStablecoin";

export function getOrCreateToken(
  tokenAddress: Address,
  event: ethereum.Event,
  market: Address | null = null
): Token {
  let token = Token.load(tokenAddress.toHexString());

  if (!token) {
    token = new Token(tokenAddress.toHexString());

    const contract = ERC20.bind(tokenAddress);
    token.name = fetchTokenName(contract);
    token.symbol = fetchTokenSymbol(contract);
    token.decimals = fetchTokenDecimals(contract) as i32;
    token.lastPriceBlockNumber = event.block.number;
    if (market) token._market = market.toHexString();
  }

  if (!token.lastPriceUSD || token.lastPriceBlockNumber! < event.block.number) {
    if (
      tokenAddress ==
      Address.fromString(
        MAI_TOKEN_ADDRESS.get(uppercaseNetwork(dataSource.network()))
      )
    ) {
      // TODO
      // token.lastPriceUSD = getUsdPricePerToken(tokenAddress).usdPrice;
      token.lastPriceUSD = BIGDECIMAL_ONE;
    } else {
      if (token._market) {
        // Wrong prices for StakeDao Curve stETh around block 15542061 and Yearn Curve stETH around block 15542065 in ethereum deployment
        if (
          !(
            (Address.fromString(token._market!) == STAKEDAO_STETH_VAULT ||
              Address.fromString(token._market!) == YEARN_STETH_VAULT) &&
            event.block.number.toI32() <= 15563004 &&
            uppercaseNetwork(dataSource.network()) == Network.MAINNET
          )
        ) {
          const contract = ERC20QiStablecoin.bind(
            Address.fromString(token._market!)
          );
          let price = BIGINT_ZERO;
          const priceCall = contract.try_getEthPriceSource();
          if (priceCall.reverted) {
            log.error("Failed to get collateral price for market: {}", [
              token._market!,
            ]);
          } else {
            price = priceCall.value;
          }
          let decimals = INT_ONE as i32;
          const id = prefixID(
            dataSource.network(),
            contract._address.toHexString()
          );
          if (COLLATERAL_PRICE_DECIMALS.has(id)) {
            decimals = COLLATERAL_PRICE_DECIMALS.get(id);
          } else {
            const decimalsCall = contract.try_priceSourceDecimals();
            if (decimalsCall.reverted) {
              log.error("Failed to get collateral decimals for market: {}", [
                token._market!,
              ]);
            } else {
              decimals = decimalsCall.value;
            }
          }

          token.lastPriceUSD = bigIntToBigDecimal(price, decimals);
        }
      }
    }

    if (!token.lastPriceUSD) {
      log.warning("No price set for token: {} at block: {}", [
        tokenAddress.toHexString(),
        event.block.number.toString(),
      ]);
      token.lastPriceUSD = BIGDECIMAL_ZERO;
    } else {
      token.lastPriceBlockNumber = event.block.number;
    }
  }
  token.save();

  return token;
}

export function getOrCreateLendingProtocol(
  event: ethereum.Event
): LendingProtocol {
  const id = MAI_TOKEN_ADDRESS.get(uppercaseNetwork(dataSource.network()));
  let protocol = LendingProtocol.load(id);
  if (!protocol) {
    protocol = new LendingProtocol(id);
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.network = dataSource.network().toUpperCase().replace("-", "_");
    protocol.type = ProtocolType.LENDING;
    protocol.lendingType = LendingType.CDP;
    protocol.riskType = RiskType.ISOLATED;

    const maiToken = getOrCreateToken(Address.fromString(id), event);
    protocol.mintedTokens = [maiToken.id];

    protocol.cumulativeUniqueUsers = INT_ZERO;
    protocol.totalPoolCount = INT_ZERO;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    protocol.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    protocol.mintedTokenSupplies = [BIGINT_ZERO];
    protocol._markets = [];
  }
  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();

  return protocol;
}

export function getOrCreateFinancialsDailySnapshot(
  protocol: LendingProtocol,
  event: ethereum.Event
): FinancialsDailySnapshot {
  const id = `${event.block.timestamp.toI64() / SECONDS_PER_DAY}`;
  let financialsSnapshot = FinancialsDailySnapshot.load(id);
  if (!financialsSnapshot) {
    financialsSnapshot = new FinancialsDailySnapshot(id);
    financialsSnapshot.protocol = protocol.id;

    financialsSnapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyDepositUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyBorrowUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyLiquidateUSD = BIGDECIMAL_ZERO;

    financialsSnapshot.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyRepayUSD = BIGDECIMAL_ZERO;
  }
  financialsSnapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialsSnapshot.mintedTokenSupplies = protocol.mintedTokenSupplies;
  financialsSnapshot.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialsSnapshot.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialsSnapshot.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;
  financialsSnapshot.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
  financialsSnapshot.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
  financialsSnapshot.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
  financialsSnapshot.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
  financialsSnapshot.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;
  financialsSnapshot.blockNumber = event.block.number;
  financialsSnapshot.timestamp = event.block.timestamp;

  return financialsSnapshot;
}

export function getOrCreateUsageMetricsHourlySnapshot(
  protocol: LendingProtocol,
  event: ethereum.Event
): UsageMetricsHourlySnapshot {
  const hour = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  const id = `${hour}`;
  let usageMetrics = UsageMetricsHourlySnapshot.load(id);
  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(id);
    usageMetrics.protocol = protocol.id;
    usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

    usageMetrics.hourlyActiveUsers = INT_ZERO;
    usageMetrics.hourlyTransactionCount = INT_ZERO;
    usageMetrics.hourlyDepositCount = INT_ZERO;
    usageMetrics.hourlyWithdrawCount = INT_ZERO;
    usageMetrics.hourlyBorrowCount = INT_ZERO;
    usageMetrics.hourlyRepayCount = INT_ZERO;
    usageMetrics.hourlyLiquidateCount = INT_ZERO;
  }
  usageMetrics.blockNumber = event.block.number;
  usageMetrics.timestamp = event.block.timestamp;

  return usageMetrics;
}

export function getOrCreateUsageMetricsDailySnapshot(
  protocol: LendingProtocol,
  event: ethereum.Event
): UsageMetricsDailySnapshot {
  const id = `${event.block.timestamp.toI64() / SECONDS_PER_DAY}`;
  let usageMetrics = UsageMetricsDailySnapshot.load(id);
  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id);
    usageMetrics.protocol = protocol.id;
    usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
    usageMetrics.totalPoolCount = protocol.totalPoolCount;

    usageMetrics.dailyActiveUsers = INT_ZERO;
    usageMetrics.dailyTransactionCount = INT_ZERO;
    usageMetrics.dailyDepositCount = INT_ZERO;
    usageMetrics.dailyWithdrawCount = INT_ZERO;
    usageMetrics.dailyBorrowCount = INT_ZERO;
    usageMetrics.dailyRepayCount = INT_ZERO;
    usageMetrics.dailyLiquidateCount = INT_ZERO;
  }
  usageMetrics.blockNumber = event.block.number;
  usageMetrics.timestamp = event.block.timestamp;

  return usageMetrics;
}

export function getOrCreateStableBorrowerInterestRate(
  marketID: string
): InterestRate {
  const rate = new InterestRate(
    `${InterestRateSide.BORROWER}-${InterestRateType.STABLE}-${marketID}`
  );
  rate.rate = BIGDECIMAL_ZERO;
  rate.side = InterestRateSide.BORROWER;
  rate.type = InterestRateType.STABLE;
  rate.save();
  return rate;
}

export function createERC20Market(
  protocol: LendingProtocol,
  token: Token,
  borrowToken: Token,
  event: ethereum.Event
): void {
  const id = event.address.toHexString();
  let market = Market.load(id);
  if (!market) {
    const contract = ERC20QiStablecoin.bind(event.address);
    market = new Market(id);
    market.protocol = protocol.id;
    market.name = contract.name();
    market.isActive = true;
    market.canUseAsCollateral = true;
    market.canBorrowFrom = true;
    market.inputToken = token.id;
    market.rates = [getOrCreateStableBorrowerInterestRate(id).id];
    market.createdTimestamp = event.block.timestamp;
    market.createdBlockNumber = event.block.number;
    // Set liquidationPenalty to 10 by default, in case it can't be read from contract
    market.liquidationPenalty = BIGDECIMAL_TEN;
    // Read LTV and liquidationPenalty from contract
    updateMetadata(market);
    market.totalValueLockedUSD = BIGDECIMAL_ZERO;
    market.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    market.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    market.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    market.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    market.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    market.inputTokenBalance = BIGINT_ZERO;
    market.inputTokenPriceUSD = BIGDECIMAL_ZERO;
    market.outputTokenSupply = BIGINT_ZERO;
    market.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    market.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    market._borrowToken = borrowToken.id;
    market._borrowBalance = BIGINT_ZERO;
    market._performanceFee = BIGINT_ZERO;

    market.save();

    protocol.totalPoolCount += 1;
    protocol._markets = addToArrayAtIndex(protocol._markets, market.id);
  }
}

export function createMaticMarket(
  protocol: LendingProtocol,
  token: Token,
  borrowToken: Token,
  event: ethereum.Event
): void {
  const id = event.address.toHexString();
  let market = Market.load(id);
  if (!market) {
    const contract = QiStablecoin.bind(event.address);
    market = new Market(id);
    market.protocol = protocol.id;
    market.name = contract.name();
    market.isActive = true;
    market.canUseAsCollateral = true;
    market.canBorrowFrom = true;
    market.inputToken = token.id;
    market.rates = [getOrCreateStableBorrowerInterestRate(id).id];
    market.createdTimestamp = event.block.timestamp;
    market.createdBlockNumber = event.block.number;
    market.liquidationPenalty = BIGDECIMAL_TEN;
    market.maximumLTV = MATIC_MAXIMUM_LTV;
    market.liquidationThreshold = MATIC_MAXIMUM_LTV;
    market.totalValueLockedUSD = BIGDECIMAL_ZERO;
    market.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    market.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    market.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    market.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    market.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    market.inputTokenBalance = BIGINT_ZERO;
    market.inputTokenPriceUSD = BIGDECIMAL_ZERO;
    market.outputTokenSupply = BIGINT_ZERO;
    market.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    market.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    market._borrowToken = borrowToken.id;
    market._borrowBalance = BIGINT_ZERO;
    market._performanceFee = BIGINT_ZERO;

    market.save();

    protocol.totalPoolCount += 1;
    protocol._markets = addToArrayAtIndex(protocol._markets, market.id);
  }
}

export function getMarket(address: Address): Market {
  return Market.load(address.toHexString())!;
}

export function getOrCreateMarketHourlySnapshot(
  market: Market,
  event: ethereum.Event
): MarketHourlySnapshot {
  const hour: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  const id = `${market.id}-${hour}`;
  let marketSnapshot = MarketHourlySnapshot.load(id);
  if (!marketSnapshot) {
    marketSnapshot = new MarketHourlySnapshot(id);
    marketSnapshot.protocol = market.protocol;
    marketSnapshot.market = market.id;
    marketSnapshot.rates = market.rates;
    marketSnapshot.hourlyDepositUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyBorrowUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyLiquidateUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyWithdrawUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyRepayUSD = BIGDECIMAL_ZERO;

    marketSnapshot.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;
  }
  marketSnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  marketSnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketSnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketSnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketSnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketSnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;

  marketSnapshot.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD;
  marketSnapshot.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD;
  marketSnapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;

  marketSnapshot.inputTokenBalance = market.inputTokenBalance;
  marketSnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  marketSnapshot.outputTokenSupply = market.outputTokenSupply;
  marketSnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketSnapshot.blockNumber = event.block.number;
  marketSnapshot.timestamp = event.block.timestamp;

  return marketSnapshot;
}

export function getOrCreateMarketDailySnapshot(
  market: Market,
  event: ethereum.Event
): MarketDailySnapshot {
  const day: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  const id = `${market.id}-${day}`;
  let marketSnapshot = MarketDailySnapshot.load(id);
  if (!marketSnapshot) {
    marketSnapshot = new MarketDailySnapshot(id);
    marketSnapshot.protocol = market.protocol;
    marketSnapshot.market = market.id;
    marketSnapshot.rates = market.rates;
    marketSnapshot.dailyDepositUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyBorrowUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyRepayUSD = BIGDECIMAL_ZERO;

    marketSnapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketSnapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
  }
  marketSnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  marketSnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketSnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketSnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketSnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketSnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;

  marketSnapshot.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD;
  marketSnapshot.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD;
  marketSnapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;

  marketSnapshot.inputTokenBalance = market.inputTokenBalance;
  marketSnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  marketSnapshot.outputTokenSupply = market.outputTokenSupply;
  marketSnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketSnapshot.blockNumber = event.block.number;
  marketSnapshot.timestamp = event.block.timestamp;

  return marketSnapshot;
}
