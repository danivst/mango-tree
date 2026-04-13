/**
 * @file seed-tags.ts
 * @description Database seeding script for predefined tags.
 * Deletes all existing tags and creates a comprehensive set of default tags
 * categorized by cuisine, meal time, meal type, difficulty, and dietary restrictions.
 * Run via: `npm run seed:tags` or `ts-node src/scripts/seed-tags.ts`
 */

import mongoose from 'mongoose';
import { MONGO_URI } from '../config/env';
import Tag from '../models/tag-model';
import { getDualTranslation } from '../utils/translation';

const seedTags = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected for tag seeding');

    // clear existing tags
    await Tag.deleteMany({});

    const tags = [
      { name: 'italian' },
      { name: 'chinese' },
      { name: 'japanese' },
      { name: 'thai' },
      { name: 'mexican' },
      { name: 'indian' },
      { name: 'french' },
      { name: 'greek' },
      { name: 'spanish' },
      { name: 'turkish' },
      { name: 'american' },
      { name: 'korean' },
      { name: 'vietnamese' },
      { name: 'lebanese' },
      { name: 'moroccan' },
      { name: 'caribbean' },
      { name: 'brazilian' },
      { name: 'german' },
      { name: 'british' },
      { name: 'mediterranean' },

      { name: 'breakfast' },
      { name: 'brunch' },
      { name: 'lunch' },
      { name: 'dinner' },
      { name: 'late-night' },
      { name: 'snack' },

      { name: 'soup' },
      { name: 'salad' },
      { name: 'main course' },
      { name: 'side dish' },
      { name: 'dessert' },
      { name: 'appetizer' },
      { name: 'drink' },
      { name: 'smoothie' },
      { name: 'sandwich' },
      { name: 'pasta' },

      { name: 'easy' },
      { name: 'medium' },
      { name: 'hard' },

      { name: 'healthy' },
      { name: 'vegan' },
      { name: 'vegetarian' },
      { name: 'gluten-free' },
      { name: 'keto' },
      { name: 'low-carb' },
      { name: 'high-protein' },
      { name: 'dairy-free' },
      { name: 'low-fat' },
      { name: 'sugar-free' },
      { name: 'bbq' },
      { name: 'grill' },
      { name: 'roast' },
      { name: 'baked' },
      { name: 'stew' },
      { name: 'fried' },
      { name: 'one-pot' },
      { name: 'instant pot' },
      { name: 'air fryer' },
      { name: 'picnic' },
      { name: 'holiday' },
      { name: 'kids friendly' },
      { name: 'comfort food' },
      { name: 'quick & easy' },
      { name: 'party food' },
    ];

    const tagsWithTranslations = await Promise.all(
      tags.map(async (tag) => {
        const dualNames = await getDualTranslation(tag.name);
        return {
          name: dualNames.en, // Keep the primary name as English
          translations: dualNames, // Store both { en, bg }
          createdBy: 'System'
        };
      })
    );

    await Tag.insertMany(tagsWithTranslations);
    console.log(`✅ Tags seeded successfully (total: ${tagsWithTranslations.length})`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Tag seeding failed:', err);
    process.exit(1);
  }
};

seedTags();