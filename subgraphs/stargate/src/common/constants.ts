/* eslint-disable @typescript-eslint/no-magic-numbers, rulesdir/no-checksum-addresses */
import { Address, BigInt, TypedMap } from "@graphprotocol/graph-ts";

import { Network } from "../sdk/util/constants";

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export const PROTOCOL_NAME = "Stargate Finance";
export const PROTOCOL_SLUG = "stargate";

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
mainnetPoolIDsToToken.set(
  BigInt.fromI32(17),
  Address.fromString("0xd8772edBF88bBa2667ed011542343b0eDDaCDa47")
);
mainnetPoolIDsToToken.set(
  BigInt.fromI32(19),
  Address.fromString("0x430Ebff5E3E80A6C58E7e6ADA1d90F5c28AA116d")
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
bscPoolIDsToToken.set(
  BigInt.fromI32(17),
  Address.fromString("0xD4CEc732b3B135eC52a3c0bc8Ce4b8cFb9dacE46")
);
bscPoolIDsToToken.set(
  BigInt.fromI32(19),
  Address.fromString("0x68C6c27fB0e02285829e69240BE16f32C5f8bEFe")
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
avaxPoolIDsToToken.set(
  BigInt.fromI32(19),
  Address.fromString("0xEAe5c2F6B25933deB62f754f239111413A0A25ef")
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

export const metisPoolIDsToToken = new TypedMap<BigInt, Address>();
metisPoolIDsToToken.set(
  BigInt.fromI32(17),
  Address.fromString("0xAad094F6A75A14417d39f04E690fC216f080A41a")
);
metisPoolIDsToToken.set(
  BigInt.fromI32(19),
  Address.fromString("0x2b60473a7C41Deb80EDdaafD5560e963440eb632")
);
crossPoolTokens.set(Network.METIS, metisPoolIDsToToken);

export const basePoolIDsToToken = new TypedMap<BigInt, Address>();
basePoolIDsToToken.set(
  BigInt.fromI32(1),
  Address.fromString("0x4c80E24119CFB836cdF0a6b53dc23F04F7e652CA")
);
basePoolIDsToToken.set(
  BigInt.fromI32(13),
  Address.fromString("0x28fc411f9e1c480AD312b3d9C60c22b965015c6B")
);
crossPoolTokens.set(Network.BASE, basePoolIDsToToken);
