/**
 * @file seed-tags.ts
 * @description Database seeding script for predefined tags.
 * Deletes all existing tags and creates a comprehensive set of default tags
 * categorized by cuisine, meal time, meal type, difficulty, and dietary restrictions.
 * Run via: `npm run seed:tags` or `ts-node src/scripts/seed-tags.ts`
 */

import mongoose from 'mongoose';
import { MONGO_URI } from '../config/env';
import Tag from '../models/tag';
import TagType from '../enums/tag-type';

const seedTags = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('mongodb connected for tag seeding');

    // clear existing tags
    await Tag.deleteMany({});

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

    await Tag.insertMany(tags);
    console.log(`✅ Tags seeded successfully (total: ${tags.length})`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Tag seeding failed:', err);
    process.exit(1);
  }
};

seedTags();