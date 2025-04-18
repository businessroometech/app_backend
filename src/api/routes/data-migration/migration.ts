import express from 'express';
import { userPostMigrate } from '../../controllers/data-migration/userpost';
import { commentMigrate } from '../../controllers/data-migration/comment';
import { commentLikeMigrate } from '../../controllers/data-migration/commentLike';
import { LikeMigrate } from '../../controllers/data-migration/like';
import { nestedCommentMigrate } from '../../controllers/data-migration/nestedComment';
import { nestedCommentLikeMigrate } from '../../controllers/data-migration/nestedCommentLike';

const Router = express.Router();

Router.get('/userpost', userPostMigrate);
Router.get('/comment', commentMigrate);
Router.get('/comment-like', commentLikeMigrate);
Router.get('/like', LikeMigrate);
Router.get('/nested-comment', nestedCommentMigrate);
Router.get('/nested-comment-like', nestedCommentLikeMigrate);

export default Router;
