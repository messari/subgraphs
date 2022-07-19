mod abi;
mod pb;
use hex;
use pb::uniswap;
use substreams::{log, store, Hex, proto};
use substreams_ethereum::{pb::eth::v1 as eth};

#[substreams::handlers::map]
pub fn map_pairs(blk: eth::Block) -> Result<uniswap::Pairs, substreams::errors::Error> {
    let mut uniswap_pairs = uniswap::Pairs { pairs: vec![] };

    for trx in blk.transaction_traces {
        // if hex::encode(&trx.to) != "5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f" {
        // if hex::encode(&trx.to) != "5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f" {
        //     continue;
        // }
        // panic!("{:?}", address_pretty(&trx.to));

        // if address_pretty(&trx.to) != "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f" {
        if address_pretty(&trx.to) != "0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f" {
            continue;
        }

        for log in trx.receipt.unwrap().logs {
            let sig = hex::encode(&log.topics[0]);

            if !is_pair_created_event(sig.as_str()) {
                continue;
            }

            uniswap_pairs.pairs.push(uniswap::Pair {
                name: address_pretty(&log.data[12..32]),
                address: address_pretty(&log.data[12..32]),
                token0: address_pretty(&log.topics[1][12..]),
                token1: address_pretty(&log.topics[2][12..]),
            })
        }
    }

    Ok(uniswap_pairs)
}

#[substreams::handlers::store]
pub fn store_pairs(pairs: uniswap::Pairs, output: store::StoreSet) {
    for pair in pairs.pairs {
        output.set(
            1,
            format!("pair:{}", pair.address),
            &proto::encode(&pair).unwrap(),
        );
    }
}

pub fn is_pair_created_event(sig: &str) -> bool {
    /* keccak value for PairCreated(address,address,address,uint256) */
    return sig == "0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9";
}

pub fn address_pretty(input: &[u8]) -> String {
    format!("0x{}", hex::encode(input))
}
