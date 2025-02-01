import {
  openDatabaseAsync,
  SQLiteDatabase,
  SQLiteStatement,
} from 'expo-sqlite';

import { LOCAL_DB_NAME } from '@/core/constants';
import {
  convertTableRowToMessageItem,
  logMessage,
} from '@/core/functions/helpers';
import {
  InvitationType,
  InvitatoionMapItem,
  LocalDBMessage,
  LocalDBRoom,
  Message,
  MessageEventData,
  MessageItem,
  MessageMetadataItem,
  RoomItem,
  RoomMember,
  RoomMemberMapItem,
  UserItem,
} from '@/core/types/chat';

let dbInstance: SQLiteDatabase | null = null;

const localDbTables = [
  'log',
  'room',
  'room_member',
  'message',
  'invitation_sent',
  'invitation_recieved',
];

export const getDb = async (): Promise<SQLiteDatabase> => {
  if (!dbInstance) {
    dbInstance = await openDatabaseAsync(LOCAL_DB_NAME);
  }
  return dbInstance;
};

export const createLogTable = async (): Promise<boolean> => {
  try {
    const db = await getDb();
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      CREATE TABLE IF NOT EXISTS log (
        timestamp TIMESTAMP PRIMARY KEY,
        date VARCHAR(16) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(8) NOT NULL
      );
    `);
    logMessage(`[ LDB ] Created 'log' table`);
    return true;
  } catch (error: any) {
    logMessage(`[ LDB ] Unable to create 'log' table`);
    console.error(`createLogTable: ${error}`);
    return false;
  }
};

export const createRoomTable = async (): Promise<boolean> => {
  try {
    const db = await getDb();
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS room (
        id VARCHAR(24) PRIMARY KEY,
        memberId VARCHAR(24) NOT NULL,
        updatedAt INTEGER NOT NULL
      );
    `);
    logMessage(`[ LDB ] Created 'room' table`);
    return true;
  } catch (error: any) {
    logMessage(`[ LDB ] Unable to create 'room' table`, 'error');
    console.error(`createRoomTable: ${error}`);
    return false;
  }
};

export const createRoomMemberTable = async (): Promise<boolean> => {
  try {
    const db = await getDb();
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS room_member (
        id VARCHAR(24) PRIMARY KEY,
        name TEXT NOT NULL,
        publicKey TEXT NOT NULL,
        imageUrl TEXT
      );
    `);
    logMessage(`[ LDB ] Created 'room_member' table`);
    return true;
  } catch (error: any) {
    logMessage(`[ LDB ] Unable to create 'room_member' table`, 'error');
    console.error(`createRoomMemberTable: ${error}`);
    return false;
  }
};

export const createMessageTable = async (): Promise<boolean> => {
  try {
    const db = await getDb();
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS message (
        id VARCHAR(24) PRIMARY KEY,
        roomId VARCHAR(24) NOT NULL,
        senderId VARCHAR(24) NOT NULL,
        recipientId VARCHAR(24) NOT NULL,
        data TEXT NOT NULL,
        type VARCHAR(16) NOT NULL,
        day VARCHAR(16) NOT NULL,
        time VARCHAR(8) NOT NULL,
        createdAt INTEGER NOT NULL,
        recievedAt INTEGER,
        viewedAt INTEGER
      );
    `);
    logMessage(`[ LDB ] Created 'message' table`);
    return true;
  } catch (error: any) {
    logMessage(`[ LDB ] Unable to create 'message' table`, 'error');
    console.error(`createMessageTable: ${error}`);
    return false;
  }
};

