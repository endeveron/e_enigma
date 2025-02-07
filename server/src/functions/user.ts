import logger from '../helpers/logger';
import UserModel from '../models/user';
import { Result } from '../types/common';

export const getUserOnlineStatus = async (
  userId: string
): Promise<Result<{ isOnline: boolean }>> => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        data: null,
        error: { message: `User not found` },
      };
    }
    return {
      data: { isOnline: !!user.isOnline },
      error: null,
    };
  } catch (err: any) {
    logger.r('getUserState');
    console.error(err);
    return {
      data: null,
      error: { message: `Unable to get user state` },
    };
  }
};

export const updateUserOnlineStatus = async (
  userId: string,
  isOnline: boolean
): Promise<Result<{ success: boolean }>> => {
  try {
    await UserModel.findByIdAndUpdate(userId, {
      isOnline,
    });
    return {
      data: { success: true },
      error: null,
    };
  } catch (err: any) {
    logger.r('updateUserState');
    console.error(err);
    return {
      data: null,
      error: { message: `Unable to update user state` },
    };
  }
};
