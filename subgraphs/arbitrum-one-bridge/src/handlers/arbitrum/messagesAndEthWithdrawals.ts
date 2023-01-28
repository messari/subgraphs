import { CustomEventType, SDK } from "../../sdk/protocols/bridge";
import {
  BridgePermissionType,
  BridgePoolType,
  CrosschainTokenType,
} from "../../sdk/protocols/bridge/enums";
import { BridgeConfig } from "../../sdk/protocols/bridge/config";
import { Versions } from "../../versions";
import { Address, log } from "@graphprotocol/graph-ts";
import { networkToChainID } from "../../sdk/protocols/bridge/chainIds";
import {
  BIGINT_ZERO,
  ETH_ADDRESS,
  ETH_SYMBOL,
  Network,
} from "../../sdk/util/constants";
import { Pool } from "../../sdk/protocols/bridge/pool";
import {
  L2ToL1Tx,
  L2ToL1Transaction,
} from "../../../generated/L2ArbSys/ArbSys";
import { Pricer, TokenInit } from "../../common/utils";

const ethAddress = Address.fromString(ETH_ADDRESS);

export function handleL2ToL1Transaction(event: L2ToL1Transaction): void {
  // log.error("&&& We found a L2ToL1Transaction: {} {} {}", [
  //   event.transaction.hash.toHexString(),
  //   event.block.number.toString(),
  //   event.block.timestamp.toString(),
  // ]);

  // --- BRIDGECONFIG

  const conf = new BridgeConfig(
    event.address.toHexString(),
    "arbitrum-one",
    "arbitrum-one",
    BridgePermissionType.WHITELIST,
    Versions
  );
  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), event);
  const acc = sdk.Accounts.loadAccount(event.params.caller);

  // -- ETH TRANSFER
  // TODO: do we want to check for event.params.data.toString() != "0x"
  if (event.params.callvalue > BIGINT_ZERO) {
    const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
      networkToChainID(Network.MAINNET),
      ethAddress,
      CrosschainTokenType.CANONICAL,
      ethAddress
    );

    // -- POOL

    const poolId = event.address;
    const pool = sdk.Pools.loadPool(poolId);

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

    acc.transferOut(
      pool,
      pool.getDestinationTokenRoute(crossToken)!,
      event.params.destination,
      event.params.callvalue,
      event.transaction.hash
    );
    // -- MESSAGING
  } else if (
    event.params.callvalue == BIGINT_ZERO
    // &&
    // event.params.data.toString() == "0x"
  ) {
    acc.messageOut(
      networkToChainID(Network.MAINNET),
      event.params.destination,
      event.params.data
    );
  }
}

export function handleL2ToL1Tx(event: L2ToL1Tx): void {
  // log.error("&&& We found a L2ToL1Transaction: {} {} {}", [
  //   event.transaction.hash.toHexString(),
  //   event.block.number.toString(),
  //   event.block.timestamp.toString(),
  // ]);

  // --- BRIDGECONFIG

  const conf = new BridgeConfig(
    event.address.toHexString(),
    "arbitrum-one",
    "arbitrum-one",
    BridgePermissionType.WHITELIST,
    Versions
  );

  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), event);

  const acc = sdk.Accounts.loadAccount(event.params.caller);

  // -- ETH TRANSFER
  // TODO: do we want to check for event.params.data.toString() != "0x"
  if (event.params.callvalue > BIGINT_ZERO) {
    const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
      networkToChainID(Network.MAINNET),
      ethAddress,
      CrosschainTokenType.CANONICAL,
      ethAddress
    );

    // -- POOL

    // const poolId = event.address;
    //
    // const pool = sdk.Pools.loadPool(
    //   poolId,
    //   onCreatePool,
    //   BridgePoolType.LOCK_RELEASE
    // );
    //
    // pool.addDestinationToken(crossToken);

    const poolId = event.address;
    const pool = sdk.Pools.loadPool(poolId);

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

    acc.transferOut(
      pool,
      pool.getDestinationTokenRoute(crossToken)!,
      event.params.destination,
      event.params.callvalue,
      event.transaction.hash
    );
    // -- MESSAGING
  } else if (
    event.params.callvalue == BIGINT_ZERO
    // &&
    // event.params.data.toString() == "0x"
  ) {
    acc.messageOut(
      networkToChainID(Network.MAINNET),
      event.params.destination,
      event.params.data
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
