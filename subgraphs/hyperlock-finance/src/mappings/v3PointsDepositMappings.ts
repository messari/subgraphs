import {
  getOrCreateV3Pool,
  initializeSDKFromEvent,
  getOrCreatePositionsNft,
} from "../common/initializers";
import {
  Deposit,
  Withdraw,
} from "../../generated/ERC721PointsDeposit/ERC721PointsDeposit";
import * as constants from "../common/constants";

export function handleDeposit(event: Deposit): void {
  const tokenId = event.params.tokenId;
  const poolAddress = event.params.pool;

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreateV3Pool(poolAddress, tokenId, sdk);

  const positionsNft = getOrCreatePositionsNft(
    poolAddress,
    tokenId,
    event.block
  );

  pool.addInputTokenBalances(
    [positionsNft.amount0, positionsNft.amount1],
    true
  );

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}

export function handleWithdraw(event: Withdraw): void {
  const tokenId = event.params.tokenId;
  const poolAddress = event.params.pool;

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreateV3Pool(poolAddress, tokenId, sdk);

  const positionsNft = getOrCreatePositionsNft(
    poolAddress,
    tokenId,
    event.block
  );

  pool.addInputTokenBalances(
    [
      positionsNft.amount0.times(constants.BIGINT_MINUS_ONE),
      positionsNft.amount1.times(constants.BIGINT_MINUS_ONE),
    ],
    true
  );

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}
