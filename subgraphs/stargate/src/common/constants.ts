import { Address, BigInt, TypedMap } from "@graphprotocol/graph-ts";

////////////////////
///// Versions /////
////////////////////

export const PROTOCOL_NAME = "Stargate Finance";
export const PROTOCOL_SLUG = "stargate";

////////////////////////
///// Schema Enums /////
////////////////////////

// The network names corresponding to the Network enum in the schema.
// They also correspond to the ones in `dataSource.network()` after converting to lower case.
// See below for a complete list:
// https://thegraph.com/docs/en/hosted-service/what-is-hosted-service/#supported-networks-on-the-hosted-service
export namespace Network {
  export const ARBITRUM_ONE = "ARBITRUM_ONE";
  export const ARWEAVE_MAINNET = "ARWEAVE_MAINNET";
  export const AURORA = "AURORA";
  export const AVALANCHE = "AVALANCHE";
  export const BOBA = "BOBA";
  export const BSC = "BSC"; // aka BNB Chain
  export const CELO = "CELO";
  export const COSMOS = "COSMOS";
  export const CRONOS = "CRONOS";
  export const MAINNET = "MAINNET"; // Ethereum mainnet
  export const FANTOM = "FANTOM";
  export const FUSE = "FUSE";
  export const HARMONY = "HARMONY";
  export const JUNO = "JUNO";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const NEAR_MAINNET = "NEAR_MAINNET";
  export const OPTIMISM = "OPTIMISM";
  export const OSMOSIS = "OSMOSIS";
  export const MATIC = "MATIC"; // aka Polygon
  export const XDAI = "XDAI"; // aka Gnosis Chain
  export const UNKNOWN_NETWORK = "UNKNOWN_NETWORK";
}

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export const crossPoolTokens = new TypedMap<
  string,
  TypedMap<BigInt, Address>
>();

