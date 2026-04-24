'use server';

import { getBase58Decoder } from '@solana/codecs-strings';
import { isAddress } from '@solana/kit';

const TOKEN_PROGRAM_LEGACY = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const TOKEN_PROGRAM_2022 = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

/** Classic SPL mint account (fixed layout). */
const SPL_MINT_LEN = 82;
/** Classic SPL token account (fixed layout before TLV extensions). */
const SPL_TOKEN_ACCOUNT_LEN = 165;

function extractRawAddress(input: string): string | null {
  const trimmed = input.trim();
  if (isAddress(trimmed)) return trimmed;
  const match = trimmed.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
  if (match && isAddress(match[0])) return match[0];
  return null;
}

function bytesToAddress(bytes: Uint8Array): string {
  return getBase58Decoder().decode(bytes);
}

export async function resolveAddressSearch(
  input: string,
): Promise<{ ok: true; path: string } | { ok: false; reason: 'empty' | 'invalid' | 'config' }> {
  if (!input.trim()) return { ok: false, reason: 'empty' };
  const address = extractRawAddress(input);
  if (!address) return { ok: false, reason: 'invalid' };

  const heliusKey = process.env.HELIUS_API_KEY;
  if (!heliusKey) return { ok: false, reason: 'config' };

  try {
    const rpcRes = await fetch(
      `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getAccountInfo',
          params: [address, { encoding: 'base64' }],
        }),
        cache: 'no-store',
      },
    );

    const rpcJson = (await rpcRes.json()) as {
      result?: { value: null | { owner: string; data: [string, string] } };
    };
    const info = rpcJson.result?.value;

    if (!info) {
      const birdeyeKey = process.env.BIRDEYE_API_KEY;
      if (birdeyeKey) {
        try {
          const beRes = await fetch(
            `https://public-api.birdeye.so/defi/token_overview?address=${address}`,
            {
              headers: {
                'X-API-KEY': birdeyeKey,
                'x-chain': 'solana',
                accept: 'application/json',
              },
              cache: 'no-store',
            },
          );
          const beJson = (await beRes.json()) as {
            success?: boolean;
            data?: { symbol?: string };
          };
          if (
            beRes.ok &&
            beJson?.success &&
            beJson.data &&
            typeof beJson.data.symbol === 'string' &&
            beJson.data.symbol.length > 0
          ) {
            return { ok: true, path: `/token/${address}` };
          }
        } catch {
          /* fall through */
        }
      }
      return { ok: true, path: `/wallet/${address}` };
    }

    const { owner, data } = info;
    const b64 = data?.[0];
    const buf = b64 ? Buffer.from(b64, 'base64') : Buffer.alloc(0);
    const len = buf.length;

    const isSplMintSize = len === SPL_MINT_LEN;
    const isSplTokenAccount =
      len === SPL_TOKEN_ACCOUNT_LEN ||
      (len > SPL_TOKEN_ACCOUNT_LEN &&
        (owner === TOKEN_PROGRAM_LEGACY || owner === TOKEN_PROGRAM_2022));

    if (
      (owner === TOKEN_PROGRAM_LEGACY || owner === TOKEN_PROGRAM_2022) &&
      isSplMintSize
    ) {
      return { ok: true, path: `/token/${address}` };
    }

    if (
      (owner === TOKEN_PROGRAM_LEGACY || owner === TOKEN_PROGRAM_2022) &&
      isSplTokenAccount &&
      len >= 64
    ) {
      const ownerKey = new Uint8Array(buf.subarray(32, 64));
      const wallet = bytesToAddress(ownerKey);
      return { ok: true, path: `/wallet/${wallet}` };
    }

    if (owner === TOKEN_PROGRAM_LEGACY || owner === TOKEN_PROGRAM_2022) {
      return { ok: true, path: `/token/${address}` };
    }

    return { ok: true, path: `/wallet/${address}` };
  } catch {
    return { ok: true, path: `/wallet/${address}` };
  }
}