export const createInvitationTable = async (
  type: InvitationType
): Promise<boolean> => {
  const tableName = `invitation_${type}`;
  try {
    const db = await getDb();
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id VARCHAR(24) PRIMARY KEY,
        name TEXT NOT NULL,
        imageUrl TEXT
      );
    `);
    logMessage(`[ LDB ] Created '${tableName}' table`);
    return true;
  } catch (error: any) {
    logMessage(`[ LDB ] Unable to create '${tableName}' table`, 'error');
    console.error(`createInvitationTable: ${error}`);
    return false;
  }
};

export const insertRoomItems = async (
  roomItems: RoomItem[]
): Promise<boolean> => {
  if (!roomItems.length) return false;

  let statement: SQLiteStatement | null = null;
  const tableName = 'room';

  // Convert type: RoomItem => LocalDBRoom
  const dbRooms: LocalDBRoom[] = roomItems.map(
    ({ newMsgCount, ...data }: RoomItem) => data
  );

  try {
    const db = await getDb();
    statement = await db.prepareAsync(`
      INSERT INTO ${tableName} (id, memberId, updatedAt) 
      SELECT $id, $memberId, $updatedAt
      WHERE NOT EXISTS (SELECT 1 FROM ${tableName} WHERE id = $id);
    `);
    for (let r of dbRooms) {
      await statement.executeAsync({
        $id: r.id,
        $memberId: r.memberId,
        $updatedAt: r.updatedAt,
      });
    }
    return true;
  } catch (error: any) {
    logMessage(
      `[ LDB ] Unable to insert data into the '${tableName}' table`,
      'error'
    );
    console.error(`insertRoomItems: ${error}`);
    return false;
  } finally {
    if (statement) await statement.finalizeAsync();
  }
};

export const insertRoomMember = async (
  roomMember: RoomMember
): Promise<boolean> => {
  const tableName = 'room_member';
  const imageUrl = roomMember.imageUrl ? `'${roomMember.imageUrl}'` : 'NULL';
  const query = `
    INSERT INTO ${tableName} (id, name, publicKey, imageUrl)
    SELECT
      '${roomMember.id}',
      '${roomMember.name}',
      '${roomMember.publicKey}',
      ${imageUrl}
    WHERE NOT EXISTS (
      SELECT 1 FROM ${tableName} WHERE id = '${roomMember.id}'
    );
  `;

  try {
    const db = await getDb();
    await db.execAsync(query);
    return true;
  } catch (error: any) {
    logMessage(
      `[ LDB ] Unable to insert data into the '${tableName}' table`,
      'error'
    );
    console.error(`insertRoomMember: ${error}`);
    return false;
  }
};

export const insertRoomMembers = async (
  roomMemberMap: Map<string, RoomMemberMapItem>
): Promise<boolean> => {
  if (!roomMemberMap.size) return false;
  let statement: SQLiteStatement | null = null;
  const tableName = 'room_member';

  try {
    const db = await getDb();
    statement = await db.prepareAsync(`
      INSERT INTO ${tableName} (id, name, publicKey, imageUrl) 
      SELECT $id, $name, $publicKey, $imageUrl
      WHERE NOT EXISTS (SELECT 1 FROM ${tableName} WHERE id = $id);
    `);
    for (let [key, data] of roomMemberMap) {
      await statement.executeAsync({
        $id: key,
        $name: data.name,
        $publicKey: data.publicKey,
        $imageUrl: data.imageUrl ?? '',
      });
    }
    return true;
  } catch (error: any) {
    logMessage(
      `[ LDB ] Unable to insert data into the '${tableName}' table`,
      'error'
    );
    console.error(`insertRoomMembers: ${error}`);
    return false;
  } finally {
    if (statement) await statement.finalizeAsync();
  }
};

export const insertMessageItems = async (
  messgageItems: MessageItem[]
): Promise<boolean> => {
  if (!messgageItems.length) return false;
  let statement: SQLiteStatement | null = null;
  const tableName = 'message';

  // Convert type: MessageItem => LocalDBMessage
  const dbMessgages: LocalDBMessage[] = messgageItems.map(
    (msgItem: MessageItem) => ({
      id: msgItem.id,
      roomId: msgItem.roomId,
      senderId: msgItem.senderId,
      recipientId: msgItem.recipientId,
      data: msgItem.data,
      type: msgItem.type,
      day: msgItem.date.day,
      time: msgItem.date.time,
      createdAt: msgItem.createdAt,
      recievedAt: msgItem.recievedAt ?? 0,
      viewedAt: msgItem.viewedAt ?? 0,
    })
  );

  try {
    const db = await getDb();
    statement = await db.prepareAsync(
      `INSERT INTO ${tableName} (
        id,
        roomId,
        senderId,
        recipientId,
        data,
        type,
        day,
        time,
        createdAt,
        recievedAt,
        viewedAt
      ) 
      SELECT 
        $id, $roomId, $senderId, $recipientId, $data, $type, $day, $time, $createdAt, $recievedAt, $viewedAt
      WHERE NOT EXISTS (
        SELECT 1 FROM ${tableName} WHERE id = $id
      );`
    );
    for (let m of dbMessgages) {
      await statement.executeAsync({
        $id: m.id,
        $roomId: m.roomId,
        $senderId: m.senderId,
        $recipientId: m.recipientId,
        $data: m.data,
        $type: m.type,
        $day: m.day,
        $time: m.time,
        $createdAt: m.createdAt,
        $recievedAt: m.recievedAt,
        $viewedAt: m.viewedAt,
      });
    }
    return true;
  } catch (error: any) {
    logMessage(
      `[ LDB ] Unable to insert data into the '${tableName}' table`,
      'error'
    );
    console.error(`insertMessageItems: ${error}`);
    return false;
  } finally {
    if (statement) await statement.finalizeAsync();
  }
};

export const insertMessages = async (
  messgages: LocalDBMessage[]
): Promise<boolean> => {
  if (!messgages.length) return false;
  let statement: SQLiteStatement | null = null;
  const tableName = 'message';

  try {
    const db = await getDb();
    statement = await db.prepareAsync(
      `INSERT INTO ${tableName} (
        id,
        roomId,
        senderId,
        recipientId,
        data,
        type,
        day,
        time,
        createdAt,
        recievedAt,
        viewedAt
      ) 
      SELECT 
        $id, $roomId, $senderId, $recipientId, $data, $type, $day, $time, $createdAt, $recievedAt, $viewedAt
      WHERE NOT EXISTS (
        SELECT 1 FROM ${tableName} WHERE createdAt = $createdAt
      );`
    );
    for (let m of messgages) {
      await statement.executeAsync({
        $id: m.id,
        $roomId: m.roomId,
        $senderId: m.senderId,
        $recipientId: m.recipientId,
        $data: m.data,
        $type: m.type,
        $day: m.day,
        $time: m.time,
        $createdAt: m.createdAt,
        $recievedAt: m.recievedAt,
        $viewedAt: m.viewedAt,
      });
    }
    return true;
  } catch (error: any) {
    logMessage(
      `[ LDB ] Unable to insert data into the '${tableName}' table`,
      'error'
    );
    console.error(`insertMessages: ${error}`);
    return false;
  } finally {
    if (statement) await statement.finalizeAsync();
  }
};

export const saveMessagesInLocalDb = async (
  messages: Message[],
  roomMemberMap: Map<string, RoomMemberMapItem>
): Promise<boolean> => {
  const errMsg = `[ LDB ] Unable to add data to the 'message' table.`;
  if (!messages.length || !roomMemberMap || !roomMemberMap.size) {
    return false;
  }
  // Convert message type: Message => LocalDBMessage
  const dbMessgages: LocalDBMessage[] = [];
  for (let m of messages) {
    // const sender = roomMemberMap.get(m.senderId);
    // if (!sender) {
    //   logMessage(`${errMsg} Sender is not in the room member map`, 'error');
    //   return false;
    // }
    dbMessgages.push({
      id: m.id,
      roomId: m.roomId,
      senderId: m.senderId,
      recipientId: m.recipientId,
      data: m.data,
      type: m.type,
      day: m.date.day,
      time: m.date.time,
      createdAt: m.createdAt,
      recievedAt: m.recievedAt ?? 0,
      viewedAt: m.viewedAt ?? 0,
    });
  }

  // Add messages to the 'message' table
  const msgSuccess = await insertMessages(dbMessgages);
  if (!msgSuccess) return false;
  return true;
};

export const insertInvitations = async (
  userItems: UserItem[],
  type: InvitationType,
  isClean?: boolean
): Promise<boolean> => {
  if (!userItems.length) return false;
  let statement: SQLiteStatement | null = null;
  const tableName = `invitation_${type}`;

  try {
    const db = await getDb();

    if (isClean) {
      const userIds = userItems.map((data) => `'${data.id}'`).join(', ');
      // Delete rows that are not in userIdArr
      await db.execAsync(`
        DELETE FROM ${tableName}
        WHERE id NOT IN (${userIds})
      `);
    }

    // Insert new rows if they don't already exist
    statement = await db.prepareAsync(`
      INSERT INTO ${tableName} (id, name, imageUrl) 
      SELECT $id, $name, $imageUrl
      WHERE NOT EXISTS (SELECT 1 FROM ${tableName} WHERE id = $id);
    `);
    for (let u of userItems) {
      await statement.executeAsync({
        $id: u.id,
        $name: u.name,
        $imageUrl: u.imageUrl ?? '',
      });
    }
    return true;
  } catch (error: any) {
    logMessage(
      `[ LDB ] Unable to insert data into the '${tableName}' table`,
      'error'
    );
    console.error(`insertInvitations: ${error}`);
    return false;
  } finally {
    if (statement) await statement.finalizeAsync();
  }
};

export const saveChatDataInLocalDb = async ({
  roomItems,
  roomMemberMap,
  messages,
  invitations,
}: {
  roomItems: RoomItem[];
  roomMemberMap: Map<string, RoomMemberMapItem>;
  messages: Message[];
  invitations: {
    sent: UserItem[];
    recieved: UserItem[];
  };
}): Promise<boolean> => {
  try {
    if (roomItems.length) {
      // Add rooms to the 'room' table
      const success = await insertRoomItems(roomItems);
      if (!success) return false;
    }

    if (roomMemberMap.size) {
      // Add room members to the 'room_member' table
      const success = await insertRoomMembers(roomMemberMap);
      if (!success) return false;
    }

    if (messages.length) {
      // Add messages to the 'message' table
      const success = await saveMessagesInLocalDb(messages, roomMemberMap);
      if (!success) return false;
    }

    if (invitations.sent.length) {
      // Add sent invitations to the 'invitation_sent' table
      const success = await insertInvitations(invitations.sent, 'sent');
      if (!success) return false;
    }

    if (invitations.recieved.length) {
      // Add recieved invitations to the 'invitation_recieved' table
      const success = await insertInvitations(invitations.sent, 'recieved');
      if (!success) return false;
    }

    return true;
  } catch (error: any) {
    logMessage(`[ LDB ] Unable to add chat data to local db`, 'error');
    console.error(`saveChatDataInLocalDb: ${error}`);
    return false;
  }
};

export const getTableData = async <T>(tableName: string) => {
  const errorMessage = `[ LDB ] Unable to get data from ${tableName}`;
  try {
    const db = await getDb();
    const result = await db.getAllAsync<T>(`SELECT * FROM ${tableName}`);
    if (!result) {
      logMessage(errorMessage, 'error');
      return null;
    }
    return result;
  } catch (error: any) {
    logMessage(errorMessage, 'error');
    console.error(`getTableData: ${error}`);
    return null;
  }
};

export const getRoomMemberId = async (
  roomId: string
): Promise<string | null> => {
  const tableName = 'room';
  const query = `
    SELECT * FROM ${tableName}
    WHERE id = '${roomId}';
  `;

  try {
    // Get data from db
    const db = await getDb();
    const row = await db.getFirstAsync<LocalDBRoom>(query);
    if (!row) return null;

    return row.memberId;
  } catch (error: any) {
    logMessage(`[ LDB ] Unable to get data from ${tableName} table`, 'error');
    console.error(`getRoomMemberId: ${error}`);
    return null;
  }
};

export const getRoomMemberMap = async (): Promise<
  Map<string, RoomMemberMapItem>
> => {
  const map = new Map<string, RoomMemberMapItem>();
  try {
    // Get data from local db
    const tableData = await getTableData<RoomMember>('room_member');
    if (!tableData || !tableData.length) return map;

    for (let d of tableData) {
      map.set(d.id, {
        name: d.name,
        publicKey: d.publicKey,
        imageUrl: d.imageUrl,
      });
    }
    return map;
  } catch (error: any) {
    logMessage(`[ LDB ] Unable to get data for room member map`, 'error');
    console.error(`getRoomMemberMap: ${error}`);
    return map;
  }
};

export const getRoomItems = async (): Promise<RoomItem[] | undefined> => {
  try {
    // Get data from db
    const tableData = await getTableData<LocalDBRoom>('room');
    if (!tableData) return;
    if (!tableData || !tableData.length) return;

    return tableData.map((d) => ({
      id: d.id,
      memberId: d.memberId,
      newMsgCount: 0,
      updatedAt: d.updatedAt,
    }));
  } catch (error: any) {
    logMessage(`[ LDB ] Unable to get rooms`, 'error');
    console.error(`getRoomMemberMap: ${error}`);
  }
};

export const getRoomMessages = async ({
  roomId,
}: {
  roomId: string;
}): Promise<MessageItem[] | null> => {
  const tableName = 'message';
  const query = `
    SELECT * FROM ${tableName}
    WHERE roomId = '${roomId}';
  `;

  try {
    const db = await getDb();
    const rows = await db.getAllAsync<LocalDBMessage>(query);
    if (!rows.length) return null;
    const messageItems: MessageItem[] = [];

    // Convert message type from LocalDBMessage to MessageItem
    for (let row of rows) {
      const messageItem = convertTableRowToMessageItem(row);
      messageItems.push(messageItem);
    }

    return messageItems;
  } catch (error: any) {
    logMessage(
      `[ LDB ] Unable to get data from the '${tableName}' table`,
      'error'
    );
    console.error(`getRoomMessages: ${error}`);
    return null;
  }
};

export const getRoomMessagesRequireMetadataUpdate = async ({
  roomId,
  userId,
}: {
  roomId: string;
  userId: string;
}): Promise<MessageItem[] | null> => {
  const tableName = 'message';
  const query = `
    SELECT * FROM ${tableName}
    WHERE roomId = '${roomId}' 
      AND senderId = '${userId}' 
      AND (createdAt = 'NULL' OR viewedAt = 'NULL');
  `;

  try {
    const db = await getDb();
    const rows = await db.getAllAsync<LocalDBMessage>(query);
    if (!rows.length) return null;
    const messageItems: MessageItem[] = [];

    // Convert message type from LocalDBMessage to MessageItem
    for (let row of rows) {
      const messageItem = convertTableRowToMessageItem(row);
      messageItems.push(messageItem);
    }

    return messageItems;
  } catch (error: any) {
    logMessage(
      `[ LDB ] Unable to get data from the '${tableName}' table`,
      'error'
    );
    console.error(`getRoomMessagesRequireMetadataUpdate: ${error}`);
    return null;
  }
};

export const updateMessageMetadataOnEvent = async (
  msgEvData: MessageEventData
): Promise<boolean> => {
  const tableName = 'message';
  const errMsg = `[ LDB ] Unable to update message metadata.`;
  const createdAt = msgEvData.createdAt;

  try {
    const db = await getDb();

    // Get message
    const row = await db.getFirstAsync<LocalDBMessage>(`
      SELECT * FROM ${tableName}
      WHERE createdAt = '${createdAt}';
    `);
    if (!row) {
      logMessage(`${errMsg} Message not found in local db`, 'error');
      return false;
    }

    // Update metadata

    if (msgEvData.recievedAt && !row.recievedAt) {
      await db.execAsync(`
        UPDATE message
        SET recievedAt = '${msgEvData.recievedAt}'
        WHERE createdAt = '${createdAt}';
      `);
    }

    if (msgEvData.viewedAt && !row.viewedAt) {
      await db.execAsync(`
        UPDATE message
        SET viewedAt = '${msgEvData.viewedAt}'
        WHERE createdAt = '${createdAt}';
      `);
    }

    return true;
  } catch (error: any) {
    logMessage(errMsg, 'error');
    console.error(`updateMessageMetadataOnEvent: ${error}`);
    return false;
  }
};

export const updateMessagesMetadata = async (
  messageMetadataItems: MessageMetadataItem[]
): Promise<boolean> => {
  const tableName = 'message';
  const errMsg = `[ LDB ] Unable to update messages metadata.`;

  try {
    const db = await getDb();
    for (let m of messageMetadataItems) {
      // Get message
      const row = await db.getFirstAsync<LocalDBMessage>(`
        SELECT * FROM ${tableName}
        WHERE createdAt = '${m.createdAt}';
      `);
      if (!row) {
        logMessage(
          `${errMsg} Message with 'createdAt':${m.createdAt} not found in local db`,
          'error'
        );
        continue;
      }

      // Update metadata
      if (m.recievedAt && m.viewedAt) {
        await db.execAsync(`
          UPDATE message
          SET 
            id = '${m.id}',
            recievedAt = '${m.recievedAt}',
            viewedAt = '${m.viewedAt}'
          WHERE createdAt = '${m.createdAt}';
        `);
      } else if (m.recievedAt) {
        await db.execAsync(`
          UPDATE message
          SET 
            id = '${m.id}',
            recievedAt = '${m.recievedAt}'
          WHERE createdAt = '${m.createdAt}';
        `);
      } else if (m.viewedAt) {
        await db.execAsync(`
          UPDATE message
          SET 
            id = '${m.id}',
            viewedAt = '${m.viewedAt}'
          WHERE createdAt = '${m.createdAt}';
        `);
      }
    }
    return true;
  } catch (error: any) {
    logMessage(errMsg, 'error');
    console.error(`updateMessagesMetadata: ${error}`);
    return false;
  }
};

export const getMessageItem = async ({
  messageId,
}: {
  messageId: string;
}): Promise<MessageItem | null> => {
  const tableName = 'message';
  const query = `
    SELECT * FROM ${tableName}
    WHERE id = '${messageId}';
  `;

  try {
    const db = await getDb();
    const row = await db.getFirstAsync<LocalDBMessage>(query);
    if (!row) return null;

    const messageItem = convertTableRowToMessageItem(row);
    return messageItem;
  } catch (error: any) {
    logMessage(
      `[ LDB ] Unable to get data from the '${tableName}' table`,
      'error'
    );
    console.error(`getMessageItem: ${error}`);
    return null;
  }
};

export const getMessagesById = async ({
  messageIdArr,
}: {
  messageIdArr: string[];
}): Promise<MessageItem[] | null> => {
  if (!messageIdArr.length) return null;
  const tableName = 'message';
  const messageItems: MessageItem[] = [];

  const placeholders = messageIdArr.map(() => '?').join(',');
  const query = `
    SELECT * FROM ${tableName}
    WHERE id IN (${placeholders});
  `;

  try {
    const db = await getDb();
    const rows = await db.getAllAsync<LocalDBMessage>(query, messageIdArr);
    if (!rows.length) return null;

    // Convert message type from LocalDBMessage to MessageItem
    for (let row of rows) {
      const messageItem = convertTableRowToMessageItem(row);
      messageItems.push(messageItem);
    }

    return messageItems;
  } catch (error: any) {
    logMessage(
      `[ LDB ] Unable to get data from the '${tableName}' table`,
      'error'
    );
    console.error(`getMessagesById: ${error}`);
    return null;
  }
};

export const getInvitations = async (
  type: InvitationType
): Promise<UserItem[]> => {
  const tableName = `invitation_${type}`;
  const query = `SELECT * FROM ${tableName};`;

  try {
    const db = await getDb();
    const rows = await db.getAllAsync<
      Omit<UserItem, 'imageUrl'> & { imageUrl: string }
    >(query);
    if (!rows.length) return [];

    const invitations: UserItem[] = rows.map((user) => ({
      id: user.id,
      name: user.name,
      imageUrl: user.imageUrl || undefined,
    }));

    return invitations;
  } catch (error: any) {
    logMessage(
      `[ LDB ] Unable to get data from the '${tableName}' table`,
      'error'
    );
    console.error(`getInvitations: ${error}`);
    return [];
  }
};

export const getInvitationMap = async (
  type: InvitationType
): Promise<Map<string, InvitatoionMapItem>> => {
  const tableName = `invitation_${type}`;
  const query = `SELECT * FROM ${tableName};`;
  const invitationMap = new Map<string, InvitatoionMapItem>();

  try {
    const db = await getDb();
    const rows = await db.getAllAsync<
      Omit<UserItem, 'imageUrl'> & { imageUrl: string }
    >(query);
    if (!rows.length) return invitationMap;

    for (let r of rows) {
      invitationMap.set(r.id, {
        name: r.name,
        imageUrl: r.imageUrl || undefined,
      });
    }

    return invitationMap;
  } catch (error: any) {
    logMessage(
      `[ LDB ] Unable to get data from the '${tableName}' table`,
      'error'
    );
    console.error(`getInvitationMap: ${error}`);
    return invitationMap;
  }
};

export const markMessagesAsViewed = async ({
  messageIdArr,
  userId,
  timestamp,
}: {
  messageIdArr: string[];
  userId: string;
  timestamp: number;
}): Promise<boolean> => {
  const errMsg = `[ LDB ] Unable to mark message as viewed.`;

  try {
    const db = await getDb();

    for (let messageId of messageIdArr) {
      // Get message item from local db
      const messageItem = await getMessageItem({
        messageId,
      });
      if (!messageItem) {
        logMessage(`${errMsg} Could not get message data from db`, 'error');
        return false;
      }

      // Update message metadata
      await db.execAsync(`
        UPDATE message
        SET viewedAt = '${timestamp}'
        WHERE id = '${messageId}';
      `);
    }

    return true;
  } catch (error: any) {
    logMessage(errMsg, 'error');
    console.error(`markMessagesAsViewed: ${error}`);
    return false;
  }
};

export const deleteAllTables = async (): Promise<boolean> => {
  const db = await getDb();
  for (let tableName of localDbTables) {
    try {
      await db.execAsync(`DROP TABLE IF EXISTS ${tableName}`);
      logMessage(`[ LDB ] Deleted '${tableName}' table`);
    } catch (err: any) {
      logMessage(`[ LDB ] Unable to delete '${tableName}' table`);
      console.error(err);
      return false;
    }
  }
  return true;
};

export const deleteMessage = async (id: string): Promise<boolean> => {
  try {
    const db = await getDb();
    await db.execAsync(`
      DELETE FROM message
      WHERE id = '${id}';
    `);
    return true;
  } catch (error: any) {
    logMessage(`[ LDB ] Unable to delete message`, 'error');
    console.error(`deleteMessage: ${error}`);
    return false;
  }
};

export const deleteInvitation = async (
  id: string, // roomCreatorId | invitedUserId
  type: InvitationType
): Promise<boolean> => {
  const tableName = `invitation_${type}`;
  try {
    const db = await getDb();
    await db.execAsync(`
      DELETE FROM ${tableName}
      WHERE id = '${id}';
    `);
    return true;
  } catch (error: any) {
    logMessage(`[ LDB ] Unable to delete invitation`, 'error');
    console.error(`deleteMessage: ${error}`);
    return false;
  }
};
