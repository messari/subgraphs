import {
  BigDecimal,
  BigInt,
  Address,
  ethereum,
  Bytes,
  log,
  crypto,
  ByteArray,
} from "@graphprotocol/graph-ts";
import {
  TokenSent,
  TokenDeployed,
  ContractCallWithToken,
  ContractCall,
  ContractCallApprovedWithMint,
  ContractCallApproved,
  Executed,
} from "../generated/AxelarGateway/AxelarGateway";
import { BurnableMintableCappedERC20 } from "../generated/AxelarGateway/BurnableMintableCappedERC20";
import {
  GasPaidForContractCall,
  GasPaidForContractCallWithToken,
  NativeGasPaidForContractCall,
  NativeGasPaidForContractCallWithToken,
  GasAdded,
  NativeGasAdded,
  RefundCall,
} from "../generated/AxelarGasService/AxelarGasService";
import { SDK } from "./sdk/protocols/bridge";
import { CustomEventType } from "./sdk/util/events";
import { TokenPricer } from "./sdk/protocols/config";
import { TokenInitializer, TokenParams } from "./sdk/protocols/bridge/tokens";
import {
  BridgePermissionType,
  BridgePoolType,
  CrosschainTokenType,
} from "./sdk/protocols/bridge/enums";
import { BridgeConfig } from "./sdk/protocols/bridge/config";
import { Account } from "./sdk/protocols/bridge/account";
import { _ERC20 } from "../generated/AxelarGateway/_ERC20";
import { ERC20NameBytes } from "../generated/AxelarGateway/ERC20NameBytes";
import { ERC20SymbolBytes } from "../generated/AxelarGateway/ERC20SymbolBytes";
import { Versions } from "./versions";
import { Token, _Command, _TokenSymbol } from "../generated/schema";
import { bigIntToBigDecimal } from "./sdk/util/numbers";
import { getUsdPricePerToken, getUsdPrice } from "./prices";
import { networkToChainID } from "./sdk/protocols/bridge/chainIds";
import {
  BIGINT_ZERO,
  BIGINT_ONE,
  getNetworkSpecificConstant,
  Network,
  BIGINT_MINUS_ONE,
  TokenType,
  POOL_PREFIX,
  INT_TWENTY_SIX,
  UINT256,
  ADDRESS,
  TRANSFER,
} from "./sdk/util/constants";
import { Pool } from "./sdk/protocols/bridge/pool";
import { isValidEVMAddress } from "./sdk/util/strings";

// empty handler for prices library
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
export function handlePairCreated(event: ethereum.Event): void {}

// Implement TokenPricer to pass it to the SDK constructor
class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    const price = getUsdPricePerToken(Address.fromBytes(token.id));
    return price.usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const _amount = bigIntToBigDecimal(amount, token.decimals);
    return getUsdPrice(Address.fromBytes(token.id), _amount);
  }
}

// Implement TokenInitializer
class TokenInit implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    const erc20 = _ERC20.bind(address);
    const decimals = erc20.decimals().toI32();

    let name = "Unknown Token";
    const nameResult = erc20.try_name();
    if (!nameResult.reverted) {
      name = nameResult.value;
    } else {
      const erc20name = ERC20NameBytes.bind(address);
      const nameResult = erc20name.try_name();
      if (!nameResult.reverted) {
        name = nameResult.value.toString();
      } else {
        log.warning("[getTokenParams]Fail to get name for token {}", [
          address.toHexString(),
        ]);
      }
    }

    let symbol = "Unknown";
    const symbolResult = erc20.try_symbol();
    if (!symbolResult.reverted) {
      symbol = symbolResult.value;
    } else {
      const erc20symbol = ERC20SymbolBytes.bind(address);
      const symbolResult = erc20symbol.try_symbol();
      if (!symbolResult.reverted) {
        symbol = symbolResult.value.toString();
      } else {
        log.warning("[getTokenParams]Fail to get symbol for token {}", [
          address.toHexString(),
        ]);
      }
    }

    return {
      name,
      symbol,
      decimals,
    };
  }
}

