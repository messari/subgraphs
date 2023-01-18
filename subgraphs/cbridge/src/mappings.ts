import {
  BigDecimal,
  BigInt,
  Address,
  ethereum,
  Bytes,
  log,
  dataSource,
} from "@graphprotocol/graph-ts";
import {
  LiquidityAdded,
  Send,
  WithdrawCall,
} from "../generated/PoolBasedBridge/PoolBasedBridge";
import {
  Deposited as OTVDeposited,
  Withdrawn as OTVWithdrawn,
} from "../generated/OriginalTokenVault/OriginalTokenVault";
import {
  Deposited as OTVv2Deposited,
  Withdrawn as OTVv2Withdrawn,
} from "../generated/OriginalTokenVaultV2/OriginalTokenVaultV2";
import {
  Mint as PTBMint,
  Burn as PTBBurn,
} from "../generated/PeggedTokenBridge/PeggedTokenBridge";
import {
  Mint as PTBv2Mint,
  Burn as PTBv2Burn,
} from "../generated/PeggedTokenBridgeV2/PeggedTokenBridgeV2";
import {
  Message,
  Message2,
  MessageWithTransfer,
  ExecuteMessageCall,
  ExecuteMessage1Call as ExecuteMessageCall2, // for non-EVM chain
} from "../generated/MessageBus/MessageBus";
import { FarmingRewardClaimed } from "../generated/FarmingRewards/FarmingRewards";
import { CustomEventType, SDK } from "./sdk/protocols/bridge";
import { TokenPricer } from "./sdk/protocols/config";
import { TokenInitializer, TokenParams } from "./sdk/protocols/bridge/tokens";
import { Pool } from "./sdk/protocols/bridge/pool";
import {
  BridgePermissionType,
  BridgePoolType,
  CrosschainTokenType,
} from "./sdk/protocols/bridge/enums";
import { BridgeConfig } from "./sdk/protocols/bridge/config";
import { _ERC20 } from "../generated/PoolBasedBridge/_ERC20";
import { ERC20NameBytes } from "../generated/PoolBasedBridge/ERC20NameBytes";
import { ERC20SymbolBytes } from "../generated/PoolBasedBridge/ERC20SymbolBytes";
import { Versions } from "./versions";
import { Token, _Refund, _PTBv1 } from "../generated/schema";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "./sdk/util/numbers";
import { getUsdPricePerToken, getUsdPrice } from "./prices";
import { networkToChainID } from "./sdk/protocols/bridge/chainIds";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  getNetworkSpecificConstant,
  RewardTokenType,
  SECONDS_PER_DAY,
  BIGINT_MINUS_ONE,
  PoolName,
} from "./sdk/util/constants";

// empty handler for prices library
// eslint-disable-next-line no-unused-vars, no-empty-function
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

function _getSDK(
  event: ethereum.Event | null = null,
  call: ethereum.Call | null = null
): SDK | null {
  let customEvent: CustomEventType;
  if (event) {
    customEvent = CustomEventType.initialize(
      event.block,
      event.transaction,
      event.transactionLogIndex,
      event
    );
  } else if (call) {
    customEvent = CustomEventType.initialize(
      call.block,
      call.transaction,
      call.transaction.index
    );
  } else {
    log.error("[_getSDK]either event or call needs to be specified", []);
    return null;
  }

  const protocolId = getNetworkSpecificConstant().getProtocolId().toHexString();
  const conf = new BridgeConfig(
    protocolId,
    "cBridge",
    "cbridge",
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
    pool.initialize("Celer Pool-based Bridge", token.name, aux1, token);
    // append pool id to protocol._liquidityPoolIDs
    const protocol = sdk.Protocol.protocol;
    let poolIDs = protocol._liquidityPoolIDs;
    if (!poolIDs) {
      poolIDs = [pool.getBytesID()];
    } else {
      poolIDs.push(pool.getBytesID());
    }
    protocol._liquidityPoolIDs = poolIDs;
    protocol.save();
  }
}

