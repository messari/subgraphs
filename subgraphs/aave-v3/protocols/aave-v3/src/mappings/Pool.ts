import { log } from "@graphprotocol/graph-ts";
import {
  Borrow,
  LiquidationCall,
  MintedToTreasury,
  Pool,
  Repay,
  ReserveDataUpdated,
  Supply,
  Withdraw,
} from "../../../../generated/templates/Pool/Pool";
import {
  createBorrow,
  createDeposit,
  createLiquidate,
  createRepay,
  createWithdraw,
} from "../entities/event";
import { updateMarketRates } from "../entities/market";
import { updateReserveAccruedToTreasury } from "../entities/reserve";
import { BIGINT_ZERO } from "../../../../src/utils/constants";
import { rayDiv } from "../../../../src/utils/numbers";

export function handleBorrow(event: Borrow): void {
  createBorrow(
    event,
    event.params.reserve,
    event.params.user,
    event.params.amount
  );
}

export function handleLiquidationCall(event: LiquidationCall): void {
  createLiquidate(
    event,
    event.params.collateralAsset,
    event.params.liquidatedCollateralAmount,
    event.params.debtAsset,
    event.params.debtToCover,
    event.params.liquidator,
    event.params.user
  );
}

export function handleMintedToTreasury(event: MintedToTreasury): void {
  const pool = Pool.bind(event.address);
  const accruedToTreasury = rayDiv(
    event.params.amountMinted,
    pool.getReserveNormalizedIncome(event.params.reserve)
  );
  updateReserveAccruedToTreasury(
    event,
    event.params.reserve,
    accruedToTreasury
  );
  updateReserveAccruedToTreasury(event, event.params.reserve, BIGINT_ZERO);
}

export function handleRepay(event: Repay): void {
  createRepay(
    event,
    event.params.reserve,
    event.params.repayer,
    event.params.amount
  );
}

export function handleReserveDataUpdated(event: ReserveDataUpdated): void {
  updateMarketRates(event);
  const pool = Pool.bind(event.address);
  const reserveData = pool.try_getReserveData(event.params.reserve);
  if (reserveData.reverted) {
    log.error("Pool.getReserveData reverted for reserve: {}", [
      event.params.reserve.toHexString(),
    ]);
    return;
  }
  updateReserveAccruedToTreasury(
    event,
    event.params.reserve,
    reserveData.value.accruedToTreasury
  );
}

export function handleSupply(event: Supply): void {
  createDeposit(
    event,
    event.params.reserve,
    event.params.user,
    event.params.amount
  );
}

export function handleWithdraw(event: Withdraw): void {
  createWithdraw(
    event,
    event.params.reserve,
    event.params.to,
    event.params.amount
  );
}
