// Type declarations for vietqr package
declare module 'vietqr' {
    interface VietQRConfig {
        bankId: string;
        accountNumber: string;
        accountName: string;
        amount: number;
        memo: string;
        template?: 'compact' | 'print' | 'qr_only';
    }

    function generate(config: VietQRConfig): string;

    export { generate, VietQRConfig };
    export default { generate };
}
