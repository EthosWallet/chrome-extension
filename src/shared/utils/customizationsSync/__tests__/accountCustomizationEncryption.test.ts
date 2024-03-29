import {
    decryptAccountCustomization,
    encryptAccountCustomization,
} from '../accountCustomizationEncryption';
import { type AccountInfo } from '_src/ui/app/KeypairVault';

describe('account customization encryption', () => {
    test('should encrypt and decrypt', async () => {
        const accountInfo: AccountInfo = {
            address: '0x123',
            publicKey: '0x456',
            index: 0,
            color: 'blue',
            emoji: '😱',
        };

        const privateKey = '0x789';

        const encrypted = await encryptAccountCustomization(
            accountInfo,
            privateKey
        );
        const decrypted = decryptAccountCustomization(encrypted, privateKey);

        expect(decrypted).toEqual(accountInfo);
    });
});
