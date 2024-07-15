import { log } from "@graphprotocol/graph-ts";
import {
  IncreaseLiquidity,
  DecreaseLiquidity,
} from "../../generated/ThrusterPointNFT/ThrusterPointNFT";
import { getOrCreatePositionsNft } from "../common/initializers";

export function handleIncreaseLiquidity(event: IncreaseLiquidity): void {
  const amount0 = event.params.amount0;
  const amount1 = event.params.amount1;
  const liquidity = event.params.liquidity;

  const tokenId = event.params.tokenId;
  const poolAddress = event.params.pool;

  const positionNft = getOrCreatePositionsNft(
    poolAddress,
    tokenId,
    event.block
  );

  positionNft.amount0 = positionNft.amount0.plus(amount0);
  positionNft.amount1 = positionNft.amount1.plus(amount1);
  positionNft.liquidity = positionNft.liquidity.plus(liquidity);
  positionNft.save();

  log.warning(
    "[IncreaseLiquidity] pool: {}, tokenId: {}, amounts: [{}, {}], updatedAmounts: [{}, {}], liquidity: {}, log_index: {}, txn: {}",
    [
      poolAddress.toHexString(),
      tokenId.toString(),
      amount0.toString(),
      amount1.toString(),
      positionNft.amount0.toString(),
      positionNft.amount1.toString(),
      liquidity.toString(),
      event.logIndex.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleDecreaseLiquidity(event: DecreaseLiquidity): void {
  const amount0 = event.params.amount0;
  const amount1 = event.params.amount1;
  const liquidity = event.params.liquidity;

  const tokenId = event.params.tokenId;
  const poolAddress = event.params.pool;

  const positionNft = getOrCreatePositionsNft(
    poolAddress,
    tokenId,
    event.block
  );

  positionNft.amount0 = positionNft.amount0.minus(amount0);
  positionNft.amount1 = positionNft.amount1.minus(amount1);
  positionNft.liquidity = positionNft.liquidity.minus(liquidity);
  positionNft.save();

  log.warning(
    "[DecreaseLiquidity] pool: {}, tokenId: {}, amounts: [{}, {}], updatedAmounts: [{}, {}], liquidity: {}, log_index: {}, txn: {}",
    [
      poolAddress.toHexString(),
      tokenId.toString(),
      amount0.toString(),
      amount1.toString(),
      positionNft.amount0.toString(),
      positionNft.amount1.toString(),
      liquidity.toString(),
      event.logIndex.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}
