import {
  Address,
  BigDecimal,
  BigInt,
  ByteArray,
  dataSource,
  log,
  crypto,
  ethereum,
} from "@graphprotocol/graph-ts";

import { checkPoolCount } from "./helpers";
import { Versions } from "../versions";
import { getUsdPrice, getUsdPricePerToken } from "../prices";
import { crossPoolTokens } from "../common/constants";
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
import {
  Network,
  RewardTokenType,
  BIGINT_MINUS_ONE,
} from "../sdk/util/constants";
import { chainIDToNetwork } from "../sdk/protocols/bridge/chainIds";
import { getRewardsPerDay, RewardIntervalType } from "../sdk/util/rewards";

import {
  Mint,
  Burn,
  Swap,
  SwapRemote,
  Pool,
} from "../../generated/LPStaking_0/Pool";
import { PoolTemplate } from "../../generated/templates";
import { Token } from "../../generated/schema";
import {
  Deposit as DepositForBlockRewards,
  LPStaking,
  Withdraw as WithdrawForBlockRewards,
} from "../../generated/LPStaking_0/LPStaking";
import {
  Deposit as DepositForTimeRewards,
  LPStakingTime,
  Withdraw as WithdrawForTimeRewards,
} from "../../generated/LPStaking_0/LPStakingTime";
import { _ERC20 } from "../../generated/LPStaking_0/_ERC20";

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
    let underlying: Address | null = null;

    const wrappedERC20 = Pool.bind(address);
    const poolIDCall = wrappedERC20.try_poolId();
    if (poolIDCall.reverted) {
      const erc20 = _ERC20.bind(address);
      const name = erc20.name();
      const symbol = erc20.symbol();
      const decimals = erc20.decimals().toI32();

      return {
        name,
        symbol,
        decimals,
        underlying,
      };
    }

    const name = wrappedERC20.name();
    const symbol = wrappedERC20.symbol();
    const decimals = wrappedERC20.decimals().toI32();
    underlying = wrappedERC20.token();

    return {
      name,
      symbol,
      decimals,
      underlying,
    };
  }
}

export function handleStakeForBlockRewards(
  event: DepositForBlockRewards
): void {
  const lpStakingContractAddr = dataSource.address();
  const poolID = event.params.pid;

  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), event);

  const lpStakingContract = LPStaking.bind(lpStakingContractAddr);

  const poolInfo = lpStakingContract.poolInfo(poolID);
  const poolAddr = poolInfo.value0;
  const allocPoint = poolInfo.value1;

  const rewardToken = sdk.Tokens.getOrCreateToken(lpStakingContract.stargate());
  const stargatePerBlock = lpStakingContract.stargatePerBlock();
  const totalAllocPoint = lpStakingContract.totalAllocPoint();

  const stargatePerBlockForPool = stargatePerBlock
    .times(allocPoint)
    .div(totalAllocPoint);

  const rewardsPerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    stargatePerBlockForPool.toBigDecimal(),
    RewardIntervalType.BLOCK
  );

  const pool = sdk.Pools.loadPool<string>(poolAddr);
  if (!pool.isInitialized) {
    const poolContract = Pool.bind(poolAddr);
    const poolName = poolContract.name();
    const poolSymbol = poolContract.symbol();
    const token = sdk.Tokens.getOrCreateToken(poolAddr);

    pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token);

    PoolTemplate.create(poolAddr);
  }

  pool.setRewardEmissions(
    RewardTokenType.DEPOSIT,
    rewardToken,
    bigDecimalToBigInt(rewardsPerDay)
  );

  checkPoolCount(sdk);
}