export const mainnetPoolIDsToToken = new TypedMap<BigInt, Address>();
mainnetPoolIDsToToken.set(
  BigInt.fromI32(1),
  Address.fromString("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
);
mainnetPoolIDsToToken.set(
  BigInt.fromI32(2),
  Address.fromString("0xdAC17F958D2ee523a2206206994597C13D831ec7")
);
mainnetPoolIDsToToken.set(
  BigInt.fromI32(3),
  Address.fromString("0x6B175474E89094C44Da98b954EedeAC495271d0F")
);
mainnetPoolIDsToToken.set(
  BigInt.fromI32(7),
  Address.fromString("0x853d955aCEf822Db058eb8505911ED77F175b99e")
);
mainnetPoolIDsToToken.set(
  BigInt.fromI32(11),
  Address.fromString("0x0C10bF8FcB7Bf5412187A595ab97a3609160b5c6")
);
mainnetPoolIDsToToken.set(
  BigInt.fromI32(13),
  Address.fromString("0x72E2F4830b9E45d52F80aC08CB2bEC0FeF72eD9c")
);
mainnetPoolIDsToToken.set(
  BigInt.fromI32(14),
  Address.fromString("0x57Ab1ec28D129707052df4dF418D58a2D46d5f51")
);
mainnetPoolIDsToToken.set(
  BigInt.fromI32(15),
  Address.fromString("0x5f98805A4E8be255a32880FDeC7F6728C6568bA0")
);
mainnetPoolIDsToToken.set(
  BigInt.fromI32(16),
  Address.fromString("0x9cef9a0b1bE0D289ac9f4a98ff317c33EAA84eb8")
);
crossPoolTokens.set(Network.MAINNET, mainnetPoolIDsToToken);

export const bscPoolIDsToToken = new TypedMap<BigInt, Address>();
bscPoolIDsToToken.set(
  BigInt.fromI32(2),
  Address.fromString("0x55d398326f99059fF775485246999027B3197955")
);
bscPoolIDsToToken.set(
  BigInt.fromI32(5),
  Address.fromString("0xe9e7cea3dedca5984780bafc599bd69add087d56")
);
bscPoolIDsToToken.set(
  BigInt.fromI32(11),
  Address.fromString("0xd17479997F34dd9156Deef8F95A52D81D265be9c")
);
bscPoolIDsToToken.set(
  BigInt.fromI32(16),
  Address.fromString("0x7BfD7f2498C4796f10b6C611D9db393D3052510C")
);
crossPoolTokens.set(Network.BSC, bscPoolIDsToToken);

export const avaxPoolIDsToToken = new TypedMap<BigInt, Address>();
avaxPoolIDsToToken.set(
  BigInt.fromI32(1),
  Address.fromString("0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E")
);
avaxPoolIDsToToken.set(
  BigInt.fromI32(2),
  Address.fromString("0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7")
);
avaxPoolIDsToToken.set(
  BigInt.fromI32(7),
  Address.fromString("0xD24C2Ad096400B6FBcd2ad8B24E7acBc21A1da64")
);
avaxPoolIDsToToken.set(
  BigInt.fromI32(16),
  Address.fromString("0x8736f92646B2542B3e5F3c63590cA7Fe313e283B")
);
crossPoolTokens.set(Network.AVALANCHE, avaxPoolIDsToToken);

export const maticPoolIDsToToken = new TypedMap<BigInt, Address>();
maticPoolIDsToToken.set(
  BigInt.fromI32(1),
  Address.fromString("0x2791bca1f2de4661ed88a30c99a7a9449aa84174")
);
maticPoolIDsToToken.set(
  BigInt.fromI32(2),
  Address.fromString("0xc2132d05d31c914a87c6611c10748aeb04b58e8f")
);
maticPoolIDsToToken.set(
  BigInt.fromI32(3),
  Address.fromString("0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063")
);
maticPoolIDsToToken.set(
  BigInt.fromI32(16),
  Address.fromString("0x8736f92646B2542B3e5F3c63590cA7Fe313e283B")
);
crossPoolTokens.set(Network.MATIC, maticPoolIDsToToken);

export const arbitrumPoolIDsToToken = new TypedMap<BigInt, Address>();
arbitrumPoolIDsToToken.set(
  BigInt.fromI32(1),
  Address.fromString("0xff970a61a04b1ca14834a43f5de4533ebddb5cc8")
);
arbitrumPoolIDsToToken.set(
  BigInt.fromI32(2),
  Address.fromString("0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9")
);
arbitrumPoolIDsToToken.set(
  BigInt.fromI32(7),
  Address.fromString("0x17FC002b466eEc40DaE837Fc4bE5c67993ddBd6F")
);
arbitrumPoolIDsToToken.set(
  BigInt.fromI32(13),
  Address.fromString("0x82CbeCF39bEe528B5476FE6d1550af59a9dB6Fc0")
);
arbitrumPoolIDsToToken.set(
  BigInt.fromI32(16),
  Address.fromString("0xF39B7Be294cB36dE8c510e267B82bb588705d977")
);
crossPoolTokens.set(Network.ARBITRUM_ONE, arbitrumPoolIDsToToken);

export const optimismPoolIDsToToken = new TypedMap<BigInt, Address>();
optimismPoolIDsToToken.set(
  BigInt.fromI32(1),
  Address.fromString("0x7f5c764cbc14f9669b88837ca1490cca17c31607")
);
optimismPoolIDsToToken.set(
  BigInt.fromI32(3),
  Address.fromString("0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1")
);
optimismPoolIDsToToken.set(
  BigInt.fromI32(7),
  Address.fromString("0x2E3D870790dC77A83DD1d18184Acc7439A53f475")
);
optimismPoolIDsToToken.set(
  BigInt.fromI32(13),
  Address.fromString("0xb69c8CBCD90A39D8D3d3ccf0a3E968511C3856A0")
);
optimismPoolIDsToToken.set(
  BigInt.fromI32(14),
  Address.fromString("0x8c6f28f2F1A3C87F0f938b96d27520d9751ec8d9")
);
optimismPoolIDsToToken.set(
  BigInt.fromI32(15),
  Address.fromString("0xc40F949F8a4e094D1b49a23ea9241D289B7b2819")
);
optimismPoolIDsToToken.set(
  BigInt.fromI32(16),
  Address.fromString("0x5421FA1A48f9FF81e4580557E86C7C0D24C18036")
);
crossPoolTokens.set(Network.OPTIMISM, optimismPoolIDsToToken);

export const fantomPoolIDsToToken = new TypedMap<BigInt, Address>();
fantomPoolIDsToToken.set(
  BigInt.fromI32(1),
  Address.fromString("0x04068da6c83afcfa0e13ba15a6696662335d5b75")
);
crossPoolTokens.set(Network.FANTOM, fantomPoolIDsToToken);
