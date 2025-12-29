const TagType = {
  MEAL_TIME: 'meal_time' as const,
  CUISINE: 'cuisine' as const,
  DIFFICULTY: 'difficulty' as const,
  MEAL_TYPE: 'meal_type' as const
};

export type TagType = typeof TagType[keyof typeof TagType];

export default TagType;