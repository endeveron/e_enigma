import { BASE_HEADERS } from '@/src/constants';
import { getApiBaseUrl } from '@/src/functions/helpers';
import { AuthData } from '@/src/types/auth';
import { UserItem } from '@/src/types/chat';
import { Result } from '@/src/types/common';

const apiBaseUrl = getApiBaseUrl();

export const searchUser = async ({
  query,
  userId,
  token,
}: AuthData & { query: string }): Promise<Result<UserItem[]>> => {
  const searchParams = new URLSearchParams();
  searchParams.append('query', query);
  searchParams.append('userId', userId);
  const errMsg = 'Unable to get search results';
  try {
    const response = await fetch(`${apiBaseUrl}/user/search?${searchParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...BASE_HEADERS,
      },
    });
    if (!response.ok) {
      if (response.status === 401) {
        return { data: null, error: { message: 'Unauthorized' } };
      }
      return { data: null, error: { message: errMsg } };
    }
    const resData = await response.json();
    if (!resData?.data) {
      return {
        data: null,
        error: { message: resData?.error?.message ?? errMsg },
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
        message: err?.response?.data?.msg || errMsg,
      },
    };
  }
};
