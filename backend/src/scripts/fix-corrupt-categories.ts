import mongoose from 'mongoose';
import Category from '../models/category';

async function fixCorruptCategories() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mangotree');
    console.log('Connected to MongoDB');

    // Get all categories
    const categories = await Category.find({});
    console.log(`\nTotal categories: ${categories.length}\n`);

    console.log('All categories:');
    categories.forEach(cat => {
      console.log(`  _id: ${cat._id} (type: ${typeof cat._id}), name: ${cat.name}`);
    });

    // Check for categories with string _id or 'flex' as _id
    const corrupt = categories.filter(cat =>
      typeof cat._id === 'string' || cat._id === 'flex'
    );

    if (corrupt.length > 0) {
      console.log('\n❌ Found corrupt categories:');
      corrupt.forEach(c => console.log(`  _id: ${c._id} (type: ${typeof c._id}), name: ${c.name}`));

      for (const c of corrupt) {
        await Category.deleteOne({ _id: c._id });
        console.log(`  ✓ Deleted corrupt category: ${c.name} (_id: ${c._id})`);
      }

      console.log('\n✅ All corrupt categories removed!');
    } else {
      console.log('\n✅ No corrupt categories found.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixCorruptCategories();
