/*

    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {ERC1155} from "../../external/ERC1155/ERC1155.sol";
import {InitializableOwnable} from "../../lib/InitializableOwnable.sol";
import {Strings} from "../../external/utils/Strings.sol";

contract DropsERC1155 is ERC1155, InitializableOwnable {
    using Strings for uint256;

    mapping (address => bool) public _IS_ALLOWED_MINT_;
    string internal _baseUri = "";

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
        string memory uri
    ) public {
        initOwner(owner);
        _baseUri = uri;
    }

    function mint(address account, uint256 id, uint256 amount, bytes memory data) external {
        require(_IS_ALLOWED_MINT_[msg.sender], "Mint restricted");
        _mint(account, id, amount, data);
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        string memory baseURI = _baseUri;

        return bytes(baseURI).length > 0
            ? string(abi.encodePacked(baseURI, tokenId.toString()))
            : '';
    }
}