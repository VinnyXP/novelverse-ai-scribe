export interface AIModel {
  name: string;
  displayName: string;
  isAvailable: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  token: string;
}

export interface Tag {
  id: string;
  name: string;
  description?: string;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
  volumeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Volume {
  id: string;
  title: string;
  order: number;
  storyId: string;
  createdAt: string;
  updatedAt: string;
  chapters: Chapter[];
}

export interface Story {
  id: string;
  title: string;
  synopsis: string;
  coverImage: string;
  authorId: string;
  authorName: string;
  tags: { id: string; name: string }[];
  volumes: Volume[];
  createdAt: string;
  updatedAt: string;
  views: number;
  likes: number;
  isPublished: boolean;
}

export interface StoryCreationSettings {
  title: string;
  synopsis: string;
  tags: string[];
  volumeCount: number;
  chaptersPerVolume: number;
  aiModel: string;
  isPublished: boolean;
  coverImage?: string;
}
