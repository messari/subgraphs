import { CustomEventType, SDK } from "../../sdk/protocols/bridge";
import {
  BridgePermissionType,
  BridgePoolType,
  CrosschainTokenType,
} from "../../sdk/protocols/bridge/enums";
import { BridgeConfig } from "../../sdk/protocols/bridge/config";
import { Versions } from "../../versions";
import { Address } from "@graphprotocol/graph-ts";
import { networkToChainID } from "../../sdk/protocols/bridge/chainIds";
import { ETH_ADDRESS, ETH_SYMBOL, Network } from "../../sdk/util/constants";
import { Pool } from "../../sdk/protocols/bridge/pool";
import { MessageDelivered } from "../../../generated/L1Bridge/Bridge";
import { Pricer, TokenInit } from "../../common/utils";

const ethAddress = Address.fromString(ETH_ADDRESS);

export function handleL1MessageDelivered(event: MessageDelivered): void {
  // -- BRIDGECONFIG

  const conf = new BridgeConfig(
    event.address.toHexString(),
    "arbitrum-one",
    "arbitrum-one",
    BridgePermissionType.WHITELIST,
    Versions
  );
  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), event);
  const acc = sdk.Accounts.loadAccount(event.params.sender);

  // Nitro
  // Message Types - https://github.com/OffchainLabs/nitro/blob/master/contracts/src/libraries/MessageTypes.sol#L10
  // L1MessageType_ethDeposit = 12
  // L2_MSG = 3

  if (event.params.kind == 12) {
    // ----> if event.params.kind == 12 // ETH TRANSFER
    // -----------------------> create ETH pool using onCreatePool
    // -----------------------> account transferIn (eth -> arb)

    // source and destination token == ethAddress
    const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
      networkToChainID(Network.ARBITRUM_ONE),
      ethAddress,
      CrosschainTokenType.CANONICAL,
      ethAddress
    );

    // -- POOL

    // const poolId = event.address;
    // const pool = sdk.Pools.loadPool(
    //   poolId,
    //   onCreatePool,
    //   BridgePoolType.LOCK_RELEASE
    // );
    //
    // pool.addDestinationToken(crossToken);

    const poolId = event.address;
    const pool = sdk.Pools.loadPool(poolId);

    pool.initialize(
      poolId.toString(),
      ETH_SYMBOL,
      BridgePoolType.LOCK_RELEASE,
      sdk.Tokens.getOrCreateToken(ethAddress)
    );

    pool.addDestinationToken(crossToken);

    // -- ACCOUNT

    acc.transferIn(
      pool,
      pool.getDestinationTokenRoute(crossToken)!,
      event.params.sender,
      event.transaction.value,
      event.transaction.hash
    );
  } else if (event.params.kind == 3) {
    // ----> if event.params.kind == 3
    // -----------------------> update account message counts

    acc.messageIn(
      networkToChainID(Network.ARBITRUM_ONE),
      event.params.sender,
      event.params.messageDataHash
      // event.transaction.hash   // bug: no optional transactionID param
    );
  }
}

// function onCreatePool(
//   event: CustomEventType,
//   pool: Pool,
//   sdk: SDK,
//   type: BridgePoolType
// ): void {
//   pool.initialize(
//     pool.pool.id.toString(),
//     ETH_SYMBOL,
//     type,
//     sdk.Tokens.getOrCreateToken(ethAddress)
//   );
// }
