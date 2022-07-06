import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { _Reserve } from "../../../../generated/schema";
import { AToken } from "../../../../generated/templates/AToken/AToken";
import { ReserveInitialized } from "../../../../generated/templates/PoolConfigurator/PoolConfigurator";
import { BIGINT_ZERO } from "../../../../src/utils/constants";
import { RAY, rayMul } from "../../../../src/utils/numbers";
import {
  addMarketProtocolSideRevenue,
  addMarketSupplySideRevenue,
  getMarket,
  getMarketById,
  updateMarketBorrowBalance,
  updateOutputTokenSupply,
} from "./market";
import { amountInUSD } from "./price";
import { getOrCreateToken, getTokenById } from "./token";

export function createReserve(event: ReserveInitialized): void {
  const reserve = new _Reserve(event.params.asset.toHexString());
  reserve.aToken = event.params.aToken.toHexString();
  reserve.stableDebtToken = event.params.stableDebtToken.toHexString();
  reserve.variableDebtToken = event.params.variableDebtToken.toHexString();
  reserve.liquidityIndex = RAY;
  reserve.scaledATokenSupply = BIGINT_ZERO;
  reserve.totalATokenSupply = BIGINT_ZERO;
  reserve.scaledVariableDebtSupply = BIGINT_ZERO;
  reserve.variableDebtSupply = BIGINT_ZERO;
  reserve.stableDebtSupply = BIGINT_ZERO;
  reserve.accruedToTreasury = BIGINT_ZERO;
  reserve.treasuryAddress = getReserveTreasuryAddress(event.params.aToken);
  reserve.save();
}

function getReserveTreasuryAddress(aTokenAddress: Address): string {
  const aToken = AToken.bind(aTokenAddress);
  return aToken.RESERVE_TREASURY_ADDRESS().toHexString();
}

export function getReserve(address: Address): _Reserve {
  const asset = getOrCreateToken(address);
  return _Reserve.load(asset.underlyingAsset!)!;
}

export function getReserveOrNull(address: Address): _Reserve | null {
  const asset = getOrCreateToken(address);
  if (asset.underlyingAsset == null) {
    return null;
  }
  return _Reserve.load(asset.underlyingAsset!);
}

export function updateReserveATokenSupply(
  event: ethereum.Event,
  amount: BigInt,
  newLiquidityIndex: BigInt
): void {
  const reserve = getReserve(event.address);
  const balanceIncrease = rayMul(
    reserve.scaledATokenSupply,
    newLiquidityIndex
  ).minus(rayMul(reserve.scaledATokenSupply, reserve.liquidityIndex));
  if (balanceIncrease.gt(BIGINT_ZERO)) {
    addMarketSupplySideRevenue(
      event,
      getMarketById(reserve.id),
      amountInUSD(balanceIncrease, getTokenById(reserve.id))
    );
  }
  reserve.scaledATokenSupply = reserve.scaledATokenSupply.plus(amount);
  reserve.totalATokenSupply = rayMul(
    reserve.scaledATokenSupply,
    newLiquidityIndex
  );
  reserve.liquidityIndex = newLiquidityIndex;
  reserve.save();
  updateOutputTokenSupply(event, reserve.id, reserve.totalATokenSupply);
}

export function updateReserveStableDebtSupply(
  event: ethereum.Event,
  newTotalSupply: BigInt
): void {
  const reserve = getReserve(event.address);
  reserve.stableDebtSupply = newTotalSupply;
  reserve.save();
  updateMarketBorrowBalance(
    event,
    getMarketById(reserve.id),
    reserve.variableDebtSupply.plus(reserve.stableDebtSupply)
  );
}

export function updateReserveVariableDebtSupply(
  event: ethereum.Event,
  change: BigInt,
  newLiquidityIndex: BigInt
): void {
  const reserve = getReserve(event.address);
  reserve.scaledVariableDebtSupply =
    reserve.scaledVariableDebtSupply.plus(change);
  reserve.variableDebtSupply = rayMul(
    reserve.scaledVariableDebtSupply,
    newLiquidityIndex
  );
  reserve.save();
  updateMarketBorrowBalance(
    event,
    getMarketById(reserve.id),
    reserve.variableDebtSupply.plus(reserve.stableDebtSupply)
  );
}

export function updateReserveAccruedToTreasury(
  event: ethereum.Event,
  reserveAddress: Address,
  newAccruedToTreasury: BigInt
): void {
  const reserve = _Reserve.load(reserveAddress.toHexString())!;
  const balanceIncrease = newAccruedToTreasury.minus(reserve.accruedToTreasury);
  if (balanceIncrease.gt(BIGINT_ZERO)) {
    addMarketProtocolSideRevenue(
      event,
      getMarket(reserveAddress),
      amountInUSD(balanceIncrease, getTokenById(reserve.id))
    );
  }
  reserve.accruedToTreasury = newAccruedToTreasury;
  reserve.save();
}
