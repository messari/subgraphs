import { ethereum } from "@graphprotocol/graph-ts";

import {
  AccrueInterest,
  AccrueInterest1,
  CToken,
} from "../../../generated/templates/CToken/CToken";
import { BLOCKS_PER_YEAR, MORPHO_COMPOUND_ADDRESS } from "../../constants";
import { getOrInitLendingProtocol } from "../../utils/initializers";
import { _handleReserveUpdate } from "../common";
import { ReserveUpdateParams } from "../morpho-aave/lending-pool";

export function handleAccrueInterestV1(event: AccrueInterest1): void {
  handleAccrueInterest(event);
}

export function handleAccrueInterestV2(event: AccrueInterest): void {
  handleAccrueInterest(event);
}

function handleAccrueInterest(event: ethereum.Event): void {
  const protocol = getOrInitLendingProtocol(MORPHO_COMPOUND_ADDRESS);
  const cTokenInstance = CToken.bind(event.address);
  const supplyPoolRatePerBlock = cTokenInstance.supplyRatePerBlock();
  const borrowPoolRatePerBlock = cTokenInstance.borrowRatePerBlock();

  const supplyPoolIndex = cTokenInstance.exchangeRateStored();
  const borrowPoolIndex = cTokenInstance.borrowIndex();

  const supplyPoolRate = supplyPoolRatePerBlock.times(BLOCKS_PER_YEAR);
  const borrowPoolRate = borrowPoolRatePerBlock.times(BLOCKS_PER_YEAR);
  _handleReserveUpdate(
    new ReserveUpdateParams(
      event,
      event.address,
      protocol,
      supplyPoolIndex,
      borrowPoolIndex,
      supplyPoolRate,
      borrowPoolRate
    )
  );
}
