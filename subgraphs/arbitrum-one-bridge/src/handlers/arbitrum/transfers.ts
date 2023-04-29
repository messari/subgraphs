import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import {
  DepositFinalized,
  WithdrawalInitiated,
  TokenGateway,
} from "../../../generated/ERC20Gateway/TokenGateway";
import {
  BridgePoolType,
  CrosschainTokenType,
} from "../../sdk/protocols/bridge/enums";
import { SDK } from "../../sdk/protocols/bridge";
import { networkToChainID } from "../../sdk/protocols/bridge/chainIds";
import { arbSideConf, Pricer, TokenInit } from "../../common/utils";
import { Network } from "../../sdk/util/constants";
import { _ERC20 } from "../../../generated/ERC20Gateway/_ERC20";

// ###################################################################################################
// ################################# Transfer Ins ####################################################
// ###################################################################################################

export function handleTransferIn3pGateway(event: DepositFinalized): void {
  const l1Token = new ethereum.EventParam("l1token", event.parameters[0].value);
  const _from = new ethereum.EventParam("_from", event.parameters[1].value);
  const _to = new ethereum.EventParam("_to", event.parameters[2].value);
  const _amount = new ethereum.EventParam("_amount", event.parameters[3].value);

  const params: ethereum.EventParam[] = [l1Token, _from, _to, _amount];
  const depositFinalized = new DepositFinalized(
    event.address,
    event.logIndex,
    event.transactionLogIndex,
    event.logType,
    event.block,
    event.transaction,
    params,
    event.receipt
  );
  handleTransferIn(depositFinalized);
}

export function handleTransferIn(event: DepositFinalized): void {
  // -- SDK

  const sdk = SDK.initialize(
    arbSideConf,
    new Pricer(event.block),
    new TokenInit(),
    event
  );

  // -- TOKENS

  const gatewayContract = TokenGateway.bind(event.address);
  const crossTokenAddress = event.params.l1Token;
  let inputTokenAddress: Address;
  const inputTokenAddressResult =
    gatewayContract.try_calculateL2TokenAddress(crossTokenAddress);
  if (inputTokenAddressResult.reverted) {
    log.info("calculate cross token address call reverted", []);
  } else {
    inputTokenAddress = inputTokenAddressResult.value;
  }

  const inputToken = sdk.Tokens.getOrCreateToken(inputTokenAddress!);
  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    networkToChainID(Network.ARBITRUM_ONE),
    crossTokenAddress!,
    CrosschainTokenType.CANONICAL,
    inputTokenAddress!
  );

  // -- POOL

  const poolId = event.address.concat(inputToken.id);
  const pool = sdk.Pools.loadPool<string>(poolId);

  if (!pool.isInitialized) {
    pool.initialize(
      inputToken.name,
      inputToken.symbol,
      BridgePoolType.BURN_MINT,
      inputToken
    );
  }

  pool.addDestinationToken(crossToken);

  // -- ACCOUNT

  const acc = sdk.Accounts.loadAccount(event.params._to);
  acc.transferIn(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    event.params._from,
    event.params._amount,
    event.transaction.hash
  );

  // -- TVL

  let inputTokenBalance: BigInt;
  const erc20 = _ERC20.bind(inputTokenAddress!);
  const inputTokenBalanceResult = erc20.try_balanceOf(event.address);
  if (inputTokenBalanceResult.reverted) {
    log.info("calculate token balance owned by bridge contract reverted", []);
  } else {
    inputTokenBalance = inputTokenBalanceResult.value;
  }
  pool.setInputTokenBalance(inputTokenBalance!);
}

// ###################################################################################################
// ############################### Transfer Outs #####################################################
// ###################################################################################################

export function handleTransferOut3pGateway(event: WithdrawalInitiated): void {
  const l1Token = new ethereum.EventParam("l1token", event.parameters[0].value);
  const _from = new ethereum.EventParam("_from", event.parameters[1].value);
  const _to = new ethereum.EventParam("_to", event.parameters[2].value);
  const _l2ToL1Id = new ethereum.EventParam(
    "_l2ToL1Id",
    event.parameters[3].value
  );
  const _exitNum = new ethereum.EventParam(
    "_exitNum",
    event.parameters[4].value
  );
  const _amount = new ethereum.EventParam("_amount", event.parameters[5].value);

  const params: ethereum.EventParam[] = [
    l1Token,
    _from,
    _to,
    _l2ToL1Id,
    _exitNum,
    _amount,
  ];
  const withdrawalInitiated = new WithdrawalInitiated(
    event.address,
    event.logIndex,
    event.transactionLogIndex,
    event.logType,
    event.block,
    event.transaction,
    params,
    event.receipt
  );
  handleTransferOut(withdrawalInitiated);
}

export function handleTransferOut(event: WithdrawalInitiated): void {
  // -- SDK

  const sdk = SDK.initialize(
    arbSideConf,
    new Pricer(event.block),
    new TokenInit(),
    event
  );

  // -- TOKENS

  const gatewayContract = TokenGateway.bind(event.address);
  const crossTokenAddress = event.params.l1Token;
  let inputTokenAddress: Address;
  const inputTokenAddressResult =
    gatewayContract.try_calculateL2TokenAddress(crossTokenAddress);
  if (inputTokenAddressResult.reverted) {
    log.info("calculate cross token address call reverted", []);
  } else {
    inputTokenAddress = inputTokenAddressResult.value;
  }

  const inputToken = sdk.Tokens.getOrCreateToken(inputTokenAddress!);
  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    networkToChainID(Network.ARBITRUM_ONE),
    crossTokenAddress!,
    CrosschainTokenType.CANONICAL,
    inputTokenAddress!
  );

  // -- POOL

  const poolId = event.address.concat(inputToken.id);
  const pool = sdk.Pools.loadPool<string>(poolId);

  if (!pool.isInitialized) {
    pool.initialize(
      inputToken.name,
      inputToken.symbol,
      BridgePoolType.BURN_MINT,
      inputToken
    );
  }

  pool.addDestinationToken(crossToken);

  // -- ACCOUNT

  const acc = sdk.Accounts.loadAccount(event.params._to);
  acc.transferOut(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    event.params._from,
    event.params._amount,
    event.transaction.hash
  );

  // -- TVL

  let inputTokenBalance: BigInt;
  const erc20 = _ERC20.bind(inputTokenAddress!);
  const inputTokenBalanceResult = erc20.try_balanceOf(event.address);
  if (inputTokenBalanceResult.reverted) {
    log.info("calculate token balance owned by bridge contract reverted", []);
  } else {
    inputTokenBalance = inputTokenBalanceResult.value;
  }
  pool.setInputTokenBalance(inputTokenBalance!);
}