export function handleSend(event: Send): void {
  const poolId = event.address.concat(event.params.token);
  const networkConstants = getNetworkSpecificConstant(event.params.dstChainId);
  const dstPoolId = networkConstants.getPoolAddress(PoolName.PoolBasedBridge);
  _handleTransferOut(
    event.params.token,
    event.params.sender,
    event.params.receiver,
    event.params.amount,
    event.params.dstChainId,
    poolId,
    dstPoolId,
    BridgePoolType.LIQUIDITY,
    CrosschainTokenType.CANONICAL,
    event,
    event.params.transferId
  );

  let transfer = _Refund.load(event.params.transferId);
  if (!transfer) {
    transfer = new _Refund(event.params.transferId);
    transfer.sender = event.params.sender.toHexString();
    transfer.save();
  }
}

export function handleLiquidityAdded(event: LiquidityAdded): void {
  const sdk = _getSDK(event)!;
  const pool = sdk.Pools.loadPool(
    event.address.concat(event.params.token),
    onCreatePool,
    BridgePoolType.LIQUIDITY,
    event.params.token.toHexString()
  );
  pool.addInputTokenBalance(event.params.amount, true);
  const acc = sdk.Accounts.loadAccount(event.params.provider);
  acc.liquidityDeposit(pool, event.params.amount, true);
}

export function handleWithdraw(call: WithdrawCall): void {
  const buf = call.inputs._wdmsg;
  const wdmsg = decodeWithdrawMsg(buf);

  const sdk = _getSDK(null, call)!;
  const pool = sdk.Pools.loadPool(
    call.to.concat(wdmsg.token),
    onCreatePool,
    BridgePoolType.LIQUIDITY,
    wdmsg.token.toHexString()
  );

  const bridgePoolType = BridgePoolType.LIQUIDITY;
  const txId = call.transaction.hash.concatI32(call.transaction.index.toI32());

  // TODO: remove once supply side revenue running
  log.info("[handleWithdraw]refid={},tx={}", [
    wdmsg.refId.toHexString(),
    call.transaction.hash.toHexString(),
  ]);

  const transfer = _Refund.load(wdmsg.refId);
  if (wdmsg.refId.equals(Bytes.empty())) {
    // LP withdraw liquidity: refId == 0x0
    pool.addInputTokenBalance(wdmsg.amount.times(BIGINT_MINUS_ONE), true);
    const acc = sdk.Accounts.loadAccount(wdmsg.receiver);
    acc.liquidityWithdraw(pool, wdmsg.amount, true);
  } else if (
    wdmsg.refId.equals(
      Bytes.fromHexString(
        "0x0000000000000000000000000000000000000000000000000000000000000001"
      )
    )
  ) {
    // claim fee (liquidity provider): refId == 0x1
    // TODO: remove once supply side revenue running
    log.info("[handleWithdraw]supplier fee {} collected in token {}", [
      wdmsg.amount.toString(),
      wdmsg.token.toHexString(),
    ]);
    pool.addRevenueNative(BIGINT_ZERO, wdmsg.amount);
  } else if (transfer) {
    // refund, refId==xfer_id
    // refund is handled with a "transferIn"
    const srcChainId = networkToChainID(dataSource.network());
    const networkConstants = getNetworkSpecificConstant(srcChainId);
    const srcPoolAddress = networkConstants.getPoolAddress(
      PoolName.PoolBasedBridge
    );

    _handleTransferIn(
      wdmsg.token,
      Address.fromString(transfer.sender),
      wdmsg.receiver,
      wdmsg.amount,
      srcChainId,
      srcPoolAddress,
      pool.getBytesID(),
      bridgePoolType,
      CrosschainTokenType.CANONICAL,
      wdmsg.refId,
      txId,
      null,
      call
    );
  } else {
    const networkConstants = getNetworkSpecificConstant(wdmsg.chainId);
    const srcPoolAddress = networkConstants.getPoolAddress(
      PoolName.PoolBasedBridge
    );

    _handleTransferIn(
      wdmsg.token,
      wdmsg.receiver, //no sender info is available, assuming to be same as receiver
      wdmsg.receiver,
      wdmsg.amount,
      wdmsg.chainId,
      srcPoolAddress,
      pool.getBytesID(),
      bridgePoolType,
      CrosschainTokenType.CANONICAL,
      wdmsg.refId,
      txId,
      null,
      call
    );
  }
}

