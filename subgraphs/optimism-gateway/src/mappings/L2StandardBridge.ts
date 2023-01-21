import { Address } from "@graphprotocol/graph-ts";
import {
  DepositFinalized as DepositFinalizedEvent,
  WithdrawalInitiated as WithdrawalInitiatedEvent,
} from "../../generated/templates/Bridge/L2StandardBridge";
import { getSDK } from "../sdk";
import { networkToChainID } from "../sdk/protocols/bridge/chainIds";
import {
  BridgePoolType,
  CrosschainTokenType,
} from "../sdk/protocols/bridge/enums";
import { ETH_ADDRESS, Network, ZERO_ADDRESS } from "../sdk/util/constants";

export function handleDepositFinalized(event: DepositFinalizedEvent): void {
  const sdk = getSDK(event);
  const pool = sdk.Pools.loadPool(event.params._l2Token);
  if (!pool.isInitialized) {
    const token = sdk.Tokens.getOrCreateToken(event.params._l2Token);
    pool.initialize(token.name, token.symbol, BridgePoolType.BURN_MINT, token);
  }

  let l1Token = event.params._l1Token;
  // ETH deposits/withdrawals have l1Token set to zero
  if (l1Token.toHexString() == ZERO_ADDRESS) {
    l1Token = Address.fromString(ETH_ADDRESS);
  }
  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    networkToChainID(Network.MAINNET),
    l1Token,
    CrosschainTokenType.CANONICAL,
    event.params._l2Token
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

export function handleWithdrawalInitiated(
  event: WithdrawalInitiatedEvent
): void {
  const sdk = getSDK(event);
  const pool = sdk.Pools.loadPool(event.params._l2Token);
  if (!pool.isInitialized) {
    const token = sdk.Tokens.getOrCreateToken(event.params._l2Token);
    pool.initialize(token.name, token.symbol, BridgePoolType.BURN_MINT, token);
  }

  let l1Token = event.params._l1Token;
  // ETH deposits/withdrawals have l1Token set to zero
  if (l1Token.toHexString() == ZERO_ADDRESS) {
    l1Token = Address.fromString(ETH_ADDRESS);
  }
  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    networkToChainID(Network.MAINNET),
    l1Token,
    CrosschainTokenType.CANONICAL,
    event.params._l2Token
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
