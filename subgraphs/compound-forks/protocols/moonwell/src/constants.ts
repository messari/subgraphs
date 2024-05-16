import { Address, dataSource, log } from "@graphprotocol/graph-ts";
import {
  cTokenDecimals,
  equalsIgnoreCase,
  Network,
} from "../../../src/constants";
import { TokenData } from "../../../src/mapping";

export class NetworkSpecificConstant {
  constructor(
    public readonly comptrollerAddress: Address,
    public readonly network: string,
    public readonly nativeToken: TokenData,
    public readonly nativeCToken: TokenData,
    public readonly auxilaryRewardToken: TokenData, // additional reward token, aside from native token
    public readonly nativeLPAddress: Address,
    public readonly nativeLPStartBlock: i32,
  ) {}
}

export function getProtocolData(): NetworkSpecificConstant {
  const network = dataSource.network();

  if (equalsIgnoreCase(network, Network.MOONRIVER)) {
    return new NetworkSpecificConstant(
      Address.fromString("0x0b7a0eaa884849c6af7a129e899536dddca4905e"),
      Network.MOONRIVER,
      moonriverNativeToken,
      moonriverNativeCToken,
      moonriverAuxilaryRewardToken,
      Address.fromString("0xe6bfc609a2e58530310d6964ccdd236fc93b4adb"), // solarbeam movr-mfam pair
      1512356,
    );
  }

  if (equalsIgnoreCase(network, Network.MOONBEAM)) {
    return new NetworkSpecificConstant(
      Address.fromString("0x8e00d5e02e65a19337cdba98bba9f84d4186a180"),
      Network.MOONBEAM,
      moonbeamNativeToken,
      moonbeamNativeCToken,
      moonbeamAuxilaryRewardToken,
      Address.fromString("0xb536c1f9a157b263b70a9a35705168acc0271742"), // solarbeam well-glmr pair
      1277866,
    );
  }

  if (equalsIgnoreCase(network, Network.BASE)) {
    return new NetworkSpecificConstant(
      Address.fromString("0xfbb21d0380bee3312b33c4353c8936a0f13ef26c"),
      Network.BASE,
      baseNativeToken,
      baseNativeCToken,
      baseAuxilaryRewardToken,
      Address.fromString("0x89d0f320ac73dd7d9513ffc5bc58d1161452a657"), // aerodrome well-weth pair
      12314465,
    );
  }

  log.critical("Unsupported network: {}", [network]);
  return new NetworkSpecificConstant(
    Address.fromString("0x0"),
    network,
    moonriverNativeToken,
    moonriverNativeCToken,
    moonbeamAuxilaryRewardToken,
    Address.fromString("0x0"),
    0,
  );
}

//
//
// TokenData classes

const moonriverNativeToken = new TokenData(
  Address.fromString("0x0000000000000000000000000000000000000000"),
  "MOVR",
  "MOVR",
  18,
);

const moonriverNativeCToken = new TokenData(
  Address.fromString("0x6a1a771c7826596652dadc9145feaae62b1cd07f"),
  "Moonwell MOVR",
  "mMOVR",
  cTokenDecimals,
);

const moonriverAuxilaryRewardToken = new TokenData(
  Address.fromString("0xbb8d88bcd9749636bc4d2be22aac4bb3b01a58f1"),
  "MFAM",
  "MFAM",
  18,
);

const moonbeamNativeToken = new TokenData(
  Address.fromString("0x0000000000000000000000000000000000000000"),
  "GLMR",
  "GLMR",
  18,
);

const moonbeamNativeCToken = new TokenData(
  Address.fromString("0x091608f4e4a15335145be0a279483c0f8e4c7955"),
  "Moonwell GLMR",
  "mGLMR",
  cTokenDecimals,
);

const moonbeamAuxilaryRewardToken = new TokenData(
  Address.fromString("0x511ab53f793683763e5a8829738301368a2411e3"),
  "WELL",
  "WELL",
  18,
);

const baseNativeToken = new TokenData(
  Address.fromString("0x0000000000000000000000000000000000000000"),
  "ETH",
  "ETH",
  18,
);

const baseNativeCToken = new TokenData(
  Address.fromString("0x091608f4e4a15335145be0a279483c0f8e4c7955"),
  "Moonwell WETH",
  "mWETH",
  cTokenDecimals,
);

const baseAuxilaryRewardToken = new TokenData(
  Address.fromString("0xa88594d404727625a9437c3f886c7643872296ae"),
  "WELL",
  "WELL",
  18,
);
