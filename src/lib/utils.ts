export function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return [];
  return tags.split(",").map((t) => t.trim()).filter(Boolean);
}

export function joinTags(tags: string[]): string {
  return tags.join(", ");
}

export const WORK_CATEGORIES = [
  { value: "project", label: "项目" },
  { value: "paper", label: "论文" },
  { value: "design", label: "设计" },
  { value: "code", label: "代码" },
  { value: "media", label: "媒体" },
  { value: "other", label: "其他" },
] as const;

export function getCategoryLabel(category: string): string {
  return WORK_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}
