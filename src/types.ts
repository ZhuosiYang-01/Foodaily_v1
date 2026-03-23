export type Category = {
  id: string;
  name: string;
  icon: string; // 可以是 emoji 或 lucide 图标名
  supportsTaste: boolean;
  order: number;
};

export type Work = {
  id: string;
  categoryId: string;
  name: string;
  coverImage: string; // 图片 URL 或 base64 或 emoji
  isEmojiCover: boolean;
  createdAt: number;
  updatedAt: number;
};

export type RecordEntry = {
  id: string;
  workId: string;
  date: string; // YYYY-MM-DD
  title: string; // 记录名称
  taste?: string; // 口味
  evaluation: string; // 评价
  notes: string; // 备忘
  mainImage: string;
  isEmojiMain: boolean;
  extraImages: string[];
  createdAt: number;
};

export type AppData = {
  categories: Category[];
  works: Work[];
  records: RecordEntry[];
};

export type MonthlyStats = {
  [categoryName: string]: number;
};
