import { Address, log } from "@graphprotocol/graph-ts";
import { BridgeConfig } from "../../sdk/protocols/bridge/config";
import { DepositFinalized } from "../../../generated/LPTGateway/LPTGateway";
import {
  BridgePermissionType,
  BridgePoolType,
  CrosschainTokenType,
} from "../../sdk/protocols/bridge/enums";
import { Versions } from "../../versions";
import { SDK } from "../../sdk/protocols/bridge";
import { networkToChainID } from "../../sdk/protocols/bridge/chainIds";
import { Pool } from "../../sdk/protocols/bridge/pool";
import { CustomEventType } from "../../sdk/protocols/bridge";
import { Network } from "../../sdk/util/constants";
import { Pricer, TokenInit } from "../../common/utils";
import { TokenGateway } from "../../../generated/ERC20Gateway/TokenGateway";

export function handleTransferIn(event: DepositFinalized): void {
  const gatewayContractAddress = event.address.toHexString();

  // === BRIDGECONFIG

  const conf = new BridgeConfig(
    gatewayContractAddress,
    "arbitrum-one",
    "arbitrum-one",
    BridgePermissionType.WHITELIST,
    Versions
  );

  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), event);

  // -- TOKENS

  const gatewayContract = TokenGateway.bind(event.address);
  const inputTokenAddress = event.params._l1Token;
  let crossTokenAddress: Address;

  const crossTokenAddressResult =
    gatewayContract.try_calculateL2TokenAddress(inputTokenAddress);
  if (crossTokenAddressResult.reverted) {
    log.info("calculate cross token address call reverted", []);
  } else {
    crossTokenAddress = crossTokenAddressResult.value;
  }

  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    networkToChainID(Network.ARBITRUM_ONE),
    crossTokenAddress!,
    CrosschainTokenType.CANONICAL,
    crossTokenAddress!
  );

  // -- POOL

  const poolId = event.address;

  const pool = sdk.Pools.loadPool(
    poolId,
    onCreatePool,
    BridgePoolType.LOCK_RELEASE
  );

  pool.addDestinationToken(crossToken);

  // -- ACCOUNT

  const acc = sdk.Accounts.loadAccount(event.params._from);
  acc.transferIn(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    event.params._from,
    event.params._amount,
    event.transaction.hash
  );
}

function onCreatePool(
  event: CustomEventType,
  pool: Pool,
  sdk: SDK,
  type: BridgePoolType
): void {
  const myEvent: DepositFinalized = event.event as DepositFinalized;
  pool.initialize(
    pool.pool.id.toString(),
    "LPT",
    type,
    sdk.Tokens.getOrCreateToken(myEvent.params._l1Token)
  );
}
