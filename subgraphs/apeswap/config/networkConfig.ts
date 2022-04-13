import { Address, BigDecimal, dataSource } from "@graphprotocol/graph-ts";
import { Factory } from "../../generated/Factory/Factory";
import { Network, toPercentage } from "./constant";
import {
  bscNativeTokenPriceInUSD,
  polygonNativeTokenPriceInUSD,
} from "./pricing";

class DeployedNetwork {
  network: string; // The deployed network(e.g BSC or Polygon )
  factoryContract: Factory; // Factory Contract of protocol in the network
  factoryAddress: string; // factory address of the protocol in the network
  tradingFee: BigDecimal; // trading fee of the protocol in the network
  protocolFee: BigDecimal; // protocol fee of the protocol in the network
  supplyFee: BigDecimal; // supply fee of the protocol in the network
  wrappedNativeTokenAddress: string; // Address of wrapped native token
  nativeTokenPriceInUSD: BigDecimal; // Current USD value of the Native token
  whitelist: string[]; // A tokens whose amounts should contribute to tracked volume and liquidity

  constructor(
    network: string,
    factoryContract: Factory,
    factoryAddress: string,
    tradingFee: BigDecimal,
    protocolFee: BigDecimal,
    supplyFee: BigDecimal,
    wrappedNativeTokenAddress: string,
    nativeTokenPriceInUSD: BigDecimal,
    whitelist: string[],
  ) {
    this.network = network;
    this.factoryContract = factoryContract;
    this.factoryAddress = factoryAddress;
    this.tradingFee = tradingFee;
    this.protocolFee = protocolFee;
    this.supplyFee = supplyFee;
    this.wrappedNativeTokenAddress = wrappedNativeTokenAddress;
    this.nativeTokenPriceInUSD = nativeTokenPriceInUSD;
    this.whitelist = whitelist;
  }
}

const POLYGON_NETWORK = "matic";
const TRADING_FEE = toPercentage(BigDecimal.fromString("0.2"));
const BSC_PROTOCOL_FEE = toPercentage(BigDecimal.fromString("0.05"));
const POLYGON_PROTOCOL_FEE = toPercentage(BigDecimal.fromString("0.15"));
const BSC_SUPPLY_FEE = toPercentage(BigDecimal.fromString("0.15"));
const POLYGON_SUPPLY_FEE = toPercentage(BigDecimal.fromString("0.05"));

export namespace BSC {
  export const WBNB_ADDRESS = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";
  export const BUSD_WBNB_PAIR = "0x51e6d27fa57373d8d4c256231241053a70cb1d93"; // created block 4857769
  export const DAI_WBNB_PAIR = "0xf3010261b58b2874639ca2e860e9005e3be5de0b"; // created block 481116
  export const USDT_WBNB_PAIR = "0x20bcc3b8a0091ddac2d0bc30f68e6cbb97de59cd"; // created block 648115
  export const FACTORY_ADDRESS = "0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6";
  export const WHITELIST = [
    "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c", // WBNB
    "0xe9e7cea3dedca5984780bafc599bd69add087d56", // BUSD
    "0x55d398326f99059ff775485246999027b3197955", // USDT
    "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", // USDC
    "0x23396cf899ca06c4472205fc903bdb4de249d6fc", // UST
    "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3", // DAI
    "0x4bd17003473389a42daf6a0a729f6fdb328bbbd7", // VAI
    "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c", // BTCB
    "0x2170ed0880ac9a755fd29b2688956bd959f933f8", // WETH
    "0x250632378e573c6be1ac2f97fcdf00515d0aa91b", // BETH
    "0x603c7f932ed1fc6575303d8fb018fdcbb0f39a95", // BANANA
    "0xdDb3Bd8645775F59496c821E4F55A7eA6A6dc299", // GNANA
  ];
}

export namespace POLYGON {
  export const WMATIC_ADDRESS = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
  export const WMATIC_DAI_PAIR = "0xd32f3139a214034a0f9777c87ee0a064c1ff6ae2";
  export const WMATIC_USDT_PAIR = "0x65d43b64e3b31965cd5ea367d4c2b94c03084797";
  export const WMATIC_USDC_PAIR = "0x019011032a7ac3a87ee885b6c08467ac46ad11cd";
  export const FACTORY_ADDRESS = "0xCf083Be4164828f00cAE704EC15a36D711491284";
  export const WHITELIST = [
    "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WMATIC
    "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", // DAI
    "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // USDC
    "0xa649325aa7c5093d12d6f98eb4378deae68ce23f", // BNB
    "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // WETH
    "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6", // WBTC
    "0x5d47bAbA0d66083C52009271faF3F50DCc01023C", // BANANA
  ];
}

let bscFactoryContract = Factory.bind(Address.fromString(BSC.FACTORY_ADDRESS))
// Create bsc network and set its specific parameter
let bscNetwork = new DeployedNetwork(
  Network.BSC,
  bscFactoryContract,
  BSC.FACTORY_ADDRESS,
  TRADING_FEE,
  BSC_PROTOCOL_FEE,
  BSC_SUPPLY_FEE,
  BSC.WBNB_ADDRESS,
  bscNativeTokenPriceInUSD(),
  BSC.WHITELIST
);

let polygonFactoryContract = Factory.bind(Address.fromString(POLYGON.FACTORY_ADDRESS))
// Create polygon network and set its specific parameter
let polygonNetwork = new DeployedNetwork(
  Network.POLYGON,
  polygonFactoryContract,
  POLYGON.FACTORY_ADDRESS,
  TRADING_FEE,
  POLYGON_PROTOCOL_FEE,
  POLYGON_SUPPLY_FEE,
  POLYGON.WMATIC_ADDRESS,
  polygonNativeTokenPriceInUSD(),
  POLYGON.WHITELIST
);


export let deployedNetwork: DeployedNetwork;
if (dataSource.network() == Network.BSC.toLowerCase()){
  deployedNetwork = bscNetwork;
} else if (dataSource.network() == POLYGON_NETWORK) {
  deployedNetwork = polygonNetwork;
}
  