export function handleStakeForTimeRewards(event: DepositForTimeRewards): void {
  const lpStakingContractAddr = dataSource.address();
  const poolID = event.params.pid;

  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), event);

  const lpStakingContract = LPStakingTime.bind(lpStakingContractAddr);

  const poolInfo = lpStakingContract.poolInfo(poolID);
  const poolAddr = poolInfo.value0;
  const allocPoint = poolInfo.value1;

  const rewardToken = sdk.Tokens.getOrCreateToken(lpStakingContract.eToken());
  const stargatePerSecond = lpStakingContract.eTokenPerSecond();
  const totalAllocPoint = lpStakingContract.totalAllocPoint();

  const stargatePerSecondForPool = stargatePerSecond
    .times(allocPoint)
    .div(totalAllocPoint);

  const rewardsPerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    stargatePerSecondForPool.toBigDecimal(),
    RewardIntervalType.TIMESTAMP
  );

  const pool = sdk.Pools.loadPool<string>(poolAddr);
  if (!pool.isInitialized) {
    const poolContract = Pool.bind(poolAddr);
    const poolName = poolContract.name();
    const poolSymbol = poolContract.symbol();
    const token = sdk.Tokens.getOrCreateToken(poolAddr);

    pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token);

    PoolTemplate.create(poolAddr);
  }

  pool.setRewardEmissions(
    RewardTokenType.DEPOSIT,
    rewardToken,
    bigDecimalToBigInt(rewardsPerDay)
  );

  checkPoolCount(sdk);
}

export function handleUnstakeForBlockRewards(
  event: WithdrawForBlockRewards
): void {
  const lpStakingContractAddr = dataSource.address();
  const poolID = event.params.pid;

  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), event);

  const lpStakingContract = LPStaking.bind(lpStakingContractAddr);

  const poolInfo = lpStakingContract.poolInfo(poolID);
  const poolAddr = poolInfo.value0;
  const allocPoint = poolInfo.value1;

  const rewardToken = sdk.Tokens.getOrCreateToken(lpStakingContract.stargate());
  const stargatePerBlock = lpStakingContract.stargatePerBlock();
  const totalAllocPoint = lpStakingContract.totalAllocPoint();

  const stargatePerBlockForPool = stargatePerBlock
    .times(allocPoint)
    .div(totalAllocPoint);

  const rewardsPerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    stargatePerBlockForPool.toBigDecimal(),
    RewardIntervalType.BLOCK
  );

  const pool = sdk.Pools.loadPool<string>(poolAddr);
  if (!pool.isInitialized) {
    const poolContract = Pool.bind(poolAddr);
    const poolName = poolContract.name();
    const poolSymbol = poolContract.symbol();
    const token = sdk.Tokens.getOrCreateToken(poolAddr);

    pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token);

    PoolTemplate.create(poolAddr);
  }

  pool.setRewardEmissions(
    RewardTokenType.DEPOSIT,
    rewardToken,
    bigDecimalToBigInt(rewardsPerDay)
  );

  checkPoolCount(sdk);
}

export function handleUnstakeForTimeRewards(
  event: WithdrawForTimeRewards
): void {
  const lpStakingContractAddr = dataSource.address();
  const poolID = event.params.pid;

  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), event);

  const lpStakingContract = LPStakingTime.bind(lpStakingContractAddr);

  const poolInfo = lpStakingContract.poolInfo(poolID);
  const poolAddr = poolInfo.value0;
  const allocPoint = poolInfo.value1;

  const rewardToken = sdk.Tokens.getOrCreateToken(lpStakingContract.eToken());
  const stargatePerSecond = lpStakingContract.eTokenPerSecond();
  const totalAllocPoint = lpStakingContract.totalAllocPoint();

  const stargatePerSecondForPool = stargatePerSecond
    .times(allocPoint)
    .div(totalAllocPoint);

  const rewardsPerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    stargatePerSecondForPool.toBigDecimal(),
    RewardIntervalType.TIMESTAMP
  );

  const pool = sdk.Pools.loadPool<string>(poolAddr);
  if (!pool.isInitialized) {
    const poolContract = Pool.bind(poolAddr);
    const poolName = poolContract.name();
    const poolSymbol = poolContract.symbol();
    const token = sdk.Tokens.getOrCreateToken(poolAddr);

    pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token);

    PoolTemplate.create(poolAddr);
  }

  pool.setRewardEmissions(
    RewardTokenType.DEPOSIT,
    rewardToken,
    bigDecimalToBigInt(rewardsPerDay)
  );

  checkPoolCount(sdk);
}