// Bridge via the Original Token Vault
export function handleOTVDeposited(event: OTVDeposited): void {
  const poolId = event.address.concat(event.params.token);
  const networkConstants = getNetworkSpecificConstant(event.params.mintChainId);
  const dstPoolId = networkConstants.getPoolAddress(PoolName.PeggedTokenBridge);
  _handleTransferOut(
    event.params.token,
    event.params.depositor,
    event.params.mintAccount,
    event.params.amount,
    event.params.mintChainId,
    poolId,
    dstPoolId,
    BridgePoolType.BURN_MINT,
    CrosschainTokenType.WRAPPED,
    event,
    event.params.depositId
  );
}

export function handleOTVWithdrawn(event: OTVWithdrawn): void {
  const sdk = _getSDK(event)!;
  const poolId = event.address.concat(event.params.token);
  const pool = sdk.Pools.loadPool(poolId);
  const txId = event.transaction.hash.concatI32(event.logIndex.toI32());

  // depending on value of refChainId, the withdraw may be fee withdraw, refund or burn-withdraw
  // https://github.com/celer-network/sgn-v2-contracts/blob/aa569f848165840bd4eec8134f753e105e36ae38/contracts/pegged-bridge/OriginalTokenVault.sol#L45
  const thisChainId = networkToChainID(dataSource.network());
  const refChainId = event.params.refChainId;
  if (refChainId == BIGINT_ZERO) {
    // fee withdraw
    pool.addRevenueNative(event.params.amount, BIGINT_ZERO);
    return;
  }
  if (refChainId == thisChainId) {
    // refund
    // refund is handled with a counter "transferIn"
    const thisPoolAddress = event.address;

    _handleTransferIn(
      event.params.token,
      event.params.burnAccount,
      event.params.receiver,
      event.params.amount,
      thisChainId,
      thisPoolAddress,
      pool.getBytesID(),
      BridgePoolType.BURN_MINT,
      CrosschainTokenType.CANONICAL,
      event.params.refId,
      txId,
      event
    );
    return;
  }

  // burn-withdraw
  const networkConstants = getNetworkSpecificConstant(event.params.refChainId);
  const srcPoolAddress = networkConstants.getPoolAddress(
    PoolName.PeggedTokenBridge
  );

  _handleTransferIn(
    event.params.token,
    event.params.burnAccount,
    event.params.receiver,
    event.params.amount,
    event.params.refChainId,
    srcPoolAddress,
    poolId,
    BridgePoolType.BURN_MINT,
    CrosschainTokenType.WRAPPED,
    event.params.refId,
    txId,
    event
  );
}

// Bridge via the Original Token Vault V2
export function handleOTVv2Deposited(event: OTVv2Deposited): void {
  const poolId = event.address.concat(event.params.token);
  const networkConstants = getNetworkSpecificConstant(event.params.mintChainId);
  const dstPoolId = networkConstants.getPoolAddress(
    PoolName.PeggedTokenBridgeV2
  );

  _handleTransferOut(
    event.params.token,
    event.params.depositor,
    event.params.mintAccount,
    event.params.amount,
    event.params.mintChainId,
    poolId,
    dstPoolId,
    BridgePoolType.BURN_MINT,
    CrosschainTokenType.WRAPPED,
    event,
    event.params.depositId
  );
}