function _createCustomEvent(
  event: ethereum.Event | null,
  call: ethereum.Call | null = null
): CustomEventType | null {
  let customEvent: CustomEventType;
  if (event) {
    customEvent = CustomEventType.initialize(
      event.block,
      event.transaction,
      event.transactionLogIndex,
      event.address,
      event
    );
  } else if (call) {
    customEvent = CustomEventType.initialize(
      call.block,
      call.transaction,
      call.transaction.index,
      call.to
    );
  } else {
    log.error(
      "[_createCustomEvent]either event or call needs to be specified",
      []
    );
    return null;
  }
  return customEvent;
}

function _getSDK(customEvent: CustomEventType): SDK {
  const protocolId = getNetworkSpecificConstant().getProtocolId().toHexString();
  const conf = new BridgeConfig(
    protocolId,
    "Axelar",
    "axelar",
    BridgePermissionType.PERMISSIONLESS,
    Versions
  );
  return new SDK(conf, new Pricer(), new TokenInit(), customEvent);
}

export function onCreatePool(
  // eslint-disable-next-line no-unused-vars
  event: CustomEventType,
  pool: Pool,
  // eslint-disable-next-line no-unused-vars
  sdk: SDK,
  aux1: BridgePoolType | null = null,
  aux2: string | null = null
): void {
  if (aux1 && aux2) {
    const token = sdk.Tokens.getOrCreateToken(Address.fromString(aux2));
    pool.initialize(`${POOL_PREFIX} ${token.name}`, token.name, aux1, token);
  }
}

export function handleTokenDeployed(event: TokenDeployed): void {
  // determine whether the token deployed is internal or external token type
  const tokenType = getTokenType(event.params.tokenAddresses);
  getOrCreateTokenSymbol(
    event.params.symbol,
    event.params.tokenAddresses.toHexString(),
    tokenType
  );
}

export function handleTokenSent(event: TokenSent): void {
  // the token should have already been deployed
  const tokenSymbol = getOrCreateTokenSymbol(event.params.symbol);
  const tokenAddress = tokenSymbol.tokenAddress;
  const poolId = event.address.concat(Address.fromString(tokenAddress));
  const dstChainId = networkToChainID(
    event.params.destinationChain.toUpperCase()
  );
  const dstNetworkConstants = getNetworkSpecificConstant(dstChainId);
  const dstPoolId = dstNetworkConstants.getPoolAddress();

  const dstStr = event.params.destinationAddress;
  const dstAddress = isValidEVMAddress(dstStr)
    ? Address.fromString(dstStr)
    : Bytes.fromUTF8(dstStr);

  const bridgePoolType =
    tokenSymbol.tokenType == TokenType.EXTERNAL
      ? BridgePoolType.LOCK_RELEASE
      : BridgePoolType.BURN_MINT;
  const crosschainTokenType =
    tokenSymbol.tokenType == TokenType.EXTERNAL
      ? CrosschainTokenType.WRAPPED
      : CrosschainTokenType.CANONICAL;

  log.info("[handleTokenSent]original={},dstAddress={}", [
    event.params.destinationAddress,
    dstAddress.toHexString(),
  ]);

  const customEvent = _createCustomEvent(event)!;
  _handleTransferOut(
    Address.fromString(tokenAddress),
    event.params.sender,
    dstAddress,
    event.params.amount,
    dstChainId,
    poolId,
    dstPoolId,
    bridgePoolType,
    crosschainTokenType,
    customEvent,
    null
  );
}

export function handleContractCallWithToken(
  event: ContractCallWithToken
): void {
  const tokenSymbol = getOrCreateTokenSymbol(event.params.symbol);
  const tokenAddress = tokenSymbol.tokenAddress;
  const poolId = event.address.concat(Address.fromString(tokenAddress));
  const dstChainId = networkToChainID(
    event.params.destinationChain.toUpperCase()
  );
  const dstNetworkConstants = getNetworkSpecificConstant(dstChainId);
  const dstPoolId = dstNetworkConstants.getPoolAddress();

  const dstAccountStr = event.params.destinationContractAddress;
  const dstAccount = isValidEVMAddress(dstAccountStr)
    ? Address.fromString(dstAccountStr)
    : Bytes.fromUTF8(dstAccountStr);

  const bridgePoolType =
    tokenSymbol.tokenType == TokenType.EXTERNAL
      ? BridgePoolType.LOCK_RELEASE
      : BridgePoolType.BURN_MINT;
  const crosschainTokenType =
    tokenSymbol.tokenType == TokenType.EXTERNAL
      ? CrosschainTokenType.WRAPPED
      : CrosschainTokenType.CANONICAL;

  const customEvent = _createCustomEvent(event)!;

  const account = _handleTransferOut(
    Address.fromString(tokenAddress),
    event.params.sender,
    dstAccount,
    event.params.amount,
    dstChainId,
    poolId,
    dstPoolId,
    bridgePoolType,
    crosschainTokenType,
    customEvent,
    null
  );

  account.messageOut(dstChainId, dstAccount, event.params.payload);
}

