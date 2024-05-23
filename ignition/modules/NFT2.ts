import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const NFTModule = buildModule("NFTModule", (m) => {
    const nft = m.contract("NFT", ['https://storage.googleapis.com/nftimagebucket/poly/tokens/0x9e8ea82e76262e957d4cc24e04857a34b0d8f062/preview/38723.png', 'level 2', 'TL2']);

    return { nft };
});

export default NFTModule;
