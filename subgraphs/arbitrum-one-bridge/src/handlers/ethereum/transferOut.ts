import { SDK } from "../../sdk/protocols/bridge";
import {
  BridgePoolType,
  CrosschainTokenType,
} from "../../sdk/protocols/bridge/enums";
import { Address, log, ethereum } from "@graphprotocol/graph-ts";
import {
  TokenGateway,
  WithdrawalFinalized
} from "../../../generated/ERC20Gateway/TokenGateway";
import { networkToChainID } from "../../sdk/protocols/bridge/chainIds";
import { Network } from "../../sdk/util/constants";
import { ethSideConf, Pricer, TokenInit } from "../../common/utils";

export function handleTransferOut3pGateway(event: WithdrawalFinalized): void {
  // build params
  const l1Token = new ethereum.EventParam("l1token", event.parameters[0].value);
  const _from = new ethereum.EventParam("_from", event.parameters[1].value);
  const _to = new ethereum.EventParam("_to", event.parameters[2].value);
  const _exitNum = new ethereum.EventParam("_exitNum", event.parameters[3].value);
  const _amount = new ethereum.EventParam("_amount", event.parameters[4].value);
  const params: ethereum.EventParam[] = [l1Token, _from, _to, _exitNum, _amount];

  // build event
  const withdrawalFinalized = new WithdrawalFinalized(event.address, event.logIndex, event.transactionLogIndex, event.logType, event.block, event.transaction, params, event.receipt);

  // primary handler
  handleTransferOut(withdrawalFinalized);
}

export function handleTransferOut(event: WithdrawalFinalized): void {
  // -- SDK

  const sdk = SDK.initialize(ethSideConf, new Pricer(), new TokenInit(), event);

  // -- TOKENS

  const crossTokenAddress: Address = event.params.l1Token;

  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    networkToChainID(Network.ARBITRUM_ONE),
    crossTokenAddress!,
    CrosschainTokenType.CANONICAL,
    crossTokenAddress!
  );

  const gatewayContract = TokenGateway.bind(event.address);

  let inputTokenAddress: Address;
  const inputTokenAddressResult =
    gatewayContract.try_calculateL2TokenAddress(crossTokenAddress);
  if (inputTokenAddressResult.reverted) {
    log.info("calculate cross token address call reverted", []);
  } else {
    inputTokenAddress = inputTokenAddressResult.value;
  }

  const inputToken = sdk.Tokens.getOrCreateToken(inputTokenAddress!);

  // -- POOL

  const poolId = event.address.concat(inputToken.symbol);
  const pool = sdk.Pools.loadPool<string>(poolId);

  if (!pool.isInitialized) {
    pool.initialize(
      poolId.toString(),
      inputToken.symbol,
      BridgePoolType.LOCK_RELEASE,
      inputToken
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