export function handleContractCall(event: ContractCall): void {
  // contract call
  const dstChainId = networkToChainID(
    event.params.destinationChain.toUpperCase()
  );
  const dstAccountStr = event.params.destinationContractAddress;
  const dstAccount = isValidEVMAddress(dstAccountStr)
    ? Address.fromString(dstAccountStr)
    : Bytes.fromUTF8(dstAccountStr);

  const customEvent = _createCustomEvent(event)!;
  _handleMessageOut(
    dstChainId,
    event.params.sender,
    dstAccount,
    event.params.payloadHash,
    customEvent
  );
}

export function handleContractCallApproved(event: ContractCallApproved): void {
  // contract call
  const srcChainId = networkToChainID(event.params.sourceChain.toUpperCase());
  const srcStr = event.params.sourceAddress;
  const srcAccount = isValidEVMAddress(srcStr)
    ? Address.fromString(srcStr)
    : Bytes.fromUTF8(srcStr);
  const customEvent = _createCustomEvent(event)!;
  _handleMessageIn(
    srcChainId,
    srcAccount,
    event.address,
    event.params.payloadHash,
    customEvent
  );
}

export function handleContractCallApprovedWithMint(
  event: ContractCallApprovedWithMint
): void {
  // contract call
  const srcChainId = networkToChainID(event.params.sourceChain.toUpperCase());
  // this is needed to support transferIn from non-EVM chains
  const srcStr = event.params.sourceAddress;
  const srcAccount = isValidEVMAddress(srcStr)
    ? Address.fromString(srcStr)
    : Bytes.fromUTF8(srcStr);

  const tokenSymbol = getOrCreateTokenSymbol(event.params.symbol);
  const tokenAddress = tokenSymbol.tokenAddress;
  const poolId = event.address.concat(Address.fromString(tokenAddress));
  const srcNetworkConstants = getNetworkSpecificConstant(srcChainId);
  const srcPoolId = srcNetworkConstants.getPoolAddress();

  const bridgePoolType =
    tokenSymbol.tokenType == TokenType.EXTERNAL
      ? BridgePoolType.LOCK_RELEASE
      : BridgePoolType.BURN_MINT;
  const crosschainTokenType =
    tokenSymbol.tokenType == TokenType.EXTERNAL
      ? CrosschainTokenType.WRAPPED
      : CrosschainTokenType.CANONICAL;

  const customEvent = _createCustomEvent(event)!;
  const account = _handleTransferIn(
    Address.fromString(tokenAddress),
    srcAccount,
    event.params.contractAddress,
    event.params.amount,
    srcChainId,
    srcPoolId,
    poolId,
    bridgePoolType,
    crosschainTokenType,
    customEvent,
    event.params.commandId
  );

  account.messageIn(srcChainId, srcAccount, event.params.payloadHash);
}

