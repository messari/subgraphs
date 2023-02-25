import { Address, Bytes } from "@graphprotocol/graph-ts";
import {
  ERC20DepositInitiated as ERC20DepositInitiatedEvent,
  ERC20WithdrawalFinalized as ERC20WithdrawalFinalizedEvent,
  ETHDepositInitiated as ETHDepositInitiatedEvent,
  ETHWithdrawalFinalized as ETHWithdrawalFinalizedEvent,
} from "../../generated/templates/Bridge/L1StandardBridge";
import { ETH_ADDRESS_OPTIMISM } from "../constants";
import { getSDK } from "../sdk";
import { networkToChainID } from "../sdk/protocols/bridge/chainIds";
import {
  BridgePoolType,
  CrosschainTokenType,
} from "../sdk/protocols/bridge/enums";
import { ETH_ADDRESS, Network } from "../sdk/util/constants";

export function handleERC20DepositInitiated(
  event: ERC20DepositInitiatedEvent
): void {
  const sdk = getSDK(event);
  const pool = sdk.Pools.loadPool(event.params._l1Token);
  if (!pool.isInitialized) {
    const token = sdk.Tokens.getOrCreateToken(event.params._l1Token);
    pool.initialize(
      token.name,
      token.symbol,
      BridgePoolType.LOCK_RELEASE,
      token
    );
  }

  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    networkToChainID(Network.OPTIMISM),
    event.params._l2Token,
    CrosschainTokenType.WRAPPED,
    event.params._l1Token
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

export function handleERC20WithdrawalFinalized(
  event: ERC20WithdrawalFinalizedEvent
): void {
  const sdk = getSDK(event);
  const pool = sdk.Pools.loadPool(event.params._l1Token);
  if (!pool.isInitialized) {
    const token = sdk.Tokens.getOrCreateToken(event.params._l1Token);
    pool.initialize(
      token.name,
      token.symbol,
      BridgePoolType.LOCK_RELEASE,
      token
    );
  }

  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    networkToChainID(Network.OPTIMISM),
    event.params._l2Token,
    CrosschainTokenType.WRAPPED,
    event.params._l1Token
  );
  pool.addDestinationToken(crossToken);

  const acc = sdk.Accounts.loadAccount(event.params._to);
  acc.transferIn(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    event.params._from,
    event.params._amount
  );
}

export function handleETHDepositInitiated(
  event: ETHDepositInitiatedEvent
): void {
  const sdk = getSDK(event);
  const ethAddress = Address.fromString(ETH_ADDRESS);

  const pool = sdk.Pools.loadPool(Bytes.fromHexString(ETH_ADDRESS));
  if (!pool.isInitialized) {
    const token = sdk.Tokens.getOrCreateToken(ethAddress);
    pool.initialize(
      token.name,
      token.symbol,
      BridgePoolType.LOCK_RELEASE,
      token
    );
  }

  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    networkToChainID(Network.OPTIMISM),
    Address.fromString(ETH_ADDRESS_OPTIMISM),
    CrosschainTokenType.WRAPPED,
    ethAddress
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

export function handleETHWithdrawalFinalized(
  event: ETHWithdrawalFinalizedEvent
): void {
  const sdk = getSDK(event);
  const ethAddress = Address.fromString(ETH_ADDRESS);

  const pool = sdk.Pools.loadPool(ethAddress);
  if (!pool.isInitialized) {
    const token = sdk.Tokens.getOrCreateToken(ethAddress);
    pool.initialize(
      token.name,
      token.symbol,
      BridgePoolType.LOCK_RELEASE,
      token
    );
  }

  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    networkToChainID(Network.OPTIMISM),
    Address.fromString(ETH_ADDRESS_OPTIMISM),
    CrosschainTokenType.WRAPPED,
    ethAddress
  );
  pool.addDestinationToken(crossToken);

  const acc = sdk.Accounts.loadAccount(event.params._to);
  acc.transferIn(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    event.params._from,
    event.params._amount
  );
}
