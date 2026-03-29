/**
 * @file tag-type.ts
 * @description Tag type/category enumeration.
 * Classifies tags into broad semantic categories for content organization.
 */

/**
 * Tag classification types.
 */
const TagType = {
  /** Tags for meal times (breakfast, lunch, dinner, snack) */
  MEAL_TIME: 'meal_time' as const,
  /** Tags for cuisine types (Italian, Mexican, Indian, etc.) */
  CUISINE: 'cuisine' as const,
  /** Tags for difficulty levels (easy, medium, hard, expert) */
  DIFFICULTY: 'difficulty' as const,
  /** Tags for meal types (appetizer, main, dessert, etc.) */
  MEAL_TYPE: 'meal_type' as const
};

export type TagType = typeof TagType[keyof typeof TagType];

export default TagType;