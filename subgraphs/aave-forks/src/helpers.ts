// Helpers for the general mapping.ts file
import {
  Address,
  BigDecimal,
  BigInt,
  ByteArray,
  crypto,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { ProtocolData } from "./sdk/manager";
import {
  Market,
  Token,
  _FlashLoanPremium,
  _MarketList,
} from "../generated/schema";
import {
  BIGINT_ZERO,
  BIGINT_ONE,
  BIGDECIMAL_ZERO,
  IavsTokenType,
  INT_TWO,
} from "./constants";
import { AToken } from "../generated/LendingPool/AToken";
import {
  INT_FIVE,
  INT_NINE,
  INT_TEN,
  INT_THREE,
  InterestRateType,
} from "./sdk/constants";

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

export function storePrePauseState(market: Market): void {
  market._prePauseState = [
    market.isActive,
    market.canUseAsCollateral,
    market.canBorrowFrom,
  ];
  market.save();
}

export function restorePrePauseState(market: Market): void {
  if (!market._prePauseState || market._prePauseState!.length !== INT_THREE) {
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
  const halfRatio = BigInt.fromI32(INT_TEN)
    .pow(INT_NINE as u8)
    .div(BigInt.fromI32(INT_TWO));
  return halfRatio.plus(a).div(BigInt.fromI32(INT_TEN).pow(INT_NINE as u8));
}

export function wadToRay(a: BigInt): BigInt {
  const result = a.times(BigInt.fromI32(INT_TEN).pow(INT_NINE as u8));
  return result;
}

// n => 10^n
export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let result = BIGINT_ONE;
  const ten = BigInt.fromI32(INT_TEN);
  for (let i = 0; i < decimals; i++) {
    result = result.times(ten);
  }
  return result.toBigDecimal();
}

export function equalsIgnoreCase(a: string, b: string): boolean {
  const DASH = "-";
  const UNDERSCORE = "_";
  return (
    a.replace(DASH, UNDERSCORE).toLowerCase() ==
    b.replace(DASH, UNDERSCORE).toLowerCase()
  );
}

// Use the Transfer event before Repay event to detect interestRateType
// We cannot use Burn event because a Repay event may actually mint
// new debt token if the repay amount is less than interest accrued
// e.g. https://polygonscan.com/tx/0x29d7eb7599c35cd6435f29cad40189a4385044c3e56e4bc4fb6b7d34cab451db#eventlog (v2)
// Transfer(): 158; Repay(): 163
// https://optimistic.etherscan.io/tx/0x80d53af69fcaf1852a2bd43b81285e9b6113e5a52fdc74d68cac8828797c9bec#eventlog (v3)
// Transfer(): 0; Repay: 5

export function getInterestRateType(
  event: ethereum.Event
): InterestRateType | null {
  const TRANSFER = "Transfer(address,address,uint256)";
  const eventSignature = crypto.keccak256(ByteArray.fromUTF8(TRANSFER));
  const logs = event.receipt!.logs;
  // Transfer emitted at 4 or 5 index ahead of Repay's event.logIndex
  const logIndexMinus5 = event.logIndex.minus(BigInt.fromI32(INT_FIVE));
  const logIndexMinus3 = event.logIndex.minus(BigInt.fromI32(INT_THREE));

  for (let i = 0; i < logs.length; i++) {
    const thisLog = logs[i];
    if (thisLog.logIndex.lt(logIndexMinus5)) {
      // skip event with logIndex < LogIndexMinus5
      continue;
    }
    if (thisLog.logIndex.equals(logIndexMinus3)) {
      // break if the logIndex = event.logIndex - 3
      break;
    }

    // topics[0] - signature
    const ADDRESS = "address";
    const logSignature = thisLog.topics[0];

    if (logSignature.equals(eventSignature)) {
      const from = ethereum.decode(ADDRESS, thisLog.topics.at(1))!.toAddress();
      const to = ethereum.decode(ADDRESS, thisLog.topics.at(2))!.toAddress();

      if (from.equals(Address.zero()) || to.equals(Address.zero())) {
        // this is a burn or mint event
        const tokenAddress = thisLog.address;
        const token = Token.load(tokenAddress);
        if (!token) {
          log.error("[getInterestRateType]token {} not found tx {}-{}", [
            tokenAddress.toHexString(),
            event.transaction.hash.toHexString(),
            event.transactionLogIndex.toString(),
          ]);
          return null;
        }

        if (token._iavsTokenType == IavsTokenType.STOKEN) {
          return InterestRateType.STABLE;
        }
        if (token._iavsTokenType == IavsTokenType.VTOKEN) {
          return InterestRateType.VARIABLE;
        }
      }
    }

    log.info(
      "[getInterestRateType]event at logIndex {} signature {} not match the exepected Transfer signature {}. tx {}-{} ",
      [
        thisLog.logIndex.toString(),
        logSignature.toHexString(),
        eventSignature.toHexString(),
        event.transaction.hash.toHexString(),
        event.transactionLogIndex.toString(),
      ]
    );
  }
  return null;
}