export function handleCommandExecuted(event: Executed): void {
  log.info("[handleCommandExecuted]commandId={} tx {} logIndex={}", [
    event.params.commandId.toHexString(),
    event.transaction.hash.toHexString(),
    event.transactionLogIndex.toString(),
  ]);

  // command is one of deployToken, mintToken, approveContractCall, approveContractCallWithMint,
  // burnToken or transferOperatorship
  // https://github.com/axelarnetwork/axelar-cgp-solidity/blob/2a24602fdad6d3aa80f4e43cacfe7241adbb905e/contracts/AxelarGateway.sol#L308-L319
  // We only interest in mintToken and burnToken, we detect those events
  // by searching the log receipt for Transfer event
  const receipt = event.receipt;
  if (!receipt) {
    log.error("[handleCommandExecuted]No receipt for tx {}", [
      event.transaction.hash.toHexString(),
    ]);
    return;
  }
  const transferSignature = crypto.keccak256(ByteArray.fromUTF8(TRANSFER));

  const commandId = event.params.commandId;
  let command = _Command.load(commandId);
  if (!command) {
    command = new _Command(commandId);
    command.isBurnToken = false;
    command.isProcessed = false;
    command.save();
  }

  const logs = event.receipt!.logs;
  //Transfer has a logIndex that's one below event.logIndex
  const transferLogIndex = event.logIndex.minus(BIGINT_ONE);
  for (let i = 0; i < logs.length; i++) {
    const thisLog = logs[i];
    if (thisLog.logIndex.gt(transferLogIndex)) {
      return;
    }
    // topics[0] - signature
    // topics[1] - from address
    // topics[2] - to address

    const logSignature = thisLog.topics[0];
    if (
      transferLogIndex.equals(thisLog.logIndex) &&
      logSignature == transferSignature
    ) {
      const tokenAddress = thisLog.address;
      const fromAddress = ethereum
        .decode(ADDRESS, thisLog.topics[1])!
        .toAddress();
      const toAddress = ethereum
        .decode(ADDRESS, thisLog.topics[2])!
        .toAddress();
      const transferAmount = ethereum.decode(UINT256, thisLog.data)!.toBigInt();

      // burnToken: transfer to 0x or address(this)
      if (toAddress.equals(Address.zero()) || toAddress.equals(event.address)) {
        log.info("[handleCommandExecuted] burn {} {} token from {} tx={}-{}", [
          transferAmount.toString(),
          tokenAddress.toHexString(),
          fromAddress.toHexString(),
          thisLog.transactionHash.toHexString(),
          thisLog.logIndex.toString(),
        ]);
        _handleBurnToken(
          commandId,
          tokenAddress,
          fromAddress,
          transferAmount,
          event
        );
        break;
      }

      // mintToken: transfer from 0x or address(this)
      if (
        fromAddress.equals(Address.zero()) ||
        fromAddress.equals(event.address)
      ) {
        log.info("[handleCommandExecuted] mint {} {} token to {} tx={}-{}", [
          transferAmount.toString(),
          tokenAddress.toHexString(),
          toAddress.toHexString(),
          thisLog.transactionHash.toHexString(),
          thisLog.logIndex.toString(),
        ]);
        _handleMintToken(
          commandId,
          tokenAddress,
          toAddress,
          transferAmount,
          event
        );
        break;
      }
    }
  }
}

export function handleGasPaidForContractCall(
  event: GasPaidForContractCall
): void {
  const customEvent = _createCustomEvent(event)!;
  _handleFees(event.params.gasToken, event.params.gasFeeAmount, customEvent);
}

export function handleGasPaidForContractCallWithToken(
  event: GasPaidForContractCallWithToken
): void {
  const customEvent = _createCustomEvent(event)!;
  _handleFees(event.params.gasToken, event.params.gasFeeAmount, customEvent);
}

export function handleNativeGasPaidForContractCall(
  event: NativeGasPaidForContractCall
): void {
  const customEvent = _createCustomEvent(event)!;
  _handleFees(
    getNetworkSpecificConstant().gasFeeToken,
    event.params.gasFeeAmount,
    customEvent
  );
}

export function handleNativeGasPaidForContractCallWithToken(
  event: NativeGasPaidForContractCallWithToken
): void {
  const customEvent = _createCustomEvent(event)!;
  _handleFees(
    getNetworkSpecificConstant().gasFeeToken,
    event.params.gasFeeAmount,
    customEvent
  );
}

export function handleGasAdded(event: GasAdded): void {
  const customEvent = _createCustomEvent(event)!;
  _handleFees(event.params.gasToken, event.params.gasFeeAmount, customEvent);
}

export function handleNativeGasAdded(event: NativeGasAdded): void {
  const customEvent = _createCustomEvent(event)!;
  _handleFees(
    getNetworkSpecificConstant().gasFeeToken,
    event.params.gasFeeAmount,
    customEvent
  );
}

