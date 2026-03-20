import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Post from '../models/post';
import User from '../models/user';
import Category from '../models/category';
import Comment from '../models/comment';
import { getDualTranslation } from '../utils/translation';

dotenv.config();

// Test data
const testUsers = [
  { username: 'alice_fitness', email: 'alice@test.com', password: 'Test123!', bio: 'Fitness enthusiast' },
  { username: 'bob_cooking', email: 'bob@test.com', password: 'Test123!', bio: 'Home chef' },
  { username: 'chris_tech', email: 'chris@test.com', password: 'Test123!', bio: 'Tech lover' },
  { username: 'dana_yoga', email: 'dana@test.com', password: 'Test123!', bio: 'Yoga instructor' },
  { username: 'eddie_gardener', email: 'eddie@test.com', password: 'Test123!', bio: 'Gardening pro' },
  { username: 'fiona_art', email: 'fiona@test.com', password: 'Test123!', bio: 'Digital artist' },
];

const categories = [
  { name: 'recipe', description: 'Recipes and cooking tips' },
  { name: 'flex', description: 'Fitness and workout routines' },
  { name: 'question', description: 'Questions and discussions' },
];

const postsData = [
  // Alice's fitness posts
  {
    author: 'alice_fitness',
    title: '10-minute morning workout routine',
    content: 'Start your day with this quick and effective 10-minute workout that boosts energy and burns fat. Perfect for busy mornings!',
    category: 'flex',
    tags: ['workout', 'morning', 'quick', 'fatburn', 'beginner'],
  },
  {
    author: 'alice_fitness',
    title: 'How to perfect your squat form',
    content: 'Learn the proper squat technique to maximize results and avoid injuries. Common mistakes and how to fix them.',
    category: 'flex',
    tags: ['squats', 'technique', 'form', 'strength', 'lowerbody'],
  },
  {
    author: 'alice_fitness',
    title: 'Best protein shakes for post-workout recovery',
    content: 'Quick and delicious protein shake recipes to help your muscles recover after exercise. Includes vegan options.',
    category: 'flex',
    tags: ['protein', 'recovery', 'nutrition', 'vegan', 'smoothie'],
  },

  // Bob's cooking posts
  {
    author: 'bob_cooking',
    title: 'Authentic Bulgarian banitsa recipe',
    content: 'Learn how to make traditional Bulgarian banitsa with homemade filo dough and cheese filling. Step-by-step guide.',
    category: 'recipe',
    tags: ['bulgarian', 'banitsa', 'pastry', 'cheese', 'traditional'],
  },
  {
    author: 'bob_cooking',
    title: 'Quick 30-minute pasta primavera',
    content: 'A fresh and healthy pasta dish loaded with vegetables. Ready in 30 minutes, perfect for weeknight dinners.',
    category: 'recipe',
    tags: ['pasta', 'quick', 'vegetables', 'healthy', 'weeknight'],
  },
  {
    author: 'bob_cooking',
    title: 'Tips for perfect homemade bread',
    content: 'Secrets to baking delicious homemade bread with a crispy crust and soft interior. No bread machine required.',
    category: 'recipe',
    tags: ['bread', 'baking', 'homemade', 'tips', 'dough'],
  },

  // Chris's tech posts
  {
    author: 'chris_tech',
    title: 'Best programming languages for beginners 2024',
    content: 'Looking to start coding? Here are the top programming languages recommended for beginners with job prospects.',
    category: 'question',
    tags: ['programming', 'beginner', 'career', 'python', 'javascript'],
  },
  {
    author: 'chris_tech',
    title: 'How to protect your online privacy',
    content: 'Essential privacy tips including password managers, VPNs, and two-factor authentication to keep your data safe.',
    category: 'question',
    tags: ['privacy', 'security', 'passwords', 'vpn', 'tips'],
  },
  {
    author: 'chris_tech',
    title: 'Building a smart home on a budget',
    content: 'Affordable smart home devices and DIY projects to automate your home without breaking the bank.',
    category: 'question',
    tags: ['smarthome', 'budget', 'iot', 'automation', 'diy'],
  },

  // Dana's yoga posts
  {
    author: 'dana_yoga',
    title: 'Morning yoga sequence for beginners',
    content: 'A gentle 20-minute yoga flow to start your day with intention and flexibility. No experience needed.',
    category: 'flex',
    tags: ['yoga', 'morning', 'beginner', 'flexibility', 'meditation'],
  },
  {
    author: 'dana_yoga',
    title: 'How to improve your downward dog',
    content: 'Common alignment mistakes in downward facing dog and adjustments to make the pose more comfortable and effective.',
    category: 'flex',
    tags: ['yoga', 'downwarddog', 'alignment', 'flexibility', 'poses'],
  },
  {
    author: 'dana_yoga',
    title: 'Breathing techniques for stress relief',
    content: 'Pranayama breathing exercises that calm the nervous system and reduce anxiety instantly.',
    category: 'flex',
    tags: ['breathing', 'stress', 'anxiety', 'pranayama', 'relaxation'],
  },

  // Ed's gardening posts
  {
    author: 'eddie_gardener',
    title: 'Growing tomatoes in containers',
    content: 'Everything you need to know about growing delicious tomatoes in pots on your balcony or patio.',
    category: 'question',
    tags: ['gardening', 'tomatoes', 'containers', 'balcony', 'urban'],
  },
  {
    author: 'eddie_gardener',
    title: 'Composting basics for beginners',
    content: 'Learn how to start composting at home to reduce waste and create nutrient-rich soil for your garden.',
    category: 'question',
    tags: ['composting', 'sustainability', 'wastereduction', 'soil', 'organic'],
  },
  {
    author: 'eddie_gardener',
    title: 'Indoor plants that purify air',
    content: 'Top houseplants that clean indoor air pollutants while adding beauty to your home.',
    category: 'question',
    tags: ['plants', 'indoor', 'airquality', 'houseplants', 'health'],
  },

  // Fiona's art posts
  {
    author: 'fiona_art',
    title: 'Getting started with digital painting',
    content: 'A beginner-friendly guide to digital art including tools, software recommendations, and fundamental techniques.',
    category: 'question',
    tags: ['art', 'digital', 'painting', 'beginner', 'tutorial'],
  },
  {
    author: 'fiona_art',
    title: 'Color theory for artists explained',
    content: 'Understanding color harmony, complementary colors, and how to create mood in your artwork.',
    category: 'question',
    tags: ['art', 'color', 'theory', 'design', 'composition'],
  },
  {
    author: 'fiona_art',
    title: 'Drawing portraits from imagination',
    content: 'Tips for drawing realistic faces without reference photos, using construction and proportion techniques.',
    category: 'question',
    tags: ['art', 'portrait', 'drawing', 'faces', 'skills'],
  },
];

