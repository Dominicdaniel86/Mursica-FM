import { PrismaClient } from "@prisma/client";

// replace 'localhost' in DATABASE_URL
process.env.DATABASE_URL = process.env.DATABASE_URL?.replace('localhost', 'database');

export const port = process.env.PORT || 3000;
export const clientID = process.env.CLIENT_ID || '';
export const clientSecret = process.env.CLIENT_SECRET || '';
export const isProduction = process.env.ENVIRONMENT === 'production';

export const prisma = new PrismaClient();
