import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
  log,
} from "@graphprotocol/graph-ts";

import { amountLDtoSD } from "./helpers";
import { Versions } from "../versions";
import { getUsdPrice, getUsdPricePerToken } from "../prices";
import { crossPoolTokens } from "../common/constants";
import { getRewardsPerDay, RewardIntervalType } from "../common/rewards";
import { NetworkConfigs } from "../../configurations/configure";

import { bigDecimalToBigInt, bigIntToBigDecimal } from "../sdk/util/numbers";
import { BridgeConfig } from "../sdk/protocols/bridge/config";
import { SDK } from "../sdk/protocols/bridge";
import { TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/bridge/tokens";
import {
  BridgePermissionType,
  BridgePoolType,
  CrosschainTokenType,
} from "../sdk/protocols/bridge/enums";
import { BIGINT_ZERO, Network, RewardTokenType } from "../sdk/util/constants";
import { chainIDToNetwork } from "../sdk/protocols/bridge/chainIds";

import {
  AddLiquidityCall,
  CreatePoolCall,
} from "../../generated/Router/Router";
import {
  InstantRedeemLocal,
  RedeemLocal,
  RedeemLocalCallback,
  RedeemRemote,
  Swap,
  SwapRemoteCall,
} from "../../generated/Router/Pool";
import { Pool } from "../../generated/Router/Pool";
import { Factory as StargateFactory } from "../../generated/Router/Factory";
import { PoolTemplate } from "../../generated/templates";
import { Token } from "../../generated/schema";
import {
  Deposit,
  LPStaking,
  Withdraw,
} from "../../generated/LPStaking/LPStaking";

const conf = new BridgeConfig(
  NetworkConfigs.getFactoryAddress(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  BridgePermissionType.PRIVATE,
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    const pricedToken = token._underlying
      ? Address.fromBytes(token._underlying!)
      : Address.fromBytes(token.id);

    return getUsdPricePerToken(pricedToken).usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const pricedToken = token._underlying
      ? Address.fromBytes(token._underlying!)
      : Address.fromBytes(token.id);
    const _amount = bigIntToBigDecimal(amount, token.decimals);

    return getUsdPrice(pricedToken, _amount);
  }
}

class TokenInit implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    const wrappedERC20 = Pool.bind(address);
    const name = wrappedERC20.name();
    const symbol = wrappedERC20.symbol();
    const decimals = wrappedERC20.decimals().toI32();
    const underlying = wrappedERC20.token();

    return {
      name,
      symbol,
      decimals,
      underlying,
    };
  }
}

export function handleCreatePool(call: CreatePoolCall): void {
  const poolAddr = call.outputs.value0;
  const poolName = call.inputs._name;
  const poolSymbol = call.inputs._symbol;

  const sdk = new SDK(
    conf,
    new Pricer(),
    new TokenInit(),
    call.block,
    call.transaction,
    BIGINT_ZERO
  );

  const token = sdk.Tokens.getOrCreateToken(poolAddr);
  const pool = sdk.Pools.loadPool(poolAddr);
  if (!pool.isInitialized) {
    pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token);
  }

  PoolTemplate.create(poolAddr);
}

export function handleAddLiquidity(call: AddLiquidityCall): void {
  const poolID = call.inputs._poolId;

  const stargateFactoryContract = StargateFactory.bind(
    Address.fromString(conf.getID())
  );
  const getPoolCall = stargateFactoryContract.try_getPool(poolID);
  if (getPoolCall.reverted) {
    return;
  }

  const poolAddr = getPoolCall.value;
  const amount = amountLDtoSD(poolAddr, call.inputs._amountLD);

  const sdk = new SDK(
    conf,
    new Pricer(),
    new TokenInit(),
    call.block,
    call.transaction,
    BIGINT_ZERO
  );

  const pool = sdk.Pools.loadPool(poolAddr);

  const account = sdk.Accounts.loadAccount(call.transaction.from);
  account.liquidityDeposit(pool, amount);
}

