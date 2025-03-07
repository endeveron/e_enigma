import { NextFunction, Request, Response } from 'express';

import { HttpError } from '../helpers/error';
import { isReqValid } from '../helpers/http';
import logger from '../helpers/logger';
import UserModel from '../models/user';
import { UserItem } from '../types/user';

export const searchUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!isReqValid(req, next)) return;
  const query = req.query.query as string;
  const userId = req.query.userId as string;

  try {
    const users = await UserModel.find({ 'account.email': query }).select(
      'account.name account.imageUrl'
    );
    if (!users.length) {
      res.status(200).json({
        data: [],
      });
      return;
    }

    const userItems: UserItem[] = [];
    users.forEach((user: any) => {
      const id = user._id.toString();
      if (id !== userId) {
        userItems.push({
          id,
          name: user.account.name,
          imageUrl: user.account.imageUrl,
        });
      }
    });

    res.status(200).json({
      data: userItems,
    });
  } catch (err: any) {
    // console.error(err);
    logger.error('searchUser', err);
    return next(new HttpError('Unable to handle user search.', 500));
  }
};
