/*

    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;

import {ERC721URIStorage} from "../external/ERC721/ERC721URIStorage.sol";
import {InitializableOwnable} from "../lib/InitializableOwnable.sol";

contract DODONFT is ERC721URIStorage, InitializableOwnable {
    
    uint256 public _CUR_TOKENID_;

    // ============ Event =============
    event DODONFTMint(address creator, uint256 tokenId);
    event DODONFTBurn(uint256 tokenId);
    
    function init(
        address owner,
        string memory name,
        string memory symbol
    ) public {
        initOwner(owner);
        _name = name;
        _symbol = symbol;
    }

    function mint(string calldata uri) external {
        _safeMint(msg.sender, _CUR_TOKENID_);
        _setTokenURI(_CUR_TOKENID_, uri);
        emit DODONFTMint(msg.sender, _CUR_TOKENID_);
        _CUR_TOKENID_ = _CUR_TOKENID_ + 1;
    }

    function burn(uint256 tokenId) external onlyOwner {
        require(tokenId < _CUR_TOKENID_, "TOKENID_INVALID");
        _burn(tokenId);
        emit DODONFTBurn(tokenId);
    }
}