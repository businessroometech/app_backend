import { Request, Response } from 'express';
import { AppDataSource } from '@/server';
// import { Hashtag } from '@/api/entity/Hashtag/Hashtag';
import { UserPost } from '@/api/entity/UserPost';
// import { Comment } from '@/api/entity/posts/Comment';
// import { NestedComment } from '@/api/entity/posts/NestedComment';

// type TargetType = 'post' | 'comment' | 'nestedComment';

// export const postHashtag = async (req: Request, res: Response): Promise<Response> => {
//   console.log('coming');
//   const { targetId, tags, type } = req.body;

//   if (!targetId || !Array.isArray(tags) || tags.length === 0 || !['post', 'comment', 'nestedComment'].includes(type)) {
//     return res.status(400).json({ message: 'enter data properly' });
//   }

//   try {
//     const hashtagRepo = AppDataSource.getRepository(Hashtag);

//     // Get or create hashtags
//     const hashtagsToAttach: Hashtag[] = [];
//     for (const tag of tags) {
//       let hashtag = await hashtagRepo.findOne({ where: { tag } });

//       if (!hashtag) {
//         hashtag = hashtagRepo.create({
//           tag,
//           createdBy: 'system',
//           updatedBy: 'system',
//         });
//         await hashtagRepo.save(hashtag);
//       }

//       hashtagsToAttach.push(hashtag);
//     }

//     let entityRepo: any;
//     let relationKey: keyof Hashtag;

//     switch (type as TargetType) {
//       case 'post':
//         entityRepo = AppDataSource.getRepository(UserPost);
//         relationKey = 'posts';
//         break;
//       case 'comment':
//         entityRepo = AppDataSource.getRepository(Comment);
//         relationKey = 'comments';
//         break;
//       case 'nestedComment':
//         entityRepo = AppDataSource.getRepository(NestedComment);
//         relationKey = 'nestedComments';
//         break;
//     }

//     const entity = await entityRepo.findOne({
//       where: { id: targetId },
//       relations: ['hashtag'],
//     });

//     if (!entity) {
//       return res.status(404).json({ message: `${type} not found.` });
//     }

//     entity.hashtag = [...(entity.hashtag || []), ...hashtagsToAttach];
//     await entityRepo.save(entity);

//     // Also update the reverse relation if needed (optional, based on use-case)
//     for (const hashtag of hashtagsToAttach) {
//       if (!hashtag[relationKey]) hashtag[relationKey] = [];
//       hashtag[relationKey].push(entity);
//       await hashtagRepo.save(hashtag);
//     }

//     return res.status(200).json({
//       message: `Hashtags added to ${type} successfully.`,
//       hashtags: hashtagsToAttach.map((h) => h.tag),
//     });
//   } catch (error) {
//     console.error('Error linking hashtags:', error);
//     return res.status(500).json({ message: 'Internal server error.' });
//   }
// };
