import { Address } from "@graphprotocol/graph-ts";
import { Token, YieldAggregator } from "../../generated/schema"
import { ERC20 as ERC20Contract } from '../../generated/Controller/ERC20'
import { PROTOCOL_ID, Network, ProtocolType, DEFAULT_DECIMALS } from "./constants"

export function getOrCreateToken(address: Address): Token {
    let id = address.toHexString();
    let token = Token.load(id);
    if (!token) {
      token = new Token(id);
      let erc20Contract = ERC20Contract.bind(address);

      let decimals = erc20Contract.try_decimals();
      token.decimals = decimals.reverted ? DEFAULT_DECIMALS : decimals.value;

      let name = erc20Contract.try_name();
      token.name = name.reverted ? '' : name.value;

      let symbol = erc20Contract.try_symbol();
      token.symbol = symbol.reverted ? '' : symbol.value;

      token.save();
    }

    return token as Token;
}

export function createProtocol(): void {
    let protocol = YieldAggregator.load(PROTOCOL_ID)
    if (!protocol) {
        protocol = new YieldAggregator(PROTOCOL_ID)
        protocol.name = "Tokemak"
        protocol.slug = "tokemak"
        protocol.network = Network.ETHEREUM
        protocol.type = ProtocolType.YIELD
        protocol.vaults = []
        protocol.save()
    }
}