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
    public readonly nativeLPStartBlock: i32
  ) {}
}

export function getProtocolData(): NetworkSpecificConstant {
  const network = dataSource.network();

  if (equalsIgnoreCase(network, Network.MOONRIVER)) {
    return new NetworkSpecificConstant(
      Address.fromString("0x0b7a0EAA884849c6Af7a129e899536dDDcA4905E"),
      Network.MOONRIVER,
      moonriverNativeToken,
      moonriverNativeCToken,
      moonriverAuxilaryRewardToken,
      Address.fromString("0xE6Bfc609A2e58530310D6964ccdd236fc93b4ADB"), // solarbeam movr-mfam pair
      1512356
    );
  }

  if (equalsIgnoreCase(network, Network.MOONBEAM)) {
    return new NetworkSpecificConstant(
      Address.fromString("0x8E00D5e02E65A19337Cdba98bbA9F84d4186a180"),
      Network.MOONBEAM,
      moonbeamNativeToken,
      moonbeamNativeCToken,
      moonbeamAuxilaryRewardToken,
      Address.fromString("0xb536c1F9A157B263B70A9a35705168ACC0271742"), // solarbeam well-glmr pair
      1277866
    );
  }

  if (equalsIgnoreCase(network, Network.BASE)) {
    return new NetworkSpecificConstant(
      Address.fromString("0xfBb21d0380beE3312B33c4353c8936a0F13EF26C"),
      Network.BASE,
      baseNativeToken,
      baseNativeCToken,
      baseAuxilaryRewardToken,
      Address.fromString("0x89D0F320ac73dd7d9513FFC5bc58D1161452a657"), // aerodrome well-weth pair
      12314465
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
    0
  );
}

//
//
// TokenData classes

const moonriverNativeToken = new TokenData(
  Address.fromString("0x0000000000000000000000000000000000000000"),
  "MOVR",
  "MOVR",
  18
);

const moonriverNativeCToken = new TokenData(
  Address.fromString("0x6a1A771C7826596652daDC9145fEAaE62b1cd07f"),
  "Moonwell MOVR",
  "mMOVR",
  cTokenDecimals
);

const moonriverAuxilaryRewardToken = new TokenData(
  Address.fromString("0xbb8d88bcd9749636bc4d2be22aac4bb3b01a58f1"),
  "MFAM",
  "MFAM",
  18
);

const moonbeamNativeToken = new TokenData(
  Address.fromString("0x0000000000000000000000000000000000000000"),
  "GLMR",
  "GLMR",
  18
);

const moonbeamNativeCToken = new TokenData(
  Address.fromString("0x091608f4e4a15335145be0A279483C0f8E4c7955"),
  "Moonwell GLMR",
  "mGLMR",
  cTokenDecimals
);

const moonbeamAuxilaryRewardToken = new TokenData(
  Address.fromString("0x511aB53F793683763E5a8829738301368a2411E3"),
  "WELL",
  "WELL",
  18
);

const baseNativeToken = new TokenData(
  Address.fromString("0x0000000000000000000000000000000000000000"),
  "ETH",
  "ETH",
  18
);

const baseNativeCToken = new TokenData(
  Address.fromString("0x091608f4e4a15335145be0A279483C0f8E4c7955"),
  "Moonwell WETH",
  "mWETH",
  cTokenDecimals
);

const baseAuxilaryRewardToken = new TokenData(
  Address.fromString("0xA88594D404727625A9437C3f886C7643872296AE"),
  "WELL",
  "WELL",
  18
);
