import { Address, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";

import {
  ExitTokensCall,
  LockTokensCall,
} from "../../generated/FxERC20Events/ERC20Predicate";

import { SDK } from "../sdk/protocols/bridge";
import {
  BridgePoolType,
  CrosschainTokenType,
} from "../sdk/protocols/bridge/enums";
import { RootChainManager } from "../../generated/FxERC20Events/RootChainManager";
import { UNKNOWN_TOKEN_VALUE } from "../prices/common/constants";
import { conf, Pricer, TokenInit } from "./fxErc20";

export function handleLockTokens(call: LockTokensCall): void {
  // poolAddress == RootToken Address
  const poolAddr = call.inputs.rootToken;
  const depositData = call.inputs.depositData;

  const decoded = ethereum.decode("uint256", depositData);

  if (!decoded) {
    log.critical("[DECODE ERROR] {} {}", [
      call.transaction.hash.toHexString(),
      depositData.toHexString(),
    ]);
    return;
  }

  const amount = decoded.toBigInt();
  log.info("[DECODE SUCCESS] txhash = {}, depositData = {} amount = {}", [
    call.transaction.hash.toHexString(),
    depositData.toHexString(),
    amount.toString(),
  ]);

  const crosschainID = BigInt.fromI32(137);

  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), call);

  const pool = sdk.Pools.loadPool<string>(poolAddr);
  const token = sdk.Tokens.getOrCreateToken(call.inputs.rootToken);
  if (token.name == UNKNOWN_TOKEN_VALUE) {
    return;
  }

  if (!pool.isInitialized) {
    pool.initialize(
      token.name,
      token.symbol,
      BridgePoolType.LOCK_RELEASE,
      token
    );
  }

  const rootChainManger = RootChainManager.bind(
    Address.fromString(conf.getID())
  );

  const crosschainTokenAddr_call = rootChainManger.try_rootToChildToken(
    call.inputs.rootToken
  );

  if (crosschainTokenAddr_call.reverted) {
    log.warning(
      "[handleSwapIn] No crosschainToken for network: {} poolID: {} token: {}",
      [
        crosschainID.toString(),
        poolAddr.toHexString(),
        call.inputs.rootToken.toHexString(),
      ]
    );

    return;
  }
  const crosschainTokenAddr = crosschainTokenAddr_call.value;

  const crosschainToken = sdk.Tokens.getOrCreateCrosschainToken(
    crosschainID,
    crosschainTokenAddr,
    CrosschainTokenType.CANONICAL,
    Address.fromBytes(token.id)
  );

  pool.addDestinationToken(crosschainToken);
  const route = pool.getDestinationTokenRoute(crosschainToken);

  const account = sdk.Accounts.loadAccount(call.inputs.depositor);
  account.transferOut(pool, route!, call.inputs.depositReceiver, amount);
}

export function handleExitTokens(call: ExitTokensCall): void {
  // poolAddress == RootToken Address
  const poolAddr = call.inputs.rootToken;
  const logData = call.inputs.log;
  const logDataLength = call.inputs.log.length;
  const logDataOffset = logDataLength - 32;

  // Log Data is a RLP encoding of the TRANSFER log from the child chain
  // encoding is supposed to be (<address of childToken>, (<hash of transfer log on child chain>,<from>,<to (usually 0 since burn)>), <amount> ))
  // I was unable to decode it properly, but who cares, since we can get the amount from the last 32 bytes of this encoding.
  // You can decode the log data using this website https://toolkit.abdk.consulting/ethereum
  const decoded = ethereum.decode(
    "uint256",
    Bytes.fromUint8Array(logData.subarray(logDataOffset, logDataLength))
  );

  if (!decoded) {
    log.critical("[DECODE ERROR] {} {}", [
      call.transaction.hash.toHexString(),
      logData.toHexString(),
    ]);
    return;
  }

  const amount = decoded.toBigInt();
  log.info("[DECODE SUCCESS] txhash = {}, logData = {} amount = {}", [
    call.transaction.hash.toHexString(),
    logData.toHexString(),
    amount.toString(),
  ]);

  const crosschainID = BigInt.fromI32(137);

  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), call);

  const pool = sdk.Pools.loadPool<string>(poolAddr);
  const token = sdk.Tokens.getOrCreateToken(call.inputs.rootToken);
  if (token.name == UNKNOWN_TOKEN_VALUE) {
    return;
  }

  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, BridgePoolType.BURN_MINT, token);
  }

  const rootChainManger = RootChainManager.bind(
    Address.fromString(conf.getID())
  );

  const crosschainTokenAddr_call = rootChainManger.try_rootToChildToken(
    call.inputs.rootToken
  );

  if (crosschainTokenAddr_call.reverted) {
    log.warning(
      "[handleSwapIn] No crosschainToken for network: {} poolID: {} token: {}",
      [
        crosschainID.toString(),
        poolAddr.toHexString(),
        call.inputs.rootToken.toHexString(),
      ]
    );

    return;
  }
  const crosschainTokenAddr = crosschainTokenAddr_call.value;

  const crosschainToken = sdk.Tokens.getOrCreateCrosschainToken(
    crosschainID,
    crosschainTokenAddr,
    CrosschainTokenType.CANONICAL,
    Address.fromBytes(token.id)
  );

  pool.addDestinationToken(crosschainToken);
  const route = pool.getDestinationTokenRoute(crosschainToken);

  const account = sdk.Accounts.loadAccount(call.inputs.value0);
  account.transferIn(pool, route!, call.inputs.value0, amount);
}
