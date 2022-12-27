import {
  dataSource,
  BigInt,
  DataSourceContext,
  BigDecimal,
  Address,
} from "@graphprotocol/graph-ts";
import { Wrapper, WrapperMint, WrapperBurn } from "../../generated/schema";
import { WrapperTemplate } from "../../generated/templates";
import { getLatestRate, strToBytes, toDecimal } from "./lib/helpers";
import { getContractDeployment } from "../../protocols/addresses";
import { AddressResolver } from "../../generated/SystemSettings_0/AddressResolver";
import {
  Burned as BurnedEvent,
  Minted as MintedEvent,
} from "../../generated/templates/WrapperTemplate/Wrapper";
import {
  WrapperMaxTokenAmountUpdated as WrapperMaxTokenAmountUpdatedEvent,
  EtherWrapperMaxETHUpdated as EtherWrapperMaxETHUpdatedEvent,
} from "../../generated/SystemSettings_0/SystemSettings";
import { Wrapper as WrapperContract } from "../../generated/templates/WrapperTemplate/Wrapper";
import { WrapperCreated as WrapperCreatedEvent } from "../../generated/WrapperFactory_0/WrapperFactory";

export function handleWrapperCreated(event: WrapperCreatedEvent): void {
  let context = new DataSourceContext();
  context.setString("tokenAddress", event.params.token.toHexString());
  context.setString("currencyKey", event.params.currencyKey.toString());
  WrapperTemplate.createWithContext(event.params.wrapperAddress, context);
}

export function handleMinted(event: MintedEvent): void {
  // Create Mint
  let mintEntity = new WrapperMint(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  mintEntity.account = event.params.account.toHexString();
  mintEntity.principal = toDecimal(event.params.principal);
  mintEntity.fee = toDecimal(event.params.fee);
  mintEntity.amountIn = toDecimal(event.params.amountIn);
  mintEntity.timestamp = event.block.timestamp;
  mintEntity.wrapperAddress = event.address.toHexString();
  mintEntity.save();

  // Update Wrapper
  let wrapper = Wrapper.load(event.address.toHexString());
  if (!wrapper) {
    wrapper = new Wrapper(event.address.toHexString());
  }
  wrapper = initializeWrapper(wrapper, event.address);

  if (wrapper) {
    wrapper.amount = wrapper.amount.plus(toDecimal(event.params.amountIn));
    wrapper.totalFees = wrapper.totalFees.plus(toDecimal(event.params.fee));

    let txHash = event.transaction.hash.toString();
    let latestRate = getLatestRate(wrapper.currencyKey, txHash);
    if (latestRate) {
      wrapper.amountInUSD = wrapper.amount.times(latestRate);
      wrapper.totalFeesInUSD = wrapper.totalFees.times(latestRate);
    }

    wrapper.save();
  }
}

export function handleBurned(event: BurnedEvent): void {
  // Create Burn
  let burnEntity = new WrapperBurn(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  burnEntity.account = event.params.account.toHex();
  burnEntity.principal = toDecimal(event.params.principal);
  burnEntity.fee = toDecimal(event.params.fee);
  burnEntity.amountOut = toDecimal(event.params.amountIn);
  burnEntity.timestamp = event.block.timestamp;
  burnEntity.wrapperAddress = event.address.toHexString();
  burnEntity.save();

  // Update Wrapper
  let wrapper = Wrapper.load(event.address.toHexString());
  if (!wrapper) {
    wrapper = new Wrapper(event.address.toHexString());
  }
  wrapper = initializeWrapper(wrapper, event.address);

  if (wrapper) {
    wrapper.amount = wrapper.amount.minus(toDecimal(event.params.principal));
    wrapper.totalFees = wrapper.totalFees.plus(toDecimal(event.params.fee));

    let txHash = event.transaction.hash.toHexString();
    let latestRate = getLatestRate(wrapper.currencyKey, txHash);
    if (latestRate) {
      wrapper.amountInUSD = wrapper.amount.times(latestRate);
      wrapper.totalFeesInUSD = wrapper.totalFees.times(latestRate);
    }

    wrapper.save();
  }
}

export function handleWrapperMaxTokenAmountUpdated(
  event: WrapperMaxTokenAmountUpdatedEvent
): void {
  let wrapper = Wrapper.load(event.params.wrapper.toHexString());
  if (wrapper) {
    wrapper.maxAmount = toDecimal(event.params.maxTokenAmount);
    wrapper.save();
  }
}

export function handleEtherWrapperMaxETHUpdated(
  event: EtherWrapperMaxETHUpdatedEvent
): void {
  let addressResolverAddress = getContractDeployment(
    "AddressResolver",
    dataSource.network(),
    BigInt.fromI32(1000000000)
  )!;
  let resolver = AddressResolver.bind(addressResolverAddress);
  let etherWrapperAddress = resolver.try_getAddress(
    strToBytes("EtherWrapper", 32)
  );
  if (etherWrapperAddress.reverted) {
    return;
  }
  let wrapperAddress = etherWrapperAddress.value;

  let wrapper = Wrapper.load(wrapperAddress.toHexString());
  if (wrapper) {
    wrapper.maxAmount = toDecimal(event.params.maxETH);
    wrapper.save();
  }
}

function initializeWrapper(wrapper: Wrapper, address: Address): Wrapper {
  // See wrapper.js for more context on the pre-regenesis wrappers
  // We assume this hasn't been initialized if the maxAmount is 0
  if (
    wrapper.amount.toString() == "0" &&
    (address.toHexString() == "0xad32aa4bff8b61b4ae07e3ba437cf81100af0cd7" ||
      address.toHexString() == "0x6202a3b0be1d222971e93aab084c6e584c29db70" ||
      address.toHexString() == "0x8a91e92fdd86e734781c38db52a390e1b99fba7c")
  ) {
    let wrapperContract = WrapperContract.bind(address);
    wrapper.tokenAddress = wrapperContract.token().toHexString();
    wrapper.currencyKey = wrapperContract.currencyKey().toString();
    wrapper.amount = toDecimal(wrapperContract.targetSynthIssued());
    wrapper.maxAmount = toDecimal(wrapperContract.maxTokenAmount());
    wrapper.totalFees = BigDecimal.fromString("0"); // TBD
  }

  // If this still doesn't have a currencyKey, this is the ETH wrapper on mainnet
  if (!wrapper.currencyKey) {
    wrapper.currencyKey = "ETH";
  }

  // Assign values from context, for template generated Wrapper entities
  let context = dataSource.context();
  if (context.get("tokenAddress")) {
    let tokenAddress = context.getString("tokenAddress");
    let currencyKey = context.getString("currencyKey");
    if (tokenAddress && tokenAddress.length) {
      wrapper.tokenAddress = tokenAddress;
      wrapper.currencyKey = currencyKey;
    }
  }

  return wrapper;
}
