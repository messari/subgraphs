mod abi;
mod pb;
use hex;
use pb::uniswap_v2;
use substreams::{log, store};
use substreams_ethereum::{pb::eth::v1 as eth};

substreams_ethereum::init!();

fn is_pair_created_event(sig: &str) -> bool {
    /* keccak value for PoolCreated(address,address,uint24,int24,address) */
    return sig == "783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118";
}

#[substreams::handlers::map]
fn block_to_pairs(blk: eth::Block) -> Result<uniswap_v2::Pairs, substreams::errors::Error> {
    let mut pairs = uniswap_v2::Pairs { pairs: vec![] };

    for trx in blk.transaction_traces {
        // Uniswap v2 Factory
        if hex::encode(&trx.to) != "5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f" {
            continue;
        }

        for log in trx.receipt.unwrap().logs {
            let sig = hex::encode(&log.topics[0]);

            if !is_pair_created_event(sig.as_str()) {
                continue;
            }

            pairs.pairs.push(pb::uniswap_v2::Pair {
                name: "name".to_string(),
                address: "address".to_string(),
                token0: "token0".to_string(),
                token1: "token1".to_string(),
            })
        }
    }

    Ok(pairs)
}

#[substreams::handlers::store]
fn store_pairs(_pairs: uniswap_v2::Pairs, _s: store::StoreAddInt64) {
    log::info!("Store pairs");
}
