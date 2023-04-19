import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  Network,
  RewardTokenType,
  SECONDS_PER_DAY_BI,
} from "../sdk/util/constants";
import {
  ACROSS_ACCELERATING_DISTRIBUTOR_CONTRACT,
  ACROSS_HUB_POOL_CONTRACT,
  ACROSS_PROTOCOL_NAME,
  ACROSS_REWARD_TOKEN,
  Pricer,
  TokenInit,
} from "../util";
import { getUsdPrice } from "../prices";
import { findDestinationToken, findOriginToken } from "../availableRoutesApi";
import { Versions } from "../versions";

import { SDK } from "../sdk/protocols/bridge";
import { BridgeConfig } from "../sdk/protocols/bridge/config";
import {
  BridgePermissionType,
  BridgePoolType,
  CrosschainTokenType,
} from "../sdk/protocols/bridge/enums";

import {
  FilledRelay,
  FundsDeposited,
} from "../../generated/SpokePool/SpokePool";
import { AcceleratingDistributor } from "../../generated/SpokePool/AcceleratingDistributor";
import { networkToChainID } from "../sdk/protocols/bridge/chainIds";
import { _ERC20 } from "../../generated/SpokePool/_ERC20";

export function handleFilledRelay(event: FilledRelay): void {
  // Chain
  const originChainId = event.params.originChainId;
  const destinationChainId = event.params.destinationChainId;

  // mainnet vs L2s
  let bridgeId: string;
  if (destinationChainId == networkToChainID(Network.MAINNET)) {
    bridgeId = ACROSS_HUB_POOL_CONTRACT;
  } else {
    bridgeId = event.address.toHexString();
  }

  // Config
  const conf = new BridgeConfig(
    bridgeId,
    ACROSS_PROTOCOL_NAME,
    ACROSS_PROTOCOL_NAME,
    BridgePermissionType.WHITELIST,
    Versions
  );

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(event.block),
    new TokenInit(),
    event
  );

  // InputToken
  const inputTokenAddress = event.params.destinationToken;
  const inputToken = sdk.Tokens.getOrCreateToken(inputTokenAddress!);

  // CrossToken
  const crossTokenAddress: Address = Address.fromString(
    findOriginToken(
      originChainId.toI32(),
      destinationChainId.toI32(),
      inputTokenAddress.toHexString()
    )
  );
  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    originChainId,
    crossTokenAddress!,
    CrosschainTokenType.CANONICAL,
    inputTokenAddress!
  );

  // Pool
  const poolId = event.address.concat(inputToken.id);
  const pool = sdk.Pools.loadPool<string>(poolId);

  if (!pool.isInitialized) {
    pool.initialize(
      poolId.toString(),
      inputToken.symbol,
      BridgePoolType.LIQUIDITY,
      inputToken
    );
  }

  pool.addDestinationToken(crossToken);

  // Account
  const acc = sdk.Accounts.loadAccount(event.params.recipient);
  acc.transferIn(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    event.params.depositor,
    event.params.amount,
    event.transaction.hash
  );

  // TVL
  let inputTokenBalance: BigInt;
  const erc20 = _ERC20.bind(inputTokenAddress);
  const inputTokenBalanceResult = erc20.try_balanceOf(event.address);
  if (inputTokenBalanceResult.reverted) {
    log.info(
      "[ERC20:balanceOf()] calculate token balance owned by bridge contract reverted",
      []
    );
  } else {
    inputTokenBalance = inputTokenBalanceResult.value;
  }

  pool.setInputTokenBalance(inputTokenBalance!);

  // Revenue
  // Note: We take the amount from crossChain (origin) and multiplying by inputToken price (destination).
  // This isn't ideal but we do this because we don't have access to price for the crossToken.
  const lpFee = bigIntToBigDecimal(event.params.realizedLpFeePct);
  const supplySideRevenueAmount = bigIntToBigDecimal(event.params.amount).times(
    lpFee
  );
  const supplySideRevenue = getUsdPrice(
    inputTokenAddress,
    supplySideRevenueAmount
  );
  pool.addSupplySideRevenueUSD(supplySideRevenue);

  // Rewards
  // RewardToken can also be fetched from AcceleratingDistributor contract ("rewardToken" method)
  // Only track rewardToken emissions on mainnet where AcceleratingDistributor is deployed
  if (
    destinationChainId == networkToChainID(Network.MAINNET) &&
    event.block.number >= BigInt.fromI32(15977129)
  ) {
    const rewardTokenAddress = Address.fromString(ACROSS_REWARD_TOKEN);
    const rewardToken = sdk.Tokens.getOrCreateToken(rewardTokenAddress);

    const acceleratingDistributorContract = AcceleratingDistributor.bind(
      Address.fromString(ACROSS_ACCELERATING_DISTRIBUTOR_CONTRACT)
    );
    const contractCall =
      acceleratingDistributorContract.try_stakingTokens(rewardTokenAddress);

    let baseEmissionRate: BigInt;
    if (contractCall.reverted) {
      log.info(
        "[AcceleratingDistributor:stakingToken()] retrieve baseEmissionRate for pools call reverted",
        []
      );
    } else {
      baseEmissionRate = contractCall.value.getBaseEmissionRate();
    }

    const amount = baseEmissionRate!
      .times(SECONDS_PER_DAY_BI)
      .div(BigInt.fromI32(rewardToken.decimals));
    pool.setRewardEmissions(RewardTokenType.DEPOSIT, rewardToken, amount);
  }
}

