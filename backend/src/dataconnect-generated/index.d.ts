import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

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

interface CreateNewUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateNewUserVariables): MutationRef<CreateNewUserData, CreateNewUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateNewUserVariables): MutationRef<CreateNewUserData, CreateNewUserVariables>;
  operationName: string;
}
export const createNewUserRef: CreateNewUserRef;

export function createNewUser(vars: CreateNewUserVariables): MutationPromise<CreateNewUserData, CreateNewUserVariables>;
export function createNewUser(dc: DataConnect, vars: CreateNewUserVariables): MutationPromise<CreateNewUserData, CreateNewUserVariables>;

interface GetUserByUsernameRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserByUsernameVariables): QueryRef<GetUserByUsernameData, GetUserByUsernameVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetUserByUsernameVariables): QueryRef<GetUserByUsernameData, GetUserByUsernameVariables>;
  operationName: string;
}
export const getUserByUsernameRef: GetUserByUsernameRef;

export function getUserByUsername(vars: GetUserByUsernameVariables): QueryPromise<GetUserByUsernameData, GetUserByUsernameVariables>;
export function getUserByUsername(dc: DataConnect, vars: GetUserByUsernameVariables): QueryPromise<GetUserByUsernameData, GetUserByUsernameVariables>;

interface CreateNewPostRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateNewPostVariables): MutationRef<CreateNewPostData, CreateNewPostVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateNewPostVariables): MutationRef<CreateNewPostData, CreateNewPostVariables>;
  operationName: string;
}
export const createNewPostRef: CreateNewPostRef;

export function createNewPost(vars: CreateNewPostVariables): MutationPromise<CreateNewPostData, CreateNewPostVariables>;
export function createNewPost(dc: DataConnect, vars: CreateNewPostVariables): MutationPromise<CreateNewPostData, CreateNewPostVariables>;

interface ListPostsByAuthorRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPostsByAuthorData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListPostsByAuthorData, undefined>;
  operationName: string;
}
export const listPostsByAuthorRef: ListPostsByAuthorRef;

export function listPostsByAuthor(): QueryPromise<ListPostsByAuthorData, undefined>;
export function listPostsByAuthor(dc: DataConnect): QueryPromise<ListPostsByAuthorData, undefined>;

