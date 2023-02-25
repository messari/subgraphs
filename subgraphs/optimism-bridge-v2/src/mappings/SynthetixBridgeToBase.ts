import { log } from "@graphprotocol/graph-ts";
import {
  DepositFinalized,
  FinalizeSynthTransfer,
  InitiateSynthTransfer,
  WithdrawalInitiated,
} from "../../generated/templates/Bridge/SynthetixBridgeToBase";
import {
  SNX_ADDRESS_MAINNET,
  SNX_ADDRESS_OPTIMISM,
  SUSD_ADDRESS_MAINNET,
  SUSD_ADDRESS_OPTIMISM,
} from "../constants";
import { getSDK } from "../sdk";
import { networkToChainID } from "../sdk/protocols/bridge/chainIds";
import {
  BridgePoolType,
  CrosschainTokenType,
} from "../sdk/protocols/bridge/enums";
import { Network } from "../sdk/util/constants";

export function handleDepositFinalized(event: DepositFinalized): void {
  const sdk = getSDK(event);
  const pool = sdk.Pools.loadPool(SNX_ADDRESS_OPTIMISM);
  if (!pool.isInitialized) {
    const token = sdk.Tokens.getOrCreateToken(SNX_ADDRESS_OPTIMISM);
    pool.initialize(token.name, token.symbol, BridgePoolType.BURN_MINT, token);
  }

  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    networkToChainID(Network.MAINNET),
    SNX_ADDRESS_MAINNET,
    CrosschainTokenType.CANONICAL,
    SNX_ADDRESS_OPTIMISM
  );
  pool.addDestinationToken(crossToken);
  const acc = sdk.Accounts.loadAccount(event.params._to);
  acc.transferIn(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    event.params._to,
    event.params._amount
  );
}

export function handleFinalizeSynthTransfer(
  event: FinalizeSynthTransfer
): void {
  if (event.params.currencyKey.toString() != "sUSD") {
    log.error("unhandled synth currency: {}", [
      event.params.currencyKey.toString(),
    ]);
    return;
  }
  const sdk = getSDK(event);
  const pool = sdk.Pools.loadPool(SUSD_ADDRESS_OPTIMISM);
  if (!pool.isInitialized) {
    const token = sdk.Tokens.getOrCreateToken(SUSD_ADDRESS_OPTIMISM);
    pool.initialize(token.name, token.symbol, BridgePoolType.BURN_MINT, token);
  }

  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    networkToChainID(Network.MAINNET),
    SUSD_ADDRESS_MAINNET,
    CrosschainTokenType.CANONICAL,
    SUSD_ADDRESS_OPTIMISM
  );
  pool.addDestinationToken(crossToken);

  const acc = sdk.Accounts.loadAccount(event.params.destination);
  acc.transferIn(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    event.params.destination,
    event.params.amount
  );
}

export function handleInitiateSynthTransfer(
  event: InitiateSynthTransfer
): void {
  if (event.params.currencyKey.toString() != "sUSD") {
    log.error("unhandled synth currency: {}", [
      event.params.currencyKey.toString(),
    ]);
    return;
  }
  const sdk = getSDK(event);
  const pool = sdk.Pools.loadPool(SUSD_ADDRESS_OPTIMISM);
  if (!pool.isInitialized) {
    const token = sdk.Tokens.getOrCreateToken(SUSD_ADDRESS_OPTIMISM);
    pool.initialize(token.name, token.symbol, BridgePoolType.BURN_MINT, token);
  }

  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    networkToChainID(Network.MAINNET),
    SUSD_ADDRESS_MAINNET,
    CrosschainTokenType.CANONICAL,
    SUSD_ADDRESS_OPTIMISM
  );
  pool.addDestinationToken(crossToken);

  const acc = sdk.Accounts.loadAccount(event.params.destination);
  acc.transferOut(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    event.params.destination,
    event.params.amount
  );
}

export function handleWithdrawalInitiated(event: WithdrawalInitiated): void {
  const sdk = getSDK(event);
  const pool = sdk.Pools.loadPool(SNX_ADDRESS_OPTIMISM);
  if (!pool.isInitialized) {
    const token = sdk.Tokens.getOrCreateToken(SNX_ADDRESS_OPTIMISM);
    pool.initialize(token.name, token.symbol, BridgePoolType.BURN_MINT, token);
  }

  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    networkToChainID(Network.MAINNET),
    SNX_ADDRESS_MAINNET,
    CrosschainTokenType.CANONICAL,
    SNX_ADDRESS_OPTIMISM
  );
  pool.addDestinationToken(crossToken);
  const acc = sdk.Accounts.loadAccount(event.params._to);
  acc.transferOut(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    event.params._to,
    event.params._amount
  );
}
