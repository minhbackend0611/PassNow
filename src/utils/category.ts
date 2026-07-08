export const getCategoryIcon = (category?: string): string => {
  if (!category) return 'category';
  
  switch (category) {
    case 'Books': return 'book';
    case 'Electronics': return 'devices';
    case 'Furniture': return 'chair';
    case 'Clothing': return 'apparel';
    case 'Other': return 'more_horiz';
    default: return 'category';
  }
};
