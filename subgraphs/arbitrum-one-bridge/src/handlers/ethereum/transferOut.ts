import { CustomEventType, SDK } from "../../sdk/protocols/bridge";
import {
  BridgePermissionType,
  BridgePoolType,
  CrosschainTokenType,
} from "../../sdk/protocols/bridge/enums";
import { BridgeConfig } from "../../sdk/protocols/bridge/config";
import { Versions } from "../../versions";
import { Address, log, ethereum } from "@graphprotocol/graph-ts";
import {
  TokenGateway,
  WithdrawalFinalized
} from "../../../generated/ERC20Gateway/TokenGateway";
import { networkToChainID } from "../../sdk/protocols/bridge/chainIds";
import { Network } from "../../sdk/util/constants";
import { Pricer, TokenInit } from "../../common/utils";


      // public address: Address,
      // public logIndex: BigInt,
      // public transactionLogIndex: BigInt,
      // public logType: string | null,
      // public block: Block,
      // public transaction: Transaction,
      // public parameters: Array<EventParam>,
      // public receipt: TransactionReceipt | null,

export function handleTransferOut3pGateway(event: WithdrawalFinalized): void {
  log.error("[3p Gateway] We are in transferOut3pGateway", []);

  const l1Token = new ethereum.EventParam("l1token", event.parameters[0].value);
  const _from = new ethereum.EventParam("_from", event.parameters[1].value);
  const _to = new ethereum.EventParam("_to", event.parameters[2].value);
  const _exitNum = new ethereum.EventParam("_exitNum", event.parameters[3].value);
  const _amount = new ethereum.EventParam("_amount", event.parameters[4].value);

  const params: ethereum.EventParam[] = [l1Token, _from, _to, _exitNum, _amount];
  const withdrawalFinalized = new WithdrawalFinalized(event.address, event.logIndex, event.transactionLogIndex, event.logType, event.block, event.transaction, params, event.receipt);
  handleTransferOut(withdrawalFinalized);
}

// export function handleTransferOutL1LPTGateway(event: WithdrawalFinalized): void {
//   log.error("[LPT] We are in transferOutLPT", []);

//   const l1Token = new ethereum.EventParam("l1token", event.parameters[0].value);
//   const _from = new ethereum.EventParam("_from", event.parameters[1].value);
//   const _to = new ethereum.EventParam("_to", event.parameters[2].value);
//   const _exitNum = new ethereum.EventParam("_exitNum", event.parameters[3].value);
//   const _amount = new ethereum.EventParam("_amount", event.parameters[4].value);

//   const params: ethereum.EventParam[] = [l1Token, _from, _to, _exitNum, _amount];
//   const withdrawalFinalized = new WithdrawalFinalized(event.address, event.logIndex, event.transactionLogIndex, event.logType, event.block, event.transaction, params, event.receipt);
  
//   handleTransferOut(withdrawalFinalized);
// }

export function handleTransferOut(event: WithdrawalFinalized): void {
  log.error("[+] We are in transferOut", []);
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

  // TODO: update symbol?
  if (!pool.isInitialized) {
    pool.initialize(
      poolId.toString(),
      "ERC20",
      BridgePoolType.LOCK_RELEASE,
      sdk.Tokens.getOrCreateToken(inputTokenAddress!)
    );
  }

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
