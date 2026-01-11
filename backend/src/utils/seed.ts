import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

import User from '../models/user';
import Post from '../models/post';
import Comment from '../models/comment';
import Report from '../models/report';
import Category from '../models/category';
import Tag from '../models/tag';
import TagType from '../enums/tag-type';

const MONGO_URI = process.env.MONGO_URI as string;

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    console.log('MongoDB connected for seeding');

    await User.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});
    await Report.deleteMany({});
    await Category.deleteMany({});
    await Tag.deleteMany({});

    // --- USERS ---
    const usersData = [];
    for (let i = 1; i <= 10; i++) {
      const passwordHash = await bcrypt.hash('password' + i, 10);
      usersData.push({
        username: `user${i}`,
        email: `user${i}@example.com`,
        passwordHash,
        role: i === 1 ? 'admin' : 'user',
        profileImage: `https://i.pravatar.cc/150?img=${i}`,
        bio: `I love cooking! User ${i}`,
        followers: [],
        following: [],
      });
    }
    const users = await User.insertMany(usersData);
    console.log('Users seeded');

    // --- CATEGORIES ---
    const categories = ['question', 'flex', 'recipe'];
    const categoryDocs = await Category.insertMany(
      categories.map((name) => ({ name }))
    );
    console.log('Categories seeded');

    // --- TAGS ---
    const tags = [
      { name: 'italian', type: TagType.CUISINE },
      { name: 'chinese', type: TagType.CUISINE },
      { name: 'japanese', type: TagType.CUISINE },
      { name: 'thai', type: TagType.CUISINE },
      { name: 'mexican', type: TagType.CUISINE },
      { name: 'indian', type: TagType.CUISINE },
      { name: 'french', type: TagType.CUISINE },
      { name: 'greek', type: TagType.CUISINE },
      { name: 'spanish', type: TagType.CUISINE },
      { name: 'turkish', type: TagType.CUISINE },
      { name: 'american', type: TagType.CUISINE },
      { name: 'korean', type: TagType.CUISINE },
      { name: 'vietnamese', type: TagType.CUISINE },
      { name: 'lebanese', type: TagType.CUISINE },
      { name: 'moroccan', type: TagType.CUISINE },
      { name: 'caribbean', type: TagType.CUISINE },
      { name: 'brazilian', type: TagType.CUISINE },
      { name: 'german', type: TagType.CUISINE },
      { name: 'british', type: TagType.CUISINE },
      { name: 'mediterranean', type: TagType.CUISINE },

      { name: 'breakfast', type: TagType.MEAL_TIME },
      { name: 'brunch', type: TagType.MEAL_TIME },
      { name: 'lunch', type: TagType.MEAL_TIME },
      { name: 'dinner', type: TagType.MEAL_TIME },
      { name: 'late-night', type: TagType.MEAL_TIME },
      { name: 'snack', type: TagType.MEAL_TIME },

      { name: 'soup', type: TagType.MEAL_TYPE },
      { name: 'salad', type: TagType.MEAL_TYPE },
      { name: 'main course', type: TagType.MEAL_TYPE },
      { name: 'side dish', type: TagType.MEAL_TYPE },
      { name: 'dessert', type: TagType.MEAL_TYPE },
      { name: 'appetizer', type: TagType.MEAL_TYPE },
      { name: 'drink', type: TagType.MEAL_TYPE },
      { name: 'smoothie', type: TagType.MEAL_TYPE },
      { name: 'sandwich', type: TagType.MEAL_TYPE },
      { name: 'pasta', type: TagType.MEAL_TYPE },

      { name: 'easy', type: TagType.DIFFICULTY },
      { name: 'medium', type: TagType.DIFFICULTY },
      { name: 'hard', type: TagType.DIFFICULTY },

      { name: 'healthy', type: TagType.MEAL_TYPE },
      { name: 'vegan', type: TagType.MEAL_TYPE },
      { name: 'vegetarian', type: TagType.MEAL_TYPE },
      { name: 'gluten-free', type: TagType.MEAL_TYPE },
      { name: 'keto', type: TagType.MEAL_TYPE },
      { name: 'low-carb', type: TagType.MEAL_TYPE },
      { name: 'high-protein', type: TagType.MEAL_TYPE },
      { name: 'dairy-free', type: TagType.MEAL_TYPE },
      { name: 'low-fat', type: TagType.MEAL_TYPE },
      { name: 'sugar-free', type: TagType.MEAL_TYPE },
      { name: 'bbq', type: TagType.MEAL_TYPE },
      { name: 'grill', type: TagType.MEAL_TYPE },
      { name: 'roast', type: TagType.MEAL_TYPE },
      { name: 'baked', type: TagType.MEAL_TYPE },
      { name: 'stew', type: TagType.MEAL_TYPE },
      { name: 'fried', type: TagType.MEAL_TYPE },
      { name: 'one-pot', type: TagType.MEAL_TYPE },
      { name: 'instant pot', type: TagType.MEAL_TYPE },
      { name: 'air fryer', type: TagType.MEAL_TYPE },
      { name: 'picnic', type: TagType.MEAL_TYPE },
      { name: 'holiday', type: TagType.MEAL_TYPE },
      { name: 'kids friendly', type: TagType.MEAL_TYPE },
      { name: 'comfort food', type: TagType.MEAL_TYPE },
      { name: 'quick & easy', type: TagType.MEAL_TYPE },
      { name: 'party food', type: TagType.MEAL_TYPE },
    ];

    const tagDocs = await Tag.insertMany(tags);
    console.log('Tags seeded');

    const foodImages = [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
      'https://images.unsplash.com/photo-1498579809087-ef1e558fd1da',
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141',
      'https://images.unsplash.com/photo-1525351484163-7529414344d8',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
      'https://images.unsplash.com/photo-1604908177522-fb0b9e1c92f6',
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe',
      'https://images.unsplash.com/photo-1605475128011-411d3c9f3a43',
      'https://images.unsplash.com/photo-1529042410759-befb1204b468',
      'https://images.unsplash.com/photo-1565958011705-44e211f08a1b',
      'https://images.unsplash.com/photo-1528731708534-816fe59f90c4',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
      'https://images.unsplash.com/photo-1478145046317-39f10e56b5e9',
      'https://images.unsplash.com/photo-1533777324565-a040eb52fac1',
    ];

    // --- POSTS ---
    const postsData = [];
    for (let i = 0; i < 15; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomCategory = categoryDocs[Math.floor(Math.random() * categoryDocs.length)];
      const randomTags = tagDocs
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((t) => t.name);

      postsData.push({
        title: `Recipe ${i + 1}`,
        content: `This is the content for Recipe ${i + 1}. A delicious example of ${randomTags.join(', ')} cuisine.`,
        image: [`${foodImages[i % foodImages.length]}?auto=format&fit=crop&w=800&q=80`],
        authorId: randomUser._id,
        category: randomCategory.name,
        tags: randomTags,
        likes: [],
        isApproved: true,
        isVisible: true,
      });
    }
    const insertedPosts = await Post.insertMany(postsData);
    console.log('Posts seeded');

    // --- COMMENTS ---
    const commentsData: {
      postId: Types.ObjectId;
      userId: Types.ObjectId;
      text: string;
      likes: Types.ObjectId[];
    }[] = [];

    insertedPosts.forEach((post) => {
      const randomCommenter = users[Math.floor(Math.random() * users.length)];
      const randomLikes: Types.ObjectId[] = [];
      const numberOfLikes = Math.floor(Math.random() * 5);

      for (let j = 0; j < numberOfLikes; j++) {
        const randomUserForLike = users[Math.floor(Math.random() * users.length)];
        if (!randomLikes.includes(randomUserForLike._id as Types.ObjectId)) {
          randomLikes.push(randomUserForLike._id as Types.ObjectId);
        }
      }

      commentsData.push({
        postId: post._id as Types.ObjectId,
        userId: randomCommenter._id as Types.ObjectId,
        text: 'Looks delicious!',
        likes: randomLikes,
      });
    });

    const insertedComments = await Comment.insertMany(commentsData);
    console.log('Comments seeded');

    // --- REPORTS ---
    const reports = [
      {
        reportedBy: users[2]._id,
        targetType: 'post',
        targetId: insertedPosts[0]._id,
        reason: 'Inappropriate language',
        status: 'pending',
      },
      {
        reportedBy: users[3]._id,
        targetType: 'comment',
        targetId: insertedComments[0]._id,
        reason: 'Spam',
        status: 'pending',
      },
    ];
    await Report.insertMany(reports);
    console.log('Reports seeded');

    console.log('Database seeding complete');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedData();