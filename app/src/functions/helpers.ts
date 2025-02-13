import { CUR_API_VERSION, SERVER_URL } from '@/src/constants';
import { consoleClors } from '@/src/constants/colors';
import { LocalDBMessage, MessageItem } from '@/src/types/chat';
import { LogType } from '@/src/types/common';

const { cyan, green, gray, red, yellow, reset } = consoleClors;

export const getApiBaseUrl = () => {
  return `${SERVER_URL}/api/v${CUR_API_VERSION}`;
};

// /**
//  * Returns the current time in the format of the local
//  * time in Ukraine.
//  */
// export function getTime() {
//   return new Date().toLocaleTimeString('uk-UA');
// }
export const getTime = (timestamp?: number) => {
  // const now = timestamp ? new Date(timestamp) : new Date();
  // const month = String(now.getMonth() + 1).padStart(2, '0');
  // const day = String(now.getDate()).padStart(2, '0');
  // const hour = String(now.getHours()).padStart(2, '0');
  // const minute = String(now.getMinutes()).padStart(2, '0');
  return {
    // date: `${day}-${month} ${hour}:${minute}`,
    date: new Date().toLocaleTimeString('uk-UA'),
    timestamp: timestamp || Date.now(),
  };
};

/**
 * Logs messages with different colors based on the type provided
 * (error, success, or default).
 * @param {string} message a string containing the message to be logged.
 * @param {LogType} [type] an optional parameter of type "info" | "success" | "error".
 */
export const logMessage = (message: string, type?: LogType) => {
  const { date } = getTime();
  try {
    switch (type) {
      case 'error': {
        console.info(`[${date}] ❌ ${red}%s${reset}`, message);
        // await saveLog(message, 'error');
        break;
      }
      case 'success': {
        console.info(`[${date}] ✔️ ${green}%s${reset}`, message);
        // await saveLog(message, 'success');
        break;
      }
      case 'warning': {
        console.info(`[${date}] ⚠️ ${yellow}%s${reset}`, message);
        // await saveLog(message, 'warning');
        break;
      }
      default: {
        console.info(`[${date}] ✔️ ${cyan}%s${reset}`, message);
        // await saveLog(message);
      }
    }
  } catch (error: any) {
    console.error(`logMessage: ${error}`);
  }
};

export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const convertTableRowToMessageItem = (
  tableRow: LocalDBMessage
): MessageItem => {
  const messageItem: MessageItem = {
    id: tableRow.id,
    roomId: tableRow.roomId,
    senderId: tableRow.senderId,
    recipientId: tableRow.recipientId,
    data: tableRow.data,
    type: tableRow.type,
    date: {
      day: tableRow.day,
      time: tableRow.time,
    },
    createdAt: tableRow.createdAt,
    recievedAt: !!tableRow.recievedAt ? tableRow.recievedAt : undefined,
    viewedAt: !!tableRow.viewedAt ? tableRow.viewedAt : undefined,
  };
  return messageItem;
};

// export const generateId = () => {
//   return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
// };
