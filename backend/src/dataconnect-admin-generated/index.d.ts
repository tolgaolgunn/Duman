import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export interface Comment_Key {
  id: UUIDString;
  __typename?: 'Comment_Key';
}

export interface CreateNewPostData {
  post_insert: Post_Key;
}

export interface CreateNewPostVariables {
  content: string;
  imageUrl?: string | null;
}

export interface CreateNewUserData {
  user_insert: User_Key;
}

export interface CreateNewUserVariables {
  username: string;
  email: string;
  passwordHash: string;
}

export interface Follow_Key {
  followerId: UUIDString;
  followingId: UUIDString;
  __typename?: 'Follow_Key';
}

export interface GetUserByUsernameData {
  users: ({
    id: UUIDString;
    username: string;
    email: string;
    passwordHash: string;
  } & User_Key)[];
}

export interface GetUserByUsernameVariables {
  username: string;
}

export interface Like_Key {
  id: UUIDString;
  __typename?: 'Like_Key';
}

export interface ListPostsByAuthorData {
  posts: ({
    id: UUIDString;
    content: string;
    imageUrl?: string | null;
    createdAt: TimestampString;
  } & Post_Key)[];
}

export interface Notification_Key {
  id: UUIDString;
  __typename?: 'Notification_Key';
}

export interface Post_Key {
  id: UUIDString;
  __typename?: 'Post_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

/** Generated Node Admin SDK operation action function for the 'CreateNewUser' Mutation. Allow users to execute without passing in DataConnect. */
export function createNewUser(dc: DataConnect, vars: CreateNewUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateNewUserData>>;
/** Generated Node Admin SDK operation action function for the 'CreateNewUser' Mutation. Allow users to pass in custom DataConnect instances. */
export function createNewUser(vars: CreateNewUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateNewUserData>>;

/** Generated Node Admin SDK operation action function for the 'GetUserByUsername' Query. Allow users to execute without passing in DataConnect. */
export function getUserByUsername(dc: DataConnect, vars: GetUserByUsernameVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetUserByUsernameData>>;
/** Generated Node Admin SDK operation action function for the 'GetUserByUsername' Query. Allow users to pass in custom DataConnect instances. */
export function getUserByUsername(vars: GetUserByUsernameVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetUserByUsernameData>>;

/** Generated Node Admin SDK operation action function for the 'CreateNewPost' Mutation. Allow users to execute without passing in DataConnect. */
export function createNewPost(dc: DataConnect, vars: CreateNewPostVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateNewPostData>>;
/** Generated Node Admin SDK operation action function for the 'CreateNewPost' Mutation. Allow users to pass in custom DataConnect instances. */
export function createNewPost(vars: CreateNewPostVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateNewPostData>>;

/** Generated Node Admin SDK operation action function for the 'ListPostsByAuthor' Query. Allow users to execute without passing in DataConnect. */
export function listPostsByAuthor(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListPostsByAuthorData>>;
/** Generated Node Admin SDK operation action function for the 'ListPostsByAuthor' Query. Allow users to pass in custom DataConnect instances. */
export function listPostsByAuthor(options?: OperationOptions): Promise<ExecuteOperationResponse<ListPostsByAuthorData>>;

