import express from 'express';
import { CreateUserPost, DeleteUserPost, FindUserPost, GetUserPostById, UpdateUserPost } from '@/api/controllers/UserPost';
import { getComments, getNestedComments, deleteComment, deleteNestedComment, createOrUpdateComment, createOrUpdateNestedComment, getCommentLikeUserList } from '@/api/controllers/posts/CommentController';
import { createLike, getAllLikesForPost, createCommentLike, getAllLikesForComment, getUserPostLikeList, getPostCommentersList } from '@/api/controllers/posts/LikeController';
import { createOrUpdateReaction, removeReaction } from '@/api/controllers/posts/ReactionController';
import { suggestUsersByEmail } from '@/api/controllers/posts/Mention';
import { blockPost, blockUser, reportedPost, reportedUser, unblockUser } from "@/api/controllers/posts/Blocked";
import { getAllPost } from '@/api/controllers/posts/GetAllPost';
import { authenticate } from '@/api/middlewares/auth/Authenticate';

const Router = express.Router();

Router.post('/create-userpost', authenticate, CreateUserPost)
Router.post('/get-userpost-byUserId', authenticate, FindUserPost)
Router.post('/update-userpost-byPostId', authenticate, UpdateUserPost)
Router.post('/delete-userpost-byPostId', authenticate, DeleteUserPost)
Router.post('/get-all-post', authenticate, getAllPost)

Router.post('/create-like', authenticate, createLike);
Router.post('/create-comment-like', authenticate, createCommentLike);
Router.post('/create-comment', authenticate, createOrUpdateComment);
Router.post('/create-nested-comment', authenticate, createOrUpdateNestedComment);

Router.post('/get-likes', authenticate, getAllLikesForPost);
Router.post('/get-comments', authenticate, getComments);
Router.post('/get-nested-comments', authenticate, getNestedComments);
Router.post('/get-comment-like-list', authenticate, getCommentLikeUserList);

Router.post('/get-post-likes-list', authenticate, getUserPostLikeList);
Router.post('/get-post-commenter-list', authenticate, getPostCommentersList);

Router.delete('/comments', authenticate, deleteComment);
Router.delete('/nested-comments', authenticate, deleteNestedComment);

Router.post("/create-update-reaction", authenticate, createOrUpdateReaction)
Router.post("/remove-reaction", authenticate, removeReaction)

Router.post("/mention", authenticate, suggestUsersByEmail)
Router.post("/get-all-likes-for-comment", authenticate, getAllLikesForComment)
Router.post("/get-user-post-by-id", authenticate, GetUserPostById)

Router.post("/block-post", authenticate, blockPost);
Router.post("/block-user", authenticate, blockUser);
Router.post("/unblock-user", authenticate, unblockUser);
Router.post("/report-post", authenticate, reportedPost);
Router.post("/report-user", authenticate, reportedUser);


export default Router;

