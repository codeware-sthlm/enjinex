import { logger } from '@tx/logger';

import { app } from './app/app';

logger.info('Start main app...');

app();
