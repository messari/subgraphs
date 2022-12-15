import { NetworkNodeBalanceMinipoolMetadata } from "./networkNodeBalanceMinipoolMetadata";
import { NetworkNodeBalanceRPLMetadata } from "./networkNodeBalanceRPLMetadata";

export class NetworkNodeBalanceMetadata {
  minipoolMetadata: NetworkNodeBalanceMinipoolMetadata;
  rplMetadata: NetworkNodeBalanceRPLMetadata;

  constructor() {
    this.minipoolMetadata = new NetworkNodeBalanceMinipoolMetadata();
    this.rplMetadata = new NetworkNodeBalanceRPLMetadata();
  }
}
