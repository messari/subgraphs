import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
} from "@graphprotocol/graph-ts";
import { AtomicMatch_Call } from "../generated/OpenSea/OpenSea";
import {
  BIGINT_ONE,
  BIGINT_ZERO,
  ERC1155_SAFE_TRANSFER_FROM_SELECTOR,
  ERC721_SAFE_TRANSFER_FROM_SELECTOR,
  ETHABI_DECODE_PREFIX,
  MATCH_ERC1155_SAFE_TRANSFER_FROM_SELECTOR,
  MATCH_ERC721_SAFE_TRANSFER_FROM_SELECTOR,
  MATCH_ERC721_TRANSFER_FROM_SELECTOR,
  NULL_ADDRESS,
  SaleStrategy,
  Side,
  TRANSFER_FROM_SELECTOR,
} from "./constants";

export class DecodedTransferResult {
  constructor(
    public readonly method: string,
    public readonly from: Address,
    public readonly to: Address,
    public readonly token: Address,
    public readonly tokenId: BigInt,
    public readonly amount: BigInt
  ) {}
}

export class DecodedAtomicizeResult {
  constructor(
    public readonly targets: Address[],
    public readonly callDatas: Bytes[]
  ) {}
}

/**
 * Get first 4 bytes of the calldata (function selector/method ID)
 */
export function getFunctionSelector(callData: Bytes): string {
  return Bytes.fromUint8Array(callData.subarray(0, 4)).toHexString();
}

/**
 * Get order side from side parameter
 * enum Side { Buy, Sell }
 * https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/exchange/SaleKindInterface.sol#L22
 */
export function getOrderSide(side: i32): string {
  if (side == 0) {
    return Side.BUY;
  } else {
    return Side.SELL;
  }
}

/**
 * Get sale strategy from saleKind parameter
 * enum SaleKind { FixedPrice, DutchAuction }
 * https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/exchange/SaleKindInterface.sol#L29
 */
export function getSaleStrategy(saleKind: i32): string {
  if (saleKind == 0) {
    return SaleStrategy.STANDARD_SALE;
  } else {
    return SaleStrategy.DUTCH_AUCTION;
  }
}

/**
 * Validate function selectors that can be decoded
 * Relevant function selectors/method IDs can be found via https://www.4byte.directory
 */
export function validateCallDataFunctionSelector(callData: Bytes): boolean {
  let functionSelector = getFunctionSelector(callData);
  return (
    functionSelector == TRANSFER_FROM_SELECTOR ||
    functionSelector == ERC721_SAFE_TRANSFER_FROM_SELECTOR ||
    functionSelector == ERC1155_SAFE_TRANSFER_FROM_SELECTOR ||
    functionSelector == MATCH_ERC721_TRANSFER_FROM_SELECTOR ||
    functionSelector == MATCH_ERC721_SAFE_TRANSFER_FROM_SELECTOR ||
    functionSelector == MATCH_ERC1155_SAFE_TRANSFER_FROM_SELECTOR
  );
}

/**
 * Split up/atomicize a set of calldata bytes into individual ERC721/1155 transfer calldata bytes
 * Creates a list of calldatas which can be decoded in decodeSingleNftData
 */
export function atomicizeCallData(
  callDatas: Bytes,
  callDataLengths: BigInt[]
): Bytes[] {
  let atomicizedCallData: Bytes[] = [];
  let index = 0;
  for (let i = 0; i < callDataLengths.length; i++) {
    let length = callDataLengths[i].toI32();
    let callData = Bytes.fromUint8Array(
      callDatas.subarray(index, index + length)
    );
    atomicizedCallData.push(callData);
    index += length;
  }

  return atomicizedCallData;
}

/**
 * Calculate the price two orders would match at, if in fact they would match (otherwise fail)
 * Returns sellPrice for sell-side order maker (sale) and buyPrice for buy-side order maker (bid/offer)
 * https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/exchange/ExchangeCore.sol#L460
 */
