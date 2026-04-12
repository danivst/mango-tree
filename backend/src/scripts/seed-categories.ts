/**
 * @file seed-categories.ts
 * @description Database seeding script for initial categories.
 * Deletes all existing categories and creates default ones: question, flex, recipe.
 * Run via: `npm run seed:categories` or `ts-node src/scripts/seed-categories.ts`
 */

import mongoose from 'mongoose';
import { MONGO_URI } from '../config/env';
import Category from '../models/category-model';

const seedCategories = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected for category seeding');

    // clear existing categories
    await Category.deleteMany({});

    const categories = ['question', 'flex', 'recipe'];

    await Category.insertMany(
      categories.map((name) => ({ name }))
    );

    console.log('✅ Categories seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Category seeding failed:', err);
    process.exit(1);
  }
};

seedCategories();