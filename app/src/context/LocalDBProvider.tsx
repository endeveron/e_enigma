import * as SQLite from 'expo-sqlite';
import { PropsWithChildren, useEffect } from 'react';

import { LOCAL_DB_NAME } from '@/src/constants';
import { KEY_DB_TABLES_CREATED } from '@/src/constants/store';
import {
  createInvitationTable,
  createLogTable,
  createMessageTable,
  createRoomMemberTable,
  createRoomTable,
} from '@/src/functions/db';
import { checkStorageItem, setStorageItem } from '@/src/functions/store';

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