export function calculateMatchPrice(call: AtomicMatch_Call): BigInt {
  let sellSideFeeRecipient = call.inputs.addrs[10];

  let sellSide = call.inputs.feeMethodsSidesKindsHowToCalls[5];
  let sellSaleKind = call.inputs.feeMethodsSidesKindsHowToCalls[6];
  let sellBasePrice = call.inputs.uints[13];
  let sellExtra = call.inputs.uints[14];
  let sellListingTime = call.inputs.uints[15];
  let sellExpirationTime = call.inputs.uints[16];

  // Calculate sell price
  let sellPrice = calculateFinalPrice(
    sellSide,
    sellSaleKind,
    sellBasePrice,
    sellExtra,
    sellListingTime,
    sellExpirationTime,
    call.block.timestamp
  );

  let buySide = call.inputs.feeMethodsSidesKindsHowToCalls[1];
  let buySaleKind = call.inputs.feeMethodsSidesKindsHowToCalls[2];
  let buyBasePrice = call.inputs.uints[4];
  let buyExtra = call.inputs.uints[5];
  let buyListingTime = call.inputs.uints[6];
  let buyExpirationTime = call.inputs.uints[7];

  // Calculate buy price
  let buyPrice = calculateFinalPrice(
    buySide,
    buySaleKind,
    buyBasePrice,
    buyExtra,
    buyListingTime,
    buyExpirationTime,
    call.block.timestamp
  );

  // Maker/taker priority
  return sellSideFeeRecipient.notEqual(NULL_ADDRESS) ? sellPrice : buyPrice;
}

/**
 * Calculate the settlement price of an order using Order paramters
 * Returns basePrice if FixedPrice sale or calculate auction settle price if DutchAuction sale
 * https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/exchange/SaleKindInterface.sol#L70
 * NOTE: "now" keyword is simply an alias for block.timestamp
 * https://docs.soliditylang.org/en/v0.4.26/units-and-global-variables.html?highlight=now#block-and-transaction-properties
 */
export function calculateFinalPrice(
  side: i32,
  saleKind: i32,
  basePrice: BigInt,
  extra: BigInt,
  listingTime: BigInt,
  expirationTime: BigInt,
  now: BigInt
): BigInt {
  if (getSaleStrategy(saleKind) == SaleStrategy.STANDARD_SALE) {
    return basePrice;
  } else if (getSaleStrategy(saleKind) == SaleStrategy.DUTCH_AUCTION) {
    let diff = extra
      .times(now.minus(listingTime))
      .div(expirationTime.minus(listingTime));
    if (getOrderSide(side) == Side.SELL) {
      return basePrice.minus(diff);
    } else {
      return basePrice.plus(diff);
    }
  } else {
    return BIGINT_ZERO;
  }
}

/**
 * Replace bytes in an array with bytes in another array, guarded by a bitmask
 * Used to merge calldataBuy and calldataSell using replacementPattern as a bitmask to recreate calldata sent to sell.target
 * https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/common/ArrayUtils.sol#L28
 */
export function guardedArrayReplace(
  _array: Bytes,
  _replacement: Bytes,
  _mask: Bytes
): Bytes {
  // If replacementPattern is empty, meaning that both arrays buyCallData == sellCallData,
  // no merging is necessary. Returns first array (buyCallData)
  if (_mask.length == 0) {
    return _array;
  }

  // Copies original Bytes Array to avoid buffer overwrite
  let array = Bytes.fromUint8Array(_array.slice(0));
  let replacement = Bytes.fromUint8Array(_replacement.slice(0));
  let mask = Bytes.fromUint8Array(_mask.slice(0));

  array.reverse();
  replacement.reverse();
  mask.reverse();

  let bigIntArray = BigInt.fromUnsignedBytes(array);
  let bigIntReplacement = BigInt.fromUnsignedBytes(replacement);
  let bigIntMask = BigInt.fromUnsignedBytes(mask);

  bigIntReplacement = bigIntReplacement.bitAnd(bigIntMask);
  bigIntArray = bigIntArray.bitOr(bigIntReplacement);
  return Bytes.fromHexString(bigIntArray.toHexString());
}

