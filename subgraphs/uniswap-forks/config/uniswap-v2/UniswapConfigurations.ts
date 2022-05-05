import { Network } from "../../src/common/constants";
import { NetworkFieldMap } from "../configurations/types";
import { UniswapMainnetConfigurations } from "./mainnet/mainnet";


export const UniswapConfigurations: NetworkFieldMap = {
    [Network.MAINNET]: UniswapMainnetConfigurations,
  }
  