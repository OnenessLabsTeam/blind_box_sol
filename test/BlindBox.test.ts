import hre from "hardhat";
import { expect } from "chai";

describe("BlindBox", () => {
  const NFT_PRICE = BigInt("100000000000000"); // 0.0001 MATIC in wei
  const NFT_TOTAL = 10000;
  const NFT_TOKEN_ID = 12;

  async function deployOneYearLockFixture() {
    // Get the wallet signers, including the contract owner and another address addr1
    const [owner, addr1] = await hre.ethers.getSigners();
    // Get the contract factory to deploy the BlindBox contract
    const BlindBox = await hre.ethers.getContractFactory("BlindBox");
    // Deploy the contract and return the deployed contract instance, owner, and addr1
    const blindBox = await BlindBox.deploy('0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B', '1');
    await blindBox.waitForDeployment();

    // Get the contract factory to deploy the NFT contract
    const NFT = await hre.ethers.getContractFactory("NFT");
    const nft1 = await NFT.deploy('https://bafybeicn7i3soqdgr7dwnrwytgq4zxy7a5jpkizrvhm5mv6bgjd32wm3q4.ipfs.w3s.link/welcome-to-IPFS.jpg', 'TNT', 'TNT');

    // Connect NFT contract to blindBox
    await nft1.setMinter(blindBox.getAddress());
    // Set NFTs and their weights
    await blindBox.setNFT([nft1.getAddress()], [100], [100]);
    await nft1.waitForDeployment();

    return { blindBox, nft1, owner, addr1 };
  }

  // Check if the NFT minting event is emitted correctly
  it("Minting NFTs should work", async () => {
    // Deploy the contract
    const { blindBox, addr1 } = await deployOneYearLockFixture();

    // Get the NFT balance before minting
    const balanceNFTBefore = await blindBox.balanceOf(addr1.address, NFT_TOKEN_ID);

    // Define the quantity of NFTs to mint
    const quantity = 1;
    // Calculate the total amount to be paid
    const amount = NFT_PRICE * BigInt(quantity);

    // Get the account balance before minting
    const balanceBefore = await hre.ethers.provider.getBalance(addr1.address);

    let tx = undefined;

    // Call the contract's mintNFT method to mint NFTs and listen for the TransferSingle event
    await expect(
      tx = await blindBox.connect(addr1).mintNFT(quantity, {
        value: amount,
      })
    ).to.emit(blindBox, "TransferSingle").withArgs(
      addr1.address,
      hre.ethers.ZeroAddress,
      addr1.address,
      NFT_TOKEN_ID,
      quantity,
    );

    // Wait for the transaction to be mined and get the transaction receipt
    const txReceipt = await tx.wait();

    // Get the actual gas used and its cost
    const gasUsed = txReceipt!.gasUsed * txReceipt!.gasPrice;

    // Get the account balance after minting
    const balanceAfter = await hre.ethers.provider.getBalance(addr1.address);

    // The expected balance after minting should be the balance before minus the payment and gas cost
    const expectedBalance = balanceBefore - amount - gasUsed;

    // Assert that the balance after minting is equal to the expected balance
    expect(balanceAfter).to.equal(expectedBalance);

    // Verify the NFT balance after minting
    const balanceNFTAfter = await blindBox.balanceOf(addr1.address, NFT_TOKEN_ID);
    // The expected NFT balance after minting
    const expectedNFTBalance = balanceNFTBefore + BigInt(quantity);
    
    expect(balanceNFTAfter).to.equal(expectedNFTBalance);
  });

  // Verify that minting a quantity of 0 NFTs should fail
  it("A casting quantity of 0 NFT should fail", async () => {
    // Deploy the contract
    const { blindBox, addr1 } = await deployOneYearLockFixture();
    // Define the quantity of NFTs to mint (zero)
    const quantity = 0;

    const amount = NFT_PRICE * BigInt(quantity);

    await expect(
      blindBox.connect(addr1).mintNFT(quantity, {
        value: amount,
      })
    ).to.be.revertedWith("Casting quantity must be more than 1");
  });

  it("Minting with quantity larger than currently issued but still within the limit should adjust the quantity", async () => {
    // Deploy the contract
    const { blindBox, addr1 } = await deployOneYearLockFixture();

    // Get the NFT balance before minting
    const balanceNFTBefore = await blindBox.balanceOf(addr1.address, NFT_TOKEN_ID);
    // Get the account balance before minting
    const balanceBefore = await hre.ethers.provider.getBalance(addr1.address);
    // Set the quantity of NFTs to mint (exceeding the current limit)
    const quantity = NFT_TOTAL + 2;
    const amount = NFT_PRICE * BigInt(quantity);

    // Mint the NFTs
    const tx = await blindBox.connect(addr1).mintNFT(quantity, {
      value: amount,
    });

    const txReceipt = await tx.wait();

    // Get the actual gas used and its cost
    const gasUsed = txReceipt!.gasUsed * txReceipt!.gasPrice;

    // Verify the NFT balance after minting
    const balanceNFTAfter = await blindBox.balanceOf(addr1.address, NFT_TOKEN_ID);
    // The expected NFT balance after minting
    const expectedNFTBalance = balanceNFTBefore + BigInt(NFT_TOTAL);
    
    expect(balanceNFTAfter).to.equal(expectedNFTBalance);

    // Verify the account balance after minting
    const balanceAfter = await hre.ethers.provider.getBalance(addr1.address);
    // The expected account balance after minting
    const expectedBalance = balanceBefore - NFT_PRICE * BigInt(NFT_TOTAL) - gasUsed;

    expect(balanceAfter).to.equal(expectedBalance);
  });

  // Verify that minting more NFTs than allowed should fail
  it("Minting more NFTs than allowed should fail", async () => {
    // Deploy the contract
    const { blindBox, addr1 } = await deployOneYearLockFixture();
    const quantity = NFT_TOTAL;
    const amount = NFT_PRICE * BigInt(quantity);

    // Mint the NFTs for the first time
    await blindBox.connect(addr1).mintNFT(quantity, {
      value: amount,
    });

    // Assert that minting more NFTs than allowed should fail
    await expect(
      blindBox.connect(addr1).mintNFT(quantity, {
        value: amount,
      })
    ).to.be.revertedWith("The blind box issuance has been exhausted.");
  });

  // Verify that minting with insufficient payment should fail
  it("Minting with incorrect payment should fail", async () => {
    // Deploy the contract
    const { blindBox, addr1 } = await deployOneYearLockFixture();
    const quantity = 1;
    const amount = NFT_PRICE - BigInt(1); // Less than required

    await expect(
      blindBox.connect(addr1).mintNFT(quantity, {
        value: amount,
      })
    ).to.be.revertedWith("Incorrect payment amount");
  });

  // Verify that the should allow owner to set URI
  it('should allow owner to set URI', async function () {
    const newURI = 'https://example.com/newuri/{id}.json';

    const { blindBox, owner } = await deployOneYearLockFixture();

    // Call the setURI method and expect no exception to be thrown
    await expect(blindBox.connect(owner).setURI(newURI))
      .to.emit(blindBox, 'URI')
      .withArgs(newURI, NFT_TOKEN_ID);

    // Read the URI of NFT to verify that the update is successful
    const uri = await blindBox.uri(NFT_TOKEN_ID);
    expect(uri).to.equal(newURI);
  });

  // Verify that the should not allow non-owner to set URI
  it('should not allow non-owner to set URI', async function () {
    const { blindBox, addr1 } = await deployOneYearLockFixture();
    const newURI = 'https://example.com/nonowneruri/{id}.json';

    // If the non-contract owner tries to set URI, an exception should be thrown
    await expect(blindBox.connect(addr1).setURI(newURI)).to.be.reverted;
  });

  // Verify that the should receive ether and increase contract balance
  it('should receive ether and increase contract balance', async function () {
    const { blindBox, addr1 } = await deployOneYearLockFixture();

    // Get the initial balance of the contract
    const initialBalance = await hre.ethers.provider.getBalance(blindBox.target);
    
    // Send some Ethernet coins to the contract
    const amount = hre.ethers.parseEther('0.1'); // 发送0.1以太币
    await addr1.sendTransaction({
      to: blindBox.target,
      value: amount,
    });
    
    // Get the new balance of the contract
    const newBalance = await hre.ethers.provider.getBalance(blindBox.target);
    
    // Verify that the balance has increased
    expect(newBalance).to.be.gt(initialBalance);
  });

  // Verify that the owner should be able to withdraw funds
  it("Owner should be able to withdraw funds", async () => {
    // Deploy the contract
    const { blindBox, owner } = await deployOneYearLockFixture();
    // Get the initial balance of the owner
    const initialOwnerBalance = await hre.ethers.provider.getBalance(owner.address);
    // Transfer some funds to the contract
    const depositAmount = hre.ethers.parseEther("0.001");
    const sentTx = await owner.sendTransaction({
      to: blindBox.target,
      value: depositAmount,
    });

    // Wait for the transaction to be mined and get the transaction receipt
    const sentTxReceipt = await sentTx.wait();

    // Get the actual gas used and its cost
    const sentTxReceiptGas = sentTxReceipt!.gasUsed * sentTxReceipt!.gasPrice;

    // Get the contract balance before withdrawing
    const contractBalanceBefore = await hre.ethers.provider.getBalance(blindBox.target);

    // Assert that the contract balance is greater than zero
    expect(contractBalanceBefore).to.be.gt(BigInt(0));
    // Call the contract's withdraw method
    const tx = await blindBox.connect(owner).withdraw();

    // Wait for the transaction to be mined and get the transaction receipt
    const txReceipt = await tx.wait();

    // Get the actual gas used and its cost
    const gasUsed = txReceipt!.gasUsed * txReceipt!.gasPrice;

    // Get the balance of the withdrawn contract
    const contractBalanceAfter = await hre.ethers.provider.getBalance(blindBox.target);
    // Verify that the balance of the withdrawn contract is 0
    expect(contractBalanceAfter).to.equal(BigInt(0));

    // Get the balance of owner
    const finalOwnerBalance = await hre.ethers.provider.getBalance(owner.address);
    const expectedOwnerBalance = initialOwnerBalance - gasUsed - sentTxReceiptGas;
    // Verify that the balance of the owner is equal to the expected balance
    expect(finalOwnerBalance).to.equal(expectedOwnerBalance);
  });

  // Verify that the withdraw method cannot be called without owner
  it("Non-owner should not be able to withdraw funds", async () => {
    // Deploy the contract
    const { blindBox, addr1 } = await deployOneYearLockFixture();

    await expect(blindBox.connect(addr1).withdraw()).to.be.reverted;
  });

  it("The open blind box function should be effective", async () => {
    // Deploy the blind box contract and get the instance and address
    const { blindBox, nft1, addr1 } = await deployOneYearLockFixture();

    // Set the quantity of NFTs to mint
    const quantity = 1;
    // Calculate the total amount to be paid for the NFTs
    const amount = NFT_PRICE * BigInt(quantity);

    // Mint NFTs to the address of addr1
    const tx = await blindBox.connect(addr1).mintNFT(quantity, {
      value: amount,
    });

    // Wait for the transaction to be mined
    await tx.wait();

    // Set the isOpenActive flag to true, allowing the opening of blind boxes
    const setActiveTx = await blindBox.setIsOpenActive(true);

    // Wait for the setActiveTx transaction to be mined
    await setActiveTx.wait();

    // Open the blind box for the specified quantity
    const openBoxTx = await blindBox.connect(addr1).openBox(quantity);

    // Wait for the openBoxTx transaction to be mined
    await openBoxTx.wait();

    // Assuming the ERC721 contract address is known and stored as ERC721_CONTRACT_ADDRESS
    const erc721Contract = await hre.ethers.getContractAt("ERC721", nft1.target);
    
    // Check the balance of addr1 in the ERC721 contract
    const balanceOfAddr1 = await erc721Contract.balanceOf(addr1.address);
    
    // Verify that the balance of ERC721 tokens for addr1 is equal to the quantity opened
    expect(balanceOfAddr1).to.equal(quantity);

    // Check the balance of the ERC1155 token for addr1 to ensure it has been burnt
    const isBurnt = await blindBox.balanceOf(addr1.address, NFT_TOKEN_ID);
    
    // Verify that the ERC1155 token balance for addr1 is zero after opening the box
    expect(isBurnt).to.equal(0);
  });

  // Verify that the should fail when the number of blind boxes is insufficient
  it("should fail when the number of blind boxes is insufficient", async () => {
    // Deploy the blind box contract and get the instance and address
    const { blindBox, addr1 } = await deployOneYearLockFixture();

    // The number of open blind boxes
    const quantity = 1;

    // Set the isOpenActive flag to true, allowing the opening of blind boxes
    const setActiveTx = await blindBox.setIsOpenActive(true);

    // Wait for the setActiveTx transaction to be mined
    await setActiveTx.wait();

    // Verify the exception when the number of blind boxes is insufficient
    await expect(
      blindBox.connect(addr1).openBox(quantity)
    ).to.be.revertedWith("Not enough NFTs in the box");
  });
});