export function handleFeeRefund(call: RefundCall): void {
  let tokenAddress = call.inputs.token;
  if (tokenAddress.equals(Address.zero())) {
    tokenAddress = getNetworkSpecificConstant().gasFeeToken;
  }
  const customEvent = _createCustomEvent(null, call)!;
  _handleFees(
    tokenAddress,
    call.inputs.amount.times(BIGINT_MINUS_ONE),
    customEvent
  );
}

//////////////////////////////// HELPER FUNCTIONS //////////////////////////////
function _handleTransferOut(
  token: Address,
  sender: Address,
  receiver: Bytes,
  amount: BigInt,
  dstChainId: BigInt,
  poolId: Bytes,
  dstPoolId: Address,
  bridgePoolType: BridgePoolType,
  crosschainTokenType: CrosschainTokenType,
  customEvent: CustomEventType,
  refId: Bytes | null = null
): Account {
  const sdk = _getSDK(customEvent);
  const inputToken = sdk.Tokens.getOrCreateToken(token);

  const pool = sdk.Pools.loadPool(
    poolId,
    onCreatePool,
    bridgePoolType,
    inputToken.id.toHexString()
  );
  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    dstChainId,
    dstPoolId,
    crosschainTokenType,
    token
  );
  pool.addDestinationToken(crossToken);

  const acc = sdk.Accounts.loadAccount(sender);
  const transfer = acc.transferOut(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    receiver,
    amount,
    customEvent.transaction.hash
  );

  if (refId) {
    transfer._refId = refId;
    transfer.save();
  }
  return acc;
}

function _handleTransferIn(
  token: Address,
  sender: Bytes,
  receiver: Address,
  amount: BigInt,
  srcChainId: BigInt,
  srcPoolId: Address,
  poolId: Bytes,
  bridgePoolType: BridgePoolType,
  crosschainTokenType: CrosschainTokenType,
  customEvent: CustomEventType,
  refId: Bytes | null = null
): Account {
  const sdk = _getSDK(customEvent);

  const pool = sdk.Pools.loadPool(
    poolId,
    onCreatePool,
    bridgePoolType,
    token.toHexString()
  );
  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    srcChainId,
    srcPoolId,
    crosschainTokenType,
    token
  );
  pool.addDestinationToken(crossToken);

  const acc = sdk.Accounts.loadAccount(receiver);
  const transfer = acc.transferIn(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    sender,
    amount,
    customEvent.transaction.hash
  );

  if (refId) {
    transfer._refId = refId;
    transfer.save();
  }
  return acc;
}

function _handleMintToken(
  commandId: Bytes,
  tokenAddress: Address,
  account: Address,
  amount: BigInt,
  event: ethereum.Event
): void {
  const receiver = account;
  const poolAddress = event.address;
  const poolId = poolAddress.concat(tokenAddress);
  const tokenType = getTokenType(tokenAddress);
  const bridgePoolType =
    tokenType == TokenType.EXTERNAL
      ? BridgePoolType.LOCK_RELEASE
      : BridgePoolType.BURN_MINT;
  const crosschainTokenType =
    tokenType == TokenType.EXTERNAL
      ? CrosschainTokenType.WRAPPED
      : CrosschainTokenType.CANONICAL;

  const srcChainId = networkToChainID(Network.UNKNOWN_NETWORK);
  const srcPoolId = Address.zero(); // Not available
  const sender = receiver; //Not available, assumed to be the same as receiver
  const customEvent = _createCustomEvent(event)!;
  _handleTransferIn(
    tokenAddress,
    sender,
    receiver,
    amount,
    srcChainId,
    srcPoolId,
    poolId,
    bridgePoolType,
    crosschainTokenType,
    customEvent,
    commandId
  );
}

function _handleBurnToken(
  commandId: Bytes,
  tokenAddress: Address,
  account: Address,
  amount: BigInt,
  event: ethereum.Event
): void {
  const sender = account;
  const poolAddress = event.address;
  const poolId = poolAddress.concat(tokenAddress);
  const tokenType = getTokenType(tokenAddress);
  const bridgePoolType =
    tokenType == TokenType.EXTERNAL
      ? BridgePoolType.LOCK_RELEASE
      : BridgePoolType.BURN_MINT;
  const crosschainTokenType =
    tokenType == TokenType.EXTERNAL
      ? CrosschainTokenType.WRAPPED
      : CrosschainTokenType.CANONICAL;

  const dstChainId = networkToChainID(Network.UNKNOWN_NETWORK);
  const dstPoolId = Address.zero(); // Not available
  const receiver = sender; //Not available, assumed to be the same as sender
  const customEvent = _createCustomEvent(event)!;
  _handleTransferOut(
    Address.fromBytes(tokenAddress),
    sender,
    receiver,
    amount,
    dstChainId,
    poolId,
    dstPoolId,
    bridgePoolType,
    crosschainTokenType,
    customEvent,
    commandId
  );
}

