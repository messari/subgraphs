import {
  Harvest,
  Deposit,
  Withdraw,
  Withdraw1 as WithdrawWithOption,
  Deposit1 as DepositWithoutShares,
  Harvest1 as HarvestWithOnlyAmount,
} from "../../generated/ConcentratorCvxCRV/ConcentratorCvxCRV";
import { readValue } from "../common/utils";
import { SDK } from "../sdk/protocols/generic";
import * as constants from "../common/constants";
import { Pool } from "../sdk/protocols/generic/pool";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { initializeSDKFromEvent } from "../common/initializers";
import { ConcentratorCvxCRV } from "../../generated/ConcentratorCvxCRV/ConcentratorCvxCRV";

function getOrCreatePool(vaultAddress: Address, sdk: SDK): Pool {
  const pool = sdk.Pools.loadPool(vaultAddress);

  if (!pool.isInitialized) {
    const vaultContract = ConcentratorCvxCRV.bind(vaultAddress);

    let inputTokenAddress = constants.NULL.TYPE_ADDRESS;

    inputTokenAddress = readValue<Address>(
      vaultContract.try_asset(),
      constants.NULL.TYPE_ADDRESS
    );

    if (inputTokenAddress.equals(constants.NULL.TYPE_ADDRESS)) {
      inputTokenAddress = readValue<Address>(
        vaultContract.try_stakingToken(),
        constants.NULL.TYPE_ADDRESS
      );
    }
    const inputToken = sdk.Tokens.getOrCreateToken(inputTokenAddress);

    pool.initialize(inputToken.name, inputToken.symbol, [inputToken.id], null);
  }

  return pool;
}

export function updatePoolTVL(pool: Pool): void {
  const vaultContract = ConcentratorCvxCRV.bind(
    Address.fromBytes(pool.getBytesID())
  );

  const vaultTVL = readValue<BigInt>(
    vaultContract.try_totalAssets(),
    constants.BIGINT_ZERO
  );

  pool.setInputTokenBalances([vaultTVL], true);
}

export function handleDeposit(event: Deposit): void {
  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  updatePoolTVL(pool);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}

export function handleDepositWithoutShares(event: DepositWithoutShares): void {
  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  updatePoolTVL(pool);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}

export function handleWithdraw(event: Withdraw): void {
  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  updatePoolTVL(pool);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}

export function handleWithdrawWithOption(event: WithdrawWithOption): void {
  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  updatePoolTVL(pool);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}

export function handleHarvestWithOnlyAmount(
  event: HarvestWithOnlyAmount
): void {
  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  const supplySideRevenue = event.params._amount;
  const protocolSideRevenue = constants.BIGINT_ZERO;

  pool.addRevenueNative(
    sdk.Tokens.getOrCreateToken(event.address),
    supplySideRevenue,
    protocolSideRevenue
  );
}

export function handleHarvest(event: Harvest): void {
  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  const supplySideRevenue = event.params.assets;
  const protocolSideRevenue = event.params.platformFee;

  pool.addRevenueNative(
    sdk.Tokens.getOrCreateToken(event.address),
    supplySideRevenue,
    protocolSideRevenue
  );
}
