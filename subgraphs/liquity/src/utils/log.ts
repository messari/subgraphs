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

// Topic0 of EtherSent event, emitted by ActivePool when sending Ether away.
export const ETHER_SENT_TOPIC0 =
  "0x6109e2559dfa766aaec7118351d48a523f0a4157f49c8d68749c8ac41318ad12";

export class LiquityEtherSentLog {
  contractAddr: Address;
  to: Address;
  amount: BigInt;

  private constructor(log: ethereum.Log) {
    const decoded = ethereum.decode("(address,uint256)", log.data)!.toTuple();
    this.to = decoded.at(0).toAddress();
    this.amount = decoded.at(1).toBigInt();
    this.contractAddr = log.address;
  }

  static parse(log: ethereum.Log): LiquityEtherSentLog | null {
    if (!LiquityEtherSentLog.isEtherSentLog(log)) {
      return null;
    }

    return new LiquityEtherSentLog(log);
  }

  static isEtherSentLog(log: ethereum.Log): boolean {
    return log.topics[0].toHexString() == ETHER_SENT_TOPIC0;
  }
}
