import { log } from "@graphprotocol/graph-ts";
import {
  Borrow,
  LiquidationCall,
  Repay,
  LendingPool,
  Deposit,
  ReserveDataUpdated,
  Withdraw,
} from "../../generated/templates/LendingPool/LendingPool";
import {
  createBorrow,
  createDeposit,
  createLiquidate,
  createRepay,
  createWithdraw,
} from "../common/event";
import { updateMarketRates } from "../common/market";
import { updateReserveAccruedToTreasury } from "../common/reserve";


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
  const pool = LendingPool.bind(event.address);
  const reserveData = pool.try_getReserveData(event.params.reserve);
  if (reserveData.reverted) {
    log.error("Pool.getReserveData reverted for reserve: {}", [
      event.params.reserve.toHexString(),
    ]);
    return;
  }
  // updateReserveAccruedToTreasury(
  //   event,
  //   event.params.reserve,
  //   reserveData.value.accruedToTreasury
  // );
}

export function handleSupply(event: Deposit): void {
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
