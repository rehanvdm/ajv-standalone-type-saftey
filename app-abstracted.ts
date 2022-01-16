import {Post} from "./types/Post";
import {Blog} from "./types/Blog";
import {DateTime} from "luxon";
import {ValidateFunction, ErrorObject} from "ajv";
import * as validations from './types/schemas/validations';

class TypeError extends Error {
  public ajvErrors: ErrorObject[];
  constructor(ajvErrors: ErrorObject[]) {
    super(JSON.stringify(ajvErrors));
    this.name = "TypeError";
    this.ajvErrors = ajvErrors;
  }
}

function ensureType<T>(
  validationFunc: ((data: any, { instancePath, parentData, parentDataProperty, rootData }?: {
    instancePath?: string;
    parentData: any;
    parentDataProperty: any;
    rootData?: any;
  }) => boolean),
  data: T): T
{
  const validate = validationFunc as ValidateFunction<T>;
  if(!validate)
    throw new Error("Validate not defined, schema not found");

  /* Casting to and from JSON forces the object to be represented in its primitive types.
   *  The Date object for example will be forced to a ISO 8601 representation which is what we want */
  const isValid = validate(JSON.parse(JSON.stringify(data)));
  if(!isValid)
    throw new TypeError(validate.errors!);

  return data;
}


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

try
{
  /* Passes */
  let another: Post = ensureType<Post>(validations.Post, {
    title: "Quick way to ensure type is valid",
    description: "Just initiate differently like this",
    createAt: DateTime.now().toJSDate(),
    rating: 5
  });

  /* Fails, similar to the basic test */
  ensureType<Blog>(validations.Blog, blog);
}
catch (err)
{
  if(err instanceof TypeError)
    console.log("TYPE ERROR WITH STACK:", err.ajvErrors, err.stack);
  else if(err instanceof Error)
    console.log("ERROR:", err)
  else
    throw err;
}
