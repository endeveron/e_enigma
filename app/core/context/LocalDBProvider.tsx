import * as SQLite from 'expo-sqlite';
import { PropsWithChildren, useEffect } from 'react';

import { LOCAL_DB_NAME } from '@/core/constants';
import { KEY_DB_TABLES_CREATED } from '@/core/constants/store';
import {
  createInvitationTable,
  createLogTable,
  createMessageTable,
  createRoomMemberTable,
  createRoomTable,
} from '@/core/functions/db';
import { checkStorageItem, setStorageItem } from '@/core/functions/store';

const DBManager = ({ children }: PropsWithChildren) => {
  const checkTables = async () => {
    if (checkStorageItem(KEY_DB_TABLES_CREATED)) return;
    try {
      // await deleteAllTables();
      await createLogTable();
      await createRoomTable();
      await createRoomMemberTable();
      await createMessageTable();
      await createInvitationTable('sent');
      await createInvitationTable('recieved');
      setStorageItem(KEY_DB_TABLES_CREATED);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    checkTables();
  }, []);

  return children;
};

const LocalDBProvider = ({ children }: PropsWithChildren) => {
  return (
    <SQLite.SQLiteProvider databaseName={LOCAL_DB_NAME}>
      <DBManager>{children}</DBManager>
    </SQLite.SQLiteProvider>
  );
};

export default LocalDBProvider;
