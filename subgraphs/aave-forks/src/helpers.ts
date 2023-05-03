// Helpers for the general mapping.ts file
import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { ProtocolData } from "./sdk/manager";
import {
  Market,
  Token,
  _AccountDebtBalance,
  _FlashLoanPremium,
  _MarketList,
} from "../generated/schema";
import { BIGINT_ZERO, BIGINT_ONE, BIGDECIMAL_ZERO } from "./constants";
import { AToken } from "../generated/LendingPool/AToken";

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

// this is more efficient than getMarketByAuxillaryToken()
// but requires a token._market field
export function getMarketFromToken(
  tokenAddress: Address,
  protocolData: ProtocolData
): Market | null {
  const token = Token.load(tokenAddress);
  if (!token) {
    log.error("[getMarketFromToken] token {} not exist", [
      tokenAddress.toHexString(),
    ]);
    return null;
  }
  if (!token._market) {
    log.warning("[getMarketFromToken] token {} _market = null", [
      tokenAddress.toHexString(),
    ]);
    return getMarketByAuxillaryToken(tokenAddress, protocolData);
  }

  const marketId = Address.fromBytes(token._market!);
  const market = Market.load(marketId);
  return market;
}
export function getBorrowBalances(market: Market, account: Address): BigInt[] {
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

  return [sDebtTokenBalance, vDebtTokenBalance];
}

export function getCollateralBalance(market: Market, account: Address): BigInt {
  const collateralBalance = BIGINT_ZERO;
  const aTokenContract = AToken.bind(Address.fromBytes(market.outputToken!));
  const balanceResult = aTokenContract.try_balanceOf(account);
  if (balanceResult.reverted) {
    log.warning(
      "[getCollateralBalance]failed to get aToken {} balance for {}",
      [market.outputToken!.toHexString(), account.toHexString()]
    );
    return collateralBalance;
  }

  return balanceResult.value;
}

export function getOrCreateFlashloanPremium(
  procotolData: ProtocolData
): _FlashLoanPremium {
  let flashloanPremium = _FlashLoanPremium.load(procotolData.protocolID);
  if (!flashloanPremium) {
    flashloanPremium = new _FlashLoanPremium(procotolData.protocolID);
    flashloanPremium.premiumRateTotal = BIGDECIMAL_ZERO;
    flashloanPremium.premiumRateToProtocol = BIGDECIMAL_ZERO;
    flashloanPremium.premiumUSDToDeduct = BIGDECIMAL_ZERO;
    flashloanPremium.save();
  }
  return flashloanPremium;
}

export function getOrCreateAccountDebtBalance(
  market: Market,
  account: Address
): _AccountDebtBalance {
  const id = account.concat(market.id);
  let accountDebtBalance = _AccountDebtBalance.load(id);
  if (!accountDebtBalance) {
    accountDebtBalance = new _AccountDebtBalance(id);
    accountDebtBalance.sTokenBalance = BIGINT_ZERO;
    accountDebtBalance.vTokenBalance = BIGINT_ZERO;
    accountDebtBalance.save();
  }
  return accountDebtBalance;
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
  if (!market._prePauseState || market._prePauseState!.length !== 3) {
    log.error(
      "[restorePrePauseState] _prePauseState for market {} is not set correctly",
      [market.id.toHexString()]
    );
    return;
  }
  market.isActive = market._prePauseState![0];
  market.canUseAsCollateral = market._prePauseState![1];
  market.canBorrowFrom = market._prePauseState![2];
  market.save();
}

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function rayToWad(a: BigInt): BigInt {
  const halfRatio = BigInt.fromI32(10).pow(9).div(BigInt.fromI32(2));
  return halfRatio.plus(a).div(BigInt.fromI32(10).pow(9));
}

export function wadToRay(a: BigInt): BigInt {
  const result = a.times(BigInt.fromI32(10).pow(9));
  return result;
}

// n => 10^n
export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let result = BIGINT_ONE;
  const ten = BigInt.fromI32(10);
  for (let i = 0; i < decimals; i++) {
    result = result.times(ten);
  }
  return result.toBigDecimal();
}

export function equalsIgnoreCase(a: string, b: string): boolean {
  return a.replace("-", "_").toLowerCase() == b.replace("-", "_").toLowerCase();
}
