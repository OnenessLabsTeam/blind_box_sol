import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import args from "./NFT3_args";

const NFTModule = buildModule("NFTModule", (m) => {
    const nft = m.contract("NFT", args);

    return { nft };
});

export default NFTModule;

//address: 0x1220b06984D58d9CEFf4f1e4b84b4100388AAB5b
//verify
//npx hardhat verify --network polygon --constructor-args ./ignition/modules/NFT3_args.ts  0x1220b06984D58d9CEFf4f1e4b84b4100388AAB5b