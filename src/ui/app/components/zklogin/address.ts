import { SIGNATURE_SCHEME_TO_FLAG } from '@mysten/sui.js/cryptography';
import { SUI_ADDRESS_LENGTH, normalizeSuiAddress } from '@mysten/sui.js/utils';
import { blake2b } from '@noble/hashes/blake2b';
import { bytesToHex } from '@noble/hashes/utils';
import { decodeJwt } from 'jose';

import { zkBcs } from './bcs';
import { genAddressSeed, toBufferBE } from './utils';

export function jwtToAddress(jwt: string, userSalt: bigint) {
    const decodedJWT = decodeJwt(jwt);
    if (!decodedJWT.sub || !decodedJWT.iss || !decodedJWT.aud) {
        throw new Error('Missing jwt data');
    }

    if (Array.isArray(decodedJWT.aud)) {
        throw new Error(
            'Not supported aud. Aud is an array, string was expected.'
        );
    }

    return computeZkAddress({
        userSalt,
        claimName: 'sub',
        claimValue: decodedJWT.sub,
        aud: decodedJWT.aud,
        iss: decodedJWT.iss,
    });
}

export interface ComputeZKAddressOptions {
    claimName: string;
    claimValue: string;
    userSalt: bigint;
    iss: string;
    aud: string;
}

export function computeZkAddress({
    claimName,
    claimValue,
    iss,
    aud,
    userSalt,
}: ComputeZKAddressOptions) {
    const addressSeedBytesBigEndian = toBufferBE(
        genAddressSeed(userSalt, claimName, claimValue, aud),
        32
    );
    const addressParamBytes = zkBcs.ser('AddressParams', { iss }).toBytes();

    const tmp = new Uint8Array(
        1 + addressSeedBytesBigEndian.length + addressParamBytes.length
    );
    tmp.set([SIGNATURE_SCHEME_TO_FLAG.Zk]);
    tmp.set(addressParamBytes, 1);
    tmp.set(addressSeedBytesBigEndian, 1 + addressParamBytes.length);

    return normalizeSuiAddress(
        bytesToHex(blake2b(tmp, { dkLen: 32 })).slice(0, SUI_ADDRESS_LENGTH * 2)
    );
}
