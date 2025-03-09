import express from 'express';
import { CreateUserPost, DeleteUserPost, FindUserPost, GetUserPostById, UpdateUserPost, uploadMiddleware, VoteInPoll } from '@/api/controllers/posts/UserPost';
import { getComments, getNestedComments, deleteComment, deleteNestedComment, createOrUpdateComment, createOrUpdateNestedComment, getCommentLikeUserList } from '@/api/controllers/posts/CommentController';
import { createLike, getAllLikesForPost, createCommentLike, createNestedCommentLike, getAllLikesForComment, getUserPostLikeList, getPostCommentersList } from '@/api/controllers/posts/LikeController';
import { createOrUpdateReaction, removeReaction } from '@/api/controllers/posts/ReactionController';
import { suggestUsersByEmail } from '@/api/controllers/posts/Mention';
import { blockPost, blockUser, reportedPost, reportedUser, unblockUser } from "@/api/controllers/posts/Blocked";
import { getAllPost } from '@/api/controllers/posts/GetAllPost';
import { authenticate } from '@/api/middlewares/auth/Authenticate';

const Router = express.Router();

Router.post('/create-userpost', authenticate, uploadMiddleware, CreateUserPost)
Router.post('/vote-in-poll', authenticate, VoteInPoll); 

Router.post('/get-userpost-byUserId', authenticate, FindUserPost)
Router.post('/update-userpost-byPostId', authenticate, UpdateUserPost)
Router.delete('/delete-userpost/:postId', authenticate, DeleteUserPost)
Router.get('/get-all-post', authenticate, getAllPost)

Router.post('/create-like', authenticate, createLike);
Router.post('/create-comment-like', authenticate, createCommentLike);
Router.post('/create-nested-comment-like', authenticate, createNestedCommentLike);
Router.post('/create-comment', authenticate, createOrUpdateComment);
Router.post('/create-nested-comment', authenticate, createOrUpdateNestedComment);

Router.get('/get-likes/:postId', authenticate, getAllLikesForPost);
Router.get('/get-comments/:postId', authenticate, getComments);
Router.get('/get-nested-comments/:commentId', authenticate, getNestedComments);
Router.post('/get-comment-like-list', authenticate, getCommentLikeUserList);

Router.get('/get-post-likes-list/:postId', authenticate, getUserPostLikeList);
Router.get('/get-post-commenter-list/:postId', authenticate, getPostCommentersList);

Router.delete('/comments/:commentId', authenticate, deleteComment);
Router.delete('/nested-comments/:nestedCommentId', authenticate, deleteNestedComment);

Router.post("/create-update-reaction", authenticate, createOrUpdateReaction)
Router.post("/remove-reaction", authenticate, removeReaction)

Router.post("/mention", authenticate, suggestUsersByEmail)
Router.post("/get-all-likes-for-comment", authenticate, getAllLikesForComment)
Router.get("/get-user-post-by-id/:postId", authenticate, GetUserPostById)

Router.post("/block-post", authenticate, blockPost);
Router.post("/block-user", authenticate, blockUser);
Router.post("/unblock-user", authenticate, unblockUser);
Router.post("/report-post", authenticate, reportedPost);
Router.post("/report-user", authenticate, reportedUser);

export default Router;