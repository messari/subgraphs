/*

    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;

import {ERC1155} from "../external/ERC1155/ERC1155.sol";
import {Strings} from "../external/utils/Strings.sol";
import {InitializableOwnable} from "../lib/InitializableOwnable.sol";

contract DODONFT1155 is ERC1155, InitializableOwnable {
    using Strings for uint256;

    uint256 public _CUR_TOKENID_;
    string internal _baseUri = "";
    mapping (uint256 => string) private _tokenURIs;

    // ============ Event =============
    event DODONFTMint(address creator, uint256 tokenId, uint256 amount);
    event DODONFTBurn(address account, uint256 tokenId, uint256 amount);
    

    function mint(string calldata uri, uint256 amount) external {
        _mint(msg.sender, _CUR_TOKENID_, amount, "");
        _setTokenURI(_CUR_TOKENID_, uri);
        emit DODONFTMint(msg.sender, _CUR_TOKENID_, amount);
        _CUR_TOKENID_ = _CUR_TOKENID_ + 1;
    }

    function burn(address account, uint256 tokenId, uint256 amount) external onlyOwner {
        require(tokenId < _CUR_TOKENID_, "TOKENID_INVALID");
        _burn(account, tokenId, amount);
        emit DODONFTBurn(account, tokenId, amount);
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseUri;

        if (bytes(base).length == 0) {
            return _tokenURI;
        }

        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }

        return super.uri(tokenId);
    }

    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        _tokenURIs[tokenId] = _tokenURI;
    }
}