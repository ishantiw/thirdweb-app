import React, { createContext, useContext, useState } from "react";
import { IWalletProvider } from "../types/wallet";

type WalletContextType = {
  wallet: IWalletProvider | null;
  setWallet: (wallet: IWalletProvider) => void;
};

const WalletContext = createContext<WalletContextType | null>(null);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<IWalletProvider | null>(null);
    
  return (
    <WalletContext.Provider value={{ wallet, setWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = () => useContext(WalletContext)!;