export function handleSwapOut(event: Swap): void {
  const poolAddr = dataSource.address();
  const amount = event.params.amountSD;
  const crosschainID = BigInt.fromI32(event.params.chainId as i32);
  const crossPoolID = event.params.dstPoolId;

  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), event);

  const pool = sdk.Pools.loadPool<string>(poolAddr);
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

  const poolTokens = crossPoolTokens.get(crosschainNetwork);
  if (!poolTokens) {
    log.warning("[handleSwapOut] No pools for network: {}", [
      crosschainNetwork,
    ]);

    return;
  }

  const crosschainTokenAddr = poolTokens.get(crossPoolID);
  if (!crosschainTokenAddr) {
    log.warning(
      "[handleSwapOut] No crosschainToken for network: {} poolID: {}",
      [crosschainNetwork, crossPoolID.toString()]
    );

    return;
  }

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

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.transferOut(pool, route!, event.transaction.from, amount);

  checkPoolCount(sdk);
}

export function handleSwapIn(event: SwapRemote): void {
  const poolAddr = dataSource.address();
  const amount = event.params.amountSD;

  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), event);

  const pool = sdk.Pools.loadPool<string>(poolAddr);
  const token = sdk.Tokens.getOrCreateToken(
    Address.fromBytes(pool.getInputToken().id)
  );

  let crosschainID = BIGINT_MINUS_ONE;
  let crossPoolID = BIGINT_MINUS_ONE;

  const creditCPEventSig = crypto.keccak256(
    ByteArray.fromUTF8("CreditChainPath(uint16,uint256,uint256,uint256)")
  );

  const logs = event.receipt!.logs;
  for (let i = 0; i < logs.length; i++) {
    const currLog = logs.at(i);
    const topic0Sig = currLog.topics.at(0);
    if (topic0Sig.equals(creditCPEventSig)) {
      const decodedLogData = ethereum
        .decode("(uint16,uint256,uint256,uint256)", currLog.data)!
        .toTuple();

      crosschainID = decodedLogData.at(0).toBigInt();
      crossPoolID = decodedLogData.at(1).toBigInt();
    }
  }

  if (crossPoolID == BIGINT_MINUS_ONE || crosschainID == BIGINT_MINUS_ONE) {
    log.warning(
      "[handleSwapIn] Could not find crosschainID/crossPoolID tx_hash: {}",
      [event.transaction.hash.toHexString()]
    );

    return;
  }

  const crosschainNetwork = chainIDToNetwork(crosschainID);
  if (crosschainNetwork == Network.UNKNOWN_NETWORK) {
    log.warning("[handleSwapIn] Network unknown for chainID: {} tx_hash: {}", [
      crosschainID.toString(),
      event.transaction.hash.toHexString(),
    ]);

    return;
  }

  const poolTokens = crossPoolTokens.get(crosschainNetwork);
  if (!poolTokens) {
    log.warning("[handleSwapIn] No pools for network: {}", [crosschainNetwork]);

    return;
  }

  const crosschainTokenAddr = poolTokens.get(crossPoolID);
  if (!crosschainTokenAddr) {
    log.warning(
      "[handleSwapIn] No crosschainToken for network: {} poolID: {}",
      [crosschainNetwork, crossPoolID.toString()]
    );

    return;
  }

  const crosschainToken = sdk.Tokens.getOrCreateCrosschainToken(
    crosschainID,
    crosschainTokenAddr,
    CrosschainTokenType.WRAPPED,
    Address.fromBytes(token.id)
  );

  pool.addDestinationToken(crosschainToken);
  const route = pool.getDestinationTokenRoute(crosschainToken);

  const account = sdk.Accounts.loadAccount(event.params.to);
  account.transferIn(pool, route!, event.params.to, amount);

  checkPoolCount(sdk);
}

export function handleMint(event: Mint): void {
  const poolAddr = dataSource.address();
  const amount = event.params.amountSD;

  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), event);

  const pool = sdk.Pools.loadPool<string>(poolAddr);

  const account = sdk.Accounts.loadAccount(event.params.to);
  account.liquidityDeposit(pool, amount);

  checkPoolCount(sdk);
}

export function handleBurn(event: Burn): void {
  const poolAddr = dataSource.address();
  const amount = event.params.amountSD;

  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), event);

  const pool = sdk.Pools.loadPool<string>(poolAddr);

  const account = sdk.Accounts.loadAccount(event.params.from);
  account.liquidityWithdraw(pool, amount);

  checkPoolCount(sdk);
}
