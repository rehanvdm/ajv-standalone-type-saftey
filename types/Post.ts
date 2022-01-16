export type Post = {
  title: string;
  description?: string;
  rating: number;
  createAt: Date;
}

export type NewPost = Omit<Post, "createAt">;
