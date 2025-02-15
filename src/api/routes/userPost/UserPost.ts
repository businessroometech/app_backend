import express from 'express';
import { CreateUserPost, DeleteUserPost, FindUserPost, getPosts, GetUserPostById, UpdateUserPost } from '@/api/controllers/UserPost';
import { getComments, getNestedComments, deleteComment, deleteNestedComment, createOrUpdateComment, createOrUpdateNestedComment, getCommentLikeUserList } from '@/api/controllers/posts/CommentController';
import { createLike, getAllLikesForPost, createCommentLike, getAllLikesForComment, getUserPostLikeList, getPostCommentersList } from '@/api/controllers/posts/LikeController';
import { createOrUpdateReaction, removeReaction } from '@/api/controllers/posts/ReactionController';
import { suggestUsersByEmail } from '@/api/controllers/posts/Mention';
import { blockPost, blockUser, reportedPost, reportedUser, unblockUser } from "@/api/controllers/posts/Blocked";

const Router = express.Router();

Router.post('/create-userpost', CreateUserPost)
Router.post('/get-userpost-byUserId', FindUserPost)
Router.post('/update-userpost-byPostId', UpdateUserPost)
Router.post('/delete-userpost-byPostId', DeleteUserPost)
Router.post('/get-all-post', getPosts)

Router.post('/create-like', createLike);
Router.post('/create-comment-like', createCommentLike);
Router.post('/create-comment', createOrUpdateComment);
Router.post('/create-nested-comment', createOrUpdateNestedComment);

Router.post('/get-likes', getAllLikesForPost);
Router.post('/get-comments', getComments);
Router.post('/get-nested-comments', getNestedComments);
Router.post('/get-comment-like-list', getCommentLikeUserList);

Router.post('/get-post-likes-list', getUserPostLikeList);
Router.post('/get-post-commenter-list', getPostCommentersList);

Router.delete('/comments', deleteComment);
Router.delete('/nested-comments', deleteNestedComment);

Router.post("/create-update-reaction", createOrUpdateReaction)
Router.post("/remove-reaction", removeReaction)

Router.post("/mention", suggestUsersByEmail)
Router.post("/get-all-likes-for-comment", getAllLikesForComment)
Router.post("/get-user-post-by-id", GetUserPostById)

Router.post("/block-post", blockPost);
Router.post("/block-user", blockUser);
Router.post("/unblock-user", unblockUser);
Router.post("/report-post", reportedPost);
Router.post("/report-user", reportedUser);


export default Router;

