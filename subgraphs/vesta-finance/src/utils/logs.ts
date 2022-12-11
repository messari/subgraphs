import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts";

// Topic0 of ERC20 Transfer event.
export const ERC20_TRANSFER_TOPIC0 =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export class ERC20TransferLog {
  tokenAddr: Address;
  from: Address;
  to: Address;
  amount: BigInt;

  private constructor(log: ethereum.Log) {
    this.tokenAddr = log.address;
    this.from = ERC20TransferLog.getFrom(log);
    this.to = ERC20TransferLog.getDestination(log);
    this.amount = ERC20TransferLog.getAmount(log);
  }

  static parse(log: ethereum.Log): ERC20TransferLog | null {
    if (!ERC20TransferLog.isTransferLog(log)) {
      return null;
    }

    return new ERC20TransferLog(log);
  }

  static isTransferLog(log: ethereum.Log): boolean {
    return log.topics[0].toHexString() == ERC20_TRANSFER_TOPIC0;
  }

  static getFrom(log: ethereum.Log): Address {
    return ethereum.decode("address", log.topics[1])!.toAddress();
  }

  static getDestination(log: ethereum.Log): Address {
    return ethereum.decode("address", log.topics[2])!.toAddress();
  }

  static getAmount(log: ethereum.Log): BigInt {
    return ethereum.decode("uint256", log.data)!.toBigInt();
  }
}

// Topic0 of AssetSent event, emitted by ActivePool when sending Asset away.
export const AsssetSend_TOPIC0 =
  "f89c3306c782ffbbe4593aa5673e97e9ad6a8c65d240405e8986363fada66392";

export class AssetSentLog {
  contractAddr: Address;
  to: Address;
  asset: Address;
  amount: BigInt;

  private constructor(log: ethereum.Log) {
    const decoded = ethereum
      .decode("(address,address,uint256)", log.data)!
      .toTuple();
    this.to = decoded.at(0).toAddress();
    this.asset = decoded.at(1).toAddress();
    this.amount = decoded.at(2).toBigInt();
    this.contractAddr = log.address;
  }

  static parse(log: ethereum.Log): AssetSentLog | null {
    if (!AssetSentLog.isAssetSentLog(log)) {
      return null;
    }

    return new AssetSentLog(log);
  }

  static isAssetSentLog(log: ethereum.Log): boolean {
    return log.topics[0].toHexString() == AsssetSend_TOPIC0;
  }
}
