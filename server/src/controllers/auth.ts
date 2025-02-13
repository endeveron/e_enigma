import bcrypt from 'bcryptjs';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import {
  RESET_TOKEN_EXPIRES_IN_HOURS,
  RESET_TOKEN_LENGTH,
} from '../config/auth';
import { sendPasswordResetEmail } from '../functions/mail';
import { HttpError } from '../helpers/error';
import { isReqValid } from '../helpers/http';
import logger from '../helpers/logger';
import { generateAlphanumeric } from '../helpers/random';
import { configureUserData } from '../helpers/user';
import UserModel from '../models/user';
import { sendSystemMessage } from '../functions/chat';

const jwtKey = process.env.JWT_KEY;
if (!jwtKey) {
  throw new Error('Unable to get app env variables');
}

// Authorization token
const genetrateJWToken = (userId: string, next: NextFunction) => {
  const handleJWTException = () =>
    next(new HttpError(`Could not generate token.`, 500));

  try {
    if (!jwtKey) return handleJWTException();
    const token = jwt.sign({ userId }, jwtKey, { expiresIn: '48h' });
    return token;
  } catch (err: any) {
    logger.r('genetrateJWToken', err?._message || err);
    return handleJWTException();
  }
};

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!isReqValid(req, next)) return;
  const { name, email, password, publicKey } = req.body;

  try {
    // Check if email in use
    const emailInUse = await UserModel.exists({ 'account.email': email });

    if (emailInUse) {
      return next(new HttpError('Email in use', 409));
    }

    // Hashing the provided password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create a new user
    const user = new UserModel({
      account: {
        name,
        email,
        password: hashedPassword,
        role: {
          index: 1,
          name: 'user',
        },
      },
      publicKey,
    });

    await user.save();

    // Generate JWT
    const userId = user._id.toString();
    const token = genetrateJWToken(userId, next);

    // Successfully signed up
    res.status(201).json({
      data: {
        token,
        user: configureUserData(user),
      },
    });
  } catch (err) {
    logger.r('Signup', err);
    return next(new HttpError('Could not create account.', 500));
  }
};

export const signin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!isReqValid(req, next)) return;
  const { email, password, publicKey } = req.body;

  try {
    // Get user from the db
    const user = await UserModel.findOne({ 'account.email': email });
    if (!user) {
      return next(new HttpError('No account registered for this email', 404));
    }

    // Check provided password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.account.password
    );
    if (!isPasswordValid) {
      return next(new HttpError('Invalid password', 401));
    }

    // Generate JWT
    const userId = user._id.toString();
    const token = genetrateJWToken(userId, next);

    // If the public key provided, the keys have been regenerated
    if (publicKey) {
      user.publicKey = publicKey;
      await user.save();

      // The system message should be created and posted to the user's rooms
      const result = await sendSystemMessage(user._id.toString(), publicKey);
      if (result.error) {
        return next(new HttpError(result.error.message, 500));
      }
    }

    // Successfully signed in
    res.status(200).json({
      data: {
        token,
        user: configureUserData(user),
      },
    });
  } catch (err) {
    logger.r('Login', err);
    return next(new HttpError('Login failed. Please try again later', 500));
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!isReqValid(req, next)) return;
  const { email } = req.body;

  try {
    // Get user account data from the DB.
    const user = await UserModel.findOne({
      'account.email': email,
    });
    if (!user) {
      return next(new HttpError('User not found', 404));
    }

    // Generate the recovery token and expiration
    const resetToken = generateAlphanumeric(RESET_TOKEN_LENGTH);
    user.account.resetToken = resetToken;
    user.account.resetTokenExpires =
      Date.now() + RESET_TOKEN_EXPIRES_IN_HOURS * 3600000;
    await user.save();

    // Send reset resetToken (code) to email
    const sendLinkResult = await sendPasswordResetEmail({
      to: user.account.email,
      // to: 'softest.dn@gmail.com',
      resetToken,
    });

    // Success
    res.status(200).json({
      data: sendLinkResult,
    });
  } catch (err) {
    logger.r('forgotPassword', err);
    return next(new HttpError('Login failed. Please try again later', 500));
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!isReqValid(req, next)) return;
  const { resetToken, newPassword } = req.body;

  try {
    // Find the user in db and check the validity of the recovery token
    const user = await UserModel.findOne({
      'account.resetToken': resetToken,
      'account.resetTokenExpires': { $gt: Date.now() },
    });
    if (!user) {
      return next(new HttpError('Invalid/expired token', 400));
    }

    // Hashing provided password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear recovery fields
    user.account.password = hashedPassword;
    user.account.resetToken = undefined;
    user.account.resetTokenExpires = undefined;
    await user.save();

    // Success
    res.status(200).json({
      data: { success: true },
    });
  } catch (err) {
    logger.r('resetPassword', err);
    return next(
      new HttpError('Unable to reset password. Please try again later', 500)
    );
  }
};
