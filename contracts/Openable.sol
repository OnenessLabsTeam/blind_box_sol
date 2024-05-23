// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "./NFT.sol";
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

contract Openable is VRFConsumerBaseV2Plus {

    bool public isOpenActive = false;

    address private immutable _VRFCoordinator;
    uint256 private _VRFSubscriptionId;
    uint256 private _randomWord;


    address[] private _nftAddresses;

    uint256 private _totalWeight;
    uint256[] private _nftWeight;

    uint256 private _totalCount;
    uint256[] private _nftCount;

    // ============ Events ============
    event RandomWordsRequested(uint256 requestId);
    event RandomWordsFulfilled(uint256 requestId);


    // ============ Constructor ============
    constructor(address VRFCoordinator_, uint256 VRFSubscriptionId_) VRFConsumerBaseV2Plus(VRFCoordinator_) {
        _VRFCoordinator = VRFCoordinator_;
        _VRFSubscriptionId = VRFSubscriptionId_;

        // _nftAddresses.push(0x5FbDB2315678afecb367f032d93F642f64180aa3); //TNT1 5%
        // _nftAddresses.push(0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512); //TNT2 95%

        // _totalWeight = 10000;
        // _nftWeight = [500, 9500]; //5%, 95%

        // _totalCount = 100;
        // _nftCount = [5, 95];
    }


    // ============ Owner Functions ============
    function setNFT(address[] calldata nftAddresses, uint256[] calldata weights, uint256[] calldata counts) external onlyOwner {
        require(nftAddresses.length == weights.length, "Length of nftAddresses and weights should be equal");
        require(nftAddresses.length == counts.length, "Length of nftAddresses and weights should be equal");

        uint256 len = nftAddresses.length;
        uint256 totalWeight = 0;
        uint256 totalCount = 0;

        for (uint i = 0; i < len;) {
            _nftAddresses.push(nftAddresses[i]);
            _nftWeight.push(weights[i]);
            _nftCount.push(counts[i]);

            totalWeight += weights[i];
            totalCount += counts[i];

            unchecked {
                ++i;
            }
        }

        _totalWeight = totalWeight;
        _totalCount = totalCount;
    }

    function setIsOpenActive(bool _isOpenActive) external onlyOwner {
        isOpenActive = _isOpenActive;
    }    

    function setVRFSubscriptionId(uint256 VRFSubscriptionId_) external onlyOwner {
        _VRFSubscriptionId = VRFSubscriptionId_;
    }

    function requestRaffleRandomWords(
        bytes32 keyHash,
        uint16 requestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external onlyOwner {
       uint256 requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: _VRFSubscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: numWords,
                // Set nativePayment to true to pay for VRF requests with Sepolia ETH instead of LINK
                extraArgs: VRFV2PlusClient._argsToBytes(VRFV2PlusClient.ExtraArgsV1({nativePayment: true}))
            })
        );

        emit RandomWordsRequested(requestId);
    }

    // ============ Chainlink VRFConsumerBaseV2 Functions ============
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        _randomWord = randomWords[0];

        emit RandomWordsFulfilled(requestId);
    }    

    // ============ User Functions ============
    function _openBox(uint256 count) internal returns (address[] memory result) {
        require(isOpenActive, "Box is not open for raffle");

        uint256 totalCount = _totalCount;
        require(count <= totalCount, "Count exceeds total count");

        uint256 randomWord = _randomWord;
        result = new address[](count);

        while (count > 0) {

            uint256 randomWeight = uint256(keccak256(abi.encodePacked(randomWord))) % _totalWeight;
            uint256 i = 0;
            uint256 len = _nftAddresses.length;

            while (i < len) {
                if (randomWeight < _nftWeight[i]) {

                    //
                    break;
                }

                unchecked {
                    randomWeight -= _nftWeight[i];
                    ++i;
                }
            }

            uint256 nftCount = _nftCount[i];
            while (nftCount == 0) {
                // Skip NFTs with zero count

                // select the next
                unchecked {
                    ++i;
                }
                nftCount = _nftCount[i];
            }
            
            result[count - 1] = _nftAddresses[i];

            count--;
            unchecked {
                --nftCount;
                --totalCount;

                ++randomWord;
            }

            _nftCount[i] = nftCount;
        }

        _randomWord = randomWord;
        _totalCount = totalCount;
    }

}