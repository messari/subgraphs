import { SDK } from "../../sdk/protocols/bridge";
import {
  BridgePoolType,
  CrosschainTokenType,
} from "../../sdk/protocols/bridge/enums";
import { networkToChainID } from "../../sdk/protocols/bridge/chainIds";
import { ETH_NAME, ETH_SYMBOL, Network } from "../../sdk/util/constants";
import { MessageDelivered } from "../../../generated/L1Bridge/Bridge";
import {
  ethSideConf,
  ethAddress,
  Pricer,
  TokenInit,
  undoAlias,
} from "../../common/utils";
import { Address } from "@graphprotocol/graph-ts";

export function handleL1MessageDelivered(event: MessageDelivered): void {
  // -- SDK

  const sdk = SDK.initialize(
    ethSideConf,
    new Pricer(event.block),
    new TokenInit(),
    event
  );

  // -- ACCOUNT

  const sender = Address.fromString(undoAlias(event.params.sender));
  const acc = sdk.Accounts.loadAccount(sender);

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
        ETH_NAME,
        ETH_SYMBOL,
        BridgePoolType.LOCK_RELEASE,
        sdk.Tokens.getOrCreateToken(ethAddress)
      );
    }

    pool.addDestinationToken(crossToken);

    // -- ACCOUNT

    acc.transferOut(
      pool,
      pool.getDestinationTokenRoute(crossToken)!,
      sender,
      event.transaction.value,
      event.transaction.hash
    );
  } else if (event.params.kind == L2_MSG) {
    acc.messageOut(
      networkToChainID(Network.ARBITRUM_ONE),
      event.transaction.to!, // don't have access to receiver
      event.params.messageDataHash
    );
  }
}
