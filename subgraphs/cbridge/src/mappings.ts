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
  WithdrawDone,
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
import { FarmingRewardClaimed } from "../generated/FarmingRewards/FarmingRewards";
import { SDK } from "./sdk/protocols/bridge";
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
import { Token, Pool as PoolEntity, _Transfer } from "../generated/schema";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "./sdk/util/numbers";
import { getUsdPricePerToken, getUsdPrice } from "./prices";
import { BIGINT_NEGATIVE_ONE } from "../../alpaca-finance-lending/src/utils/constants";
import { networkToChainID } from "./sdk/protocols/bridge/chainIds";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  getNetworkSpecificConstant,
  RewardTokenType,
  SECONDS_PER_DAY,
} from "./sdk/util/constants";
import { Protocol } from "../../badgerdao/src/common/constants";

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

function _getSDK(event: ethereum.Event): SDK {
  const protocolId = getNetworkSpecificConstant().protocolId.toHexString();
  const conf = new BridgeConfig(
    protocolId,
    "cBridge",
    "cbridge",
    BridgePermissionType.PERMISSIONLESS,
    Versions
  );
  return new SDK(conf, new Pricer(), new TokenInit(), event);
}

export class AuxArgs {
  token: Token;
  poolType: BridgePoolType;

  constructor(token: Token, poolType: BridgePoolType) {
    this.token = token;
    this.poolType = poolType;
  }
}

export function onCreatePool(
  // eslint-disable-next-line no-unused-vars
  event: ethereum.Event,
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
  _handleTransferOut(
    event.params.token,
    event.params.sender,
    event.params.receiver,
    event.params.amount,
    event.params.dstChainId,
    BridgePoolType.LIQUIDITY,
    CrosschainTokenType.CANONICAL,
    event
  );

  let transfer = _Transfer.load(event.params.transferId);
  if (!transfer) {
    transfer = new _Transfer(event.params.transferId);
    transfer.sender = event.params.sender.toHexString();
    transfer.save();
  }
}

export function handleLiquidityAdded(event: LiquidityAdded): void {
  const sdk = _getSDK(event);
  const token = sdk.Tokens.getOrCreateToken(event.params.token);
  const auxArgs = new AuxArgs(token, BridgePoolType.LIQUIDITY);
  // TODO: concatenate Pool address and token address for pool id?
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

  // fake an event for the purpose of calling _handleTransferIn
  const value = new ethereum.Value(ethereum.ValueKind.INT, 0 as u64);
  const eventParameters = [new ethereum.EventParam("value", value)];
  const event = new ethereum.Event(
    call.to,
    call.transaction.index,
    call.transaction.index,
    null,
    call.block,
    call.transaction,
    eventParameters,
    null
  );

  const sdk = _getSDK(event);
  const token = sdk.Tokens.getOrCreateToken(wdmsg.token);
  //const auxArgs = new AuxArgs(token, BridgePoolType.LIQUIDITY);
  const pool = sdk.Pools.loadPool(
    call.to.concat(wdmsg.token),
    onCreatePool,
    BridgePoolType.LIQUIDITY,
    wdmsg.token.toHexString()
  );

  // TODO: remove once supply side revenue running
  log.info("[handleWithdraw]refid={},tx={}", [
    wdmsg.refId.toHexString(),
    call.transaction.hash.toHexString(),
  ]);

  const transfer = _Transfer.load(wdmsg.refId);
  if (wdmsg.refId.equals(Bytes.empty())) {
    // LP withdraw liquidity: refId == 0x0
    pool.addInputTokenBalance(wdmsg.amount.times(BIGINT_NEGATIVE_ONE), true);
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
    _handleTransferIn(
      wdmsg.token,
      Address.fromString(transfer.sender),
      wdmsg.receiver,
      wdmsg.amount,
      networkToChainID(dataSource.network()),
      BridgePoolType.LIQUIDITY,
      CrosschainTokenType.CANONICAL,
      event
    );
  } else {
    _handleTransferIn(
      wdmsg.token,
      wdmsg.receiver, //no sender info is available, assuming to be same as receiver
      wdmsg.receiver,
      wdmsg.amount,
      wdmsg.chainId,
      BridgePoolType.LIQUIDITY,
      CrosschainTokenType.CANONICAL,
      event
    );
  }
}

// Bridge via the Original Token Vault
export function handleOTVDeposited(event: OTVDeposited): void {
  _handleTransferOut(
    event.params.token,
    event.params.depositor,
    event.params.mintAccount,
    event.params.amount,
    event.params.mintChainId,
    BridgePoolType.BURN_MINT,
    CrosschainTokenType.WRAPPED,
    event
  );
}

export function handleOTVWithdrawn(event: OTVWithdrawn): void {
  _handleTransferIn(
    event.params.token,
    event.params.burnAccount,
    event.params.receiver,
    event.params.amount,
    event.params.refChainId,
    BridgePoolType.BURN_MINT,
    CrosschainTokenType.WRAPPED,
    event
  );
}

