import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const NFTModule = buildModule("NFTModule", (m) => {
  const nft = m.contract("NFT", ['https://bafybeicn7i3soqdgr7dwnrwytgq4zxy7a5jpkizrvhm5mv6bgjd32wm3q4.ipfs.w3s.link/welcome-to-IPFS.jpg', 'level 1', 'TL1']);

  return { nft };
});

export default NFTModule;
