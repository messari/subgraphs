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
  fnName: string | null;

  constructor(event: ethereum.Event, fnName: string | null = null) {
    this.event = event;
    this.fnName = fnName;
  }

  private formatLog(msg: string): string {
    if (this.fnName) {
      return `messari_log: [${
        this.fnName
      }}] tx: ${this.event.transaction.hash.toHexString()} :: ${msg}`;
    }

    return `messari_log: tx: ${this.event.transaction.hash.toHexString()} :: ${msg}`;
  }

  info(msg: string, args: string[] | null = null): void {
    if (!args) args = [];
    log.info(this.formatLog(msg), args);
  }
  warning(msg: string, args: string[] | null = null): void {
    if (!args) args = [];
    log.warning(this.formatLog(msg), args);
  }
  error(msg: string, args: string[] | null = null): void {
    if (!args) args = [];
    log.error(this.formatLog(msg), args);
  }
  critical(msg: string, args: string[] | null = null): void {
    if (!args) args = [];
    log.critical(this.formatLog(msg), args);
  }

  updateFunctionName(fnName: string): void {
    this.fnName = fnName;
  }
}
