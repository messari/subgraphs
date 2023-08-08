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
import { BIGDECIMAL_ZERO } from "../utils/constants";
import { addMarketTokenBalance, getOrCreateMarket } from "../entities/market";
import {
  createBorrow,
  createDeposit,
  createRepay,
  createWithdraw,
} from "../entities/event";
import { getOrCreateToken } from "../entities/token";
import { addProtocolSideRevenue } from "../entities/protocol";

export function handleWrapperCreated(event: WrapperCreatedEvent): void {
  const context = new DataSourceContext();
  context.setString("tokenAddress", event.params.token.toHexString());
  context.setString("currencyKey", event.params.currencyKey.toString());
  WrapperTemplate.createWithContext(event.params.wrapperAddress, context);
}

export function handleMinted(event: MintedEvent): void {
  // Create Mint
  const mintEntity = new WrapperMint(
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
  const wrapper = getOrCreateWrapper(event.address.toHexString());

  wrapper.amount = wrapper.amount.plus(toDecimal(event.params.amountIn));
  wrapper.totalFees = wrapper.totalFees.plus(toDecimal(event.params.fee));

  const txHash = event.transaction.hash.toString();
  const latestRate = getLatestRate(wrapper.currencyKey, txHash);
  if (latestRate) {
    wrapper.amountInUSD = wrapper.amount.times(latestRate);
    wrapper.totalFeesInUSD = wrapper.totalFees.times(latestRate);
  }

  wrapper.save();

  const address = event.params.account;
  const token = getOrCreateToken(event.address.toHexString());
  const amount = event.params.amountIn;
  const amountUSD = toDecimal(amount).times(latestRate!);
  const market = getOrCreateMarket(token.id, event);
  const feeUSD = toDecimal(event.params.fee).times(latestRate!);

  createDeposit(event, market, token, amount, amountUSD, address);
  createBorrow(event, market, token, amount, amountUSD, address);
  addProtocolSideRevenue(event, market, feeUSD);
  addMarketTokenBalance(event, market, amount, latestRate!);
}

export function handleBurned(event: BurnedEvent): void {
  // Create Burn
  const burnEntity = new WrapperBurn(
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
  const wrapper = getOrCreateWrapper(event.address.toHexString());

  wrapper.amount = wrapper.amount.minus(toDecimal(event.params.principal));
  wrapper.totalFees = wrapper.totalFees.plus(toDecimal(event.params.fee));

  const txHash = event.transaction.hash.toString();
  const latestRate = getLatestRate(wrapper.currencyKey, txHash);
  if (latestRate) {
    wrapper.amountInUSD = wrapper.amount.times(latestRate);
    wrapper.totalFeesInUSD = wrapper.totalFees.times(latestRate);
  }

  wrapper.save();

  const address = event.params.account;
  const token = getOrCreateToken(event.address.toHexString());
  const amount = event.params.amountIn;
  const amountUSD = toDecimal(amount).times(latestRate!);
  const market = getOrCreateMarket(token.id, event);
  const feeUSD = toDecimal(event.params.fee).times(latestRate!);

  createWithdraw(event, market, token, amount, amountUSD, address);
  createRepay(event, market, token, amount, amountUSD, address, address);
  addProtocolSideRevenue(event, market, feeUSD);
  addMarketTokenBalance(
    event,
    market,
    amount.times(BigInt.fromString("-1")),
    latestRate!
  );
}

export function handleWrapperMaxTokenAmountUpdated(
  event: WrapperMaxTokenAmountUpdatedEvent
): void {
  const wrapper = Wrapper.load(event.params.wrapper.toHexString());
  if (wrapper) {
    wrapper.maxAmount = toDecimal(event.params.maxTokenAmount);
    wrapper.save();
  }
}

export function handleEtherWrapperMaxETHUpdated(
  event: EtherWrapperMaxETHUpdatedEvent
): void {
  const addressResolverAddress = getContractDeployment(
    "AddressResolver",
    dataSource.network()
  )!;
  const resolver = AddressResolver.bind(addressResolverAddress);
  const etherWrapperAddress = resolver.try_getAddress(
    strToBytes("EtherWrapper", 32)
  );
  if (etherWrapperAddress.reverted) {
    return;
  }
  const wrapperAddress = etherWrapperAddress.value;

  const wrapper = Wrapper.load(wrapperAddress.toHexString());
  if (wrapper) {
    wrapper.maxAmount = toDecimal(event.params.maxETH);
    wrapper.save();
  }
}

function getOrCreateWrapper(address: string): Wrapper {
  let wrapper = Wrapper.load(address);

  if (!wrapper) {
    wrapper = new Wrapper(address);
    wrapper.amount = BIGDECIMAL_ZERO;
    wrapper.amountInUSD = BIGDECIMAL_ZERO;
    wrapper.tokenAddress = "";
    wrapper.currencyKey = "ETH";
    wrapper.totalFees = BIGDECIMAL_ZERO;
    wrapper.maxAmount = BIGDECIMAL_ZERO;
    wrapper.totalFeesInUSD = BIGDECIMAL_ZERO;

    // Assign values from context, for template generated Wrapper entities
    const context = dataSource.context();
    if (context.get("tokenAddress")) {
      const tokenAddress = context.getString("tokenAddress");
      const currencyKey = context.getString("currencyKey");
      if (tokenAddress && tokenAddress.length) {
        wrapper.tokenAddress = tokenAddress;
        wrapper.currencyKey = currencyKey;
      }
    }

    if (
      address == "0xad32aa4bff8b61b4ae07e3ba437cf81100af0cd7" ||
      address == "0x6202a3b0be1d222971e93aab084c6e584c29db70" ||
      address == "0x8a91e92fdd86e734781c38db52a390e1b99fba7c"
    ) {
      const wrapperContract = WrapperContract.bind(Address.fromString(address));
      wrapper.tokenAddress = wrapperContract.token().toHexString();
      wrapper.currencyKey = wrapperContract.currencyKey().toString();
      wrapper.amount = toDecimal(wrapperContract.targetSynthIssued());
      wrapper.maxAmount = toDecimal(wrapperContract.maxTokenAmount());
      wrapper.totalFees = BigDecimal.fromString("0"); // TBD
    }
  }

  return wrapper;
}
