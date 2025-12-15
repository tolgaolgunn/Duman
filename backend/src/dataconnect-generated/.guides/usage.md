# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createNewUser, getUserByUsername, createNewPost, listPostsByAuthor } from '@dataconnect/generated';


// Operation CreateNewUser:  For variables, look at type CreateNewUserVars in ../index.d.ts
const { data } = await CreateNewUser(dataConnect, createNewUserVars);

// Operation GetUserByUsername:  For variables, look at type GetUserByUsernameVars in ../index.d.ts
const { data } = await GetUserByUsername(dataConnect, getUserByUsernameVars);

// Operation CreateNewPost:  For variables, look at type CreateNewPostVars in ../index.d.ts
const { data } = await CreateNewPost(dataConnect, createNewPostVars);

// Operation ListPostsByAuthor: 
const { data } = await ListPostsByAuthor(dataConnect);


```