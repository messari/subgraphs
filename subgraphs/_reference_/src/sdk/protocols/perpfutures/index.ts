import { ethereum } from "@graphprotocol/graph-ts";

export class SDK {
  constructor() {}

  static initializeFromEvent(): SDK {
    return new SDK();
  }

  static initializeFromCall(): SDK {
    return new SDK();
  }
}