export function handleFundsDeposited(event: FundsDeposited): void {
  // Chain
  const originChainId = event.params.originChainId;
  const destinationChainId = event.params.destinationChainId;

  // mainnet vs L2s
  let bridgeId: string;
  if (originChainId == networkToChainID(Network.MAINNET)) {
    bridgeId = ACROSS_HUB_POOL_CONTRACT;
  } else {
    bridgeId = event.address.toHexString();
  }

  // Config
  const conf = new BridgeConfig(
    bridgeId,
    ACROSS_PROTOCOL_NAME,
    ACROSS_PROTOCOL_NAME,
    BridgePermissionType.WHITELIST,
    Versions
  );

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(event.block),
    new TokenInit(),
    event
  );

  // InputToken
  const inputTokenAddress = event.params.originToken;
  const inputToken = sdk.Tokens.getOrCreateToken(inputTokenAddress!);

  // CrossToken
  const crossTokenAddress: Address = Address.fromString(
    findDestinationToken(
      originChainId.toI32(),
      destinationChainId.toI32(),
      inputTokenAddress.toHexString()
    )
  );
  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    originChainId,
    crossTokenAddress!,
    CrosschainTokenType.CANONICAL,
    inputTokenAddress!
  );

  // Pool
  const poolId = event.address.concat(inputToken.id);
  const pool = sdk.Pools.loadPool<string>(poolId);

  if (!pool.isInitialized) {
    pool.initialize(
      poolId.toString(),
      inputToken.symbol,
      BridgePoolType.LIQUIDITY,
      inputToken
    );
  }

  pool.addDestinationToken(crossToken);

  // Account
  const acc = sdk.Accounts.loadAccount(event.params.depositor);
  acc.transferOut(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    event.params.recipient,
    event.params.amount,
    event.transaction.hash
  );

  // TVL
  let inputTokenBalance: BigInt;
  const erc20 = _ERC20.bind(inputTokenAddress);
  const inputTokenBalanceResult = erc20.try_balanceOf(event.address);
  if (inputTokenBalanceResult.reverted) {
    log.info(
      "[ERC20:balanceOf()] calculate token balance owned by bridge contract reverted",
      []
    );
  } else {
    inputTokenBalance = inputTokenBalanceResult.value;
  }

  pool.setInputTokenBalance(inputTokenBalance!);
}
