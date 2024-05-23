// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "./NFT.sol";
import "./Openable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
//import "@openzeppelin/contracts/access/Ownable.sol";

contract BlindBox is ERC1155, Openable {
  uint256 constant NFT_PRICE = 100000000000000;
  uint256 constant NFT_TOTAL = 10000;
  uint8 constant NFT_TOKEN_ID = 12;
  uint256 consumedScor = 0;

  constructor(address VRFCoordinator_, uint256 VRFSubscriptionId_) 
    ERC1155("https://raw.githubusercontent.com/OnenessLabsTeam/test/main/box.json") 
    Openable(VRFCoordinator_, VRFSubscriptionId_) {

    }

  function mintNFT(uint256 _quantity) external payable {
    require(_quantity != 0, "Casting quantity must be more than 1");
    require(consumedScor < NFT_TOTAL, "The blind box issuance has been exhausted.");

    uint256 quantity = _quantity;

    if (quantity > NFT_TOTAL - consumedScor) {
      quantity = NFT_TOTAL - consumedScor;
    }

    require(msg.value >= NFT_PRICE * quantity, "Incorrect payment amount");

    consumedScor += quantity;

    _mint(msg.sender, NFT_TOKEN_ID, quantity, "");

    uint256 excessAmount = msg.value - NFT_PRICE * quantity;

    if (excessAmount > 0) {
      payable(msg.sender).transfer(excessAmount);
    }
  }

  receive() external payable {}

  function withdraw() external onlyOwner {
    uint256 balance = address(this).balance;
    payable(owner()).transfer(balance);
  }

  //
  function openBox(uint256 count) external {
    uint256 balance = balanceOf(msg.sender, NFT_TOKEN_ID);
    require(balance >= count, "Not enough NFTs in the box");

    address[] memory nftAddresses = _openBox(count);

    //burn 1155 token
    _burn(msg.sender, NFT_TOKEN_ID, count);

    //mint nft
    uint256 len = nftAddresses.length;
    for (uint256 i = 0; i < len;) {
        NFT(nftAddresses[i]).mint(msg.sender);

        unchecked {
            ++i;
        }
    }
  }
}