/**
 * Decode Ethereum calldata of transferFrom/safeTransferFrom calls using function signature
 * 0x23b872dd transferFrom(address,address,uint256)
 * 0x42842e0e safeTransferFrom(address,address,uint256)
 * https://www.4byte.directory/signatures/?bytes4_signature=0x23b872dd
 * https://www.4byte.directory/signatures/?bytes4_signature=0x42842e0e
 */
export function decode_ERC721Transfer_Method(
  target: Address,
  callData: Bytes
): DecodedTransferResult {
  let functionSelector = getFunctionSelector(callData);
  let dataWithoutFunctionSelector = Bytes.fromUint8Array(callData.subarray(4));

  let decoded = ethereum
    .decode("(address,address,uint256)", dataWithoutFunctionSelector)!
    .toTuple();
  let senderAddress = decoded[0].toAddress();
  let recieverAddress = decoded[1].toAddress();
  let tokenId = decoded[2].toBigInt();

  return new DecodedTransferResult(
    functionSelector,
    senderAddress,
    recieverAddress,
    target,
    tokenId,
    BIGINT_ONE
  );
}

/**
 * Decode Ethereum calldata of safeTransferFrom call using function signature
 * 0xf242432a safeTransferFrom(address,address,uint256,uint256,bytes)
 * https://www.4byte.directory/signatures/?bytes4_signature=0xf242432a
 * NOTE: needs ETHABI_DECODE_PREFIX to decode (contains arbitrary bytes)
 */
export function decode_ERC1155Transfer_Method(
  target: Address,
  callData: Bytes
): DecodedTransferResult {
  let functionSelector = getFunctionSelector(callData);
  let dataWithoutFunctionSelector = Bytes.fromUint8Array(callData.subarray(4));
  let dataWithoutFunctionSelectorWithPrefix = ETHABI_DECODE_PREFIX.concat(
    dataWithoutFunctionSelector
  );

  let decoded = ethereum
    .decode(
      "(address,address,uint256,uint256,bytes)",
      dataWithoutFunctionSelectorWithPrefix
    )!
    .toTuple();
  let senderAddress = decoded[0].toAddress();
  let recieverAddress = decoded[1].toAddress();
  let tokenId = decoded[2].toBigInt();
  let amount = decoded[3].toBigInt();

  return new DecodedTransferResult(
    functionSelector,
    senderAddress,
    recieverAddress,
    target,
    tokenId,
    amount
  );
}

/**
 * Decode Ethereum calldata of matchERC721UsingCriteria/matchERC721WithSafeTransferUsingCriteria calls using function signature
 * 0xfb16a595 matchERC721UsingCriteria(address,address,address,uint256,bytes32,bytes32[])
 * 0xc5a0236e matchERC721WithSafeTransferUsingCriteria(address,address,address,uint256,bytes32,bytes32[])
 * https://www.4byte.directory/signatures/?bytes4_signature=0xfb16a595
 * https://www.4byte.directory/signatures/?bytes4_signature=0xc5a0236e
 * NOTE: needs ETHABI_DECODE_PREFIX to decode (contains arbitrary bytes/bytes array)
 */
export function decode_matchERC721UsingCriteria_Method(
  callData: Bytes
): DecodedTransferResult {
  let functionSelector = getFunctionSelector(callData);
  let dataWithoutFunctionSelector = Bytes.fromUint8Array(callData.subarray(4));
  let dataWithoutFunctionSelectorWithPrefix = ETHABI_DECODE_PREFIX.concat(
    dataWithoutFunctionSelector
  );

  let decoded = ethereum
    .decode(
      "(address,address,address,uint256,bytes32,bytes32[])",
      dataWithoutFunctionSelectorWithPrefix
    )!
    .toTuple();
  let senderAddress = decoded[0].toAddress();
  let recieverAddress = decoded[1].toAddress();
  let nftContractAddress = decoded[2].toAddress();
  let tokenId = decoded[3].toBigInt();

  return new DecodedTransferResult(
    functionSelector,
    senderAddress,
    recieverAddress,
    nftContractAddress,
    tokenId,
    BIGINT_ONE
  );
}

