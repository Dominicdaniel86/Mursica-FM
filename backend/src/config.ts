import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import * as fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const plainPort = process.env.PORT;
const plainDatabaseUrl = process.env.DATABASE_URL ?? '';
process.env.DATABASE_URL = plainDatabaseUrl.replace('localhost', 'database');

// Env variables
export const ENV_VARIABLES = {
    PORT: plainPort !== undefined ? parseInt(plainPort, 10) || 3000 : 3000,
    CLIENT_ID: process.env.CLIENT_ID ?? '',
    CLIENT_SECRET: process.env.CLIENT_SECRET ?? '',
    DATABASE_URL: process.env.DATABASE_URL ?? '',
    IS_PRODUCTION: process.env.ENVIRONMENT === 'production',
    EMAIL: process.env.EMAIL ?? '',
    EMAIL_SENDER_NAME: process.env.EMAIL_SENDER_NAME ?? '',
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ?? '',
    EMAIL_SERVICE: process.env.EMAIL_SERVICE ?? 'gmail',
    LOCAL_HOST: process.env.LOCAL_HOST ?? 'localhost',
    DOMAIN: process.env.DOMAIN ?? '',
};

// Prisma client for database interaction
export const prisma = new PrismaClient();

// Email transporter
export const transporter = nodemailer.createTransport({
    service: ENV_VARIABLES.EMAIL_SERVICE,
    auth: {
        user: ENV_VARIABLES.EMAIL,
        pass: ENV_VARIABLES.EMAIL_PASSWORD,
    },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Most common passwords
// TODO: Better initialization
const data = await fs.readFile(path.join(__dirname, '..', '/documents', '10k-most-common.txt'), 'utf-8');
export const commonPasswords = new Set(data.split('\n').map((pw) => pw.trim().toLowerCase()));
