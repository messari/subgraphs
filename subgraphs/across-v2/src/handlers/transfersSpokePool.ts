import { Address, ethereum } from "@graphprotocol/graph-ts";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  DEPLOYER_BRIDGE_CONFIG,
  MAINNET_BRIDGE_CONFIG,
  Pricer,
  TokenInit,
  getTokenBalance,
} from "../util";
import { getUsdPrice } from "../prices";
import { findDestinationToken, findOriginToken } from "../availableRoutesApi";

import { SDK } from "../sdk/protocols/bridge";
import {
  BridgePoolType,
  CrosschainTokenType,
} from "../sdk/protocols/bridge/enums";

import {
  FilledRelay,
  FundsDeposited,
} from "../../generated/SpokePool1/SpokePool1";
import {
  FilledRelay as FilledRelaySpokePool2,
  FundsDeposited as FundsDepositedSpokePool2,
} from "../../generated/SpokePool1/SpokePool2";
import { networkToChainID } from "../sdk/protocols/bridge/chainIds";
import { Network } from "../sdk/util/constants";
import { BridgeConfig } from "../sdk/protocols/bridge/config";

export function handleFilledRelaySpokePool2(
  event: FilledRelaySpokePool2
): void {
  // build params
  const amount = new ethereum.EventParam("amount", event.parameters[0].value);
  const totalFilledAmount = new ethereum.EventParam(
    "totalFilledAmount",
    event.parameters[1].value
  );
  const fillAmount = new ethereum.EventParam(
    "fillAmount",
    event.parameters[2].value
  );
  const repaymentChainId = new ethereum.EventParam(
    "repaymentChainId",
    event.parameters[3].value
  );
  const originChainId = new ethereum.EventParam("", event.parameters[4].value);
  const destinationChainId = new ethereum.EventParam(
    "destinationChainId",
    event.parameters[5].value
  );
  const relayerFeePct = new ethereum.EventParam("", event.parameters[6].value);
  const appliedRelayerFeePct = new ethereum.EventParam(
    "appliedRelayerFeePct",
    ethereum.Value.fromI32(0)
  );
  const realizedLpFeePct = new ethereum.EventParam(
    "realizedLpFeePct",
    event.parameters[7].value
  );
  const depositId = new ethereum.EventParam(
    "depositId",
    event.parameters[8].value
  );
  const destinationToken = new ethereum.EventParam(
    "destinationToken",
    event.parameters[9].value
  );
  const relayer = new ethereum.EventParam(
    "relayer",
    event.parameters[10].value
  );
  const depositor = new ethereum.EventParam(
    "depositor",
    event.parameters[11].value
  );
  const recipient = new ethereum.EventParam(
    "recipient",
    event.parameters[12].value
  );
  const isSlowRelay = new ethereum.EventParam(
    "isSlowRelay",
    ethereum.Value.fromBoolean(false)
  );

  const params: ethereum.EventParam[] = [
    amount,
    totalFilledAmount,
    fillAmount,
    repaymentChainId,
    originChainId,
    destinationChainId,
    relayerFeePct,
    appliedRelayerFeePct,
    realizedLpFeePct,
    depositId,
    destinationToken,
    relayer,
    depositor,
    recipient,
    isSlowRelay,
  ];

  // build event
  const filledRelaySpokePool1 = new FilledRelay(
    event.address,
    event.logIndex,
    event.transactionLogIndex,
    event.logType,
    event.block,
    event.transaction,
    params,
    event.receipt
  );

  // primary handler
  handleFilledRelaySpokePool1(filledRelaySpokePool1);
}

export function handleFilledRelaySpokePool1(event: FilledRelay): void {
  // Chain
  const originChainId = event.params.originChainId;
  const destinationChainId = event.params.destinationChainId;

  // mainnet vs L2s
  let conf: BridgeConfig;
  if (destinationChainId == networkToChainID(Network.MAINNET)) {
    conf = MAINNET_BRIDGE_CONFIG;
  } else {
    conf = DEPLOYER_BRIDGE_CONFIG;
  }

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
  const poolId = inputToken.id;
  const pool = sdk.Pools.loadPool<string>(poolId);

  if (!pool.isInitialized) {
    pool.initialize(
      inputToken.name,
      inputToken.symbol,
      BridgePoolType.LOCK_RELEASE,
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
  pool.setInputTokenBalance(getTokenBalance(inputTokenAddress, event.address));

  // Revenue
  // Note: We take the amount from crossChain (origin) and multiplying by inputToken price (destination).
  // This isn't ideal but we do this because we don't have access to price for the crossToken.
  const lpFeePct = bigIntToBigDecimal(event.params.realizedLpFeePct);
  const relayerFeePct = bigIntToBigDecimal(event.params.relayerFeePct);
  const supplySideRevenueAmount = bigIntToBigDecimal(event.params.amount).times(
    lpFeePct.plus(relayerFeePct)
  );
  const supplySideRevenue = getUsdPrice(
    inputTokenAddress,
    supplySideRevenueAmount
  );
  pool.addSupplySideRevenueUSD(supplySideRevenue);
}

export function handleFundsDepositedSpokePool2(
  event: FundsDepositedSpokePool2
): void {
  // build params
  const amount = new ethereum.EventParam("amount", event.parameters[0].value);
  const originChainId = new ethereum.EventParam(
    "originChainId",
    event.parameters[1].value
  );
  const destinationChainId = new ethereum.EventParam(
    "destinationChainId",
    event.parameters[2].value
  );
  const relayerFeePct = new ethereum.EventParam(
    "relayerFeePct",
    event.parameters[3].value
  );
  const depositId = new ethereum.EventParam(
    "depositId",
    event.parameters[4].value
  );
  const quoteTimestamp = new ethereum.EventParam(
    "quoteTimestamp",
    event.parameters[5].value
  );
  const originToken = new ethereum.EventParam(
    "originToken",
    event.parameters[6].value
  );
  const recipient = new ethereum.EventParam(
    "recipient",
    event.parameters[7].value
  );
  const depositor = new ethereum.EventParam(
    "depositor",
    event.parameters[8].value
  );

  const params: ethereum.EventParam[] = [
    amount,
    originChainId,
    destinationChainId,
    relayerFeePct,
    depositId,
    quoteTimestamp,
    originToken,
    recipient,
    depositor,
  ];

  // build event
  const fundsDepositedSpokePool1 = new FundsDeposited(
    event.address,
    event.logIndex,
    event.transactionLogIndex,
    event.logType,
    event.block,
    event.transaction,
    params,
    event.receipt
  );

  // primary handler
  handleFundsDepositedSpokePool1(fundsDepositedSpokePool1);
}

export function handleFundsDepositedSpokePool1(event: FundsDeposited): void {
  // Chain
  const originChainId = event.params.originChainId;
  const destinationChainId = event.params.destinationChainId;

  // mainnet vs L2s
  let conf: BridgeConfig;
  if (originChainId == networkToChainID(Network.MAINNET)) {
    conf = MAINNET_BRIDGE_CONFIG;
  } else {
    conf = DEPLOYER_BRIDGE_CONFIG;
  }

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
    destinationChainId,
    crossTokenAddress!,
    CrosschainTokenType.CANONICAL,
    inputTokenAddress!
  );

  // Pool
  const poolId = inputToken.id;
  const pool = sdk.Pools.loadPool<string>(poolId);

  if (!pool.isInitialized) {
    pool.initialize(
      inputToken.name,
      inputToken.symbol,
      BridgePoolType.LOCK_RELEASE,
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
  pool.setInputTokenBalance(getTokenBalance(inputTokenAddress, event.address));
}
