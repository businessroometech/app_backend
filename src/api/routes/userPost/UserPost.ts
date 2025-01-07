import express from 'express';
import { CreateUserPost, DeleteUserPost, FindUserPost, getPosts, UpdateUserPost } from '@/api/controllers/UserPost';
import { createComment, createNestedComment, getComments, getNestedComments } from '@/api/controllers/posts/CommentController';
import { createOrToggleLike, getAllLikesForPost } from '@/api/controllers/posts/LikeController';

const Router = express.Router();

Router.post('/create-userpost', CreateUserPost)
Router.post('/get-userpost-byUserId', FindUserPost)
Router.post('/update-userpost-byPostId', UpdateUserPost)
Router.post('/delete-userpost-byPostId', DeleteUserPost)
Router.post('/get-all-post', getPosts)

Router.post('/create-like', createOrToggleLike);
Router.post('/create-comment', createComment);
Router.post('/create-nested-comment', createNestedComment);

Router.post('/get-likes', getAllLikesForPost);
Router.post('/get-comments', getComments);
Router.post('/get-nested-comments', getNestedComments);

export default Router;

