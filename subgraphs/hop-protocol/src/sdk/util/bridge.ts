import { Address, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import {
  ARBITRUM_L1_SIGNATURE,
  MESSENGER_EVENT_SIGNATURES,
  OPTIMISM_L1_SIGNATURE,
  XDAI_L1_SIGNATURE,
} from "./constants";
import { Account } from "../protocols/bridge/account";

export function updateBridgeMessage(
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
