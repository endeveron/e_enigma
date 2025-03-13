import { BASE_HEADERS } from '@/constants';
import { getApiBaseUrl } from '@/functions/helpers';
import { AuthCredentials, UserAuthData } from '@/types/auth';
import { Result, Status } from '@/types/common';

const apiBaseUrl = getApiBaseUrl();

type SignInData = AuthCredentials & { publicKey?: string };

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
        error: { message: 'Server error.' },
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
        message: err?.response?.data?.msg || 'Something went wrong.',
      },
    };
  }
};

export const postSignIn = async ({
  email,
  password,
  publicKey,
}: SignInData): Promise<Result<UserAuthData> | undefined> => {
  try {
    const data: SignInData = {
      email,
      password,
    };
    if (publicKey) data.publicKey = publicKey;

    const response = await fetch(`${apiBaseUrl}/auth/signin`, {
      method: 'POST',
      headers: BASE_HEADERS,
      body: JSON.stringify(data),
    });
    const resData = await response.json();
    if (!resData) {
      return {
        data: null,
        error: { message: 'Server error.' },
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
        message: err?.response?.data?.msg || 'Something went wrong.',
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
        error: { message: 'Server error.' },
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
        message: err?.response?.data?.msg || 'Something went wrong.',
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
        error: { message: 'Server error.' },
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
        message: err?.response?.data?.msg || 'Something went wrong.',
      },
    };
  }
};