/**
 * Decode Ethereum calldata of matchERC1155UsingCriteria call using function signature
 * 0x96809f90 matchERC1155UsingCriteria(address,address,address,uint256,uint256,bytes32,bytes32[])
 * https://www.4byte.directory/signatures/?bytes4_signature=0x96809f90
 * NOTE: needs ETHABI_DECODE_PREFIX to decode (contains arbitrary bytes/bytes array)
 */
export function decode_matchERC1155UsingCriteria_Method(
  callData: Bytes
): DecodedTransferResult {
  let functionSelector = getFunctionSelector(callData);
  let dataWithoutFunctionSelector = Bytes.fromUint8Array(callData.subarray(4));
  let dataWithoutFunctionSelectorWithPrefix = ETHABI_DECODE_PREFIX.concat(
    dataWithoutFunctionSelector
  );

  let decoded = ethereum
    .decode(
      "(address,address,address,uint256,uint256,bytes32,bytes32[])",
      dataWithoutFunctionSelectorWithPrefix
    )!
    .toTuple();
  let senderAddress = decoded[0].toAddress();
  let recieverAddress = decoded[1].toAddress();
  let nftContractAddress = decoded[2].toAddress();
  let tokenId = decoded[3].toBigInt();
  let amount = decoded[4].toBigInt();

  return new DecodedTransferResult(
    functionSelector,
    senderAddress,
    recieverAddress,
    nftContractAddress,
    tokenId,
    amount
  );
}

/**
 * Decode Ethereum calldata of atomicize call using function signature
 * 0x68f0bcaa atomicize(address[],uint256[],uint256[],bytes)
 * https://www.4byte.directory/signatures/?bytes4_signature=0x68f0bcaa
 * NOTE: needs ETHABI_DECODE_PREFIX to decode (contains arbitrary bytes/arrays)
 */
export function decode_atomicize_Method(
  callData: Bytes
): DecodedAtomicizeResult {
  let dataWithoutFunctionSelector = Bytes.fromUint8Array(callData.subarray(4));
  let dataWithoutFunctionSelectorWithPrefix = ETHABI_DECODE_PREFIX.concat(
    dataWithoutFunctionSelector
  );
  let decoded = ethereum
    .decode(
      "(address[],uint256[],uint256[],bytes)",
      dataWithoutFunctionSelectorWithPrefix
    )!
    .toTuple();
  let targets = decoded[0].toAddressArray();
  let callDataLengths = decoded[2].toBigIntArray();
  let callDatas = decoded[3].toBytes();

  let atomicizedCallDatas = atomicizeCallData(callDatas, callDataLengths);

  return new DecodedAtomicizeResult(targets, atomicizedCallDatas);
}

export function decode_nftTransfer_Method(
  target: Address,
  callData: Bytes
): DecodedTransferResult {
  let functionSelector = getFunctionSelector(callData);
  if (
    functionSelector == TRANSFER_FROM_SELECTOR ||
    functionSelector == ERC721_SAFE_TRANSFER_FROM_SELECTOR
  ) {
    return decode_ERC721Transfer_Method(target, callData);
  } else if (
    functionSelector == MATCH_ERC721_TRANSFER_FROM_SELECTOR ||
    functionSelector == MATCH_ERC721_SAFE_TRANSFER_FROM_SELECTOR
  ) {
    return decode_matchERC721UsingCriteria_Method(callData);
  } else if (functionSelector == ERC1155_SAFE_TRANSFER_FROM_SELECTOR) {
    return decode_ERC1155Transfer_Method(target, callData);
  } else {
    return decode_matchERC1155UsingCriteria_Method(callData);
  }
}

export function min(a: BigDecimal, b: BigDecimal): BigDecimal {
  return a.lt(b) ? a : b;
}

export function max(a: BigDecimal, b: BigDecimal): BigDecimal {
  return a.lt(b) ? b : a;
}
