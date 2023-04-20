import { Address } from "@graphprotocol/graph-ts";
import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class PolygonMainnetConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): string {
    return "0xA0c68C638235ee32657e8f720a23ceC1bFc77C77";
  }
  getRewardToken(): string {
    return "";
  }
  ignoreToken(tokenAddr: string): boolean {
    const ignoreList = [
      "0xea6b6a4b813d1436a75883fcc789121e4b3f0465",
      "0x761D38e5ddf6ccf6Cf7c55759d5210750B5D60F3",
      "0xfad45e47083e4607302aa43c65fb3106f1cd7607",
      "0x9d3ee6b64e69ebe12a4bf0b01d031cb80f556ee4",
      "0x922ac473a3cc241fd3a0049ed14536452d58d73c",
      "0xCae72A7A0Fd9046cf6b165CA54c9e3a3872109E0",
      "0x9695e0114e12c0d3a3636fab5a18e6b737529023",
      "0xcc4ae94372da236e9b113132e0c46c68704246b9",
      "0x676CdC3312d0350749bed17CD3eB3B90E5917F42",
      "0x591975253e25101f6e6f0383e13e82b7601d8c59",
      "0x7b6bbbeac6a7f5681ec8e250b9aeb45a42bdc2cf",
      "0xe17093967e43d37ad615a64cb86ae11826d6e58b",
      "0xa6f7645ed967faf708a614a2fca8d4790138586f",
      "0x2baac9330cf9ac479d819195794d79ad0c7616e3",
      "0x38b0e3a59183814957d83df2a97492aed1f003e2",
      "0x0ff80a1708191c0da8aa600fa487f7ac81d7818c",
      "0x2596825a84888e8f24b747df29e11b5dd03c81d7",
      "0x9559aaa82d9649c7a7b220e7c461d2e74c9a3593",
      "0xc5a1973e1f736e2ad991573f3649f4f4a44c3028",
      "0xcdb9d30a3ba48cdfcb0ecbe19317e6cf783672f1",
      "0xd9016a907dc0ecfa3ca425ab20b6b785b42f2373",
      "0x03042482d64577a7bdb282260e2ea4c8a89c064b",
    ];
    return ignoreList.includes(tokenAddr);
  }
}
