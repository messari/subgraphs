import { ethereum, BigInt, log } from "@graphprotocol/graph-ts";
import { getOrCreateAccount, getOrCreatePosition, getOrCreateProtocol, getOrCreateTransfer } from "./getters";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, DEFAULT_DECIMALS, TransferType } from "./constants";
import { LiquidityPool, Token, _PositionCounter } from "../../generated/schema";
import { ADDRESS_ZERO } from "../../../ellipsis-finance/src/common/constants";
import { convertTokenToDecimal } from "./utils/utils";

// Handle data from transfer event for mints. Used to populate Deposit entity in the Mint event.
export function handleTransferMint(
  event: ethereum.Event,
  pool: LiquidityPool,
  value: BigInt,
  to: string
): void {
  const transfer = getOrCreateTransfer(event);
  const protocol = getOrCreateProtocol();

  // Tracks supply of minted LP tokens
  const token = pool.liquidityToken ? Token.load(pool.liquidityToken!) : null;
  let decimals = token ? token.decimals : DEFAULT_DECIMALS;

  const liquidity = convertTokenToDecimal(
    value,
    decimals
  );
    
  let liquidityUSD = pool.outputTokenPriceUSD!.times(liquidity);
  if(!pool.activeLiquidity) {
    pool.activeLiquidity = BIGINT_ZERO;
  }
  if(!pool.activeLiquidityUSD) {
    pool.activeLiquidityUSD = BIGDECIMAL_ZERO;
  }

  pool.activeLiquidity = pool.activeLiquidity.plus(value);
  pool.activeLiquidityUSD = pool.activeLiquidityUSD.plus(liquidityUSD);

  pool.totalLiquidity = pool.activeLiquidity;
  pool.totalLiquidityUSD = pool.activeLiquidityUSD;

  protocol.activeLiquidityUSD = protocol.activeLiquidityUSD.plus(liquidityUSD)
  protocol.totalLiquidityUSD = protocol.activeLiquidityUSD;

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
  protocol.save();
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
  const protocol = getOrCreateProtocol();

  // Tracks supply of minted LP tokens
  const token = pool.liquidityToken ? Token.load(pool.liquidityToken!) : null;
  let decimals = token ? token.decimals : DEFAULT_DECIMALS;
  
  const liquidity = convertTokenToDecimal(
    value,
    decimals
  );
    
  let liquidityUSD = pool.outputTokenPriceUSD!.times(liquidity);
  
  if(!pool.activeLiquidity) {
    pool.activeLiquidity = BIGINT_ZERO;
  }
  pool.activeLiquidity = pool.activeLiquidity.minus(value);
  pool.activeLiquidityUSD = pool.activeLiquidityUSD.minus(liquidityUSD);

  pool.totalLiquidity = pool.activeLiquidity;
  pool.totalLiquidityUSD = pool.activeLiquidityUSD;

  protocol.activeLiquidityUSD = protocol.activeLiquidityUSD      .minus(liquidityUSD)
  protocol.totalLiquidityUSD = protocol.activeLiquidityUSD;

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
  protocol.save();
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

  fromPosition.liquidity = fromPosition.liquidity.minus(value);
  if(fromPosition.liquidity == BIGINT_ZERO && fromPosition.cumulativeDepositTokenAmounts[0] == BIGINT_ZERO && fromPosition.cumulativeDepositTokenAmounts[1] == BIGINT_ZERO) {
    // close the position
    fromPosition.blockNumberClosed = event.block.number
    fromPosition.hashClosed = event.transaction.hash;
    fromPosition.timestampClosed = event.block.timestamp;
    fromPosition.save();
    if(from.openPositionCount > 0) {
      from.openPositionCount -= 1;
    }
    from.closedPositionCount += 1;
    from.save();
    from.positionCount = from.openPositionCount + from.closedPositionCount;
    from.save();
    let counter = _PositionCounter.load(from.id.toHexString().concat("-").concat(pool.id.toHexString()));
    counter!.nextCount += 1;
    counter!.save();
  }

  toPosition.liquidity = toPosition.liquidity.plus(value);
  toPosition.save();

}
