import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import {
  PredicateRegistered,
  TokenMapped,
} from "../../generated/RootChainManager/RootChainManager";
import { SDK } from "../sdk/protocols/bridge";
import {
  BridgePoolType,
  CrosschainTokenType,
} from "../sdk/protocols/bridge/enums";
import { conf, Pricer, TokenInit } from "./fx-erc20";
import { Predicate as PredicateTemplate } from "../../generated/templates";
import { UNKNOWN_TOKEN_VALUE } from "../prices/common/constants";

export function handlePredicateRegistered(event: PredicateRegistered): void {
  log.debug(
    "[handlePredicate] New Predicate {} with TokenType {} at block {} & hash: {}",
    [
      event.params.predicateAddress.toHexString(),
      event.params.tokenType.toString(),
      event.block.number.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
  PredicateTemplate.create(event.params.predicateAddress);
}

export function handlePOSTokenMapped(event: TokenMapped): void {
  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), event);
  const crosschainID = BigInt.fromI32(137);

  const pool = sdk.Pools.loadPool<string>(event.params.rootToken);
  const rootToken = sdk.Tokens.getOrCreateToken(event.params.rootToken);

  if (rootToken.name == UNKNOWN_TOKEN_VALUE) {
    return;
  }

  if (!pool.isInitialized) {
    pool.initialize(
      rootToken.name,
      rootToken.symbol,
      BridgePoolType.LOCK_RELEASE,
      rootToken
    );
  }

  const crosschainTokenAddr = event.params.childToken;

  const crosschainToken = sdk.Tokens.getOrCreateCrosschainToken(
    crosschainID,
    crosschainTokenAddr,
    CrosschainTokenType.WRAPPED,
    Address.fromBytes(rootToken.id)
  );

  pool.addDestinationToken(crosschainToken);
}