export function handleOTVv2Withdrawn(event: OTVv2Withdrawn): void {
  const sdk = _getSDK(event)!;
  const poolId = event.address.concat(event.params.token);
  const pool = sdk.Pools.loadPool(poolId);
  const txId = event.transaction.hash.concatI32(event.logIndex.toI32());

  // depending on value of refChainId, the withdraw may be fee withdraw, refund or burn-withdraw
  // https://github.com/celer-network/sgn-v2-contracts/blob/aa569f848165840bd4eec8134f753e105e36ae38/contracts/pegged-bridge/OriginalTokenVaultV2.sol#L45
  const thisChainId = networkToChainID(dataSource.network());
  const refChainId = event.params.refChainId;
  if (refChainId == BIGINT_ZERO) {
    // fee withdraw
    pool.addRevenueNative(event.params.amount, BIGINT_ZERO);
    return;
  }
  if (refChainId == thisChainId) {
    // refund
    // refund is handled with a counter "transferIn"
    const thisPoolAddress = event.address;

    _handleTransferIn(
      event.params.token,
      event.params.burnAccount,
      event.params.receiver,
      event.params.amount,
      thisChainId,
      thisPoolAddress,
      pool.getBytesID(),
      BridgePoolType.BURN_MINT,
      CrosschainTokenType.CANONICAL,
      event.params.refId,
      txId,
      event
    );
    return;
  }

  // burn-withdraw
  const networkConstants = getNetworkSpecificConstant(event.params.refChainId);
  const srcPoolAddress = networkConstants.getPoolAddress(
    PoolName.PeggedTokenBridgeV2
  );

  _handleTransferIn(
    event.params.token,
    event.params.burnAccount,
    event.params.receiver,
    event.params.amount,
    event.params.refChainId,
    srcPoolAddress,
    poolId,
    BridgePoolType.BURN_MINT,
    CrosschainTokenType.WRAPPED,
    txId,
    event.params.refId,
    event
  );
}

// Pegged Token Bridge V1
export function handlePTBMint(event: PTBMint): void {
  const poolId = event.address.concat(event.params.token);
  const networkConstants = getNetworkSpecificConstant(event.params.refChainId);
  const srcPoolAddress = networkConstants.getPoolAddress(
    PoolName.OriginalTokenVault
  );

  const txId = event.transaction.hash.concatI32(event.logIndex.toI32());
  _handleTransferIn(
    event.params.token,
    event.params.depositor,
    event.params.account,
    event.params.amount,
    event.params.refChainId,
    srcPoolAddress,
    poolId,
    BridgePoolType.BURN_MINT,
    CrosschainTokenType.WRAPPED,
    event.params.refId,
    txId,
    event
  );

  const ptb = new _PTBv1(event.params.token);
  ptb.srcChainId = event.params.refChainId;
  ptb.refId = event.params.refId;
  ptb.save();
}

// Pegged Token Bridge V1
export function handlePTBBurn(event: PTBBurn): void {
  const ptb = _PTBv1.load(event.params.token);
  if (!ptb) {
    log.error(
      "[handlePTBBurn]No entry found for token {} in _PTBv1; it is needed for finding destination chain",
      []
    );
    return;
  }

  const poolId = event.address.concat(event.params.token);
  const networkConstants = getNetworkSpecificConstant(ptb.srcChainId);
  const dstPoolId = networkConstants.getPoolAddress(
    PoolName.OriginalTokenVault
  );

  _handleTransferOut(
    event.params.token,
    event.params.account,
    event.params.withdrawAccount,
    event.params.amount,
    ptb.srcChainId,
    poolId,
    dstPoolId,
    BridgePoolType.BURN_MINT,
    CrosschainTokenType.WRAPPED,
    event,
    event.params.burnId
  );
}

