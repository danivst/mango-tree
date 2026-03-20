# Test Data for Home Page

These scripts will generate test data so you can test the new Home page features:

- Search functionality
- Personalised feed (followed users' posts)
- Suggested posts (algorithmic recommendations)
- Infinite scroll

## Prerequisites

1. MongoDB is running
2. Backend `.env` file is configured with `MONGO_URI`
3. At least one user exists in the database (register via the app)
4. The required categories (`recipe`, `flex`, `question`) exist in the database

## Step 1: Create Required Categories (Optional)

If you haven't created the three main categories yet, run:

```bash
cd backend
npm run dev:scripts ensure-categories.ts
# OR if using ts-node directly:
npx ts-node src/scripts/ensure-categories.ts
```

This will create the `recipe`, `flex`, and `question` categories if they don't exist already.

## Step 2: Generate Test Posts

Run the main seeding script:

```bash
cd backend
npm run dev:scripts quick-seed-posts.ts
# OR:
npx ts-node src/scripts/quick-seed-posts.ts
```

What this script does:
- Finds existing users in the database
- Creates 12 sample posts with:
  - Realistic titles and content
  - Proper category assignments (`recipe`, `flex`, `question`)
  - Relevant tags (5 tags per post)
  - Random dates within the last 30 days
- Adds random likes (0-5 per post) from various users

## Step 3: Create Follow Relationships

To test the **followed users feed**, you need to have some users following each other.

**Manual method** (recommended for testing):
1. Log in as one user
2. Go to `/search` → `/users` (or Search page)
3. Follow a few users
4. Log out, log in as another user
5. Follow some different users

This will populate the `following` arrays in the User model.

**OR use the automated script** (seed-homepage-test.ts) which creates all of this, but you'll need to run it once on a fresh database.

## Step 4: Generate More Posts and Interactions

The quick-seed creates 12 posts. To get more content for infinite scroll testing, you can run the script multiple times or modify it to create more. Alternatively, use the full-featured seed script:

```bash
npx ts-node src/scripts/seed-homepage-test.ts
```

⚠️ **WARNING**: This script creates:
- 6 new test users (alice, bob, chris, dana, eddie, fiona)
- 17 posts total across different categories
- Comments on posts
- Follow relationships

Only run this on a **fresh database** or if you want the full test dataset.

## Step 5: Test the Home Page

1. Start the frontend dev server (`npm run dev` in `frontend/`)
2. Log in as a user who follows at least 2-3 other users
3. Go to the Home page (`/`)

Expected Behavior:
- **Initial load**: Shows "Posts from people you follow" section with posts from followed users
- **Below that**: "Suggested for you" section appears with posts based on your likes, comments, and followed categories/tags
- **Top search bar**: Type to search across post titles, content, and tags
- **Infinite scroll**: Scroll down, more posts load automatically

### Test Scenarios

1. **Search**
   - Type a keyword like "yoga" or "pasta"
   - Should show posts matching that term in title/content/tags
   - Clear search → returns to feed

2. **Followed Feed**
   - If you follow users, their posts appear in the first section
   - Unfollow someone → their posts disappear after refresh

3. **Suggested Feed**
   - Like a post about "fitness" → more fitness-related posts appear
   - Comment on posts → similar topic posts get boosted
   - Posts from users you follow should NOT duplicate across sections

4. **No Follows Scenario**
   - If a user follows nobody, they directly see "Suggested for you" posts
   - Welcome message explains they should follow users

5. **Empty States**
   - No posts yet → appropriate message
   - Search returns nothing → "No posts found"

## Data Structure

The generated posts include:
- Covers health/fitness (flex category)
- Covers recipes (recipe category)
- Covers Q&A/discussions (question category)
- Mix of authors
- Various tags for search testing
- Different creation dates for recency scoring

## Tips for Manual Testing

- Create 2-3 users in the app
- As User A: follow User B and User C
- As User A: like 5 posts (some from B/C, some not)
- As User A: comment on 2-3 posts
- Refresh Home → check both sections appear are personalised

- As User B (who A follows): create some posts in categories A likes
- As User A: refresh Home → User B's posts should appear in "Followed" section

## Troubleshooting

**No posts appear in Home?**
- Ensure `isVisible: true` and `isApproved: true` on posts
- Check that you're logged in (Home requires auth)
- Check browser console for API errors

**Only suggested appears, no followed?**
- You may not be following anyone, or followed users have no visible posts
- Follow some users who have posts
- Ensure the followed users' posts have `isVisible: true`

**Search not working?**
- Check that the MongoDB text index exists. If not, restart backend after adding indexes in `post.ts`
- Search uses MongoDB `$text` operator which requires a text index

**Infinite scroll not loading?**
- Need at least 20+ posts total for scroll to trigger
- Check Network tab for API calls to `/posts/followed` or `/posts/suggested` with skip/limit
