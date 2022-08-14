use anyhow::{Ok, Result};
use substreams_ethereum::Abigen;

fn main() -> Result<(), anyhow::Error> {
    Abigen::new("ERC20", "abi/erc20.json")?
        .generate()?
        .write_to_file("src/abi/erc20.rs")?;

    Abigen::new("Pair", "abi/pair.json")?
    .generate()?
    .write_to_file("src/abi/pair.rs")?;

    Ok(())
}
