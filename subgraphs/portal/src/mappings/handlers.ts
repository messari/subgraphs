import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  dataSource,
  log,
} from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import {
  denormalizeAmount,
  getCrossTokenAddress,
  truncateAddress,
} from "./helpers";
import { getUsdPrice, getUsdPricePerToken } from "../prices";

import { SDK } from "../sdk/protocols/bridge";
import { TokenInitializer, TokenParams } from "../sdk/protocols/bridge/tokens";
import { BridgeConfig } from "../sdk/protocols/bridge/config";
import {
  BridgePermissionType,
  BridgePoolType,
  CrosschainTokenType,
} from "../sdk/protocols/bridge/enums";
import { TokenPricer } from "../sdk/protocols/config";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import { BIGINT_ZERO, INT_ZERO, ZERO_ADDRESS } from "../sdk/util/constants";

import {
  Bridge,
  CompleteTransferAndUnwrapETHCall,
  CompleteTransferAndUnwrapETHWithPayloadCall,
  CompleteTransferCall,
  CompleteTransferWithPayloadCall,
} from "../../generated/Core/Bridge";
import { Core, LogMessagePublished } from "../../generated/Core/Core";
import { _ERC20 } from "../../generated/Core/_ERC20";
import { Token } from "../../generated/schema";

const conf = new BridgeConfig(
  NetworkConfigs.getFactoryAddress().toHexString(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  BridgePermissionType.PRIVATE,
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    const pricedToken = Address.fromBytes(token.id);

    return getUsdPricePerToken(pricedToken).usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const pricedToken = Address.fromBytes(token.id);
    const _amount = bigIntToBigDecimal(amount, token.decimals);

    return getUsdPrice(pricedToken, _amount);
  }
}

class TokenInit implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    const erc20 = _ERC20.bind(address);
    let name = "unknown";
    let symbol = "UNKNOWN";
    let decimals = INT_ZERO as i32;

    const nameCall = erc20.try_name();
    if (!nameCall.reverted) {
      name = nameCall.value;
    } else {
      log.warning("[getTokenParams] nameCall reverted for {}", [
        address.toHexString(),
      ]);
    }
    const symbolCall = erc20.try_symbol();
    if (!symbolCall.reverted) {
      symbol = symbolCall.value;
    } else {
      log.warning("[getTokenParams] symbolCall reverted for {}", [
        address.toHexString(),
      ]);
    }
    const decimalsCall = erc20.try_decimals();
    if (!decimalsCall.reverted) {
      decimals = decimalsCall.value.toI32();
    } else {
      log.warning("[getTokenParams] decimalsCall reverted for {}", [
        address.toHexString(),
      ]);
    }

    return {
      name,
      symbol,
      decimals,
    };
  }
}

