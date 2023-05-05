import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  getOrCreateAccount,
  getOrCreatePool,
  initializeSDK,
} from "../common/initializers";

export function swap(
  event: ethereum.Event,
  accountAddress: Address,
  tokenInAddress: Address,
  amountIn: BigInt,
  tokenOutAddress: Address,
  amountOut: BigInt
): void {
  const sdk = initializeSDK(event);

  const pool = getOrCreatePool(event, sdk);
  const account = getOrCreateAccount(accountAddress, pool, sdk);

  account.swap(
    pool,
    tokenInAddress,
    amountIn,
    tokenOutAddress,
    amountOut,
    Address.fromBytes(pool.getBytesID()),
    true
  );
}