export function handlePTBv2Mint(event: PTBv2Mint): void {
  const poolId = event.address.concat(event.params.token);
  const networkConstants = getNetworkSpecificConstant(event.params.refChainId);
  const srcPoolAddress = networkConstants.getPoolAddress(
    PoolName.OriginalTokenVaultV2
  );

  const txId = event.transaction.hash.concatI32(event.logIndex.toI32());
  _handleTransferIn(
    event.params.token,
    event.params.depositor,
    event.params.account,
    event.params.amount,
    event.params.refChainId,
    srcPoolAddress,
    poolId,
    BridgePoolType.BURN_MINT,
    CrosschainTokenType.WRAPPED,
    event.params.refId,
    txId,
    event
  );
}

export function handleFarmingRewardClaimed(event: FarmingRewardClaimed): void {
  const sdk = _getSDK(event)!;
  const protocol = sdk.Protocol.protocol;

  if (!protocol._lastRewardTimestamp) {
    protocol._lastRewardTimestamp = event.block.timestamp;
    protocol._cumulativeRewardsClaimed = event.params.reward;
    protocol.save();
    return;
  } else if (
    event.block.timestamp <
    protocol._lastRewardTimestamp!.plus(BigInt.fromI32(SECONDS_PER_DAY))
  ) {
    // TODO maybe one day is too short & reward amount is jumpy
    // Increase to 7 days?
    protocol._cumulativeRewardsClaimed =
      protocol._cumulativeRewardsClaimed!.plus(event.params.reward);
    protocol.save();
    return;
  }

  // allocate rewards to pool proportional to tvl
  const rToken = sdk.Tokens.getOrCreateToken(event.params.token);
  const poolIDs = protocol._liquidityPoolIDs!;
  // first iteration summing tvl
  let sumTVLUSD = BIGDECIMAL_ZERO;
  for (let i = 0; i < poolIDs.length; i++) {
    const pool = sdk.Pools.loadPool(poolIDs[i]).pool;
    sumTVLUSD = sumTVLUSD.plus(pool.totalValueLockedUSD);
  }

  for (let i = 0; i < poolIDs.length; i++) {
    const pool = sdk.Pools.loadPool(poolIDs[i]);
    const poolRewardAmount = bigDecimalToBigInt(
      pool.pool.totalValueLockedUSD
        .div(sumTVLUSD)
        .times(protocol._cumulativeRewardsClaimed!.toBigDecimal())
    );
    pool.setRewardEmissions(RewardTokenType.DEPOSIT, rToken, poolRewardAmount);
  }

  protocol._lastRewardTimestamp = event.block.timestamp;
  protocol._cumulativeRewardsClaimed = BIGINT_ZERO;
  protocol.save();
}

// Pegged Token Bridge V2
export function handlePTBv2Burn(event: PTBv2Burn): void {
  const poolId = event.address.concat(event.params.token);
  const networkConstants = getNetworkSpecificConstant(event.params.toChainId);
  const dstPoolId = networkConstants.getPoolAddress(
    PoolName.OriginalTokenVaultV2
  );

  _handleTransferOut(
    event.params.token, //srcToken
    event.params.account,
    event.params.toAccount,
    event.params.amount,
    event.params.toChainId,
    poolId,
    dstPoolId,
    BridgePoolType.BURN_MINT,
    CrosschainTokenType.WRAPPED,
    event,
    event.params.burnId
  );
}

export function handleMessage2(event: Message2): void {
  _handleMessageOut(
    event.params.dstChainId,
    event.params.sender,
    Address.fromBytes(event.params.receiver), //this may truncate addresses for non-EVM chain
    event.params.message,
    event.params.fee,
    event
  );
}

export function handleMessage(event: Message): void {
  _handleMessageOut(
    event.params.dstChainId,
    event.params.sender,
    event.params.receiver,
    event.params.message,
    event.params.fee,
    event
  );
}

export function handleMessageWithTransfer(event: MessageWithTransfer): void {
  _handleMessageOut(
    event.params.dstChainId,
    event.params.sender,
    event.params.receiver,
    event.params.message,
    event.params.fee,
    event
  );
}

