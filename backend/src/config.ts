import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import * as fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// replace 'localhost' in DATABASE_URL
process.env.DATABASE_URL = process.env.DATABASE_URL?.replace('localhost', 'database');

// Env variables
const plainPort = process.env.PORT;
export const PORT = plainPort !== undefined ? parseInt(plainPort, 10) || 3000 : 3000;
export const CLIENT_ID = process.env.CLIENT_ID ?? '';
export const CLIENT_SECRET = process.env.CLIENT_SECRET ?? '';
export const IS_PRODUCTION = process.env.ENVIRONMENT === 'production';

// Prisma client for database interaction
export const prisma = new PrismaClient();

// Email transporter
export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Most common passwords
// TODO: Better initialization
const data = await fs.readFile(path.join(__dirname, '..', '/documents', '10k-most-common.txt'), 'utf-8');
export const commonPasswords = new Set(data.split('\n').map((pw) => pw.trim().toLowerCase()));