export function handleSwapOut(event: LogMessagePublished): void {
  const payload = event.params.payload;

  let amount: BigInt;
  let tokenAddress: Bytes;
  let tokenChain: i32;
  let to: Bytes;
  let toChain: i32;

  const bridgeContract = Bridge.bind(NetworkConfigs.getBridgeAddress());
  const parseTransferCall = bridgeContract.try_parseTransfer(payload);
  if (parseTransferCall.reverted) {
    const parseTransferWithPayloadCall =
      bridgeContract.try_parseTransferWithPayload(payload);
    if (parseTransferWithPayloadCall.reverted) {
      log.warning("[handleSwapOut] tx_hash: {} failed to parse payload: {}", [
        event.transaction.hash.toHexString(),
        payload.toHexString(),
      ]);
      return;
    }

    const transferStruct = parseTransferWithPayloadCall.value;

    amount = transferStruct.amount;
    tokenAddress = transferStruct.tokenAddress;
    tokenChain = transferStruct.tokenChain;
    to = transferStruct.to;
    toChain = transferStruct.toChain;
  } else {
    const transferStruct = parseTransferCall.value;

    amount = transferStruct.amount;
    tokenAddress = transferStruct.tokenAddress;
    tokenChain = transferStruct.tokenChain;
    to = transferStruct.to;
    toChain = transferStruct.toChain;
  }

  const chainID = NetworkConfigs.getNetworkID();

  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), event);

  let bridgePoolType = BridgePoolType.LOCK_RELEASE;
  let crosschainTokenType = CrosschainTokenType.WRAPPED;
  if (BigInt.fromI32(tokenChain) != chainID) {
    tokenAddress = bridgeContract.wrappedAsset(tokenChain, tokenAddress);
    bridgePoolType = BridgePoolType.BURN_MINT;
    crosschainTokenType = CrosschainTokenType.CANONICAL;
  }

  if (tokenAddress == Address.fromString(ZERO_ADDRESS)) {
    return;
  }

  const token = sdk.Tokens.getOrCreateToken(truncateAddress(tokenAddress));
  amount = denormalizeAmount(amount, token.decimals);

  const pool = sdk.Pools.loadPool<string>(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, bridgePoolType, token);
  }

  const crosschainTokenAddr = getCrossTokenAddress(
    token.id.toHexString(),
    BigInt.fromI32(tokenChain),
    chainID,
    BigInt.fromI32(toChain)
  );
  const crosschainToken = sdk.Tokens.getOrCreateCrosschainToken(
    BigInt.fromI32(toChain),
    crosschainTokenAddr,
    crosschainTokenType,
    Address.fromBytes(token.id)
  );

  pool.addDestinationToken(crosschainToken);

  const route = pool.getDestinationTokenRoute(crosschainToken);

  const coreContract = Core.bind(dataSource.address());
  const protocolFee = coreContract.messageFee();
  pool.addRevenueNative(protocolFee, BIGINT_ZERO);

  const protocol = sdk.Protocol;
  protocol.setBridgingFee(protocolFee);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.transferOut(pool, route!, to, amount);
}

export function handleSwapIn(call: CompleteTransferCall): void {
  const coreContract = Core.bind(NetworkConfigs.getFactoryAddress());
  const parseVMCall = coreContract.try_parseAndVerifyVM(call.inputs.encodedVm);
  if (parseVMCall.reverted) {
    log.warning("[handleSwapIn] failed to parse encodedVM: {}", [
      call.inputs.encodedVm.toHexString(),
    ]);

    return;
  }

  const parsedVM = parseVMCall.value;
  const fromChain = parsedVM.value0.emitterChainId;
  const fromAddress = parsedVM.value0.emitterAddress;
  const payload = parsedVM.value0.payload;

  const bridgeContract = Bridge.bind(dataSource.address());
  const parseTransferCall = bridgeContract.try_parseTransfer(payload);
  if (parseTransferCall.reverted) {
    log.warning("[handleSwapIn] failed to parse payload: {}", [
      payload.toHexString(),
    ]);

    return;
  }

  const transferStruct = parseTransferCall.value;
  let amount = transferStruct.amount;
  let tokenAddress = transferStruct.tokenAddress;
  const tokenChain = transferStruct.tokenChain;
  const to = transferStruct.to;

  const chainID = NetworkConfigs.getNetworkID();

  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), call);

  let bridgePoolType = BridgePoolType.LOCK_RELEASE;
  let crosschainTokenType = CrosschainTokenType.WRAPPED;
  if (BigInt.fromI32(tokenChain) != chainID) {
    tokenAddress = bridgeContract.wrappedAsset(tokenChain, tokenAddress);
    bridgePoolType = BridgePoolType.BURN_MINT;
    crosschainTokenType = CrosschainTokenType.CANONICAL;
  }

  if (tokenAddress == Address.fromString(ZERO_ADDRESS)) {
    return;
  }

  const token = sdk.Tokens.getOrCreateToken(truncateAddress(tokenAddress));
  amount = denormalizeAmount(amount, token.decimals);

  const pool = sdk.Pools.loadPool<string>(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, bridgePoolType, token);
  }

  const crosschainTokenAddr = getCrossTokenAddress(
    token.id.toHexString(),
    BigInt.fromI32(tokenChain),
    chainID,
    BigInt.fromI32(fromChain)
  );
  const crosschainToken = sdk.Tokens.getOrCreateCrosschainToken(
    BigInt.fromI32(fromChain),
    crosschainTokenAddr,
    crosschainTokenType,
    Address.fromBytes(token.id)
  );

  pool.addDestinationToken(crosschainToken);
  const route = pool.getDestinationTokenRoute(crosschainToken);

  const account = sdk.Accounts.loadAccount(truncateAddress(to));
  account.transferIn(pool, route!, fromAddress, amount);
}

