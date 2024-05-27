// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFT is ERC721, Ownable {
    string private _nftBaseURI;
    address private _minter;
    uint256 private _currentTokenId;

    constructor(
        string memory ntfBaseURI_,
        string memory name_,
        string memory symbol_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        _nftBaseURI = ntfBaseURI_;
    }

    function setBaseURI(string memory ntfBaseURI_) external onlyOwner {
        _nftBaseURI = ntfBaseURI_;
    }

    function setMinter(address minter_) external onlyOwner {
        _minter = minter_;
    }

    function mint(address to) external {
        require(msg.sender == _minter, "Only minter can mint");

        uint256 tokenId = _currentTokenId;
        tokenId++;
        _safeMint(to, tokenId);

        _currentTokenId = tokenId;
    }

    function burn(uint256 tokenId) external {
        require(msg.sender == _requireOwned(tokenId), "Only owner can burn");

        _burn(tokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        _requireOwned(tokenId);

        // string memory baseURI = _baseURI();
        // return bytes(baseURI).length > 0 ? string.concat(baseURI, tokenId.toString()) : "";
        return _nftBaseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _nftBaseURI;
    }
}
