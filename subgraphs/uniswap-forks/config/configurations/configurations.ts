import { Network, Protocol } from "../../src/common/constants";
import { ConfigurationFields} from "./fields";
// import { ApeswapConfigurations } from "../apeswap/apeswapConfigurations"
// import { SushiswapConfigurations } from "../sushiswap/sushiswapConfigurations"
import { UniswapV2Configurations } from "../uniswap-v2/uniswapConfigurations"
import { log, TypedMap } from "@graphprotocol/graph-ts";



export let AllConfigurations = new TypedMap<string, TypedMap<string, TypedMap<string, string>>>();
// AllConfigurations.set(Protocol.APESWAP,  ApeswapConfigurations)
// AllConfigurations.set(Protocol.SUSHISWAP, SushiswapConfigurations)
AllConfigurations.set(Protocol.UNISWAP_V2, UniswapV2Configurations)


// const AllConfigurations: HashMap<HashMap<ConfigurationFields>> = {};
// AllConfigurations[Protocol.APESWAP] =  ApeswapConfigurations
// AllConfigurations[Protocol.SUSHISWAP] = SushiswapConfigurations
// AllConfigurations[Protocol.UNISWAP_V2] = UniswapV2Configurations
// export default AllConfigurations

//log.warning(ApeswapConfigurations[Network.BSC].network, [])
// export const AllConfigurations: ProtocolNetworkConfigurationFields = {
//     [Protocol.APESWAP]: ApeswapConfigurations,
//     [Protocol.SUSHISWAP]: SushiswapConfigurations,
//     [Protocol.UNISWAP_V2]: UniswapV2Configurations,
//   }