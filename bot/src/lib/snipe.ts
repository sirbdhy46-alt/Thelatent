export type SnipedMessage = {
  content: string;
  author: string;
  at: number;
};

export type EditSniped = {
  before: string;
  after: string;
  author: string;
  at: number;
};

export const snipeCache = new Map<string, SnipedMessage>();
export const editSnipeCache = new Map<string, EditSniped>();
