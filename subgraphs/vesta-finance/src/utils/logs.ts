import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts";

// Topic0 of ERC20 Transfer event.
// Transfer(address,address.uint256)
export const ERC20_TRANSFER_TOPIC0 =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export class ERC20TransferLog {
  tokenAddr: Address;
  from: Address;
  to: Address;
  amount: BigInt;

  private constructor(txLog: ethereum.Log) {
    this.tokenAddr = txLog.address;
    this.from = ERC20TransferLog.getFrom(txLog);
    this.to = ERC20TransferLog.getDestination(txLog);
    this.amount = ERC20TransferLog.getAmount(txLog);
  }

  static parse(txLog: ethereum.Log): ERC20TransferLog | null {
    if (!ERC20TransferLog.isTransferLog(txLog)) {
      return null;
    }

    return new ERC20TransferLog(txLog);
  }

  static isTransferLog(txLog: ethereum.Log): boolean {
    return txLog.topics[0].toHexString() == ERC20_TRANSFER_TOPIC0;
  }

  static getFrom(txLog: ethereum.Log): Address {
    return ethereum.decode("address", txLog.topics[1])!.toAddress();
  }

  static getDestination(txLog: ethereum.Log): Address {
    return ethereum.decode("address", txLog.topics[2])!.toAddress();
  }

  static getAmount(txLog: ethereum.Log): BigInt {
    return ethereum.decode("uint256", txLog.data)!.toBigInt();
  }
}

// Topic0 of AssetSent event, emitted by ActivePool when sending Asset away.
// AssetSent(address,address,uint256)
export const AsssetSend_TOPIC0 =
  "0xf89c3306c782ffbbe4593aa5673e97e9ad6a8c65d240405e8986363fada66392";

export class AssetSentLog {
  contractAddr: Address;
  to: Address;
  asset: Address;
  amount: BigInt;

  private constructor(txLog: ethereum.Log) {
    const decoded = ethereum.decode("(address,uint256)", txLog.data)!.toTuple();
    this.to = decoded.at(0).toAddress();
    this.asset = ethereum.decode("address", txLog.topics[1])!.toAddress();
    this.amount = decoded.at(1).toBigInt();
    this.contractAddr = txLog.address;
  }

  static parse(txLog: ethereum.Log): AssetSentLog | null {
    if (!AssetSentLog.isAssetSentLog(txLog)) {
      return null;
    }

    return new AssetSentLog(txLog);
  }

  static isAssetSentLog(txLog: ethereum.Log): boolean {
    return txLog.topics[0].toHexString() == AsssetSend_TOPIC0;
  }
}
