// Subgraph Schema: DEX AMM
// Version: 1.2.1
// See <https://github.com/messari/subgraphs/blob/master/docs/Schema.md> for details

#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Pairs {
    #[prost(message, repeated, tag="1")]
    pub pairs: ::prost::alloc::vec::Vec<Pair>,
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Pair {
    #[prost(string, tag="1")]
    pub name: ::prost::alloc::string::String,
    #[prost(string, tag="2")]
    pub address: ::prost::alloc::string::String,
    #[prost(string, tag="3")]
    pub token0: ::prost::alloc::string::String,
    #[prost(string, tag="4")]
    pub token1: ::prost::alloc::string::String,
}
