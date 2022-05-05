import { Network } from "../../src/common/constants";
import { NetworkFieldMap } from "../configurations/types";
import { UniswapV2MainnetConfigurations } from "./mainnet/mainnet";


export const UniswapV2Configurations: NetworkFieldMap = {
    [Network.MAINNET]: UniswapV2MainnetConfigurations,
  }
  