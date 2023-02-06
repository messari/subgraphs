import { SDK } from "../../sdk/protocols/bridge";
import {
  BridgePoolType,
  CrosschainTokenType,
} from "../../sdk/protocols/bridge/enums";
import { Address } from "@graphprotocol/graph-ts";
import { networkToChainID } from "../../sdk/protocols/bridge/chainIds";
import { ETH_ADDRESS, ETH_SYMBOL, Network } from "../../sdk/util/constants";
import { MessageDelivered } from "../../../generated/L1Bridge/Bridge";
import { ethSideConf, Pricer, TokenInit } from "../../common/utils";

// eth
const ethAddress = Address.fromString(ETH_ADDRESS);

export function handleL1MessageDelivered(event: MessageDelivered): void {
  // -- SDK

  const sdk = SDK.initialize(ethSideConf, new Pricer(), new TokenInit(), event);

  // -- ACCOUNT

  const acc = sdk.Accounts.loadAccount(event.params.sender);

  // -- HANDLE ETH DEPOSIT & MESSAGES

  // Nitro
  // Message Types - https://github.com/OffchainLabs/nitro/blob/master/contracts/src/libraries/MessageTypes.sol#L10
  const L1MessageType_ethDeposit = 12;
  const L2_MSG = 3;

  if (event.params.kind == L1MessageType_ethDeposit) {
    // -- TOKENS

    // source and destination token == ethAddress
    const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
      networkToChainID(Network.ARBITRUM_ONE),
      ethAddress,
      CrosschainTokenType.CANONICAL,
      ethAddress
    );

    // -- POOL

    const poolId = event.address;
    const pool = sdk.Pools.loadPool<string>(poolId);

    if (!pool.isInitialized) {
      pool.initialize(
        poolId.toString(),
        ETH_SYMBOL,
        BridgePoolType.LOCK_RELEASE,
        sdk.Tokens.getOrCreateToken(ethAddress)
      );
    }

    pool.addDestinationToken(crossToken);

    // -- ACCOUNT

    acc.transferIn(
      pool,
      pool.getDestinationTokenRoute(crossToken)!,
      event.params.sender,
      event.transaction.value,
      event.transaction.hash
    );
  } else if (event.params.kind == L2_MSG) {
    acc.messageIn(
      networkToChainID(Network.ARBITRUM_ONE),
      event.params.sender,
      event.params.messageDataHash
    );
  }
}
