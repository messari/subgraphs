import { Network } from "../../src/common/constants";
import { NetworkFieldMap } from "../configurations/types";
import { UniswapV2MainnetConfigurations } from "./mainnet/mainnet";


export var UniswapV2Configurations: NetworkFieldMap = {
    [Network.MAINNET]: UniswapV2MainnetConfigurations,
  }
  