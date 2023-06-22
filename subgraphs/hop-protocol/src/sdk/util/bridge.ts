import { Address, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import {
  ARBITRUM_L1_SIGNATURE,
  MESSENGER_EVENT_SIGNATURES,
  Network,
  OPTIMISM_L1_SIGNATURE,
  OPTIMISM_L2_SIGNATURE,
  XDAI_L1_SIGNATURE,
  XDAI_L2_SIGNATURE,
} from "./constants";
import { Account } from "../protocols/bridge/account";
import { reverseChainIDs } from "../protocols/bridge/chainIds";

export function updateL1OutgoingBridgeMessage(
  event: ethereum.Event,
  recipient: Address,
  chainId: BigInt,
  acc: Account,
  inputToken: string,
  receipt: ethereum.TransactionReceipt
): void {
  for (let index = 0; index < receipt.logs.length; index++) {
    const _address = receipt.logs[index].address;
    if (receipt.logs[index].topics.length == 0) continue;

    const _topic0 = receipt.logs[index].topics[0].toHexString();
    const _data = receipt.logs[index].data;

    log.warning("S8 - chainID: {}, topic0: {}, txHash: {}", [
      chainId.toString(),
      _topic0,
      event.transaction.hash.toHexString(),
    ]);
    if (!MESSENGER_EVENT_SIGNATURES.includes(_topic0)) continue;
    log.warning("S9 - chainID: {}, inputToken: {}, topic0: {}, txHash: {}", [
      chainId.toString(),
      inputToken,
      _topic0,
      event.transaction.hash.toHexString(),
    ]);

    const data = Bytes.fromUint8Array(_data.subarray(0));

    log.warning(
      "MessageOUTDT - emittingContractaddress: {}, topic0: {}, logAddress: {}, data: {}",
      [
        event.address.toHexString(),
        _topic0,
        _address.toHexString(),
        data.toHexString(),
      ]
    );
    if (_topic0 == ARBITRUM_L1_SIGNATURE) {
      acc.messageOut(chainId, recipient, data);
    } else if (_topic0 == XDAI_L1_SIGNATURE) {
      const _xDaiData = receipt.logs[index].topics[3];

      acc.messageOut(chainId, recipient, _xDaiData);
    } else if (_topic0 == OPTIMISM_L1_SIGNATURE) {
      const _optimismData = receipt.logs[index].topics[1];

      acc.messageOut(chainId, recipient, _optimismData);

      log.warning("MessageOUT - BridgeAddress: {}, data: {}", [
        event.address.toHexString(),
        data.toHexString(),
      ]);
    }
  }
}

export function updateL2OutgoingBridgeMessage(
  event: ethereum.Event,
  recipient: Address,
  chainId: BigInt,
  acc: Account,
  receipt: ethereum.TransactionReceipt
): void {
  for (let index = 0; index < receipt.logs.length; index++) {
    const _address = receipt.logs[index].address;
    if (receipt.logs[index].topics.length == 0) continue;

    const _topic0 = receipt.logs[index].topics[0].toHexString();
    if (!MESSENGER_EVENT_SIGNATURES.includes(_topic0)) continue;
    const _data = receipt.logs[index].data;

    const data = Bytes.fromUint8Array(_data.subarray(0));

    log.warning(
      "MessageOUTDT - emittingContractaddress: {}, topic0: {},  logAddress: {}, data: {}",
      [
        event.address.toHexString(),
        _topic0,
        _address.toHexString(),
        data.toHexString(),
      ]
    );
    if (_topic0 == XDAI_L2_SIGNATURE || _topic0 == OPTIMISM_L2_SIGNATURE) {
      acc.messageOut(chainId, recipient, data);
    }
    log.warning("MessageOUTDT2 - TokenAddress: {},  data: {}", [
      event.address.toHexString(),
      data.toHexString(),
    ]);
  }

  log.warning("TransferOUT - TokenAddress: {},  txHash: {},", [
    event.address.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
}

export function updateL2IncomingBridgeMessage(
  event: ethereum.Event,
  recipient: Address,
  acc: Account,
  receipt: ethereum.TransactionReceipt
): void {
  for (let index = 0; index < receipt.logs.length; index++) {
    const _topic0 = receipt.logs[index].topics[0].toHexString();
    if (!MESSENGER_EVENT_SIGNATURES.includes(_topic0)) continue;

    const _optimismData = receipt.logs[index].topics[1];
    const _address = receipt.logs[index].address;
    const _data = receipt.logs[index].data;

    const data = Bytes.fromUint8Array(_data.subarray(0));

    log.warning(
      "MessageINDT - emittingContractaddress: {}, topic0: {}, logAddress: {}, data: {}",
      [
        event.address.toHexString(),
        _topic0,
        _address.toHexString(),
        data.toHexString(),
      ]
    );
    if (_topic0 == OPTIMISM_L2_SIGNATURE) {
      acc.messageIn(
        reverseChainIDs.get(Network.MAINNET)!,
        recipient,
        _optimismData
      );
    } else if (_topic0 == XDAI_L2_SIGNATURE) {
      acc.messageIn(reverseChainIDs.get(Network.MAINNET)!, recipient, data);
    }

    log.warning("MessageIN - TokenAddress: {}, data: {}", [
      event.address.toHexString(),
      data.toHexString(),
    ]);
  }

  log.warning("TransferIN - TokenAddress: {},  txHash: {}", [
    event.address.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
}
