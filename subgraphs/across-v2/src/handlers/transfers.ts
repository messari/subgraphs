import { Address } from "@graphprotocol/graph-ts";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import { Network } from "../sdk/util/constants";
import {
  ACROSS_HUB_POOL_CONTRACT,
  ACROSS_PROTOCOL_NAME,
  Pricer,
  TokenInit,
  getTokenBalance,
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
import { networkToChainID } from "../sdk/protocols/bridge/chainIds";

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
