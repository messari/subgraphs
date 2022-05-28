import { Factory } from "../../generated/schema";
import { BIG_INT_ZERO } from "../common/constants/index";
import { Address } from "@graphprotocol/graph-ts";
import { StableFactory } from "../../generated/AddressProvider/StableFactory";
import { CryptoFactory } from "../../generated/templates/CryptoRegistryTemplate/CryptoFactory";

export function getFactory(factoryAddress: Address, version: i32): Factory {
  let factory = Factory.load(factoryAddress.toHexString());
  if (!factory) {
    factory = new Factory(factoryAddress.toHexString());
    if (version == 1) {
      const factoryContract = StableFactory.bind(factoryAddress);
      const poolCountResult = factoryContract.try_pool_count();
      factory.poolCount = poolCountResult.reverted ? BIG_INT_ZERO : poolCountResult.value;
    } else if (version == 2) {
      const factoryContract = CryptoFactory.bind(factoryAddress);
      const poolCountResult = factoryContract.try_pool_count();
      factory.poolCount = poolCountResult.reverted ? BIG_INT_ZERO : poolCountResult.value;
    }
    factory.save();
  }
  return factory;
}
