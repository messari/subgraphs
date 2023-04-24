import { ethereum, log } from "@graphprotocol/graph-ts";

/**
 * Logger class is used to log messages to be picked up by our logging system.
 *
 * @param event The event that triggered the log message
 * @param funcName The name of the function that triggered the log message
 * @param msg The message to log (add `{}` to the message to add additional arguments)
 * @param args Any additional arguments to add to the msg (same format as graph-ts log functions)
 */
export class Logger {
  event: ethereum.Event;
  funcName: string; // this will act as a rudimentary stack trace

  constructor(event: ethereum.Event, funcName: string) {
    this.event = event;
    this.funcName = funcName;
  }

  private formatLog(msg: string): string {
    return `messari_log: [${
      this.funcName
    }}] tx: ${this.event.transaction.hash.toHexString()} :: ${msg}`;
  }

  info(msg: string, args: string[]): void {
    log.info(this.formatLog(msg), args);
  }
  warning(msg: string, args: string[]): void {
    log.warning(this.formatLog(msg), args);
  }
  error(msg: string, args: string[]): void {
    log.error(this.formatLog(msg), args);
  }
  critical(msg: string, args: string[]): void {
    log.critical(this.formatLog(msg), args);
  }

  appendFuncName(funcName: string): void {
    this.funcName = this.funcName.concat("/").concat(funcName);
  }
}
