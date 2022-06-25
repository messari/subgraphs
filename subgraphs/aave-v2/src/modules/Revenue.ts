import {
  getProtocolIdFromCtx,
  getOrCreateLendingProtocol,
  getOrCreateMarketDailySnapshot,
  getOrCreateMarketHourlySnapshot,
  getOrCreateFinancialsDailySnapshot,
} from "../common/initializers";
import * as constants from "../common/constants";
import { bigIntToBigDecimal } from "../common/utils";
import { Address, ethereum, log } from "@graphprotocol/graph-ts";
import { InterestRate, Market, Token } from "../../generated/schema";
import { StableDebtToken as SToken } from "../../generated/templates/LendingPool/StableDebtToken";
import { VariableDebtToken as VToken } from "../../generated/templates/LendingPool/VariableDebtToken";

export function calculateRevenues(
  event: ethereum.Event,
  market: Market,
  token: Token
): void {
  // Calculate and save the fees and revenue on both market and protocol level
  // Additionally calculate the total borrow amount on market and protocol
  // Pull S and V debt tokens to get the amount currently borrowed as stable debt or variable debt
  const STokenContract = SToken.bind(Address.fromString(market._sToken));
  const VTokenContract = VToken.bind(Address.fromString(market._vToken));
  const stableTokenSupply = STokenContract.try_totalSupply();
  const variableTokenSupply = VTokenContract.try_totalSupply();

  const marketDailySnapshot = getOrCreateMarketDailySnapshot(event, market);
  const marketHourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  const financialDailySnapshot = getOrCreateFinancialsDailySnapshot(event.block);

  if (!variableTokenSupply.reverted && !stableTokenSupply.reverted) {
    log.info(
      "IN REPAY FOR MARKET " +
        market.id +
        " STABLE OR VARIABLE TOKEN SUPPLIES " +
        stableTokenSupply.value.toString() +
        " " +
        market.totalStableValueLocked.toString() +
        " " +
        variableTokenSupply.value.toString() +
        " " +
        market.totalVariableValueLocked.toString(),
      []
    );
    market.totalVariableValueLocked = variableTokenSupply.value;
    market.totalStableValueLocked = stableTokenSupply.value;
  } else {
    log.info(
      "IN REPAY FOR MARKET " +
        market.id +
        " COULD NOT GET STABLE OR VARIABLE TOKEN SUPPLIES " +
        stableTokenSupply.reverted.toString() +
        " " +
        variableTokenSupply.reverted.toString(),
      []
    );
  }
  // Subtract prior market total fees protocol.totalRevenueUSD
  const protocolId = getProtocolIdFromCtx();
  const protocol = getOrCreateLendingProtocol(protocolId);
  log.info(
    "SUBTRACTING MARKET FROM PROTOCOL TOTAL FEES " +
      protocol.cumulativeTotalRevenueUSD.toString() +
      " - " +
      market.cumulativeTotalRevenueUSD.toString(),
    []
  );

  // Get the protocol revenues/fees subtracting the market values before calculation
  const protoMinusMarketProtoRevenue = protocol.cumulativeProtocolSideRevenueUSD.minus(
    market.cumulativeProtocolSideRevenueUSD
  );
  const protoMinusMarketSupplyRevenue = protocol.cumulativeSupplySideRevenueUSD.minus(
    market.cumulativeSupplySideRevenueUSD
  );
  const protoMinusMarketFees = protocol.cumulativeTotalRevenueUSD.minus(
    market.cumulativeTotalRevenueUSD
  );

  const rewardTokens = market.rewardTokens;
  if (!rewardTokens) return;

  const stableBorrowRate = InterestRate.load(rewardTokens[0])!;
  const variableBorrowRate = InterestRate.load(rewardTokens[1])!;
  if (!stableBorrowRate || !variableBorrowRate) return;

  // Multiply total Variable value Locked in USD by market.variableBorrowRate
  const varAmountUSD = market.inputTokenPriceUSD.times(
    market.totalVariableValueLocked
      .toBigDecimal()
      .div(constants.BIGINT_TEN.pow(token.decimals as u8).toBigDecimal())
  );

  const varFees = varAmountUSD.times(variableBorrowRate.rate);

  // Multiply total Stable value Locked in USD by market.variableStableRate
  const staAmountUSD = market.inputTokenPriceUSD.times(
    market.totalStableValueLocked
      .toBigDecimal()
      .div(constants.BIGINT_TEN.pow(token.decimals as u8).toBigDecimal())
  );
  const staFees = staAmountUSD.times(stableBorrowRate.rate);

  // Add these values together, save to market and add protocol total
  let oldCumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
  market.cumulativeTotalRevenueUSD = staFees.plus(varFees).truncate(3);
  marketDailySnapshot.dailyTotalRevenueUSD = marketDailySnapshot.dailyTotalRevenueUSD.plus(
    market.cumulativeTotalRevenueUSD.minus(oldCumulativeTotalRevenueUSD)
  );
  marketHourlySnapshot.hourlyTotalRevenueUSD = marketHourlySnapshot.hourlyTotalRevenueUSD.plus(
    market.cumulativeTotalRevenueUSD.minus(oldCumulativeTotalRevenueUSD)
  );
  financialDailySnapshot.dailyTotalRevenueUSD = financialDailySnapshot.dailyTotalRevenueUSD.plus(
    market.cumulativeTotalRevenueUSD.minus(oldCumulativeTotalRevenueUSD)
  )
  protocol.cumulativeTotalRevenueUSD = protoMinusMarketFees.plus(
    market.cumulativeTotalRevenueUSD
  );

  let oldCumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD;
  market.cumulativeProtocolSideRevenueUSD = market.cumulativeTotalRevenueUSD
    .times(bigIntToBigDecimal(market.reserveFactor, 4))
    .truncate(3);
  marketDailySnapshot.dailyProtocolSideRevenueUSD = marketDailySnapshot.dailyProtocolSideRevenueUSD.plus(
    market.cumulativeProtocolSideRevenueUSD.minus(oldCumulativeProtocolSideRevenueUSD)
  );
  marketHourlySnapshot.hourlyProtocolSideRevenueUSD = marketHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(
    market.cumulativeProtocolSideRevenueUSD.minus(oldCumulativeProtocolSideRevenueUSD)
  );
  financialDailySnapshot.dailyProtocolSideRevenueUSD = financialDailySnapshot.dailyProtocolSideRevenueUSD.plus(
    market.cumulativeProtocolSideRevenueUSD.minus(oldCumulativeProtocolSideRevenueUSD)
  )
  protocol.cumulativeProtocolSideRevenueUSD = protoMinusMarketProtoRevenue.plus(
    market.cumulativeProtocolSideRevenueUSD
  );

  let oldCumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD;
  market.cumulativeSupplySideRevenueUSD = market.cumulativeTotalRevenueUSD
    .times(
      constants.BIGDECIMAL_ONE.minus(
        bigIntToBigDecimal(market.reserveFactor, 4)
      )
    )
    .truncate(3);
  marketDailySnapshot.dailySupplySideRevenueUSD = marketDailySnapshot.dailySupplySideRevenueUSD.plus(
    market.cumulativeSupplySideRevenueUSD.minus(oldCumulativeSupplySideRevenueUSD)
  );
  marketHourlySnapshot.hourlySupplySideRevenueUSD = marketHourlySnapshot.hourlySupplySideRevenueUSD.plus(
    market.cumulativeSupplySideRevenueUSD.minus(oldCumulativeSupplySideRevenueUSD)
  );
  financialDailySnapshot.dailySupplySideRevenueUSD = financialDailySnapshot.dailySupplySideRevenueUSD.plus(
    market.cumulativeSupplySideRevenueUSD.minus(oldCumulativeSupplySideRevenueUSD)
  )
  protocol.cumulativeSupplySideRevenueUSD = protoMinusMarketSupplyRevenue.plus(
    market.cumulativeSupplySideRevenueUSD
  );

  // CALCULATE totalBorrowUSD FIELDS ON MARKET AND PROTOCOL ENTITIES
  // The sum in USD of s and v tokens on market is totalBorrowUSD
  // Subtract the previously saved amount of the market TotalBorrowUSD value from the protocol totalBorrowUSD
  // This gets the amount in USD out in borrows on the protocol not including this market
  const tempProtocolBorrowTotal = protocol.cumulativeBorrowUSD.minus(
    market.cumulativeBorrowUSD
  );
  // Sum the amount in USD of the stable borrows and variable borrows currently in use
  market.cumulativeBorrowUSD = staAmountUSD.plus(varAmountUSD);
  // Add this markets new amount out in borrows to the protocol value
  protocol.cumulativeBorrowUSD = tempProtocolBorrowTotal.plus(
    market.cumulativeBorrowUSD
  );

  financialDailySnapshot.save();
  marketHourlySnapshot.save();
  marketDailySnapshot.save();
  protocol.save();
  market.save();
}
