import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, Contract } from "ethers";
import artifact from "./contract/LendingPlatform.json";
import { CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID, SEPOLIA_CHAIN_ID_HEX } from "./contract/config";

export default function useWallet() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState("");

  const hasMetaMask = typeof window !== "undefined" && !!window.ethereum;
  const wrongNetwork = chainId !== null && chainId !== SEPOLIA_CHAIN_ID;

  const setup = useCallback(async (accounts) => {
    // Wallet locked or disconnected
    if (!accounts || accounts.length === 0) {
      setAccount(null);
      setContract(null);
      return;
    }
    try {
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const currentChain = Number(network.chainId);
      setChainId(currentChain);
      setAccount(accounts[0]);

      if (currentChain === SEPOLIA_CHAIN_ID) {
        const signer = await provider.getSigner();
        setContract(new Contract(CONTRACT_ADDRESS, artifact.abi, signer));
      } else {
        setContract(null);
      }
    } catch (err) {
      setError("Could not set up the wallet connection.");
    }
  }, []);

  const connect = async () => {
    setError("");
    if (!window.ethereum) {
      setError("MetaMask is not installed.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      await setup(accounts);
    } catch (err) {
      setError(err?.code === 4001 ? "Connection request was rejected." : "Could not connect wallet.");
    }
  };

  const disconnect = async () => {
    // Asks MetaMask to revoke this site's access (supported in recent versions)
    try {
      await window.ethereum.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      });
    } catch (err) {
      // Older MetaMask versions don't support this; the local reset below still works
    }
    setAccount(null);
    setContract(null);
    setChainId(null);
    setError("");
  };

  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      });
    } catch (err) {
      setError("Please switch to the Sepolia network manually in MetaMask.");
    }
  };

  useEffect(() => {
    if (!window.ethereum) return;

    // Reconnect automatically if the site was already approved
    window.ethereum.request({ method: "eth_accounts" }).then(setup);

    const onAccountsChanged = (accounts) => setup(accounts);
    const onChainChanged = () => window.location.reload();

    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("chainChanged", onChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccountsChanged);
      window.ethereum.removeListener("chainChanged", onChainChanged);
    };
  }, [setup]);

  return { account, contract, wrongNetwork, hasMetaMask, error, connect, disconnect, switchToSepolia };
}