export function handleSwapInWithPayload(
  call: CompleteTransferWithPayloadCall
): void {
  const coreContract = Core.bind(NetworkConfigs.getFactoryAddress());
  const parseVMCall = coreContract.try_parseAndVerifyVM(call.inputs.encodedVm);
  if (parseVMCall.reverted) {
    log.warning("[handleSwapInWithPayload] failed to parse encodedVM: {}", [
      call.inputs.encodedVm.toHexString(),
    ]);

    return;
  }

  const parsedVM = parseVMCall.value;
  const fromChain = parsedVM.value0.emitterChainId;
  const fromAddress = parsedVM.value0.emitterAddress;
  const payload = parsedVM.value0.payload;

  const bridgeContract = Bridge.bind(dataSource.address());
  const parseTransferCall =
    bridgeContract.try_parseTransferWithPayload(payload);
  if (parseTransferCall.reverted) {
    log.warning("[handleSwapInWithPayload] failed to parse payload: {}", [
      payload.toHexString(),
    ]);

    return;
  }

  const transferStruct = parseTransferCall.value;
  let amount = transferStruct.amount;
  let tokenAddress = transferStruct.tokenAddress;
  const tokenChain = transferStruct.tokenChain;
  const to = transferStruct.to;

  const chainID = NetworkConfigs.getNetworkID();

  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), call);

  let bridgePoolType = BridgePoolType.LOCK_RELEASE;
  let crosschainTokenType = CrosschainTokenType.WRAPPED;
  if (BigInt.fromI32(tokenChain) != chainID) {
    tokenAddress = bridgeContract.wrappedAsset(tokenChain, tokenAddress);
    bridgePoolType = BridgePoolType.BURN_MINT;
    crosschainTokenType = CrosschainTokenType.CANONICAL;
  }

  if (tokenAddress == Address.fromString(ZERO_ADDRESS)) {
    return;
  }

  const token = sdk.Tokens.getOrCreateToken(truncateAddress(tokenAddress));
  amount = denormalizeAmount(amount, token.decimals);

  const pool = sdk.Pools.loadPool<string>(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, bridgePoolType, token);
  }

  const crosschainTokenAddr = getCrossTokenAddress(
    token.id.toHexString(),
    BigInt.fromI32(tokenChain),
    chainID,
    BigInt.fromI32(fromChain)
  );
  const crosschainToken = sdk.Tokens.getOrCreateCrosschainToken(
    BigInt.fromI32(fromChain),
    crosschainTokenAddr,
    crosschainTokenType,
    Address.fromBytes(token.id)
  );

  pool.addDestinationToken(crosschainToken);
  const route = pool.getDestinationTokenRoute(crosschainToken);

  const account = sdk.Accounts.loadAccount(truncateAddress(to));
  account.transferIn(pool, route!, fromAddress, amount);
}

