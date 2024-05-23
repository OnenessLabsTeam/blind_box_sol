import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const NFTModule = buildModule("NFTModule", (m) => {
    const nft = m.contract("NFT", ['https://gateway.pinata.cloud/ipfs/QmQDg6Ay9j8EAJ65H6jkTQdXZNLW9EGKkyyYxvp2ws19yu', 'level 3', 'TL3']);

    return { nft };
});

export default NFTModule;
