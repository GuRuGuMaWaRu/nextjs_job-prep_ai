type CacheTag = "users" | "interviews" | "questions" | "jobInfos";

export function getGlobalTag(tag: CacheTag) {
  return `global:${tag}` as const;
}

export function getUserTag(userId: string, tag: CacheTag) {
  return `user:${userId}:${tag}` as const;
}

export function getIdTag(id: string, tag: CacheTag) {
  return `id:${id}:${tag}` as const;
}
