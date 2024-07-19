import {
  Deposit,
  Withdraw,
  Harvest,
  Harvest1 as HarvestWithCaller,
  Deposit1 as DepositWithShares,
  Withdraw1 as WithdrawWithShares,
} from "../../generated/AladdinConvexVault/AladdinConvexVault";
import { readValue } from "../common/utils";
import { SDK } from "../sdk/protocols/generic";
import * as constants from "../common/constants";
import { Pool } from "../sdk/protocols/generic/pool";
import { initializeSDKFromEvent } from "../common/initializers";
import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { AladdinConvexVault } from "../../generated/AladdinConvexVault/AladdinConvexVault";

function getOrCreatePool(
  vaultAddress: Address,
  poolId: BigInt,
  sdk: SDK
): Pool {
  const pool = sdk.Pools.loadPool(vaultAddress.concatI32(poolId.toI32()));

  if (!pool.isInitialized) {
    const vaultContract = AladdinConvexVault.bind(vaultAddress);

    let inputTokenAddress = constants.NULL.TYPE_ADDRESS;
    const poolInfoCall = vaultContract.try_poolInfo(poolId);
    if (!poolInfoCall.reverted) {
      inputTokenAddress = poolInfoCall.value.getLpToken();
    } else {
      inputTokenAddress = readValue<Address>(
        vaultContract.try_underlying(poolId),
        constants.NULL.TYPE_ADDRESS
      );
    }
    const inputToken = sdk.Tokens.getOrCreateToken(inputTokenAddress);

    pool.initialize(inputToken.name, inputToken.symbol, [inputToken.id], null);
  }

  return pool;
}

export function getRewardToken(vaultAddress: Address): Address {
  const vaultContract = AladdinConvexVault.bind(vaultAddress);

  let rewardToken = constants.NULL.TYPE_ADDRESS;

  rewardToken = readValue<Address>(
    vaultContract.try_rewardToken(),
    constants.NULL.TYPE_ADDRESS
  );
  if (rewardToken.notEqual(constants.NULL.TYPE_ADDRESS)) return rewardToken;

  rewardToken = readValue<Address>(
    vaultContract.try_aladdinCRV(),
    constants.NULL.TYPE_ADDRESS
  );

  return rewardToken;
}

export function updatePoolTVL(
  pool: Pool,
  vaultAddress: Address,
  poolId: BigInt
): void {
  const vaultContract = AladdinConvexVault.bind(vaultAddress);

  const vaultTVL = readValue<BigInt>(
    vaultContract.try_getTotalUnderlying(poolId),
    constants.BIGINT_ZERO
  );

  pool.setInputTokenBalances([vaultTVL], true);
}

export function handleDeposit(event: Deposit): void {
  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, event.params._pid, sdk);

  updatePoolTVL(pool, event.address, event.params._pid);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}
export function handleDepositWithShares(event: DepositWithShares): void {
  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, event.params.pid, sdk);

  updatePoolTVL(pool, event.address, event.params.pid);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}

export function handleWithdraw(event: Withdraw): void {
  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, event.params._pid, sdk);

  updatePoolTVL(pool, event.address, event.params._pid);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}

export function handleWithdrawWithShares(event: WithdrawWithShares): void {
  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, event.params.pid, sdk);

  updatePoolTVL(pool, event.address, event.params.pid);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}

export function handleHarvest(event: Harvest): void {
  let decoded = ethereum.decode(
    "harvest(uint256,address,uint256)",
    event.transaction.input
  );

  let poolId = constants.BIGINT_ZERO;

  if (decoded) {
    let decodedTuple = decoded.toTuple();
    poolId = decodedTuple[0].toBigInt();

    log.warning("[Harvest [AL-CVX]] PoolId Decoded: {}", [poolId.toString()]);
  }

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, poolId, sdk);

  const supplySideRevenue = event.params._reward;
  const protocolSideRevenue = event.params._platformFee;

  pool.addRevenueNative(
    sdk.Tokens.getOrCreateToken(getRewardToken(event.address)),
    supplySideRevenue,
    protocolSideRevenue
  );
}

export function handleHarvestWithCaller(event: HarvestWithCaller): void {
  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, event.params.pid, sdk);

  const supplySideRevenue = event.params.rewards;
  const protocolSideRevenue = event.params.platformFee;

  pool.addRevenueNative(
    sdk.Tokens.getOrCreateToken(getRewardToken(event.address)),
    supplySideRevenue,
    protocolSideRevenue
  );
}