function _handleFees(
  tokenAddress: Address,
  feeAmount: BigInt,
  customEvent: CustomEventType
): void {
  const sdk = _getSDK(customEvent);
  const poolAddress = getNetworkSpecificConstant().getPoolAddress();
  const poolId = poolAddress.concat(tokenAddress);
  const inputToken = sdk.Tokens.getOrCreateToken(tokenAddress);
  const pool = sdk.Pools.loadPool(
    poolId,
    onCreatePool,
    BridgePoolType.BURN_MINT,
    inputToken.id.toHexString()
  );
  pool.addRevenueNative(feeAmount, BIGINT_ZERO);
}

function _handleMessageIn(
  srcChainId: BigInt,
  sender: Bytes,
  receiver: Address,
  data: Bytes,
  customeEvent: CustomEventType
): void {
  // see doc in _handleMessageOut
  const sdk = _getSDK(customeEvent);
  const acc = sdk.Accounts.loadAccount(receiver);
  acc.messageIn(srcChainId, sender, data);
}

function _handleMessageOut(
  dstChainId: BigInt,
  sender: Address,
  receiver: Bytes,
  data: Bytes,
  customEvent: CustomEventType
): void {
  const sdk = _getSDK(customEvent);
  const acc = sdk.Accounts.loadAccount(sender);
  acc.messageOut(dstChainId, receiver, data);
}

/**
 * get or create an TokenSymbol entity; if the entry is new, either `tokenAddress`
 * or `contractAddress` param needs to be provided
 *
 * @param symbol token symbol
 * @param tokenAddress token address
 * @param contractAddress address of AxelarGatewayMultiSig contract
 *
 */

function getOrCreateTokenSymbol(
  symbol: string,
  tokenAddress: string | null = null,
  tokenType: TokenType | null = null
): _TokenSymbol {
  let tokenSymbol = _TokenSymbol.load(symbol);
  if (!tokenSymbol) {
    tokenSymbol = new _TokenSymbol(symbol);
    tokenSymbol.tokenAddress = tokenAddress!;
    tokenSymbol.tokenType = tokenType!;
    tokenSymbol.save();
  }
  return tokenSymbol;
}

function getTokenType(tokenAddress: Address): TokenType {
  const internalERC20Contract = BurnableMintableCappedERC20.bind(tokenAddress);
  const depositAddressResult = internalERC20Contract.try_depositAddress(
    Bytes.empty()
  );
  let tokenType = TokenType.INTERNAL;
  if (depositAddressResult.reverted) {
    tokenType = TokenType.EXTERNAL;
  }
  return tokenType;
}

export function bytesToUnsignedBigInt(
  bytes: Bytes,
  bigEndian: boolean = true
): BigInt {
  // Caution: this function changes the input bytes for bigEndian
  return BigInt.fromUnsignedBytes(
    bigEndian ? Bytes.fromUint8Array(bytes.reverse()) : bytes
  );
}

export function bytes32ToAddress(bytes: Bytes): Address {
  //take the last 40 hexstring & convert it to address (20 bytes)
  const address = bytes32ToAddressHexString(bytes);
  return Address.fromString(address);
}

export function bytes32ToAddressHexString(bytes: Bytes): string {
  //take the last 40 hexstring: 0x + 32 bytes/64 hex characters
  return `0x${bytes.toHexString().slice(INT_TWENTY_SIX).toLowerCase()}`;
}

export function getTxId(
  event: ethereum.Event | null,
  call: ethereum.Call | null = null
): Bytes | null {
  if (event) {
    return event.transaction.hash.concatI32(event.transactionLogIndex.toI32());
  }

  if (call) {
    return call.transaction.hash.concatI32(call.transaction.index.toI32());
  }

  return null;
}
