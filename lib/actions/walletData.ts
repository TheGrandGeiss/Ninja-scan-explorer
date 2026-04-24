'use server';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY!;
const GROQ_API_KEY = process.env.GROQ_API_KEY!;

type RiskProfile = 'Conservative' | 'Moderate' | 'Aggressive';

type WalletProfile = {
  wallet: string;
  healthScore: number;
  status: 'Healthy' | 'Warning' | 'Risky';
  stats: {
    solBalance: number;
    accountAgeDays: number;
    txCount: number;
    spamAssets: number;
    verifiedAssets: number;
    rentLamports: number;
    recentActivity: boolean;
  };
  detectedAssets: {
    mint: string;
    symbol: string;
    name: string;
    image?: string | null;
    verified: boolean;
    flagged: boolean;
  }[];
  last10: {
    signature: string;
    description: string;
    type: string;
    timestamp: number;
    token: {
      mint: string;
      symbol: string;
      name: string;
      image: string | null;
    } | null;
    counterparty: string;
  }[];
  aiSummary: {
    summary: string;
    riskProfile: RiskProfile;
    verdict: string;
  };
};

export async function getWalletProfiler(
  walletAddress: string,
): Promise<WalletProfile> {
  try {
    // -------------------------
    // BALANCE
    // -------------------------
    const balanceRes = await fetch(
      `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [walletAddress],
        }),
        cache: 'no-store',
      },
    );

    const balanceData = await balanceRes.json();
    const solBalance = (balanceData.result?.value || 0) / 1e9;

    // -------------------------
    // ASSETS (DAS)
    // -------------------------
    const assetsRes = await fetch(
      `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getAssetsByOwner',
          params: {
            ownerAddress: walletAddress,
            page: 1,
            limit: 100,
          },
        }),
        cache: 'no-store',
      },
    );

    const assetsData = await assetsRes.json();
    const items = assetsData.result?.items || [];

    const detectedAssets = items
      .map((asset: any) => {
        const tokenInfo = asset.token_info || {};
        const metadata = asset.content?.metadata || {};
        const symbol = tokenInfo.symbol || metadata.symbol || '';
        const name = metadata.name || tokenInfo.name || '';
        const image =
          asset.content?.links?.image || asset.content?.files?.[0]?.uri || null;

        const isFungible =
          asset.interface === 'FungibleToken' ||
          asset.interface === 'FungibleAsset' ||
          tokenInfo.decimals !== undefined;

        const verified =
          isFungible &&
          ((!!symbol && symbol !== 'UNKNOWN') ||
            !!name ||
            tokenInfo.decimals !== undefined);

        return {
          mint: asset.id,
          symbol: symbol || `${asset.id?.slice(0, 4) || 'UNK'}...`,
          name: name || (isFungible ? 'Token Asset' : 'NFT Asset'),
          image,
          verified,
          flagged: isFungible ? !verified : true,
          isFungible,
        };
      })
      .filter((asset: any) => asset.isFungible)
      .sort((a: any, b: any) => Number(b.isFungible) - Number(a.isFungible))
      .slice(0, 50)
      .map(({ isFungible, ...asset }: any) => asset);

    const verifiedAssets = detectedAssets.filter((a: any) => a.verified).length;
    const spamAssets = detectedAssets.filter((a: any) => a.flagged).length;

    const tokenMetaByMint = new Map<
      string,
      { symbol: string; name: string; image: string | null }
    >();

    detectedAssets.forEach((asset: any) => {
      tokenMetaByMint.set(asset.mint, {
        symbol: asset.symbol,
        name: asset.name,
        image: asset.image || null,
      });
    });

    // -------------------------
    // TRANSACTIONS
    // -------------------------
    const txRes = await fetch(
      `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=10`,
      { cache: 'no-store' },
    );

    const txData = await txRes.json();

    function getPrimaryToken(tx: any) {
      const swap = tx.events?.swap;
      const swapToken =
        swap?.tokenOutputs?.[0] ||
        swap?.tokenInputs?.[0] ||
        tx.tokenTransfers?.[0] ||
        null;

      if (!swapToken) return null;

      const mint =
        swapToken.mint ||
        swapToken.tokenAddress ||
        swapToken.address ||
        swapToken.tokenMint ||
        '';

      if (!mint) return null;

      const known = tokenMetaByMint.get(mint);
      const symbol =
        known?.symbol || swapToken.symbol || swapToken.tokenSymbol || 'UNKNOWN';
      const name =
        known?.name || swapToken.name || swapToken.tokenName || symbol;
      const image =
        known?.image || swapToken.image || swapToken.logoURI || null;

      return { mint, symbol, name, image };
    }

    function getMintCandidates(tx: any): string[] {
      const mints = new Set<string>();

      const swap = tx.events?.swap;
      const inMint =
        swap?.tokenInputs?.[0]?.mint ||
        swap?.tokenInputs?.[0]?.tokenAddress ||
        swap?.tokenInputs?.[0]?.address;
      const outMint =
        swap?.tokenOutputs?.[0]?.mint ||
        swap?.tokenOutputs?.[0]?.tokenAddress ||
        swap?.tokenOutputs?.[0]?.address;

      if (inMint) mints.add(inMint);
      if (outMint) mints.add(outMint);

      (tx.tokenTransfers || []).forEach((t: any) => {
        const mint = t.mint || t.tokenAddress || t.address;
        if (mint) mints.add(mint);
      });

      return Array.from(mints);
    }

    function getCounterparty(tx: any) {
      const transfer = tx.tokenTransfers?.find(
        (t: any) =>
          t.fromUserAccount === walletAddress ||
          t.toUserAccount === walletAddress,
      );

      if (transfer) {
        if (
          transfer.fromUserAccount &&
          transfer.fromUserAccount !== walletAddress
        ) {
          return transfer.fromUserAccount;
        }
        if (
          transfer.toUserAccount &&
          transfer.toUserAccount !== walletAddress
        ) {
          return transfer.toUserAccount;
        }
      }

      const nativeTransfer = tx.nativeTransfers?.find(
        (t: any) =>
          t.fromUserAccount === walletAddress ||
          t.toUserAccount === walletAddress,
      );

      if (nativeTransfer) {
        if (
          nativeTransfer.fromUserAccount &&
          nativeTransfer.fromUserAccount !== walletAddress
        ) {
          return nativeTransfer.fromUserAccount;
        }
        if (
          nativeTransfer.toUserAccount &&
          nativeTransfer.toUserAccount !== walletAddress
        ) {
          return nativeTransfer.toUserAccount;
        }
      }

      return tx.feePayer || walletAddress;
    }

    function formatTx(tx: any, token: { symbol: string } | null) {
      const type = tx.type || 'UNKNOWN';
      if (type === 'SWAP') return `Swapped ${token?.symbol || 'token'}`;
      if (type === 'TRANSFER') return `Transferred ${token?.symbol || 'asset'}`;
      if (type === 'NFT_SALE') return `NFT sale activity`;
      return tx.description || `${type} activity`;
    }

    const txMintCandidates = new Set<string>();
    (txData || []).forEach((tx: any) => {
      getMintCandidates(tx).forEach((mint) => txMintCandidates.add(mint));
    });

    const missingMints = Array.from(txMintCandidates).filter(
      (mint) => mint && !tokenMetaByMint.has(mint),
    );

    if (missingMints.length > 0) {
      const metaResponses = await Promise.all(
        missingMints.slice(0, 20).map(async (mint) => {
          try {
            const metaRes = await fetch(
              `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  id: 1,
                  method: 'getAsset',
                  params: { id: mint },
                }),
                cache: 'no-store',
              },
            );

            const metaJson = await metaRes.json();
            const asset = metaJson?.result;
            const symbol =
              asset?.token_info?.symbol ||
              asset?.content?.metadata?.symbol ||
              '';
            const name =
              asset?.content?.metadata?.name ||
              asset?.token_info?.name ||
              symbol ||
              '';
            const image =
              asset?.content?.links?.image ||
              asset?.content?.files?.[0]?.uri ||
              null;

            if (symbol || name || image) {
              tokenMetaByMint.set(mint, {
                symbol: symbol || `${mint.slice(0, 4)}...`,
                name: name || symbol || 'Token Asset',
                image,
              });
            }
          } catch {}
        }),
      );

      await Promise.all(metaResponses);
    }

    const last10 = (txData || []).map((tx: any) => {
      const token = getPrimaryToken(tx);

      return {
        signature: tx.signature,
        description: formatTx(tx, token),
        type: tx.type || 'UNKNOWN',
        timestamp: tx.timestamp || 0,
        token,
        counterparty: getCounterparty(tx),
      };
    });

    // -------------------------
    // TX COUNT + AGE
    // -------------------------
    const sigRes = await fetch(
      `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getSignaturesForAddress',
          params: [walletAddress, { limit: 1000 }],
        }),
        cache: 'no-store',
      },
    );

    const sigData = await sigRes.json();
    const sigs = sigData.result || [];

    const txCount = sigs.length;

    const blockTimes = sigs
      .map((s: any) => Number(s?.blockTime || 0))
      .filter((t: number) => Number.isFinite(t) && t > 0);

    const txTimes = (txData || [])
      .map((tx: any) => Number(tx?.timestamp || 0))
      .filter((t: number) => Number.isFinite(t) && t > 0);

    const firstTxTime =
      (blockTimes.length ? Math.min(...blockTimes) : 0) ||
      (txTimes.length ? Math.min(...txTimes) : 0) ||
      Date.now() / 1000;

    const accountAgeDays = Math.floor(
      (Date.now() / 1000 - firstTxTime) / 86400,
    );

    const recentActivity =
      last10.length > 0 &&
      Date.now() / 1000 - last10[0].timestamp < 60 * 60 * 24 * 30;

    // -------------------------
    // RENT ESTIMATE
    // -------------------------
    const rentLamports = detectedAssets.length * 2039280;

    // -------------------------
    // HEALTH SCORE
    // -------------------------
    let score = 50;

    if (solBalance > 1) score += 10;
    if (accountAgeDays > 30) score += 10;
    if (verifiedAssets > spamAssets) score += 10;
    if (recentActivity) score += 10;
    if (spamAssets > 20) score -= 15;
    if (solBalance < 0.01) score -= 10;

    score = Math.max(0, Math.min(100, score));

    let status: WalletProfile['status'] = 'Warning';
    if (score >= 75) status = 'Healthy';
    else if (score < 45) status = 'Risky';

    // -------------------------
    // GROQ AI
    // -------------------------
    const groqRes = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          temperature: 0.3,
          max_tokens: 300,
          messages: [
            {
              role: 'system',
              content: `
You are a sharp Solana wallet analyst.

Return ONLY JSON:
{
 "summary": "3 sentences max",
 "riskProfile": "Conservative | Moderate | Aggressive",
 "verdict": "Healthy | Warning | Risky"
}
              `,
            },
            {
              role: 'user',
              content: `
Wallet: ${walletAddress}
Balance: ${solBalance}
Age: ${accountAgeDays}
Txs: ${txCount}
Verified: ${verifiedAssets}
Spam: ${spamAssets}
Score: ${score}
Status: ${status}
              `,
            },
          ],
        }),
        cache: 'no-store',
      },
    );

    const groqData = await groqRes.json();
    const raw = groqData?.choices?.[0]?.message?.content || '';

    let aiSummary = {
      summary: 'No summary available',
      riskProfile: 'Moderate' as RiskProfile,
      verdict: status,
    };

    try {
      aiSummary = JSON.parse(raw);
    } catch {}

    // -------------------------
    // RETURN
    // -------------------------
    return {
      wallet: walletAddress,
      healthScore: score,
      status,
      stats: {
        solBalance,
        accountAgeDays,
        txCount,
        spamAssets,
        verifiedAssets,
        rentLamports,
        recentActivity,
      },
      detectedAssets,
      last10,
      aiSummary,
    };
  } catch (err) {
    console.error(err);
    throw new Error('Wallet profiling failed');
  }
}