// Connection string - update as needed
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mangotree';

async function connectDB() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');
}

async function createTestUsers() {
  console.log('\n=== Creating Test Users ===');
  const createdUsers = [];

  for (const userData of testUsers) {
    // Check if user exists
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      console.log(`✓ User ${userData.username} already exists`);
      createdUsers.push(existing);
      continue;
    }

    // Create new user with simple password (hash it properly in real scenario)
    // For testing, we'll use the bcrypt hash of 'Test123!'
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(userData.password, 10);

    const user = new User({
      username: userData.username,
      email: userData.email,
      passwordHash,
      bio: userData.bio,
      isVisible: true,
      isApproved: true,
      followers: [],
      following: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      translations: {
        bio: {
          en: userData.bio,
          bg: userData.bio, // Same for simplicity
        },
      },
    });

    await user.save();
    console.log(`✓ Created user: ${userData.username}`);
    createdUsers.push(user);
  }

  return createdUsers;
}

async function setupCategories() {
  console.log('\n=== Setting Up Categories ===');
  const createdCategories = [];

  for (const catData of categories) {
    // Check if category exists
    const existing = await Category.findOne({ name: catData.name });
    if (existing) {
      console.log(`✓ Category ${catData.name} already exists`);
      createdCategories.push(existing);
      continue;
    }

    // Find or create translation
    const { Translation } = await import('../models/translation');
    const translation = new Translation({
      key: `category:${catData.name}`,
      translations: {
        en: catData.name,
        bg: catData.name.charAt(0).toUpperCase() + catData.name.slice(1), // Simple Bulgarian
      },
    });
    await translation.save();

    const category = new Category({
      name: catData.name,
      translations: {
        name: {
          en: catData.name,
          bg: catData.name.charAt(0).toUpperCase() + catData.name.slice(1),
        },
      },
    });

    await category.save();
    console.log(`✓ Created category: ${catData.name}`);
    createdCategories.push(category);
  }

  return createdCategories;
}

async function createPosts(users, categoriesMap) {
  console.log('\n=== Creating Posts ===');

  for (const postData of postsData) {
    // Find author
    const author = users.find(u => u.username === postData.author);
    if (!author) {
      console.log(`✗ Skipping post - author ${postData.author} not found`);
      continue;
    }

    // Find category
    const category = categoriesMap.get(postData.category);
    if (!category) {
      console.log(`✗ Skipping post - category ${postData.category} not found`);
      continue;
    }

    // Translate title and content
    try {
      const [titleTrans, contentTrans] = await Promise.all([
        getDualTranslation(postData.title),
        getDualTranslation(postData.content),
      ]);

      const post = new Post({
        title: titleTrans.en,
        content: contentTrans.en,
        translations: {
          title: titleTrans,
          content: contentTrans,
        },
        authorId: author._id,
        category: category._id,
        tags: postData.tags,
        image: [],
        likes: [],
        isVisible: true,
        isApproved: true,
      });

      await post.save();
      console.log(`✓ Created post: "${postData.title}" by @${postData.author}`);
    } catch (err) {
      console.error(`✗ Error creating post "${postData.title}":`, err.message);
    }
  }
}

