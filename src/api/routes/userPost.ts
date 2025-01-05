import express from 'express';
import { CreateUserPost, DeleteUserPost, FindUserPost, getPosts, UpdateUserPost } from '../controllers/UserPost';

const Router = express.Router();

Router.post('/create-userpost', CreateUserPost)
Router.post('/get-userpost-byUserId', FindUserPost)
Router.post('/update-userpost-byPostId', UpdateUserPost)
Router.post('/delete-userpost-byPostId', DeleteUserPost)
Router.post('/get-all-post', getPosts)
