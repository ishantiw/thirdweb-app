export interface IWalletProvider {
    connect(options?: any): Promise<void>;
    disconnect(): Promise<void>;
    getAddress(): Promise<string | null>;
    isConnected(): boolean;
    // getAuthToken(): Promise<string | null>; // now mandatory
  }
  