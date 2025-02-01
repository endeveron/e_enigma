import { Router } from 'express';

import { searchUser } from '../controllers/user';
import { handleHttpError } from '../helpers/error';
import { checkAuth } from '../middleware/check-auth';

const router = Router();
router.use(checkAuth);

router.get('/search', searchUser);

router.use(handleHttpError);

export default router;
