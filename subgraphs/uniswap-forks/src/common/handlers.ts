import { ethereum, BigInt, log } from "@graphprotocol/graph-ts";
import { getOrCreateAccount, getOrCreatePosition, getOrCreateTransfer } from "./getters";
import { BIGINT_ZERO, TransferType } from "./constants";
import { LiquidityPool, _PositionCounter } from "../../generated/schema";
import { ADDRESS_ZERO } from "../../../ellipsis-finance/src/common/constants";

// Handle data from transfer event for mints. Used to populate Deposit entity in the Mint event.
export function handleTransferMint(
  event: ethereum.Event,
  pool: LiquidityPool,
  value: BigInt,
  to: string
): void {
  const transfer = getOrCreateTransfer(event);

  // Tracks supply of minted LP tokens
  pool.outputTokenSupply = pool.outputTokenSupply!.plus(value);

  // if - create new mint if no mints so far or if last one is done already
  // else - This is done to remove a potential feeto mint --- Not active
  if (!transfer.type) {
    transfer.type = TransferType.MINT;

    // Address that is minted to
    transfer.sender = to;
    transfer.liquidity = value;
  } else if (transfer.type == TransferType.MINT) {
    // Updates the liquidity if the previous mint was a fee mint
    // Address that is minted to
    transfer.sender = to;
    transfer.liquidity = value;
  }

  transfer.save();
  pool.save();
}

/**
 * There are two Transfer event handlers for Burns because when the LP token is burned,
 * there the LP tokens are first transfered to the liquidity pool, and then the LP tokens are burned
 * to the null address from the particular liquidity pool.
 */

// Handle data from transfer event for burns. Used to populate Deposit entity in the Burn event.
export function handleTransferToPoolBurn(
  event: ethereum.Event,
  from: string
): void {
  const transfer = getOrCreateTransfer(event);

  transfer.type = TransferType.BURN;
  transfer.sender = from;

  transfer.save();
}

// Handle data from transfer event for burns. Used to populate Deposit entity in the Burn event.
export function handleTransferBurn(
  event: ethereum.Event,
  pool: LiquidityPool,
  value: BigInt,
  from: string
): void {
  const transfer = getOrCreateTransfer(event);

  // Tracks supply of minted LP tokens
  pool.outputTokenSupply = pool.outputTokenSupply!.minus(value);

  // Uses address from the transfer to pool part of the burn. Set transfer type from this handler.
  if (transfer.type == TransferType.BURN) {
    transfer.liquidity = value;
  } else {
    transfer.type = TransferType.BURN;
    transfer.sender = from;
    transfer.liquidity = value;
  }

  transfer.save();
  pool.save();
}

export function handleTransferPosition(
  event: ethereum.Event,
  pool: LiquidityPool,
  value: BigInt,
  fromAddress: string,
  toAddress: string,
):void {

  if(fromAddress == ADDRESS_ZERO.toHexString()) {
    return;
  }
  const transfer = getOrCreateTransfer(event);
  transfer.sender = fromAddress;
  transfer.save();
  const from = getOrCreateAccount(event);
  let fromPosition = getOrCreatePosition(event)
  transfer.sender = toAddress;
  transfer.save();
  const to = getOrCreateAccount(event);
  let toPosition = getOrCreatePosition(event);

  fromPosition.outputTokenBalance = fromPosition.outputTokenBalance!.minus(value);
  if(fromPosition.outputTokenBalance == BIGINT_ZERO && fromPosition.inputTokenBalances[0] == BIGINT_ZERO && fromPosition.inputTokenBalances[1] == BIGINT_ZERO) {
    // close the position
    fromPosition.blockNumberClosed = event.block.number
    fromPosition.hashClosed = event.transaction.hash.toHexString();
    fromPosition.timestampClosed = event.block.timestamp;
    fromPosition.save();
    if(from.openPositionCount > 0) {
      from.openPositionCount -= 1;
    }
    const oldPositionCount = from.positionCount;
    from.closedPositionCount += 1;
    from.save();
    if((from.openPositionCount + from.closedPositionCount) > from.positionCount) {
      from.positionCount = from.openPositionCount + from.closedPositionCount;
      from.save();
    }
    let counter = _PositionCounter.load(from.id.concat("-").concat(pool.id));
    counter!.nextCount += 1;
    counter!.save();
  }

  toPosition.outputTokenBalance = toPosition.outputTokenBalance!.plus(value);
  toPosition.save();

}
