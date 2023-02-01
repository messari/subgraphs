import { CustomEventType, SDK } from "../../sdk/protocols/bridge";
import {
  BridgePermissionType,
  BridgePoolType,
  CrosschainTokenType,
} from "../../sdk/protocols/bridge/enums";
import { BridgeConfig } from "../../sdk/protocols/bridge/config";
import { Versions } from "../../versions";
import { Address, log } from "@graphprotocol/graph-ts";
import {
  TokenGateway,
  WithdrawalFinalized,
} from "../../../generated/ERC20Gateway/TokenGateway";
import { networkToChainID } from "../../sdk/protocols/bridge/chainIds";
import { Network } from "../../sdk/util/constants";
import { Pricer, TokenInit } from "../../common/utils";
import { Pool } from "../../sdk/protocols/bridge/pool";

export function handleTransferOut(event: WithdrawalFinalized): void {
  // -- BRIDGECONFIG

  const conf = new BridgeConfig(
    event.address.toHexString(),
    "arbitrum-one",
    "arbitrum-one",
    BridgePermissionType.WHITELIST,
    Versions
  );

  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), event);

  // -- TOKENS

  const crossTokenAddress: Address = event.params.l1Token;

  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    networkToChainID(Network.ARBITRUM_ONE),
    crossTokenAddress!,
    CrosschainTokenType.CANONICAL,
    crossTokenAddress!
  );

  // -- POOL

  // const poolId = event.address;

  // const pool = sdk.Pools.loadPool(
  //   poolId,
  //   onCreatePool,
  //   BridgePoolType.LOCK_RELEASE
  // );

  // pool.addDestinationToken(crossToken);

  const gatewayContract = TokenGateway.bind(event.address);

  let inputTokenAddress: Address;
  const inputTokenAddressResult =
    gatewayContract.try_calculateL2TokenAddress(crossTokenAddress);
  if (inputTokenAddressResult.reverted) {
    log.info("calculate cross token address call reverted", []);
  } else {
    inputTokenAddress = inputTokenAddressResult.value;
  }

  const poolId = event.address;
  const pool = sdk.Pools.loadPool<string>(poolId);

  pool.initialize(
    poolId.toString(),
    "ERC20",
    BridgePoolType.LOCK_RELEASE,
    sdk.Tokens.getOrCreateToken(inputTokenAddress!)
  );

  pool.addDestinationToken(crossToken);

  // -- ACCOUNT

  const acc = sdk.Accounts.loadAccount(event.params._from);
  acc.transferOut(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    event.params._to,
    event.params._amount,
    event.transaction.hash
  );
}

// function onCreatePool(
//   event: CustomEventType,
//   pool: Pool,
//   sdk: SDK,
//   type: BridgePoolType
// ): void {
//   const myEvent: WithdrawalFinalized = event.event as WithdrawalFinalized;
//   const crossTokenAddress = myEvent.params.l1Token;
//   const gatewayContract = TokenGateway.bind(myEvent.address);

//   let inputTokenAddress: Address;
//   const inputTokenAddressResult =
//     gatewayContract.try_calculateL2TokenAddress(crossTokenAddress);
//   if (inputTokenAddressResult.reverted) {
//     log.info("calculate cross token address call reverted", []);
//   } else {
//     inputTokenAddress = inputTokenAddressResult.value;
//   }

//   pool.initialize(
//     pool.pool.id.toString(),
//     "ERC20",
//     type,
//     sdk.Tokens.getOrCreateToken(inputTokenAddress!)
//   );
// }
