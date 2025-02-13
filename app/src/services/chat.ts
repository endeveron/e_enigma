import { BASE_HEADERS } from '@/src/constants';
import { getApiBaseUrl } from '@/src/functions/helpers';
import { AuthData } from '@/src/types/auth';
import {
  CreateMessageReqData,
  EncryptedMessage,
  InvitationData,
  MessageMetadataItem,
  RoomItem,
  RoomMember,
  UserItem,
} from '@/src/types/chat';
import { Result } from '@/src/types/common';

const apiBaseUrl = getApiBaseUrl();

export const reset = async (): Promise<Result<boolean>> => {
  const errMsg = 'Unable to reset data';
  try {
    const response = await fetch(`${apiBaseUrl}/chat/reset`, {
      headers: BASE_HEADERS,
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

export const getInitialData = async ({
  userId,
  token,
}: AuthData): Promise<
  Result<{
    roomItems: RoomItem[];
    roomMembers: RoomMember[];
    messages: EncryptedMessage[];
    invitations: {
      sent: UserItem[];
      recieved: UserItem[];
    };
  }>
> => {
  const searchParams = new URLSearchParams({ userId }).toString();
  const errMsg = 'Unable to get chat data';
  try {
    const response = await fetch(`${apiBaseUrl}/chat/data?${searchParams}`, {
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

export const inviteUserToChat = async ({
  roomCreatorId,
  invitedUserId,
  token,
}: InvitationData & {
  token: string;
}): Promise<Result<UserItem[]>> => {
  const searchParams = new URLSearchParams();
  searchParams.append('roomCreatorId', roomCreatorId);
  searchParams.append('invitedUserId', invitedUserId);
  const errMsg = 'Unable to get invitation results';
  try {
    const response = await fetch(`${apiBaseUrl}/chat/invite?${searchParams}`, {
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

export const getRooms = async ({
  userId,
  token,
}: AuthData): Promise<
  Result<{
    roomItems: RoomItem[];
    roomMembers: RoomMember[];
  }>
> => {
  const searchParams = new URLSearchParams({ userId }).toString();
  const errMsg = 'Unable to get rooms';
  try {
    const response = await fetch(`${apiBaseUrl}/chat/rooms?${searchParams}`, {
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

export const getInvitations = async ({
  userId,
  token,
}: AuthData): Promise<Result<UserItem[]>> => {
  const searchParams = new URLSearchParams({ userId }).toString();
  const errMsg = 'Unable to get user invitations';
  try {
    const response = await fetch(
      `${apiBaseUrl}/chat/invitations?${searchParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...BASE_HEADERS,
        },
      }
    );
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

export const deleteInvitation = async ({
  roomCreatorId,
  invitedUserId,
  token,
}: InvitationData & {
  token: string;
}): Promise<Result<boolean>> => {
  const searchParams = new URLSearchParams();
  searchParams.append('roomCreatorId', roomCreatorId);
  searchParams.append('invitedUserId', invitedUserId);
  const errMsg = 'Unable to delete invitation';
  try {
    const response = await fetch(
      `${apiBaseUrl}/chat/invitation?${searchParams}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          ...BASE_HEADERS,
        },
      }
    );
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

export const postRoom = async ({
  roomCreatorId,
  invitedUserId,
  token,
}: InvitationData & {
  token: string;
}): Promise<
  Result<{
    roomId: string;
    updatedAt: number;
    roomCreatorPublicKey: string;
  }>
> => {
  const errMsg = 'Unable to send message';
  try {
    const response = await fetch(`${apiBaseUrl}/chat/room`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        ...BASE_HEADERS,
      },
      body: JSON.stringify({
        roomCreatorId,
        invitedUserId,
      }),
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

export const getNewMessages = async ({
  userId,
  token,
  timestamp,
}: AuthData & { timestamp?: number }): Promise<Result<EncryptedMessage[]>> => {
  const searchParams = new URLSearchParams();
  searchParams.append('userId', userId);
  if (timestamp) {
    searchParams.append('timestamp', timestamp.toString());
  }
  const params = searchParams.toString();
  const errMsg = 'Unable to get new messages';
  try {
    const response = await fetch(`${apiBaseUrl}/chat/new-messages?${params}`, {
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

export const postUpdateMessagesMetadata = async ({
  roomId,
  createdAtArr,
  userId,
  token,
}: { roomId: string; createdAtArr: number[] } & AuthData): Promise<
  Result<MessageMetadataItem[]>
> => {
  const errMsg = 'Unable to update messages metadata';
  try {
    // Send request to server to update metadata
    // POST: /chat/message-metadata
    const response = await fetch(`${apiBaseUrl}/chat/message-metadata`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        ...BASE_HEADERS,
      },
      body: JSON.stringify({
        userId,
        roomId,
        createdAtArr,
      }),
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

export const sendMessage = async ({
  data,
  token,
}: {
  data: CreateMessageReqData;
  token: string;
}): Promise<Result<string>> => {
  const errMsg = 'Unable to send message';
  try {
    const response = await fetch(`${apiBaseUrl}/chat/message`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        ...BASE_HEADERS,
      },
      body: JSON.stringify(data),
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

export const deleteMessage = async ({
  roomId,
  token,
}: {
  roomId: string;
  token: string;
}): Promise<Result<boolean>> => {
  const searchParams = new URLSearchParams({ roomId }).toString();
  const errMsg = 'Unable to delete message';
  try {
    const response = await fetch(`${apiBaseUrl}/chat/message?${searchParams}`, {
      method: 'DELETE',
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
