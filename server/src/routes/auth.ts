import { Router } from 'express';
import { body } from 'express-validator';

import {
  signup,
  signin,
  forgotPassword,
  resetPassword,
} from '../controllers/auth';
import { handleHttpError } from '../helpers/error';
import { RESET_TOKEN_LENGTH } from '../config/auth';

const router = Router();

const baseCredentials = [
  body('email').isEmail(),
  body('password').isLength({ min: 6, max: 30 }),
];

router.post('/signin', baseCredentials, signin);
router.post(
  '/signup',
  [
    body('name').isLength({ min: 2, max: 30 }),
    body('publicKey').notEmpty(),
    ...baseCredentials,
  ],
  signup
);

// Account recovery
router.post('/forgot-password', [body('email').isEmail()], forgotPassword);
router.post(
  '/reset-password',
  [
    body('resetToken').isLength({
      min: RESET_TOKEN_LENGTH,
      max: RESET_TOKEN_LENGTH,
    }),
    body('newPassword').isLength({ min: 6, max: 20 }),
  ],
  resetPassword
);

router.use(handleHttpError);

export default router;
