import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("NFT contract", () => {
    async function deployFixture() {
        const NFT = await ethers.getContractFactory("NFT");
        const nft = await NFT.deploy('https://bafybeicn7i3soqdgr7dwnrwytgq4zxy7a5jpkizrvhm5mv6bgjd32wm3q4.ipfs.w3s.link/welcome-to-IPFS.jpg', 'TNT', 'TNT');
        await nft.waitForDeployment();
        console.log("NFT contract deployed to:", nft.getAddress());

        const [owner, minter, addr1, addr2] = await ethers.getSigners();

        return {nft, owner, minter, addr1, addr2};
    }

    it("Should deploy NFT contract", async () => {
        const { nft } = await loadFixture(deployFixture);
        expect(nft.getAddress()).to.not.be.null;
    });

    it("Should set minter by owner", async () => {
        const { nft, owner, minter, addr1, addr2 } = await loadFixture(deployFixture);

        await expect(
            nft.connect(addr1).setMinter(minter)
        ).to.be.reverted;

        await expect(
            nft.connect(owner).setMinter(minter)
        ).to.be.not.reverted;
    });

    it("Should mint NFT by minter", async () => {
        const { nft, owner, minter, addr1, addr2 } = await loadFixture(deployFixture);

        await expect(
            nft.connect(owner).mint(addr2)
        ).to.be.revertedWith("Only minter can mint");

        nft.connect(owner).setMinter(minter);
        await expect(
            nft.connect(minter).mint(addr2)
        ).to.be.not.reverted;
    });

    it("Should burn NFT by owner", async () => {
        const { nft, owner, minter, addr1, addr2 } = await loadFixture(deployFixture);
        await nft.connect(owner).setMinter(minter);
        let tx = await nft.connect(minter).mint(addr2);
        let reciept = await tx.wait();

        let tokenId = reciept?.logs?.[0]?.topics[3];
        console.log("Token ID:", tokenId);

        expect(tokenId).to.be.not.undefined;
        expect(tokenId).to.be.not.null;

        await expect(
            nft.connect(owner).burn(tokenId != undefined ? BigInt(tokenId) : 0)
        ).to.be.revertedWith("Only owner can burn");

        expect(await nft.connect(addr2).balanceOf(addr2)).to.be.equal(1);
        await expect(
            nft.connect(addr2).burn(tokenId != undefined ? BigInt(tokenId) : 0)
        ).to.be.not.reverted;
        expect(await nft.connect(addr2).balanceOf(addr2)).to.be.equal(0);
    });

});