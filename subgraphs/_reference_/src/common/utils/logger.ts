import { ethereum, log } from "@graphprotocol/graph-ts";

export class Logger {
  event: ethereum.Event;

  constructor(event: ethereum.Event) {
    this.event = event;
  }

  private formatLog(funcName: string, msg: string): string {
    return `messari_log: [${funcName}}] tx: ${this.event.transaction.hash.toHexString()} :: ${msg}`;
  }

  info(funcName: string, msg: string): void {
    log.info(this.formatLog(funcName, msg), []);
  }
  warning(funcName: string, msg: string): void {
    log.warning(this.formatLog(funcName, msg), []);
  }
  error(funcName: string, msg: string): void {
    log.error(this.formatLog(funcName, msg), []);
  }
  critical(funcName: string, msg: string): void {
    log.critical(this.formatLog(funcName, msg), []);
  }
}
