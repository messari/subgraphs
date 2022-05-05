import { Network } from "../../src/common/constants";
import { NetworkFieldMap } from "../configurations/types";
import { ApeswapBscConfigurations } from "./bsc/bsc";
import { ApeswapMaticConfigurations } from "./matic/matic";


export const ApeswapConfigurations: NetworkFieldMap = {
    [Network.BSC]: ApeswapBscConfigurations,
    [Network.MATIC]: ApeswapMaticConfigurations,
  }
  