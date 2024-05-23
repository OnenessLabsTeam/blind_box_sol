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

    let blindboxAddress = "0x41B80c694A12195f78D3D28873bDf29c921CCD9B";
    const blindbox = await ethers.getContractAt("BlindBox", blindboxAddress, signer);

    let tx = await blindbox.setIsOpenActive(true);
    await tx.wait();
    console.log("Minted BlindBox: hash: " + tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
