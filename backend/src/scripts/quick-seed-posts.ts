import mongoose from 'mongoose';
import Post from '../models/post';
import { getDualTranslation } from '../utils/translation';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mangotree';

async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');
  } catch (err) {
    console.error('✗ Failed to connect:', err);
    process.exit(1);
  }

  // Import User and Category models
  const User = require('../models/user').default;
  const Category = require('../models/category').default;
  const Comment = require('../models/comment').default;

  // Get existing data
  const users = await User.find({}).select('_id username').lean();
  const categories = await Category.find({}).select('_id name').lean();

  if (users.length === 0) {
    console.error('✗ No users found. Please create at least one user first.');
    process.exit(1);
  }

  if (categories.length === 0) {
    console.error('✗ No categories found. Please create categories first in admin panel.');
    process.exit(1);
  }

  console.log(`✓ Found ${users.length} users and ${categories.length} categories\n`);

  // Sample posts with varying content to test different features
  const samplePosts = [
    // Recipe category posts
    {
      title: 'Classic Bulgarian Shopska Salad',
      content: 'Fresh tomatoes, cucumbers, peppers, and sirene cheese. The perfect summer salad with simple ingredients.',
      categoryName: 'recipe',
      tags: ['salad', 'bulgarian', 'fresh', 'summer', 'easy'],
    },
    {
      title: 'How to Make Perfect Pasta Carbonara',
      content: 'Authentic Italian pasta carbonara with eggs, pecorino cheese, and guanciale. No cream allowed!',
      categoryName: 'recipe',
      tags: ['pasta', 'italian', 'traditional', 'quick', 'dinner'],
    },
    {
      title: 'Healthy Overnight Oats Recipe',
      content: 'Prepare these nutritious overnight oats the night before for a perfect grab-and-go breakfast.',
      categoryName: 'recipe',
      tags: ['breakfast', 'healthy', 'overnight', 'mealprep', 'quick'],
    },

    // Flex category posts
    {
      title: 'Full Body HIIT Workout - No Equipment',
      content: '20-minute high intensity interval training that burns calories and builds strength. Do it anywhere!',
      categoryName: 'flex',
      tags: ['hiit', 'bodyweight', 'cardio', 'strength', 'homeworkout'],
    },
    {
      title: '5 Yoga Poses for Better Posture',
      content: 'Counteract desk job stiffness with these yoga poses that improve alignment and reduce back pain.',
      categoryName: 'flex',
      tags: ['yoga', 'posture', 'backpain', 'stretching', 'deskjob'],
    },
    {
      title: 'Beginner Guide to Running 5K',
      content: 'Start your running journey with this 8-week couch to 5K program. Build endurance safely.',
      categoryName: 'flex',
      tags: ['running', 'beginner', 'c25k', 'endurance', 'cardio'],
    },

    // Question category posts
    {
      title: 'Best resources to learn TypeScript in 2024?',
      content: 'I want to learn TypeScript properly. What are the best online courses, books, or tutorials you recommend?',
      categoryName: 'question',
      tags: ['typescript', 'learning', 'programming', 'webdev', 'javascript'],
    },
    {
      title: 'How do you stay motivated with fitness goals?',
      content: 'I struggle with consistency. What are your strategies for staying on track with workouts and nutrition?',
      categoryName: 'question',
      tags: ['motivation', 'fitness', 'goals', 'consistency', 'habits'],
    },
    {
      title: 'Tips for growing herbs indoors?',
      content: 'I want to start an indoor herb garden. What are the easiest herbs for beginners and what equipment do I need?',
      categoryName: 'question',
      tags: ['gardening', 'herbs', 'indoor', 'beginner', 'plants'],
    },
    {
      title: 'What is your favorite programming paradigm and why?',
      content: 'Functional vs OOP vs procedural? Let\'s discuss the pros and cons of different programming paradigms.',
      categoryName: 'question',
      tags: ['programming', 'discussion', 'oop', 'functional', 'debate'],
    },

    // Additional variety
    {
      title: 'The Science of Sleep: How to Optimize Your Rest',
      content: 'Understanding sleep cycles and how to improve sleep quality through environment, routine, and supplements.',
      categoryName: 'question',
      tags: ['sleep', 'health', 'wellness', 'habits', 'science'],
    },
    {
      title: 'Building a Minimalist Wardrobe',
      content: 'How to declutter your closet and build a capsule wardrobe with versatile, quality pieces you love.',
      categoryName: 'question',
      tags: ['fashion', 'minimalism', 'wardrobe', 'lifestyle', 'style'],
    },
  ];

  console.log('=== Creating Sample Posts ===\n');

  let postCount = 0;

  for (let i = 0; i < samplePosts.length; i++) {
    const postData = samplePosts[i];

    // Pick a random author (different from previous for variety)
    const author = users[i % users.length];

    // Find category
    const category = categories.find((c: any) => c.name.toLowerCase() === postData.categoryName);
    if (!category) {
      console.log(`✗ Skipping: category "${postData.categoryName}" not found`);
      continue;
    }

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
        likes: [], // Empty likes initially
        isVisible: true,
        isApproved: true,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
      });

      await post.save();
      postCount++;

      console.log(`${i + 1}. "${postData.title}"`);
      console.log(`   Author: @${author.username} | Category: ${category.name}`);
      console.log(`   Tags: ${postData.tags.join(', ')}`);
      console.log(`   Date: ${post.createdAt.toISOString().split('T')[0]}\n`);
    } catch (err: any) {
      console.error(`✗ Error creating post "${postData.title}":`, err.message);
    }
  }

  console.log(`\n✓ Created ${postCount} posts successfully\n`);
  console.log('=== Adding Some Likes to Posts ===\n');

  const allPosts = await Post.find({ isVisible: true }).select('_id title likes').lean();
  let totalLikesAdded = 0;

  for (const post of allPosts) {
    // Add 0-5 random likes
    const numLikes = Math.floor(Math.random() * 6);
    const shuffledUsers = users.sort(() => 0.5 - Math.random());
    const randomUsers = shuffledUsers.slice(0, numLikes);

    for (const user of randomUsers) {
      await Post.findByIdAndUpdate(
        post._id,
        { $addToSet: { likes: user._id } }
      );
    }

    if (numLikes > 0) {
      console.log(`✓ "${post.title.substring(0, 40)}..." → ${numLikes} likes`);
      totalLikesAdded += numLikes;
    }
  }

  console.log(`\n✓ Added ${totalLikesAdded} total likes\n`);

  // Summary
  const finalCount = await Post.countDocuments();
  console.log('=== SUMMARY ===');
  console.log(`Total posts in database: ${finalCount}`);

  // Show posts by author
  console.log('\nPosts by author:');
  const postsByAuthor = await Post.aggregate([
    { $group: { _id: '$authorId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  for (const group of postsByAuthor) {
    const author = users.find((u: any) => u._id.toString() === group._id.toString());
    if (author) {
      console.log(`  @${author.username}: ${group.count} posts`);
    }
  }

  console.log('\n✓ Test data generation complete!');
  console.log('\nNext steps:');
  console.log('1. Log in as different users');
  console.log('2. Have some users follow each other (via profiles)');
  console.log('3. Like some posts');
  console.log('4. Refresh home page to see personalized feed and suggestions');
  process.exit(0);
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