export function handleExecuteMessage(call: ExecuteMessageCall): void {
  // See https://github.com/celer-network/sgn-v2-contracts/blob/aa569f848165840bd4eec8134f753e105e36ae38/contracts/message/libraries/MsgDataTypes.sol#L55
  const sender = call.inputs._route.at(0).toAddress();
  const receiver = call.inputs._route.at(1).toAddress();
  const srcChainId = call.inputs._route.at(2).toBigInt();
  const data = call.inputs._message;
  _handleMessageIn(srcChainId, sender, receiver, data, null, call);
}

// for non-EVM chain where the address may be more than 20 bytes
export function handleExecuteMessage2(call: ExecuteMessageCall2): void {
  // See https://github.com/celer-network/sgn-v2-contracts/blob/aa569f848165840bd4eec8134f753e105e36ae38/contracts/message/libraries/MsgDataTypes.sol#L55
  const sender = call.inputs._route.at(0).toAddress();
  const receiver = call.inputs._route.at(1).toAddress();
  const srcChainId = call.inputs._route.at(3).toBigInt();
  const data = call.inputs._message;
  _handleMessageIn(srcChainId, sender, receiver, data, null, call);
}

function _handleTransferOut(
  token: Address,
  sender: Address,
  receiver: Address,
  amount: BigInt,
  dstChainId: BigInt,
  poolId: Bytes,
  dstPoolId: Address,
  bridgePoolType: BridgePoolType,
  crosschainTokenType: CrosschainTokenType,
  event: ethereum.Event,
  refId: Bytes | null = null
): void {
  const sdk = _getSDK(event)!;
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
    event.transaction.hash
  );

  if (refId) {
    transfer._refId = refId;
    transfer.save();
  }
}

function _handleTransferIn(
  token: Address,
  sender: Address,
  receiver: Address,
  amount: BigInt,
  srcChainId: BigInt,
  srcPoolId: Address,
  poolId: Bytes,
  bridgePoolType: BridgePoolType,
  crosschainTokenType: CrosschainTokenType,
  refId: Bytes | null = null,
  transactionID: Bytes | null = null,
  event: ethereum.Event | null = null,
  call: ethereum.Call | null = null
): void {
  const sdk = _getSDK(event, call)!;

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
    transactionID
  );

  if (refId) {
    transfer._refId = refId;
    transfer.save();
  }
}

function _handleMessageOut(
  dstChainId: BigInt,
  sender: Address,
  receiver: Address,
  data: Bytes,
  fee: BigInt,
  event: ethereum.Event | null = null,
  call: ethereum.Call | null = null
): void {
  const sdk = _getSDK(event, call)!;
  // Message send/receive on cbridge is not specific to a bridge
  // unless it is sendMessageWithTransfer or executeMessageWithTransfer
  // then in these cases, the transfer is going through the specified bridge
  // (Peg V1/V2, or Liquidity), but even then the message is execuated in a
  // separate step (e.g. https://github.com/celer-network/sgn-v2-contracts/blob/aa569f848165840bd4eec8134f753e105e36ae38/contracts/message/messagebus/MessageBusReceiver.sol#L105)
  // Here we assume all messages are associated with the liquidity-based pool (bridge)
  // because protocol side revenue has to be attributed to a pool, and the liquidity-based
  // bridge is used for signature verification for all messages:
  // 1. messageWithTransfer: https://github.com/celer-network/sgn-v2-contracts/blob/aa569f848165840bd4eec8134f753e105e36ae38/contracts/message/messagebus/MessageBusReceiver.sol#L98
  // 2. executeMessageWithTransferRefund: https://github.com/celer-network/sgn-v2-contracts/blob/aa569f848165840bd4eec8134f753e105e36ae38/contracts/message/messagebus/MessageBusReceiver.sol#L151
  // 3. executeMessage: https://github.com/celer-network/sgn-v2-contracts/blob/aa569f848165840bd4eec8134f753e105e36ae38/contracts/message/messagebus/MessageBusReceiver.sol#L225
  // alternatively, it may make sense to create a "MessageBus" pool, and assign
  // all message revenue to the MessageBus pool, but we still need to specifiy the BridgePoolType
  // for the MessageBus pool
  const gasFeeToken = getNetworkSpecificConstant(
    networkToChainID(dataSource.network())
  ).gasFeeToken;
  const pool = sdk.Pools.loadPool(
    sdk.Protocol.getBytesID(),
    onCreatePool,
    BridgePoolType.LIQUIDITY,
    gasFeeToken.id.toHexString()
  );

  const acc = sdk.Accounts.loadAccount(sender);
  acc.messageOut(dstChainId, receiver, data);
  pool.addRevenueNative(fee, BIGINT_ZERO);
}

