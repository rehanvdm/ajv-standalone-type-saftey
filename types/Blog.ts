import {Post} from "./Post";

export type Blog = {
  site: string;
  about: string;
  email: string;
  // twitter: string; //Test watch command
  posts: Post[];
};
