import { Address, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import {
  BIGINT_ONE,
  ETHABI_DECODE_PREFIX,
  MATCH_ERC115_SAFE_TRANSFER_FROM_SELCTOR,
  MATCH_ERC721_SAFE_TRANSFER_FROM_SELCTOR,
  MATCH_ERC721_TRANSFER_FROM_SELCTOR,
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

/**
 * Get first 4 bytes of the calldata (function selector/method ID)
 */
export function getFunctionSelector(callData: Bytes): string {
  return Bytes.fromUint8Array(callData.subarray(0, 4)).toHexString();
}

/**
 * Relevant function selectors/method IDs can be found via https://www.4byte.directory
 */
export function checkCallDataFunctionSelector(callData: Bytes): boolean {
  let functionSelector = getFunctionSelector(callData);
  return (
    functionSelector == MATCH_ERC721_TRANSFER_FROM_SELCTOR ||
    functionSelector == MATCH_ERC721_SAFE_TRANSFER_FROM_SELCTOR ||
    functionSelector == MATCH_ERC115_SAFE_TRANSFER_FROM_SELCTOR
  );
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
 * Decode Ethereum calldata of matchERC721UsingCriteria/matchERC721WithSafeTransferUsingCriteria calls using function signature
 * 0xfb16a595 matchERC721UsingCriteria(address,address,address,uint256,bytes32,bytes32[])
 * 0xc5a0236e matchERC721WithSafeTransferUsingCriteria(address,address,address,uint256,bytes32,bytes32[])
 * https://www.4byte.directory/signatures/?bytes4_signature=0xfb16a595
 * https://www.4byte.directory/signatures/?bytes4_signature=0xc5a0236e
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
 * matchERC1155UsingCriteria(address,address,address,uint256,uint256,bytes32,bytes32[])
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

export function decodeSingleNftData(callData: Bytes): DecodedTransferResult {
  let functionSelector = getFunctionSelector(callData);
  if (
    functionSelector == MATCH_ERC721_TRANSFER_FROM_SELCTOR ||
    functionSelector == MATCH_ERC721_SAFE_TRANSFER_FROM_SELCTOR
  ) {
    return decode_matchERC721UsingCriteria_Method(callData);
  } else {
    return decode_matchERC1155UsingCriteria_Method(callData);
  }
}
