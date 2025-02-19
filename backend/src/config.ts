import { PrismaClient } from "@prisma/client";

// replace 'localhost' in DATABASE_URL
process.env.DATABASE_URL = process.env.DATABASE_URL?.replace('localhost', 'database');

// Env variables
export const PORT = process.env.PORT || 3000;
export const CLIENT_ID = process.env.CLIENT_ID || '';
export const CLIENT_SECRET = process.env.CLIENT_SECRET || '';
export const IS_PRODUCTION = process.env.ENVIRONMENT === 'production';

// Prisma client for database interaction
export const prisma = new PrismaClient();
