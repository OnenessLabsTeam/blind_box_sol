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

    //polygon mainnet vrf coordinator: 0xec0Ed46f36576541C75739E915ADbCb3DE24bD77
    //200 gwei Key Hash : 0x0ffbbd0c1c18c0263dd778dadd1d64240d7bc338d95fec1cf0473928ca7eaf9e
    let tx = await blindbox.requestRaffleRandomWords('0x0ffbbd0c1c18c0263dd778dadd1d64240d7bc338d95fec1cf0473928ca7eaf9e', 3, 40000, 1);
    await tx.wait();
    console.log("Minted BlindBox: hash: " + tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
