import { BigDecimal } from "@graphprotocol/graph-ts"

export type Network_StringMap = { [Network: string]: string }
export type Network_BigDecimalMap = { [Network: string]: BigDecimal }
export type Network_StringListMap = { [Network: string]: string[] }
export type Protocol_Network_StringMap = { [Protocol: string]: Network_StringMap }
export type Protocol_Network_BigDecimalMap = { [Protocol: string]: Network_BigDecimalMap }
export type Protocol_Network_StringListMap = { [Protocol: string]: Network_StringListMap }

export type Network_StringMaps = { [Network: string]: any }
