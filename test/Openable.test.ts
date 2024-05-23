import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Openable contract", () => {
    const NFT_TOKEN_ID = 12;

    async function deployFixture() {
        const BlindBox = await ethers.getContractFactory("BlindBox");
        const blindbox = await BlindBox.deploy('0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B', '1');
        await blindbox.waitForDeployment();
        //console.log("NFT contract deployed to:", blindbox.getAddress());

        const NFT = await ethers.getContractFactory("NFT");
        const nft1 = await NFT.deploy('https://bafybeicn7i3soqdgr7dwnrwytgq4zxy7a5jpkizrvhm5mv6bgjd32wm3q4.ipfs.w3s.link/welcome-to-IPFS.jpg', 'TNT', 'TNT');
        await nft1.waitForDeployment();
        const nft2 = await NFT.deploy('https://bafybeicn7i3soqdgr7dwnrwytgq4zxy7a5jpkizrvhm5mv6bgjd32wm3q4.ipfs.w3s.link/welcome-to-IPFS.jpg', 'TNT', 'TNT');
        await nft2.waitForDeployment();

        //connect NFT contract to blindbox
        await nft1.setMinter(blindbox.getAddress());
        await nft2.setMinter(blindbox.getAddress());
        //set NFTs and their weights
        await blindbox.setNFT([nft1.getAddress(), nft2.getAddress()], [500, 9500], [500, 9500]);

        const [owner, addr1, addr2] = await ethers.getSigners();

        return {blindbox, nft1, nft2, owner, addr1, addr2};
    }

    it("Should deploy NFT contract", async () => {
        const { blindbox } = await loadFixture(deployFixture);
        expect(blindbox.getAddress()).to.not.be.null;
    });

    it("Should fail if sender doesn't have enough 1155 tokens", async () => {
        const { blindbox, owner, addr1, addr2 } = await loadFixture(deployFixture);

        await expect(
            blindbox.connect(addr1).openBox(1)
        ).to.be.revertedWith("Not enough NFTs in the box");
    });

    it("Should fail if isOpenActive is false", async () => {
        const { blindbox, owner, addr1, addr2 } = await loadFixture(deployFixture);

        await blindbox.connect(addr1).mintNFT(1, { value: ethers.parseEther("1")});
        await expect(
            blindbox.connect(addr1).openBox(1)
        ).to.be.revertedWith("Box is not open for raffle");
    });   


    it("Should set isOpenActive by owner", async () => {
        const { blindbox, owner, addr1, addr2 } = await loadFixture(deployFixture);

        await expect(
            blindbox.connect(owner).setIsOpenActive(true)
        ).to.be.not.reverted;    

        await expect(
            blindbox.connect(addr1).setIsOpenActive(true)
        ).to.be.revertedWith("Only callable by owner");
    });       
    
    it("Should open successfully if isOpenActive is true and sender has enough 1155 tokens", async () => {
        const { blindbox, nft1, nft2, owner, addr1, addr2 } = await loadFixture(deployFixture);

        await blindbox.connect(addr1).mintNFT(1, { value: ethers.parseEther("1")});
        //switch isOpenActive to true
        await blindbox.setIsOpenActive(true);

        await expect(
            blindbox.connect(addr1).openBox(1)
        ).to.be.not.reverted;    

        //check if NFTs are transferred to
        let balance1 = await nft1.balanceOf(addr1);
        let balance2 = await nft2.balanceOf(addr1);
        expect(balance1 + balance2).to.equal(1);
        //check if blindbox are burned
        let balance3 = await blindbox.balanceOf(addr1, NFT_TOKEN_ID);
        expect(balance3).to.equal(0);
    });   


    it("Should open the blind box with the correct probability", async () => {
        const { blindbox, nft1, nft2, owner, addr1, addr2 } = await loadFixture(deployFixture);

        await blindbox.connect(addr1).mintNFT(1000, { value: ethers.parseEther("50")});
        //switch isOpenActive to true
        await blindbox.setIsOpenActive(true);

        let tx = await blindbox.connect(addr1).openBox(500);
        const txReceipt = await tx.wait();
        const gasUsed = txReceipt!.gasUsed;
        console.log("Gas used:", gasUsed.toString());
    });

    it("Should open the blind box with the correct probability", async () => {
        const { blindbox, nft1, nft2, owner, addr1, addr2 } = await loadFixture(deployFixture);

        await blindbox.connect(addr1).mintNFT(1000, { value: ethers.parseEther("50")});
        //switch isOpenActive to true
        await blindbox.setIsOpenActive(true);
        
        for (let i=0; i<2; i++) {
            await expect(
                blindbox.connect(addr1).openBox(500)
            ).to.be.not.reverted;   
        }      

        //check if NFTs are transferred to
        let balance1 = await nft1.balanceOf(addr1);
        let balance2 = await nft2.balanceOf(addr1);
        console.log(balance1, balance2);
        expect(balance1).to.be.greaterThan(47).lessThan(53);
        expect(balance1 + balance2).to.be.equal(1000);

        //check if blindbox are burned
        let balance3 = await blindbox.balanceOf(addr1, NFT_TOKEN_ID);
        expect(balance3).to.equal(0);
    });

    it("Should open the blind box with the correct probability", async () => {
        const { blindbox, nft1, nft2, owner, addr1, addr2 } = await loadFixture(deployFixture);

        await blindbox.connect(addr1).mintNFT(10000, { value: ethers.parseEther("50")});
        //switch isOpenActive to true
        await blindbox.setIsOpenActive(true);
        
        for (let i=0; i<20; i++) {
            await expect(
                blindbox.connect(addr1).openBox(500)
            ).to.be.not.reverted;   
        }      

        //check if NFTs are transferred to
        let balance1 = await nft1.balanceOf(addr1);
        let balance2 = await nft2.balanceOf(addr1);
        console.log(balance1, balance2);
        expect(balance1).to.be.equal(500);
        expect(balance1 + balance2).to.be.equal(10000);

        //check if blindbox are burned
        let balance3 = await blindbox.balanceOf(addr1, NFT_TOKEN_ID);
        expect(balance3).to.equal(0);
    });   
});