// Bridge via the Original Token Vault V2
export function handleOTVv2Deposited(event: OTVv2Deposited): void {
  _handleTransferOut(
    event.params.token,
    event.params.depositor,
    event.params.mintAccount,
    event.params.amount,
    event.params.mintChainId,
    BridgePoolType.BURN_MINT,
    CrosschainTokenType.WRAPPED,
    event
  );
}

export function handleOTVv2Withdrawn(event: OTVv2Withdrawn): void {
  _handleTransferIn(
    event.params.token,
    event.params.burnAccount,
    event.params.receiver,
    event.params.amount,
    event.params.refChainId,
    BridgePoolType.BURN_MINT,
    CrosschainTokenType.WRAPPED,
    event
  );
}

// Pegged Token Bridge V1
export function handlePTBMint(event: PTBMint): void {
  _handleTransferIn(
    event.params.token,
    event.params.depositor,
    event.params.account,
    event.params.amount,
    event.params.refChainId,
    BridgePoolType.BURN_MINT,
    CrosschainTokenType.WRAPPED,
    event
  );
}

// Pegged Token Bridge V1
export function handlePTBBurn(event: PTBBurn): void {
  _handleTransferOut(
    event.params.token,
    event.params.account,
    Address.zero(), //TODO: receiver missing
    event.params.amount,
    BIGINT_ZERO, //TODO: dstChainId missing
    BridgePoolType.BURN_MINT,
    CrosschainTokenType.WRAPPED,
    event
  );
}

export function handlePTBv2Mint(event: PTBv2Mint): void {
  _handleTransferIn(
    event.params.token,
    event.params.depositor,
    event.params.account,
    event.params.amount,
    event.params.refChainId,
    BridgePoolType.BURN_MINT,
    CrosschainTokenType.WRAPPED,
    event
  );
}

// export function handleWithdrawalRequest(event: WithdrawalRequest): void {}

export function handleFarmingRewardClaimed(event: FarmingRewardClaimed): void {
  const sdk = _getSDK(event);
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
    const poolEntity = PoolEntity.load(poolIDs[i])!;
    sumTVLUSD = sumTVLUSD.plus(poolEntity.totalValueLockedUSD);
  }

  for (let i = 0; i < poolIDs.length; i++) {
    const poolEntity = PoolEntity.load(poolIDs[i])!;
    const pool = sdk.Pools.loadPool(poolIDs[i]);
    const poolRewardAmount = bigDecimalToBigInt(
      poolEntity.totalValueLockedUSD
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
  _handleTransferOut(
    event.params.token, //srcToken
    event.params.account,
    event.params.toAccount,
    event.params.amount,
    event.params.toChainId,
    BridgePoolType.BURN_MINT,
    CrosschainTokenType.WRAPPED,
    event
  );
}

function _handleTransferOut(
  token: Address,
  sender: Address,
  receiver: Address,
  amount: BigInt,
  dstChainId: BigInt,
  bridgePoolType: BridgePoolType,
  crosschainTokenType: CrosschainTokenType,
  event: ethereum.Event
): void {
  const sdk = _getSDK(event);
  const inputToken = sdk.Tokens.getOrCreateToken(token);
  //const auxArgs = new AuxArgs(inputToken, BridgePoolType.LIQUIDITY);

  const pool = sdk.Pools.loadPool(
    event.address.concat(token),
    onCreatePool,
    bridgePoolType,
    inputToken.id.toHexString()
  );
  const dstPool = getPoolAddress(bridgePoolType, dstChainId);
  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    dstChainId,
    dstPool,
    crosschainTokenType,
    token
  );
  pool.addDestinationToken(crossToken);

  const acc = sdk.Accounts.loadAccount(sender);
  acc.transferOut(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    receiver,
    amount,
    event.transaction.hash
  );
  //pool.addRevenueNative(event.params.protocolFee, event.params.supplyFee);
}

function _handleTransferIn(
  token: Address,
  sender: Address,
  receiver: Address,
  amount: BigInt,
  srcChainId: BigInt,
  bridgePoolType: BridgePoolType,
  crosschainTokenType: CrosschainTokenType,
  event: ethereum.Event
): void {
  const sdk = _getSDK(event);
  const inputToken = sdk.Tokens.getOrCreateToken(token);
  //const auxArgs = new AuxArgs(inputToken, BridgePoolType.LIQUIDITY);
  const pool = sdk.Pools.loadPool(
    event.address.concat(token),
    onCreatePool,
    bridgePoolType,
    token.toHexString()
  );
  // TODO: add bridge version for OTV - PTB
  const srcPool = getPoolAddress(bridgePoolType, srcChainId);
  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    srcChainId,
    srcPool,
    crosschainTokenType,
    token
  );
  pool.addDestinationToken(crossToken);

  const acc = sdk.Accounts.loadAccount(receiver);
  acc.transferIn(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    sender,
    amount,
    event.transaction.hash
  );
  //pool.addRevenueNative(event.params.protocolFee, event.params.supplyFee);
}

export function getPoolAddress(type: string, chainId: BigInt): Address {
  // TODO
  return Address.zero();
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

// This function implements decWithdrawMsg in PbPool.sol (and its dependencies)
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
