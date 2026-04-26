/**
 * @file seed-tags.ts
 * @description Database seeding script for predefined tags with DeepL translation support.
 * Run via: `npm run seed:tags` or `ts-node src/scripts/seed-tags.ts`
 */

import mongoose from 'mongoose';
import { MONGO_URI } from '../config/env';
import Tag from '../models/tag-model';
import { getDualTranslation } from '../utils/translation';

/**
 * Utility to pause execution for a set duration.
 * Helps stay within API rate limits.
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const seedTags = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected for tag seeding');

    await Tag.deleteMany({});
    console.log('Existing tags cleared from database');

    const tags = [
      { name: 'italian' }, { name: 'chinese' }, { name: 'japanese' }, { name: 'thai' },
      { name: 'mexican' }, { name: 'indian' }, { name: 'french' }, { name: 'greek' },
      { name: 'spanish' }, { name: 'turkish' }, { name: 'american' }, { name: 'korean' },
      { name: 'vietnamese' }, { name: 'lebanese' }, { name: 'moroccan' }, { name: 'caribbean' },
      { name: 'brazilian' }, { name: 'german' }, { name: 'british' }, { name: 'mediterranean' },

      { name: 'breakfast' }, { name: 'brunch' }, { name: 'lunch' }, { name: 'dinner' },
      { name: 'late-night' }, { name: 'snack' },

      { name: 'soup' }, { name: 'salad' }, { name: 'main course' }, { name: 'side dish' },
      { name: 'dessert' }, { name: 'appetizer' }, { name: 'drink' }, { name: 'smoothie' },
      { name: 'sandwich' }, { name: 'pasta' },

      { name: 'easy' }, { name: 'medium' }, { name: 'hard' },

      { name: 'healthy' }, { name: 'vegan' }, { name: 'vegetarian' }, { name: 'gluten-free' },
      { name: 'keto' }, { name: 'low-carb' }, { name: 'high-protein' }, { name: 'dairy-free' },
      { name: 'low-fat' }, { name: 'sugar-free' },

      { name: 'bbq' }, { name: 'grill' }, { name: 'roast' }, { name: 'baked' },
      { name: 'stew' }, { name: 'fried' }, { name: 'one-pot' }, { name: 'instant pot' },
      { name: 'air fryer' }, { name: 'picnic' }, { name: 'holiday' }, { name: 'kids friendly' },
      { name: 'comfort food' }, { name: 'quick & easy' }, { name: 'party food' },
    ];

    const tagsWithTranslations = [];
    console.log(`Starting translation process for ${tags.length} tags...`);

    for (const [index, tag] of tags.entries()) {
      let retryCount = 0;
      let success = false;
      const maxRetries = 3;

      while (!success && retryCount < maxRetries) {
        try {
          const dualNames = await getDualTranslation(tag.name);
          
          tagsWithTranslations.push({
            name: dualNames.en, 
            translations: dualNames, 
            createdBy: 'System'
          });

          console.log(`[${index + 1}/${tags.length}] Processed: ${tag.name}`);
          success = true;

          await sleep(500); 

        } catch (error: any) {
          if (error.message?.includes('429')) {
            retryCount++;
            const waitTime = retryCount * 5000;
            console.warn(`Rate limit hit on "${tag.name}". Retrying in ${waitTime / 1000}s (Attempt ${retryCount})...`);
            await sleep(waitTime);
          } else {
            console.error(`Error translating "${tag.name}":`, error.message);
            break; 
          }
        }
      }
    }

    if (tagsWithTranslations.length > 0) {
      await Tag.insertMany(tagsWithTranslations);
      console.log('---');
      console.log(`Seeding Complete: ${tagsWithTranslations.length} tags inserted.`);
    } else {
      console.error('No tags were translated. Database update skipped.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Critical script failure:', err);
    process.exit(1);
  }
};

seedTags();