export function handleRedeemLocal(event: RedeemLocal): void {
  const poolAddr = dataSource.address();
  const amount = event.params.amountSD;

  const sdk = new SDK(
    conf,
    new Pricer(),
    new TokenInit(),
    event.block,
    event.transaction,
    event.logIndex
  );

  const pool = sdk.Pools.loadPool(poolAddr);

  const account = sdk.Accounts.loadAccount(event.params.from);
  account.liquidityWithdraw(pool, amount);
}

export function handleInstantRedeemLocal(event: InstantRedeemLocal): void {
  const poolAddr = dataSource.address();
  const amount = event.params.amountSD;

  const sdk = new SDK(
    conf,
    new Pricer(),
    new TokenInit(),
    event.block,
    event.transaction,
    event.logIndex
  );

  const pool = sdk.Pools.loadPool(poolAddr);

  const account = sdk.Accounts.loadAccount(event.params.from);
  account.liquidityWithdraw(pool, amount);
}

export function handleRedeemRemote(event: RedeemRemote): void {
  const poolAddr = dataSource.address();
  // event.params.amountSD is infact amountLD
  const amount = amountLDtoSD(poolAddr, event.params.amountSD);

  const sdk = new SDK(
    conf,
    new Pricer(),
    new TokenInit(),
    event.block,
    event.transaction,
    event.logIndex
  );

  const pool = sdk.Pools.loadPool(poolAddr);

  const account = sdk.Accounts.loadAccount(event.params.from);
  account.liquidityWithdraw(pool, amount);
}

export function handleRedeemLocalCallback(event: RedeemLocalCallback): void {
  const poolAddr = dataSource.address();
  const amount = event.params._amountToMintSD;

  const sdk = new SDK(
    conf,
    new Pricer(),
    new TokenInit(),
    event.block,
    event.transaction,
    event.logIndex
  );

  const pool = sdk.Pools.loadPool(poolAddr);

  const account = sdk.Accounts.loadAccount(event.params._to);
  account.liquidityDeposit(pool, amount);
}

export function handleSwapOut(event: Swap): void {
  const poolAddr = dataSource.address();
  const amount = event.params.amountSD;
  const crosschainID = BigInt.fromI32(event.params.chainId as i32);
  const crossPoolID = event.params.dstPoolId;

  const sdk = new SDK(
    conf,
    new Pricer(),
    new TokenInit(),
    event.block,
    event.transaction,
    event.logIndex
  );

  const pool = sdk.Pools.loadPool(poolAddr);
  const token = sdk.Tokens.getOrCreateToken(
    Address.fromBytes(pool.getInputToken().id)
  );

  const crosschainNetwork = chainIDToNetwork(crosschainID);
  if (crosschainNetwork == Network.UNKNOWN_NETWORK) {
    log.warning("[handleSwapOut] Network unknown for chainID: {} tx_hash: {}", [
      crosschainID.toString(),
      event.transaction.hash.toHexString(),
    ]);

    return;
  }

  const poolTokens = crossPoolTokens.get(crosschainNetwork)!;
  const crosschainTokenAddr = poolTokens.get(crossPoolID)!;

  const crosschainToken = sdk.Tokens.getOrCreateCrosschainToken(
    crosschainID,
    crosschainTokenAddr,
    CrosschainTokenType.WRAPPED,
    Address.fromBytes(token.id)
  );

  pool.addDestinationToken(crosschainToken);
  const route = pool.getDestinationTokenRoute(crosschainToken);

  const protocolFee = event.params.protocolFee;
  const supplyFee = event.params.lpFee;
  pool.addRevenueNative(protocolFee, supplyFee);

  const account = sdk.Accounts.loadAccount(event.params.from);
  account.transferOut(pool, route!, event.params.from, amount);
}