function _handleMessageIn(
  srcChainId: BigInt,
  sender: Address,
  receiver: Address,
  data: Bytes,
  event: ethereum.Event | null = null,
  call: ethereum.Call | null = null
): void {
  // see doc in _handleMessageOut
  const sdk = _getSDK(event, call)!;
  const acc = sdk.Accounts.loadAccount(receiver);
  acc.messageIn(srcChainId, sender, data);
}

export class WithdrawMsg {
  chainId: BigInt; // tag =1
  seqnum: BigInt; // tag =2
  receiver: Address; // tag =3
  token: Address; // tag =4
  amount: BigInt; // tag =5
  refId: Bytes; // tag =6

  constructor(
    chainId: BigInt,
    seqnum: BigInt,
    receiver: Address,
    token: Address,
    amount: BigInt,
    refId: Bytes
  ) {
    this.chainId = chainId;
    this.seqnum = seqnum;
    this.receiver = receiver;
    this.token = token;
    this.amount = amount;
    this.refId = refId;
  }
}

// These functions implement decWithdrawMsg in PbPool.sol (and its dependencies)
// https://github.com/celer-network/sgn-v2-contracts/blob/aa569f848165840bd4eec8134f753e105e36ae38/contracts/libraries/PbPool.sol#L20-L45
export function decodeWithdrawMsg(buf: Bytes): WithdrawMsg {
  const wdmsg = new WithdrawMsg(
    BIGINT_ZERO,
    BIGINT_ZERO,
    Address.zero(),
    Address.zero(),
    BIGINT_ZERO,
    Bytes.empty()
  );

  let idx: i32 = 0;
  while (idx < buf.length) {
    const decoded = decodeKey(buf, idx);
    const tag = decoded[0]; // attribute position in WithdrawMsg
    const wireType = decoded[1];
    idx = decoded[2];

    log.info("[decodeWithdrawMsg]idx={},tag={},wireType={}", [
      idx.toString(),
      tag.toString(),
      wireType.toString(),
    ]);

    let retBigInt: BigInt[];
    let retBytes: Bytes[];
    switch (tag) {
      case 1:
        retBigInt = decodeVarInt(buf, idx);
        wdmsg.chainId = retBigInt[0];
        idx = retBigInt[1].toI32();
        break;
      case 2:
        retBigInt = decodeVarInt(buf, idx);
        wdmsg.seqnum = retBigInt[0];
        idx = retBigInt[1].toI32();
        break;
      case 3:
        retBytes = decodeBytes(buf, idx)!;
        wdmsg.receiver = Address.fromBytes(retBytes[0]);
        idx = retBytes[1].toI32();
        break;
      case 4:
        retBytes = decodeBytes(buf, idx)!;
        wdmsg.token = Address.fromBytes(retBytes[0]);
        idx = retBytes[1].toI32();
        break;
      case 5:
        retBytes = decodeBytes(buf, idx)!;
        wdmsg.amount = toBigInt(retBytes[0])!;
        idx = retBytes[1].toI32();
        break;
      case 6:
        retBytes = decodeBytes(buf, idx)!;
        wdmsg.refId = retBytes[0];
        idx = retBytes[1].toI32();
        break;
      default:
        idx = skipValue(buf, idx, wireType);
    }
  }

  return wdmsg;
} // end decoder WithdrawMsg

