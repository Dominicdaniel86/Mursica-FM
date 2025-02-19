import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import * as querystring from 'querystring';
import { SpotifyAuthTokenResponse } from '../../interfaces/index.js';
import logger from '../../logger/logger.js';
import { generateRandomString } from '../../utility/fileUtils.js';
import { clientID, clientSecret} from '../../config.js';

const prisma = new PrismaClient();

export function generateOAuthQuerystring(): string {
    const state = generateRandomString(16); // TODO: Use this state to prevent CSRF attacks
    const scope = 'user-modify-playback-state user-read-playback-state';
    const redirectURI = 'http://127.0.0.1:3000/callback';

    return querystring.stringify({
        response_type: 'code',
        client_id: clientID,
        scope: scope,
        redirect_uri: redirectURI,
        state: state
    });
}

export async function oAuthAuthorization(code: string): Promise<string[]> {
    const url = 'https://accounts.spotify.com/api/token';
    const data = {
        code: code,
        redirect_uri: 'http://127.0.0.1:3000/callback',
        grant_type: 'authorization_code'
    };
    const config = {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + (Buffer.from(clientID + ':' + clientSecret).toString('base64'))
        }
    };

    const response = await axios.post<SpotifyAuthTokenResponse>(url, data, config);

    const access_token = response.data.access_token;
    const expires_in = response.data.expires_in;
    const refresh_token = response.data.refresh_token;

    const validUntilDate: Date = new Date(Date.now() + (expires_in * 1000));

    const token = await prisma.oAuthToken.findFirst();

    if(token) {
        await prisma.oAuthToken.update({
            where: {id: token.id },
            data: { token: access_token, validUntil: validUntilDate, refreshToken: refresh_token}
        });
    } else {
        await prisma.oAuthToken.create({
            data: { token: access_token, validUntil: validUntilDate, refreshToken: refresh_token}
        });
    }

    return [access_token, String(expires_in), refresh_token];
}

export async function refreshAuthToken() {

    const token = await prisma.oAuthToken.findFirst();

    if(!token)
        return;

    const url = 'https://accounts.spotify.com/api/token';
    const data = new URLSearchParams({
       grant_type: 'refresh_token',
       refresh_token: token.refreshToken,
    });
    const config = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + (Buffer.from(clientID + ':' + clientSecret).toString('base64'))
        }
    };

    const response = await axios.post<SpotifyAuthTokenResponse>(url, data, config);
    console.log(response.data);
}
