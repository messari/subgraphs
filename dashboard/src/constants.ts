export namespace ProtocolType {
    export const EXCHANGE = "EXCHANGE"
    export const LENDING = "LENDING"
    export const YIELD = "YIELD"
    export const BRIDGE = "BRIDGE"
    export const GENERIC = "GENERIC"
}
export namespace Versions{
    export const Schema100 = "1.0.0"
    export const Schema110 = "1.1.0"
}

export interface Schema{
    entities: string[]
    entititesData: string[][]
    query: string
}