import { SDK } from "../../sdk/protocols/bridge";
import {
  BridgePoolType,
  CrosschainTokenType,
} from "../../sdk/protocols/bridge/enums";
import { Address, log, ethereum, BigInt } from "@graphprotocol/graph-ts";
import {
  DepositInitiated,
  TokenGateway,
  WithdrawalFinalized,
} from "../../../generated/ERC20Gateway/TokenGateway";
import { networkToChainID } from "../../sdk/protocols/bridge/chainIds";
import { Network } from "../../sdk/util/constants";
import { ethSideConf, Pricer, TokenInit } from "../../common/utils";
import { _ERC20 } from "../../../generated/ERC20Gateway/_ERC20";

// ###################################################################################################
// ################################# Transfer Ins ####################################################
// ###################################################################################################

export function handleTransferIn3pGateway(event: WithdrawalFinalized): void {
  // build params
  const l1Token = new ethereum.EventParam("l1token", event.parameters[0].value);
  const _from = new ethereum.EventParam("_from", event.parameters[1].value);
  const _to = new ethereum.EventParam("_to", event.parameters[2].value);
  const _exitNum = new ethereum.EventParam(
    "_exitNum",
    event.parameters[3].value
  );
  const _amount = new ethereum.EventParam("_amount", event.parameters[4].value);
  const params: ethereum.EventParam[] = [
    l1Token,
    _from,
    _to,
    _exitNum,
    _amount,
  ];

  // build event
  const withdrawalFinalized = new WithdrawalFinalized(
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
  handleTransferIn(withdrawalFinalized);
}

export function handleTransferIn(event: WithdrawalFinalized): void {
  if (ignoredToken(event.params.l1Token.toHexString())) {
    // token is in ignored tokens list, skip execution
    return;
  }
  // -- SDK

  const sdk = SDK.initialize(
    ethSideConf,
    new Pricer(event.block),
    new TokenInit(),
    event
  );

  // -- TOKENS

  const inputTokenAddress: Address = event.params.l1Token;
  const inputToken = sdk.Tokens.getOrCreateToken(inputTokenAddress!);

  let crossTokenAddress: Address;
  const gatewayContract = TokenGateway.bind(event.address);
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
    inputTokenAddress
  );

  // -- POOL

  const poolId = event.address.concat(inputToken.id);
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
  const erc20 = _ERC20.bind(inputTokenAddress);
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

export function handleTransferOut3pGateway(event: DepositInitiated): void {
  // build params
  const l1Token = new ethereum.EventParam("l1token", event.parameters[0].value);
  const _from = new ethereum.EventParam("_from", event.parameters[1].value);
  const _to = new ethereum.EventParam("_to", event.parameters[2].value);
  const _sequenceNumber = new ethereum.EventParam(
    "_sequenceNumber",
    event.parameters[3].value
  );
  const _amount = new ethereum.EventParam("_amount", event.parameters[4].value);
  const params: ethereum.EventParam[] = [
    l1Token,
    _from,
    _to,
    _sequenceNumber,
    _amount,
  ];

  // build event
  const depositInitiated = new DepositInitiated(
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
  handleTransferOut(depositInitiated);
}

export function handleTransferOut(event: DepositInitiated): void {
  if (ignoredToken(event.params.l1Token.toHexString())) {
    // token is in ignored tokens list, skip execution
    return;
  }

  // -- SDK

  const sdk = SDK.initialize(
    ethSideConf,
    new Pricer(event.block),
    new TokenInit(),
    event
  );

  // -- TOKENS

  const inputTokenAddress: Address = event.params.l1Token;
  const inputToken = sdk.Tokens.getOrCreateToken(inputTokenAddress!);

  let crossTokenAddress: Address;
  const gatewayContract = TokenGateway.bind(event.address);
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
    inputTokenAddress
  );

  // -- POOL

  const poolId = event.address.concat(inputToken.id);
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

  // -- TVL

  let inputTokenBalance: BigInt;
  const erc20 = _ERC20.bind(inputTokenAddress);
  const inputTokenBalanceResult = erc20.try_balanceOf(event.address);
  if (inputTokenBalanceResult.reverted) {
    log.info("calculate token balance owned by bridge contract reverted", []);
  } else {
    inputTokenBalance = inputTokenBalanceResult.value;
  }
  pool.setInputTokenBalance(inputTokenBalance!);
}

function ignoredToken(tokenAddress: string): bool {
  const IGNORED_TOKENS: Array<string> = [
    "0x761d38e5ddf6ccf6cf7c55759d5210750b5d60f3",
    "0xd9a8bb44968f35282f1b91c353f77a61baf31a4b",
    "0x050cbff7bff0432b6096dd15cd9499913ddf8e23",
    "0xcfaf8edcea94ebaa080dc4983c3f9be5701d6613",
  ];

  for (let i = 0; i < IGNORED_TOKENS.length; i++) {
    if (IGNORED_TOKENS[i] == tokenAddress) {
      return true;
    }
  }

  return false;
}
