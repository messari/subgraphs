// Helpers for the general mapping.ts file
import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { ProtocolData } from "./sdk/manager";
import { Market, _MarketList } from "../generated/schema";
import { BIGINT_ZERO, BIGDECIMAL_ONE } from "./constants";
import { AToken } from "../generated/LendingPool/AToken";
import { bigDecimalToBigInt } from "./sdk/constants";

// returns the market based on any auxillary token
// ie, outputToken, vToken, or sToken
export function getMarketByAuxillaryToken(
  auxillaryToken: Address,
  protocolData: ProtocolData
): Market | null {
  const marketList = _MarketList.load(protocolData.protocolID);
  if (!marketList) {
    log.warning("[getMarketByAuxillaryToken]marketList not found for id {}", [
      protocolData.protocolID.toHexString(),
    ]);
    return null;
  }
  for (let i = 0; i < marketList.markets.length; i++) {
    const market = Market.load(marketList.markets[i]);

    if (!market) {
      continue;
    }

    if (market.outputToken && market.outputToken!.equals(auxillaryToken)) {
      // we found a matching market!
      return market;
    }
    if (market._vToken && market._vToken!.equals(auxillaryToken)) {
      return market;
    }
    if (market._sToken && market._sToken!.equals(auxillaryToken)) {
      return market;
    }
  }

  return null; // no market found
}

export function getBorrowBalance(market: Market, account: Address): BigInt {
  let sDebtTokenBalance = BIGINT_ZERO;
  let vDebtTokenBalance = BIGINT_ZERO;

  // get account's balance of variable debt
  if (market._vToken) {
    const vTokenContract = AToken.bind(Address.fromBytes(market._vToken!));
    const tryVDebtTokenBalance = vTokenContract.try_balanceOf(account);
    vDebtTokenBalance = tryVDebtTokenBalance.reverted
      ? BIGINT_ZERO
      : tryVDebtTokenBalance.value;
  }

  // get account's balance of stable debt
  if (market._sToken) {
    const sTokenContract = AToken.bind(Address.fromBytes(market._sToken!));
    const trySDebtTokenBalance = sTokenContract.try_balanceOf(account);
    sDebtTokenBalance = trySDebtTokenBalance.reverted
      ? BIGINT_ZERO
      : trySDebtTokenBalance.value;
  }

  const totalDebt = sDebtTokenBalance.plus(vDebtTokenBalance);

  return totalDebt;
}

export function getCollateralBalance(market: Market, account: Address): BigInt {
  let collateralBalance = BIGINT_ZERO;
  const aTokenContract = AToken.bind(Address.fromBytes(market.outputToken!));
  const balanceResult = aTokenContract.try_balanceOf(account);
  if (balanceResult.reverted) {
    log.warning(
      "[getCollateralBalance]failed to get aToken {} balance for {}",
      [market.outputToken!.toHexString(), account.toHexString()]
    );
    return collateralBalance;
  }

  let exchangeRate = BIGDECIMAL_ONE;
  if (!market.exchangeRate) {
    log.warning(
      "[getCollateralBalance]market {} exchange rate not set, default to 1.0",
      [market.id.toHexString()]
    );
    return collateralBalance;
  }
  exchangeRate = market.exchangeRate!;

  collateralBalance = bigDecimalToBigInt(
    balanceResult.value.toBigDecimal().times(exchangeRate)
  );
  return collateralBalance;
}

export function storePrePauseState(market: Market): void {
  market._prePauseState = [
    market.isActive,
    market.canUseAsCollateral,
    market.canBorrowFrom,
  ];
  market.save();
}

export function restorePrePauseState(market: Market): void {
  if (!market._prePauseState || market._prePauseState.length !== 3) {
    log.warning(
      "[restorePrePauseState] _prePauseState for market {} is not set correctly",
      [market.id.toHexString()]
    );
    return;
  }
  market.isActive = market._prePauseState[0];
  market.canUseAsCollateral = market._prePauseState[1];
  market.canBorrowFrom = market._prePauseState[2];
  market.save();
}