export function handleSwapInNative(
  call: CompleteTransferAndUnwrapETHCall
): void {
  const coreContract = Core.bind(NetworkConfigs.getFactoryAddress());
  const parseVMCall = coreContract.try_parseAndVerifyVM(call.inputs.encodedVm);
  if (parseVMCall.reverted) {
    log.warning("[handleSwapInNative] failed to parse encodedVM: {}", [
      call.inputs.encodedVm.toHexString(),
    ]);

    return;
  }

  const parsedVM = parseVMCall.value;
  const fromChain = parsedVM.value0.emitterChainId;
  const fromAddress = parsedVM.value0.emitterAddress;
  const payload = parsedVM.value0.payload;

  const bridgeContract = Bridge.bind(dataSource.address());
  const parseTransferCall = bridgeContract.try_parseTransfer(payload);
  if (parseTransferCall.reverted) {
    log.warning("[handleSwapInNative] failed to parse payload: {}", [
      payload.toHexString(),
    ]);

    return;
  }

  const transferStruct = parseTransferCall.value;
  let amount = transferStruct.amount;
  let tokenAddress = transferStruct.tokenAddress;
  const tokenChain = transferStruct.tokenChain;
  const to = transferStruct.to;

  const chainID = NetworkConfigs.getNetworkID();

  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), call);

  let bridgePoolType = BridgePoolType.LOCK_RELEASE;
  let crosschainTokenType = CrosschainTokenType.WRAPPED;
  if (BigInt.fromI32(tokenChain) != chainID) {
    tokenAddress = bridgeContract.wrappedAsset(tokenChain, tokenAddress);
    bridgePoolType = BridgePoolType.BURN_MINT;
    crosschainTokenType = CrosschainTokenType.CANONICAL;
  }

  if (tokenAddress == Address.fromString(ZERO_ADDRESS)) {
    return;
  }

  const token = sdk.Tokens.getOrCreateToken(truncateAddress(tokenAddress));
  amount = denormalizeAmount(amount, token.decimals);

  const pool = sdk.Pools.loadPool<string>(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, bridgePoolType, token);
  }

  const crosschainTokenAddr = getCrossTokenAddress(
    token.id.toHexString(),
    BigInt.fromI32(tokenChain),
    chainID,
    BigInt.fromI32(fromChain)
  );
  const crosschainToken = sdk.Tokens.getOrCreateCrosschainToken(
    BigInt.fromI32(fromChain),
    crosschainTokenAddr,
    crosschainTokenType,
    Address.fromBytes(token.id)
  );

  pool.addDestinationToken(crosschainToken);
  const route = pool.getDestinationTokenRoute(crosschainToken);

  const account = sdk.Accounts.loadAccount(truncateAddress(to));
  account.transferIn(pool, route!, fromAddress, amount);
}

export function handleSwapInNativeWithPayload(
  call: CompleteTransferAndUnwrapETHWithPayloadCall
): void {
  const coreContract = Core.bind(NetworkConfigs.getFactoryAddress());
  const parseVMCall = coreContract.try_parseAndVerifyVM(call.inputs.encodedVm);
  if (parseVMCall.reverted) {
    log.warning(
      "[handleSwapInNativeWithPayload] failed to parse encodedVM: {}",
      [call.inputs.encodedVm.toHexString()]
    );
    return;
  }

  const parsedVM = parseVMCall.value;
  const fromChain = parsedVM.value0.emitterChainId;
  const fromAddress = parsedVM.value0.emitterAddress;
  const payload = parsedVM.value0.payload;

  const bridgeContract = Bridge.bind(dataSource.address());
  const parseTransferCall =
    bridgeContract.try_parseTransferWithPayload(payload);
  if (parseTransferCall.reverted) {
    log.warning("[handleSwapInNativeWithPayload] failed to parse payload: {}", [
      payload.toHexString(),
    ]);

    return;
  }

  const transferStruct = parseTransferCall.value;
  let amount = transferStruct.amount;
  let tokenAddress = transferStruct.tokenAddress;
  const tokenChain = transferStruct.tokenChain;
  const to = transferStruct.to;

  const chainID = NetworkConfigs.getNetworkID();

  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), call);

  let bridgePoolType = BridgePoolType.LOCK_RELEASE;
  let crosschainTokenType = CrosschainTokenType.WRAPPED;
  if (BigInt.fromI32(tokenChain) != chainID) {
    tokenAddress = bridgeContract.wrappedAsset(tokenChain, tokenAddress);
    bridgePoolType = BridgePoolType.BURN_MINT;
    crosschainTokenType = CrosschainTokenType.CANONICAL;
  }

  if (tokenAddress == Address.fromString(ZERO_ADDRESS)) {
    return;
  }

  const token = sdk.Tokens.getOrCreateToken(truncateAddress(tokenAddress));
  amount = denormalizeAmount(amount, token.decimals);

  const pool = sdk.Pools.loadPool<string>(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, bridgePoolType, token);
  }

  const crosschainTokenAddr = getCrossTokenAddress(
    token.id.toHexString(),
    BigInt.fromI32(tokenChain),
    chainID,
    BigInt.fromI32(fromChain)
  );
  const crosschainToken = sdk.Tokens.getOrCreateCrosschainToken(
    BigInt.fromI32(fromChain),
    crosschainTokenAddr,
    crosschainTokenType,
    Address.fromBytes(token.id)
  );

  pool.addDestinationToken(crosschainToken);
  const route = pool.getDestinationTokenRoute(crosschainToken);

  const account = sdk.Accounts.loadAccount(truncateAddress(to));
  account.transferIn(pool, route!, fromAddress, amount);
}