function decodeKey(buf: Bytes, idx: i32): i32[] {
  const result = decodeVarInt(buf, idx);
  const v = result[0].toI32();
  const tag = v / 8;
  const wiretype = v & 7;
  return [tag, wiretype, result[1].toI32()];
}

// decode varying length integer
function decodeVarInt(buf: Bytes, idx: i32): BigInt[] {
  const tmpArray = new Uint8Array(10); // proto int is at most 10 bytes (7 bits can be used per byte)
  tmpArray.set(buf.slice(idx, idx + 10)); // load 10 bytes from buf[idx, idx+10] to tmp
  let b: i32; // store current byte content
  let v: i32 = 0; // reset to 0 for return value
  let endIdx: i32 = idx;
  for (let i = 0; i < 10; i++) {
    b = tmpArray[i]; // don't use tmp[i] because it does bound check and costs extra
    v |= (b & 0x7f) << (i * 7);
    if ((b & 0x80) == 0) {
      endIdx += i + 1;

      log.info("[decodeVarInt]idx={},next={},result={}", [
        idx.toString(),
        endIdx.toString(),
        v.toString(),
      ]);
      return [BigInt.fromI32(v), BigInt.fromI32(endIdx)];
    }
  }

  throw new Error("Invalid varint stream"); // i=10, invalid varint stream
}

// decode bytes
function decodeBytes(buf: Bytes, idx: i32): Bytes[] | null {
  const retVal = decodeVarInt(buf, idx);
  const len = retVal[0].toI32();
  const endIdx = retVal[1].toI32() + len;
  if (endIdx > buf.length) {
    log.error("[decodeBytes]Error: endIdx {} > buf length {}", [
      endIdx.toString(),
      buf.length.toString(),
    ]);
    return null;
  }
  const tmpArray = new Uint8Array(len);
  const nextIdx = retVal[1].toI32();
  tmpArray.set(buf.slice(nextIdx, endIdx));
  const resultBytes = Bytes.fromUint8Array(tmpArray);
  log.info("[decodeBytes]idx={},next={},result={}", [
    idx.toString(),
    endIdx.toString(),
    resultBytes.toHexString(),
  ]);
  return [resultBytes, Bytes.fromI32(endIdx)];
}

function skipValue(buf: Bytes, idx: i32, wireType: i32): i32 {
  // WireType definition:
  if (wireType == 0) {
    // WireType.Varint
    const retVal = decodeVarInt(buf, idx);
    return retVal[1].toI32();
  } else if (wireType == 2) {
    //WireType.LengthDelim
    const retVal = decodeVarInt(buf, idx);
    const nextIdx = retVal[1].toI32() + retVal[0].toI32(); // skip len bytes value data
    if (nextIdx <= buf.length) {
      return nextIdx;
    }
  }

  // invalid wire type/inputs
  log.error("[skipValue]invalid inputs: buf={}, idx={}, wireType={}", [
    buf.toHexString(),
    idx.toString(),
    wireType.toString(),
  ]);
  return 0 as i32;
}

function toBigInt(b: Bytes): BigInt | null {
  if (b.length > 32) {
    log.error("[toBigInt]Invalid input length {}", [b.length.toString()]);
    return null;
  }
  const paddedByteString = `0x${b.toHexString().slice(2).padStart(32, "0")}`;
  // reverse() for little endian
  const correctBytes = Bytes.fromUint8Array(
    Bytes.fromHexString(paddedByteString).reverse()
  );

  const retVal = BigInt.fromUnsignedBytes(correctBytes);
  return retVal;
}
