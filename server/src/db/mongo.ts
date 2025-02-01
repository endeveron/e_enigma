import mongoose, { ConnectOptions } from 'mongoose';

import logger from '../helpers/logger';
import { getTime } from '../helpers/date';

const uri = process.env.DB_CONNECTION_STRING as string;
const options = {};

const mongo = {
  connect: async () => {
    try {
      await mongoose.connect(uri, options as ConnectOptions);
      logger.b(`✔️ Connected to database`);
    } catch (err) {
      logger.r(`❌ Database connection error`);
      console.error(err);
    }
  },
};

export { mongo };