export function handleSwapIn(call: SwapRemoteCall): void {
  const poolAddr = dataSource.address();
  const amount = amountLDtoSD(poolAddr, call.outputs.amountLD);
  const amountLPFee = call.inputs._s.lpFee;

  const sdk = new SDK(
    conf,
    new Pricer(),
    new TokenInit(),
    call.block,
    call.transaction,
    BIGINT_ZERO
  );

  const pool = sdk.Pools.loadPool(poolAddr);
  const token = sdk.Tokens.getOrCreateToken(
    Address.fromBytes(pool.getInputToken().id)
  );
  const crosschainID = BigInt.fromI32(call.inputs._srcChainId as i32);
  const crossPoolID = call.inputs._srcPoolId;

  const crosschainNetwork = chainIDToNetwork(crosschainID);
  if (crosschainNetwork == Network.UNKNOWN_NETWORK) {
    log.warning("[handleSwapIn] Network unknown for chainID: {} tx_hash: {}", [
      crosschainID.toString(),
      call.transaction.hash.toHexString(),
    ]);

    return;
  }

  const poolTokens = crossPoolTokens.get(crosschainNetwork)!;
  const crosschainTokenAddr = poolTokens.get(crossPoolID)!;

  const crosschainToken = sdk.Tokens.getOrCreateCrosschainToken(
    crosschainID,
    crosschainTokenAddr,
    CrosschainTokenType.WRAPPED,
    Address.fromBytes(token.id)
  );

  pool.addDestinationToken(crosschainToken);
  const route = pool.getDestinationTokenRoute(crosschainToken);

  const account = sdk.Accounts.loadAccount(call.inputs._to);
  account.transferIn(pool, route!, call.inputs._to, amount);
  account.liquidityDeposit(pool, amountLPFee);
}

export function handleStake(event: Deposit): void {
  const lpStakingContractAddr = dataSource.address();
  const poolID = event.params.pid;

  const lpStakingContract = LPStaking.bind(lpStakingContractAddr);

  const poolInfo = lpStakingContract.poolInfo(poolID);
  const poolAddr = poolInfo.value0;
  const allocPoint = poolInfo.value1;

  const stargatePerBlock = lpStakingContract.stargatePerBlock();
  const totalAllocPoint = lpStakingContract.totalAllocPoint();

  const stargatePerBlockForPool = stargatePerBlock
    .times(allocPoint)
    .div(totalAllocPoint);

  const sdk = new SDK(
    conf,
    new Pricer(),
    new TokenInit(),
    event.block,
    event.transaction,
    BIGINT_ZERO
  );

  const pool = sdk.Pools.loadPool(poolAddr);
  const rewardToken = sdk.Tokens.getOrCreateToken(
    Address.fromString(NetworkConfigs.getRewardToken())
  );
  const rewardsPerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    stargatePerBlockForPool.toBigDecimal(),
    RewardIntervalType.BLOCK
  );

  pool.setRewardEmissions(
    RewardTokenType.DEPOSIT,
    rewardToken,
    bigDecimalToBigInt(rewardsPerDay)
  );
}

export function handleUnstake(event: Withdraw): void {
  const lpStakingContractAddr = dataSource.address();
  const poolID = event.params.pid;

  const lpStakingContract = LPStaking.bind(lpStakingContractAddr);

  const poolInfo = lpStakingContract.poolInfo(poolID);
  const poolAddr = poolInfo.value0;
  const allocPoint = poolInfo.value1;

  const stargatePerBlock = lpStakingContract.stargatePerBlock();
  const totalAllocPoint = lpStakingContract.totalAllocPoint();

  const stargatePerBlockForPool = stargatePerBlock
    .times(allocPoint)
    .div(totalAllocPoint);

  const sdk = new SDK(
    conf,
    new Pricer(),
    new TokenInit(),
    event.block,
    event.transaction,
    BIGINT_ZERO
  );

  const pool = sdk.Pools.loadPool(poolAddr);
  const rewardToken = sdk.Tokens.getOrCreateToken(
    Address.fromString(NetworkConfigs.getRewardToken())
  );
  const rewardsPerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    stargatePerBlockForPool.toBigDecimal(),
    RewardIntervalType.BLOCK
  );

  pool.setRewardEmissions(
    RewardTokenType.DEPOSIT,
    rewardToken,
    bigDecimalToBigInt(rewardsPerDay)
  );
}
