/*

    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {ERC721Enumerable} from "../../external/ERC721/ERC721Enumerable.sol";
import {InitializableOwnable} from "../../lib/InitializableOwnable.sol";

contract DropsERC721 is ERC721Enumerable, InitializableOwnable {
    mapping (address => bool) public _IS_ALLOWED_MINT_;

    // ============ Event =============
    event addMinter(address account);
    event removeMinter(address account);

    function addMintAccount(address account) public onlyOwner {
        _IS_ALLOWED_MINT_[account] = true;
        emit addMinter(account);
    }

    function removeMintAccount(address account) public onlyOwner {
        _IS_ALLOWED_MINT_[account] = false;
        emit removeMinter(account);
    }

    function init(
        address owner,
        string memory name,
        string memory symbol,
        string memory uri
    ) public {
        initOwner(owner);
        _name = name;
        _symbol = symbol;
        _baseUri = uri;
    }

    function mint(address to, uint256 tokenId) external {
        require(_IS_ALLOWED_MINT_[msg.sender], "restricted");
        _mint(to, tokenId);
    }
}