async function createInteractions() {
  console.log('\n=== Creating Interactions (Likes & Comments) ===');

  // Get all posts
  const allPosts = await Post.find({ isVisible: true })
    .populate('authorId', 'username')
    .lean();

  // Get all users
  const allUsers = await User.find({}).lean();

  // Helper to get random subset
  const randomSubset = <T>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // Create likes - each user likes random posts from other users
  for (const user of allUsers) {
    const otherPosts = allPosts.filter(p => p.authorId?._id?.toString() !== user._id?.toString());
    const postsToLike = randomSubset(otherPosts, Math.floor(Math.random() * 8) + 3); // 3-10 likes per user

    for (const post of postsToLike) {
      await Post.findByIdAndUpdate(
        post._id,
        { $addToSet: { likes: user._id } }
      );
      console.log(`✓ @${user.username} liked post "${post.title.substring(0, 30)}..."`);
    }
  }

  // Create comments - fewer than likes
  const { Comment } = await import('../models/comment');
  const sampleComments = [
    'Great post! Really helpful.',
    'Thanks for sharing this!',
    'I tried this and it worked perfectly.',
    'Very informative, well explained.',
    'Love this! Keep up the good work.',
    'This is exactly what I needed.',
    'Amazing content as always!',
    'Saved for later reference.',
  ];

  for (const user of allUsers) {
    const otherPosts = allPosts.filter(p => p.authorId?._id?.toString() !== user._id?.toString());
    const postsToComment = randomSubset(otherPosts, Math.floor(Math.random() * 3) + 1); // 1-3 comments per user

    for (const post of postsToComment) {
      const commentText = sampleComments[Math.floor(Math.random() * sampleComments.length)];
      const [textEn, textBg] = await Promise.all([
        getDualTranslation(commentText),
      ]);

      const comment = new Comment({
        postId: post._id,
        userId: user._id,
        text: textEn.en,
        translations: {
          text: {
            en: textEn.en,
            bg: textEn.bg,
          },
        },
        likes: [],
      });

      await comment.save();
      console.log(`✓ @${user.username} commented on post "${post.title.substring(0, 30)}..."`);
    }
  }
}

async function createFollows() {
  console.log('\n=== Creating Follow Relationships ===');

  const allUsers = await User.find({}).lean();
  const followCounts = new Map<string, number>();

  // Each user follows 2-5 other random users (not themselves)
  for (const user of allUsers) {
    const otherUsers = allUsers.filter(u => u._id.toString() !== user._id.toString());
    const usersToFollow = Math.floor(Math.random() * 4) + 2; // 2-5 follows

    for (let i = 0; i < Math.min(usersToFollow, otherUsers.length); i++) {
      const target = otherUsers[Math.floor(Math.random() * otherUsers.length)];

      // Add to following
      await User.findByIdAndUpdate(
        user._id,
        { $addToSet: { following: target._id } }
      );

      // Add to followers
      await User.findByIdAndUpdate(
        target._id,
        { $addToSet: { followers: user._id } }
      );

      console.log(`✓ @${user.username} is now following @${target.username}`);
    }
  }
}

async function main() {
  try {
    await connectDB();

    // Setup
    const users = await createTestUsers();
    const categoriesList = await setupCategories();
    const categoriesMap = new Map(categoriesList.map(c => [c.name, c]));

    // Create posts
    await createPosts(users, categoriesMap);

    // Create interactions (likes and comments)
    await createInteractions();

    // Create follow relationships
    await createFollows();

    console.log('\n✓✓✓ Test data generation complete! ✓✓✓');
    console.log('\nSummary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Categories: ${categoriesList.length}`);
    const postCount = await Post.countDocuments();
    console.log(`- Posts: ${postCount}`);
    const commentCount = await Comment.countDocuments();
    console.log(`- Comments: ${commentCount}`);

    // Show some stats
    console.log('\nSample posts:');
    const sample = await Post.find({ isVisible: true })
      .populate('authorId', 'username')
      .populate('category', 'name')
      .limit(5)
      .lean();

    for (const p of sample) {
      console.log(`  - "${p.title}" by @${(p.authorId as any)?.username} [${p.category?.name}] (${(p.likes as any[]).length} likes)`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

main();
