import { log } from "@graphprotocol/graph-ts";
import {
  DepositInitiated,
  FinalizeSynthTransfer,
  InitiateSynthTransfer,
  WithdrawalFinalized,
} from "../../generated/templates/Bridge/SynthetixBridgeToOptimism";
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

export function handleDepositInitiated(event: DepositInitiated): void {
  const sdk = getSDK(event);
  const pool = sdk.Pools.loadPool(SNX_ADDRESS_MAINNET);
  if (!pool.isInitialized) {
    const token = sdk.Tokens.getOrCreateToken(SNX_ADDRESS_MAINNET);
    pool.initialize(
      token.name,
      token.symbol,
      BridgePoolType.LOCK_RELEASE,
      token
    );
  }

  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    networkToChainID(Network.OPTIMISM),
    SNX_ADDRESS_OPTIMISM,
    CrosschainTokenType.WRAPPED,
    SNX_ADDRESS_MAINNET
  );
  pool.addDestinationToken(crossToken);
  const acc = sdk.Accounts.loadAccount(event.params._from);
  acc.transferOut(
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
  const pool = sdk.Pools.loadPool(SUSD_ADDRESS_MAINNET);
  if (!pool.isInitialized) {
    const token = sdk.Tokens.getOrCreateToken(SUSD_ADDRESS_MAINNET);
    pool.initialize(
      token.name,
      token.symbol,
      BridgePoolType.LOCK_RELEASE,
      token
    );
  }

  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    networkToChainID(Network.OPTIMISM),
    SUSD_ADDRESS_OPTIMISM,
    CrosschainTokenType.WRAPPED,
    SUSD_ADDRESS_MAINNET
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
  const pool = sdk.Pools.loadPool(SUSD_ADDRESS_MAINNET);
  if (!pool.isInitialized) {
    const token = sdk.Tokens.getOrCreateToken(SUSD_ADDRESS_MAINNET);
    pool.initialize(
      token.name,
      token.symbol,
      BridgePoolType.LOCK_RELEASE,
      token
    );
  }

  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    networkToChainID(Network.OPTIMISM),
    SUSD_ADDRESS_OPTIMISM,
    CrosschainTokenType.WRAPPED,
    SUSD_ADDRESS_MAINNET
  );
  pool.addDestinationToken(crossToken);

  const acc = sdk.Accounts.loadAccount(event.transaction.from);
  acc.transferOut(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    event.params.destination,
    event.params.amount
  );
}

export function handleWithdrawalFinalized(event: WithdrawalFinalized): void {
  const sdk = getSDK(event);
  const pool = sdk.Pools.loadPool(SNX_ADDRESS_MAINNET);
  if (!pool.isInitialized) {
    const token = sdk.Tokens.getOrCreateToken(SNX_ADDRESS_MAINNET);
    pool.initialize(
      token.name,
      token.symbol,
      BridgePoolType.LOCK_RELEASE,
      token
    );
  }

  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    networkToChainID(Network.OPTIMISM),
    SNX_ADDRESS_OPTIMISM,
    CrosschainTokenType.WRAPPED,
    SNX_ADDRESS_MAINNET
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
