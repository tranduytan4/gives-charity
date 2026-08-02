export interface BankInfo {
  id?: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo?: string;
}

export const COMMON_BANKS_BY_BIN: Record<
  string,
  { code: string; name: string; shortName: string }
> = {
  '970418': {
    code: 'BIDV',
    name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
    shortName: 'BIDV',
  },
  '970422': { code: 'MB', name: 'Ngân hàng TMCP Quân đội', shortName: 'MBBank' },
  '970423': { code: 'TPB', name: 'Ngân hàng TMCP Tiên Phong', shortName: 'TPBank' },
  '970415': { code: 'ICB', name: 'Ngân hàng TMCP Công thương Việt Nam', shortName: 'VietinBank' },
  '970436': { code: 'VCB', name: 'Ngân hàng TMCP Ngoại thương Việt Nam', shortName: 'Vietcombank' },
  '970407': { code: 'TCB', name: 'Ngân hàng TMCP Kỹ thương Việt Nam', shortName: 'Techcombank' },
  '970432': { code: 'VPB', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng', shortName: 'VPBank' },
  '970425': { code: 'ABB', name: 'Ngân hàng TMCP An Bình', shortName: 'ABBANK' },
  '970437': { code: 'STB', name: 'Ngân hàng TMCP Sài Gòn Thương Tín', shortName: 'Sacombank' },
  '970441': { code: 'VIB', name: 'Ngân hàng TMCP Quốc tế Việt Nam', shortName: 'VIB' },
  '970448': { code: 'OCB', name: 'Ngân hàng TMCP Phương Đông', shortName: 'OCB' },
  '970405': {
    code: 'VBA',
    name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam',
    shortName: 'Agribank',
  },
  '970416': { code: 'ACB', name: 'Ngân hàng TMCP Á Châu', shortName: 'ACB' },
  '970443': { code: 'SHB', name: 'Ngân hàng TMCP Sài Gòn - Hà Nội', shortName: 'SHB' },
  '970428': { code: 'NAB', name: 'Ngân hàng TMCP Nam Á', shortName: 'Nam A Bank' },
  '970454': { code: 'BVB', name: 'Ngân hàng TMCP Bản Việt', shortName: 'BVBank' },
  '970429': { code: 'SCB', name: 'Ngân hàng TMCP Sài Gòn', shortName: 'SCB' },
  '970431': { code: 'EIB', name: 'Ngân hàng TMCP Xuất Nhập Khẩu Việt Nam', shortName: 'Eximbank' },
  '970440': { code: 'SEAB', name: 'Ngân hàng TMCP Đông Nam Á', shortName: 'SeABank' },
  '970449': { code: 'LPB', name: 'Ngân hàng TMCP Lộc Phát Việt Nam', shortName: 'LPBank' },
  '963388': { code: 'TIMO', name: 'Ngân hàng số Timo', shortName: 'Timo' },
};

let cachedBanksPromise: Promise<BankInfo[]> | null = null;
let cachedBanks: BankInfo[] | null = null;

export async function fetchVietQRBanks(): Promise<BankInfo[]> {
  if (cachedBanks) return cachedBanks;
  if (!cachedBanksPromise) {
    cachedBanksPromise = fetch('https://api.vietqr.io/v2/banks')
      .then((res) => res.json())
      .then((res) => {
        if (res.code === '00' && Array.isArray(res.data)) {
          cachedBanks = res.data;
          return res.data;
        }
        return [];
      })
      .catch((err) => {
        console.error('Failed to load VietQR banks:', err);
        return [];
      });
  }
  return cachedBanksPromise;
}

export function getBankNameByBin(bin?: string, banksList?: BankInfo[]): string {
  if (!bin) return '';

  if (banksList && banksList.length > 0) {
    const found = banksList.find((b) => b.bin === bin);
    if (found) {
      return [found.code || found.shortName, found.name].filter(Boolean).join(' - ');
    }
  }

  const common = COMMON_BANKS_BY_BIN[bin];
  if (common) {
    return [common.code || common.shortName, common.name].filter(Boolean).join(' - ');
  }

  return bin;
}
