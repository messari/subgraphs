import {
  _MasterChef,
  _MasterChefStakingPool,
  _Tranche,
} from "../../generated/schema";
import { Versions } from "../versions";
import * as constants from "../common/constants";
import { SDK } from "../sdk/protocols/perpfutures";
import { RewardTokenType } from "../sdk/util/constants";
import { ProtocolConfig } from "../sdk/protocols/config";
import { Pool } from "../sdk/protocols/perpfutures/pool";
import { TokenInitialize, TokenPrice } from "../modules/token";
import { Account } from "../sdk/protocols/perpfutures/account";
import { Address, Bytes, ethereum, BigInt } from "@graphprotocol/graph-ts";

export function initializeSDK(event: ethereum.Event): SDK {
  const protocolConfig = new ProtocolConfig(
    constants.PROTOCOL_ID,
    constants.PROTOCOL_NAME,
    constants.PROTOCOL_SLUG,
    Versions
  );
  const tokenPricer = new TokenPrice();
  const tokenInitializer = new TokenInitialize();

  const sdk = SDK.initializeFromEvent(
    protocolConfig,
    tokenPricer,
    tokenInitializer,
    event
  );

  return sdk;
}

export function getOrCreatePool(sdk: SDK): Pool {
  const pool = sdk.Pools.loadPool(
    Bytes.fromHexString(constants.VAULT_ADDRESS.toHexString())
  );
  if (!pool.isInitialized) {
    const outputToken = sdk.Tokens.getOrCreateToken(
      constants.OUTPUT_TOKEN_ADDRESS
    );
    pool.initialize(
      constants.POOL_NAME,
      constants.POOL_SYMBOL,
      [],
      outputToken
    );
  }
  return pool;
}

export function getOrCreateAccount(
  accountAddress: Address,
  pool: Pool,
  sdk: SDK
): Account {
  const loadAccountResponse = sdk.Accounts.loadAccount(accountAddress);
  const account = loadAccountResponse.account;
  if (loadAccountResponse.isNewUser) {
    const protocol = sdk.Protocol;
    protocol.addUser();
    pool.addUser();
  }
  return account;
}

export function getOrCreateTranche(address: Bytes): _Tranche {
  let tranche = _Tranche.load(address);
  if (!tranche) {
    tranche = new _Tranche(address);
    tranche.totalSupply = constants.BIGINT_ZERO;
    tranche.tvl = constants.BIGDECIMAL_ZERO;
    tranche.save();
  }
  return tranche;
}

export function createMasterChefStakingPool(
  event: ethereum.Event,
  masterChefType: string,
  pid: BigInt,
  poolAddress: Address
): _MasterChefStakingPool {
  const masterChefPool = new _MasterChefStakingPool(
    masterChefType + "-" + pid.toString()
  );

  masterChefPool.poolAddress = poolAddress.toHexString();
  masterChefPool.multiplier = constants.BIGINT_ONE;
  masterChefPool.poolAllocPoint = constants.BIGINT_ZERO;
  masterChefPool.lastRewardBlock = event.block.number;

  const sdk = initializeSDK(event);
  const rewardToken = sdk.Tokens.getOrCreateToken(
    constants.LEVEL_TOKEN_ADDRESS
  );
  sdk.Tokens.getOrCreateRewardToken(rewardToken, RewardTokenType.DEPOSIT);
  masterChefPool.save();

  return masterChefPool;
}

// Create the masterchef contract that contains data used to calculate rewards for all pools.
export function getOrCreateMasterChef(
  event: ethereum.Event,
  masterChefType: string
): _MasterChef {
  let masterChef = _MasterChef.load(masterChefType);

  if (!masterChef) {
    masterChef = new _MasterChef(masterChefType);
    masterChef.totalAllocPoint = constants.BIGINT_ZERO;
    masterChef.rewardTokenInterval = constants.INFLATION_INTERVAL;
    masterChef.rewardTokenRate = BigInt.fromString(
      constants.STARTING_INFLATION_RATE.toString()
    );
    masterChef.adjustedRewardTokenRate = BigInt.fromString(
      constants.STARTING_INFLATION_RATE.toString()
    );
    masterChef.lastUpdatedRewardRate = constants.BIGINT_ZERO;
    masterChef.save();
  }
  return masterChef;
}

// Create a MasterChefStaking pool using the MasterChef pid for id.
export function getOrCreateMasterChefStakingPool(
  event: ethereum.Event,
  masterChefType: string,
  pid: BigInt
): _MasterChefStakingPool {
  let masterChefPool = _MasterChefStakingPool.load(
    masterChefType + "-" + pid.toString()
  );

  // Create entity to track masterchef pool mappings
  if (!masterChefPool) {
    masterChefPool = new _MasterChefStakingPool(
      masterChefType + "-" + pid.toString()
    );

    masterChefPool.multiplier = constants.BIGINT_ONE;
    masterChefPool.poolAllocPoint = constants.BIGINT_ZERO;
    masterChefPool.lastRewardBlock = event.block.number;

    masterChefPool.save();
  }

  return masterChefPool;
}

// Update the total allocation for all pools whenever the allocation points are updated for a pool.
export function updateMasterChefTotalAllocation(
  event: ethereum.Event,
  oldPoolAlloc: BigInt,
  newPoolAlloc: BigInt,
  masterChefType: string
): void {
  const masterChef = getOrCreateMasterChef(event, masterChefType);
  masterChef.totalAllocPoint = masterChef.totalAllocPoint.plus(
    newPoolAlloc.minus(oldPoolAlloc)
  );
  masterChef.save();
}
