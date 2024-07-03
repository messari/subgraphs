import {
  updatePoolTVL,
  getOrCreateV2Pool,
  initializeSDKFromEvent,
} from "../common/initializers";
import {
  Deposit,
  Withdraw,
} from "../../generated/ERC721PointsDeposit/ERC721PointsDeposit";

export function handleDeposit(event: Deposit): void {
  const tokenId = event.params.tokenId;
  const poolAddress = event.params.pool;

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreateV2Pool(poolAddress, sdk);

  updatePoolTVL(pool, amount);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}

export function handleWithdraw(event: Withdraw): void {}
