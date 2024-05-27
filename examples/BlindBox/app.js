let provider = window.ethereum;

if (window.ethereum?.providers?.length) {
  provider = window.ethereum.providers.find(
        (item) => item.isMetaMask
    );
}

document.addEventListener("DOMContentLoaded", async () => {
  const web3Provider = new window.ethers.providers.Web3Provider(provider);
  const signer = web3Provider.getSigner();

  const contractAddress = "0x41B80c694A12195f78D3D28873bDf29c921CCD9B";

  const abi = [
      "function balanceOf(address account, uint256 id) view returns (uint256)",
      "function mintNFT(uint256 _quantity) external payable",
      "function withdraw() external",
      "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data) external"
  ];

  const contract = new window.ethers.Contract(contractAddress, abi, signer);

  const mintButton = document.getElementById("mintButton");
  mintButton.addEventListener("click", async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      } else {
        alert('Please install and connect MetaMask');
        return;
      }

      const _quantity = 20;
      const tx = await contract.mintNFT(_quantity, { value: ethers.utils.parseEther((0.0001 * _quantity).toString()) });
      
      await tx.wait();
      alert('NFT was successfully cast!');
    } catch (error) {
      console.error('Error minting NFT:', error);
      alert('Casting failed, please check if MetaMask is connected and confirm the transaction.');
    }
  });

  document.getElementById("countButton").addEventListener('click', async () => {
    let userAddress = document.getElementById("countAddress").value;

    if (!userAddress) {
      userAddress = await signer.getAddress();
    }

    
    console.log('User Address:', userAddress);

    const balance = await contract.balanceOf(userAddress, 12);

    console.log(balance.toString())

    alert(`The current account amount is ${balance.toString()}`)
  })

  document.getElementById("contractBalance").addEventListener('click', async () => {

    const balance = await contract.balance();

    alert(`The current contract balance is ${balance.toString()}`)
  })

  document.getElementById("withdraw").addEventListener('click', async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      } else {
        alert('Please install and connect MetaMask');
        return;
      }

      const tx = await contract.withdraw();
      
      await tx.wait();
      alert('The withdrawal was successful!');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to withdraw money!');
    }
  })

  document.getElementById("transferFromNFT").addEventListener('click', async () => {
    const toAddress = document.getElementById("transferAddress").value;
    const userAddress = await signer.getAddress();
    const tx = await contract.safeTransferFrom(
      userAddress,
      toAddress,
      "12",
      1,
      "0x"
    );
    console.log('Transaction hash:', tx.hash);

    const receipt = await tx.wait();
    console.log('Transaction was mined in block', receipt.blockNumber);
    alert('The transaction was successful!')
  });
});
