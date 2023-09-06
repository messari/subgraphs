import { SDK } from "../sdk/protocols/perpfutures";
import { Pool } from "../sdk/protocols/perpfutures/pool";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { getOrCreateAccount } from "../common/initializers";

export function swap(
  accountAddress: Address,
  tokenInAddress: Address,
  amountIn: BigInt,
  tokenOutAddress: Address,
  amountOut: BigInt,
  sdk: SDK,
  pool: Pool
): void {
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
