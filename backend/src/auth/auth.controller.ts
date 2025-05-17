import { prisma } from '../config.js';
import { InvalidParameterError } from '../errors/services.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { generateRandomString } from '../utility/fileUtils.js';

dotenv.config();

export async function register(userName: string, email: string, password: string): Promise<void> {
    if (userName === undefined || userName === '') {
        throw new InvalidParameterError('Username is required');
    }
    if (email === undefined || email === '') {
        throw new InvalidParameterError('Email is required');
    }
    if (password === undefined || password === '') {
        throw new InvalidParameterError('Password is required');
    }

    // Username requirements
    if (userName.length < 3) {
        throw new InvalidParameterError('Username must be at least 3 characters long');
    }

    // Email requirements
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(email);
    if (!isValidEmail) {
        throw new InvalidParameterError('Invalid email format');
    }

    // Password requirements
    if (password.length < 8) {
        throw new InvalidParameterError('Password must be at least 8 characters long');
    }
    if (!/[0-9]/.test(password)) {
        throw new InvalidParameterError('Password must contain at least 1 number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        throw new InvalidParameterError('Password must contain at least 1 special character');
    }
    // TODO: Check if the password is in the top 1000 passwords

    // Check if the username is already taken
    const existingUserEmail = await prisma.user.findUnique({
        where: {
            email,
        },
    });
    if (existingUserEmail) {
        throw new InvalidParameterError('Email is already in use');
    }

    const existingUserName = await prisma.user.findFirst({
        where: {
            name: userName,
        },
    });
    if (existingUserName) {
        throw new InvalidParameterError('Username is already in use');
    }

    // Get verification token
    const verificationToken = generateRandomString(32);

    // Has the password been hashed?
    const saltRounds = 10; // Higher number = more secure but slower
    bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
            throw new Error('Error hashing password');
        }
        // Save the user to the database
        await prisma.user.create({
            data: {
                name: userName,
                email,
                password: hash,
                verificationCode: verificationToken,
            },
        });
    });

    /* Example of how to verify a password
    const inputPassword = 'your_password_here';
    const storedHash = 'hash_from_database';

    bcrypt.compare(inputPassword, storedHash, function(err, result) {
    if (err) {
        console.error('Error verifying password:', err);
    } else if (result) {
        console.log('Password is correct!');
    } else {
        console.log('Password is incorrect.');
    }
    });
    */

    // Send a confirmation email
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    // Return success message
    const mailOptions = {
        from: `"Mursica.FM" <${process.env.EMAIL}>`,
        to: email,
        subject: 'Please confirm your email',
        text: `Please confirm your email by clicking on the following link: http://localhost:3000/confirm-email?token=%${verificationToken}`,
        // TODO: Implement validation URL API
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Error sending confirmation email');
    }

    // TODO: One time an hour it should check if the user has confirmed their email. If not, delete the user from the database.
}
