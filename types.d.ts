interface Transaction {
  id: string;
  from: string;
  tokenAddress: string;
  to: string;
  toName?: string;
  amount: number;
  uiAmount: string;
  valueUsd: number;
  symbol: string;
  icon: string;
}
