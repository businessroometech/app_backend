import express from 'express';
import { CreateUserPost, DeleteUserPost, FindUserPost, getPosts, UpdateUserPost } from '@/api/controllers/UserPost';
import { createComment, createNestedComment, getComments, getNestedComments } from '@/api/controllers/posts/CommentController';
import {  createLike, getAllLikesForPost, createCommentLike, getAllLikesForComment } from '@/api/controllers/posts/LikeController';
import { createOrUpdateReaction, removeReaction } from '@/api/controllers/posts/ReactionController';

const Router = express.Router();

Router.post('/create-userpost', CreateUserPost)
Router.post('/get-userpost-byUserId', FindUserPost)
Router.post('/update-userpost-byPostId', UpdateUserPost)
Router.post('/delete-userpost-byPostId', DeleteUserPost)
Router.post('/get-all-post', getPosts)

Router.post('/create-like', createLike);
Router.post('/create-comment-like', createCommentLike);
Router.post('/create-comment', createComment);
Router.post('/create-nested-comment', createNestedComment);

Router.post('/get-likes', getAllLikesForPost);
Router.post('/get-comments', getComments);
Router.post('/get-nested-comments', getNestedComments);

Router.post("/create-update-reaction", createOrUpdateReaction)
Router.post("/remove-reaction", removeReaction)

export default Router;

