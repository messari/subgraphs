import { Address } from "@graphprotocol/graph-ts";
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
} from "../../generated/SpokePool1/SpokePool";
import { networkToChainID } from "../sdk/protocols/bridge/chainIds";
import { Network } from "../sdk/util/constants";
import { BridgeConfig } from "../sdk/protocols/bridge/config";

export function handleFilledRelay(event: FilledRelay): void {
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

export function handleFundsDeposited(event: FundsDeposited): void {
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
