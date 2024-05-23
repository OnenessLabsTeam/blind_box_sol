import dotenv from 'dotenv';
import { ethers } from "hardhat";
import { expect } from "chai";
import { Provider, Signer } from "ethers";

dotenv.config();

async function main() {
    //
    let provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");
    const wallet = new ethers.Wallet(process.env.PRIVATE_POLYGON!);
    const signer = wallet.connect(provider);

    //
    let nft1Address = "0x0299c96a87F0079868506cc5a64430AD06305bE8";
    let nft2Address = "0x96EF3A6EB3B51334fd34a23D02D37a473409d89A";
    let nft3Address = "0x1220b06984D58d9CEFf4f1e4b84b4100388AAB5b";
    const nft1 = await ethers.getContractAt("NFT", nft1Address, signer);
    const nft2 = await ethers.getContractAt("NFT", nft2Address, signer);
    const nft3 = await ethers.getContractAt("NFT", nft3Address, signer);

    let blindboxAddress = "0x41B80c694A12195f78D3D28873bDf29c921CCD9B";
    const blindbox = await ethers.getContractAt("BlindBox", blindboxAddress, signer);

    let tx1 = await nft1.setMinter(blindbox.getAddress());
    await tx1.wait();
    console.log("NFT1 minter set to BlindBox, hash: " + tx1.hash);

    let tx2 = await nft2.setMinter(blindbox.getAddress());
    await tx2.wait();
    console.log("NFT2 minter set to BlindBox, hash: " + tx2.hash);

    let tx3 = await nft3.setMinter(blindbox.getAddress());
    await tx3.wait();
    console.log("NFT3 minter set to BlindBox, hash: " + tx3.hash);

    //set NFTs and their weights
    let tx4 = await blindbox.setNFT([nft1.getAddress(), nft2.getAddress(), nft3.getAddress()], [100, 400, 9500], [100, 400, 9500]);
    await tx4.wait(); 
    console.log("BlindBox NFTs set, hash: " + tx4.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
