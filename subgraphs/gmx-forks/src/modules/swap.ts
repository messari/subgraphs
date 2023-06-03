import {
  getOrCreateAccount,
  getOrCreatePool,
  initializeSDK,
} from "../common/initializers";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
export function swap(
  event: ethereum.Event,
  accountAddress: Address,
  tokenInAddress: Address,
  amountIn: BigInt,
  tokenOutAddress: Address,
  amountOut: BigInt
): void {
  const sdk = initializeSDK(event);

  const pool = getOrCreatePool(sdk);
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
