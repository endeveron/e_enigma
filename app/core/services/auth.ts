import { BASE_HEADERS } from '@/core/constants';
import { getApiBaseUrl } from '@/core/functions/helpers';
import { AuthCredentials, UserAuthData } from '@/core/types/auth';
import { Result, Status } from '@/core/types/common';

const apiBaseUrl = getApiBaseUrl();

export const postSignUp = async ({
  name,
  email,
  password,
  publicKey,
}: AuthCredentials & { publicKey: string }): Promise<
  Result<UserAuthData> | undefined
> => {
  try {
    const response = await fetch(`${apiBaseUrl}/auth/signup`, {
      method: 'POST',
      headers: BASE_HEADERS,
      body: JSON.stringify({
        name,
        email,
        password,
        publicKey,
      }),
    });
    const resData = await response.json();
    if (!resData) {
      return {
        data: null,
        error: { message: 'Server error. Please try again later.' },
      };
    }
    if (resData.error) {
      return {
        data: null,
        error: { message: resData.error.message },
      };
    }
    const { token, user } = resData.data;
    if (!token || !user) {
      return {
        data: null,
        error: {
          message:
            'Could not register. Failed to retrieve data from the server.',
        },
      };
    }
    return {
      data: { token, user },
      error: null,
    };
  } catch (err: any) {
    console.error(err);
    return {
      data: null,
      error: {
        message:
          err?.response?.data?.msg ||
          'Something went wrong. Please try again later.',
      },
    };
  }
};

export const postSignIn = async ({
  email,
  password,
}: AuthCredentials): Promise<Result<UserAuthData> | undefined> => {
  try {
    const response = await fetch(`${apiBaseUrl}/auth/signin`, {
      method: 'POST',
      headers: BASE_HEADERS,
      body: JSON.stringify({
        email,
        password,
      }),
    });
    const resData = await response.json();
    if (!resData) {
      return {
        data: null,
        error: { message: 'Server error. Please try again later.' },
      };
    }
    if (resData.error) {
      return {
        data: null,
        error: { message: resData.error.message },
      };
    }
    const { token, user } = resData.data;
    if (!token || !user) {
      return {
        data: null,
        error: {
          message: 'Could not log in. Failed to retrieve data from the server.',
        },
      };
    }
    return {
      data: { token, user },
      error: null,
    };
  } catch (err: any) {
    console.error(err);
    return {
      data: null,
      error: {
        message:
          err?.response?.data?.msg ||
          'Something went wrong. Please try again later.',
      },
    };
  }
};

export const postForgotPassword = async ({
  email,
}: {
  email: string;
}): Promise<Result<Status> | undefined> => {
  try {
    const response = await fetch(`${apiBaseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: BASE_HEADERS,
      body: JSON.stringify({
        email,
      }),
    });
    const resData = await response.json();
    if (!resData) {
      return {
        data: null,
        error: { message: 'Server error. Please try again later.' },
      };
    }
    if (resData.error) {
      return {
        data: null,
        error: { message: resData.error.message },
      };
    }
    return {
      data: resData.data,
      error: null,
    };
  } catch (err: any) {
    console.error(err);
    return {
      data: null,
      error: {
        message:
          err?.response?.data?.msg ||
          'Something went wrong. Please try again later.',
      },
    };
  }
};

export const postResetPassword = async ({
  resetToken,
  newPassword,
}: {
  resetToken: string;
  newPassword: string;
}): Promise<Result<UserAuthData> | undefined> => {
  try {
    const response = await fetch(`${apiBaseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: BASE_HEADERS,
      body: JSON.stringify({
        resetToken,
        newPassword,
      }),
    });
    const resData = await response.json();
    if (!resData) {
      return {
        data: null,
        error: { message: 'Server error. Please try again later.' },
      };
    }
    if (resData.error) {
      return {
        data: null,
        error: { message: resData.error.message },
      };
    }
    return {
      data: resData.data,
      error: null,
    };
  } catch (err: any) {
    console.error(err);
    return {
      data: null,
      error: {
        message:
          err?.response?.data?.msg ||
          'Something went wrong. Please try again later.',
      },
    };
  }
};
