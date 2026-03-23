export interface Category {
  id: string;
  name: string;
  flavorSupport?: boolean;
}

export interface Dish {
  id: string;
  name: string;
  categoryId: string;
  coverEmoji?: string;
  coverImage?: string;
}

export interface CookingRecord {
  id: string;
  dishId: string;
  date: string;
  mainEmoji?: string;
  mainImage?: string;
  flavor?: string;
  rating: number;
  memo?: string;
  extraPhotos?: string[];
}
