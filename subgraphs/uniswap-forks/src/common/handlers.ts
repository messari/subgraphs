import { ethereum, BigInt } from "@graphprotocol/graph-ts";
import { getOrCreateTransfer } from "./getters";
import { TransferType } from "./constants";
import { LiquidityPool } from "../../generated/schema";

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
