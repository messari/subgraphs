import { Address, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import {
  BIGINT_ONE,
  BIGINT_ZERO,
  ETHABI_DECODE_PREFIX,
  MATCH_ERC115_SAFE_TRANSFER_FROM_SELCTOR,
  MATCH_ERC721_SAFE_TRANSFER_FROM_SELCTOR,
  MATCH_ERC721_TRANSFER_FROM_SELCTOR,
  NULL_ADDRESS,
} from "./constants";

export class DecodedTransferResult {
  method: string;
  from: Address;
  to: Address;
  token: Address;
  tokenId: BigInt;
  amount: BigInt;

  constructor(
    _method: string,
    _from: Address,
    _to: Address,
    _token: Address,
    _tokenId: BigInt,
    _amount: BigInt
  ) {
    this.method = _method;
    this.from = _from;
    this.to = _to;
    this.token = _token;
    this.tokenId = _tokenId;
    this.amount = _amount;
  }
}

export function getFunctionSelector(callData: Bytes): string {
  return Bytes.fromUint8Array(callData.subarray(0, 4)).toHexString();
}

export function checkCallDataFunctionSelector(callData: Bytes): boolean {
  let functionSelector = getFunctionSelector(callData);
  return (
    functionSelector == MATCH_ERC721_TRANSFER_FROM_SELCTOR ||
    functionSelector == MATCH_ERC721_SAFE_TRANSFER_FROM_SELCTOR ||
    functionSelector == MATCH_ERC115_SAFE_TRANSFER_FROM_SELCTOR
  );
}

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
  // return changetype<Bytes>(Bytes.fromBigInt(bigIntArray).reverse());
  return Bytes.fromHexString(bigIntArray.toHexString());
}

export function decode_matchERC721UsingCriteria_Method(
  callData: Bytes
): DecodedTransferResult {
  let functionSelector = getFunctionSelector(callData);
  let dataWithoutFunctionSelector = Bytes.fromUint8Array(callData.subarray(4));
  let dataWithoutFunctionSelectorWithPrefix = ETHABI_DECODE_PREFIX.concat(dataWithoutFunctionSelector);

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

export function decode_matchERC1155UsingCriteria_Method(
  callData: Bytes
): DecodedTransferResult {
  let functionSelector = getFunctionSelector(callData);
  let dataWithoutFunctionSelector = Bytes.fromUint8Array(callData.subarray(4));
  let dataWithoutFunctionSelectorWithPrefix = ETHABI_DECODE_PREFIX.concat(dataWithoutFunctionSelector);

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
