interface MarkdownMetadata {
  title: string;
  description: string;
  aliases: string[];
  date: string;
  draft: boolean;
  author: string;
  image: string;
  tags: string[];
  type?: "une" | "telex";
}

interface Post {
  id: number;
  title: string;
  slug: string;
  mobiledoc: string;
  feature_image: string;
  page: number;
  status: string;
  published_at: number;
  created_at: number;
  meta_title: string;
  author_id: number;
  created_by: number;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Tag {
  id: number;
  name: string;
}

interface PostAuthor {
  post_id: number;
  author_id: number;
}

interface PostTag {
  tag_id: number;
  post_id: number;
}

interface ExportMeta {
  exported_on: number;
  version: string;
}

interface ExportData {
  posts: Post[];
  tags: Tag[];
  users: User[];
  posts_tags: PostTag[];
  posts_authors: PostAuthor[];
  roles_users?: [];
}

interface SiteExport {
  meta: ExportMeta;
  data: ExportData;
}

interface ExportOptions {
  limit: number | undefined;
  perPage: number | undefined;
}
