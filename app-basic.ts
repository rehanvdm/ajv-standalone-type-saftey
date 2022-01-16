import {Post} from "./types/Post";
import {Blog} from "./types/Blog";
import {DateTime} from "luxon";
import {ValidateFunction} from "ajv";
import * as validations from './types/schemas/validations';

const blog: Blog = {
  site: "rehanvdm.com",
  email: "rehan.nope@gmail.com",
  about: "My blog, the one I never have time to write for but do it anyway.",
  posts: [{
    title: "Valid Post",
    rating: 5,
    createAt: DateTime.now().toJSDate()
  }]
};
let postInValid = {
  title: "Invalid Post! Missing createAt, forcing by casting",
  rating: 1
} as Post;
blog.posts.push(postInValid);


const validateBlog = validations.Blog as ValidateFunction<Blog>;
if(!validateBlog)
  throw new Error("Validate not defined, schema not found");

/* Casting to and from JSON forces the object to be represented in its primitive types.
*  The Date object for example will be forced to a ISO 8601 representation which is what we want */
if(!validateBlog(JSON.parse(JSON.stringify(blog))))
{
  console.error(validateBlog.errors);
  console.error(JSON.stringify(validateBlog.errors));
  throw new Error("Blog not valid");
}
