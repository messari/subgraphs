import { SDK } from "../../sdk/protocols/bridge";
import {
  BridgePoolType,
  CrosschainTokenType,
} from "../../sdk/protocols/bridge/enums";

import { ethereum } from "@graphprotocol/graph-ts";
import { networkToChainID } from "../../sdk/protocols/bridge/chainIds";
import { BIGINT_ZERO, ETH_SYMBOL, Network } from "../../sdk/util/constants";
import {
  L2ToL1Tx,
  L2ToL1Transaction,
} from "../../../generated/L2ArbSys/ArbSys";
import { Pricer, TokenInit, arbSideConf, ethAddress } from "../../common/utils";

export function handleL2ToL1Tx(event: L2ToL1Tx): void {
  // build params
  const caller = new ethereum.EventParam("caller", event.parameters[0].value);
  const destination = new ethereum.EventParam(
    "destination",
    event.parameters[1].value
  );
  const callvalue = new ethereum.EventParam(
    "callvalue",
    event.parameters[7].value
  );
  const data = new ethereum.EventParam("data", event.parameters[8].value);

  const params: ethereum.EventParam[] = [caller, destination, callvalue, data];

  // build event
  const l2ToL1Transaction = new L2ToL1Transaction(
    event.address,
    event.logIndex,
    event.transactionLogIndex,
    event.logType,
    event.block,
    event.transaction,
    params,
    event.receipt
  );

  // primary handler
  handleL2ToL1Transaction(l2ToL1Transaction);
}

export function handleL2ToL1Transaction(event: L2ToL1Transaction): void {
  // -- SDK
  const sdk = SDK.initialize(arbSideConf, new Pricer(event.block), new TokenInit(), event);

  // -- ACCOUNT
  const acc = sdk.Accounts.loadAccount(event.params.caller);

  if (event.params.callvalue > BIGINT_ZERO) {
    // ETH TRANSFER
    // note: we can also add additional check (event.params.data.toString() != "0x")

    // -- TOKENS

    const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
      networkToChainID(Network.MAINNET),
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

    acc.transferOut(
      pool,
      pool.getDestinationTokenRoute(crossToken)!,
      event.params.destination,
      event.params.callvalue,
      event.transaction.hash
    );
  } else if (
    // MESSAGING
    // note: we can also add additional check (event.params.data.toString() == "0x")
    event.params.callvalue == BIGINT_ZERO
  ) {
    acc.messageOut(
      networkToChainID(Network.MAINNET),
      event.params.destination,
      event.params.data
    );
  }
}
