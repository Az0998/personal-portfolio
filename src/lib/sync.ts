import { prisma } from "@/lib/db";
import { worksContent, profileContent } from "@/data/works-content";

export type SyncResult = {
  worksCreated: number;
  worksUpdated: number;
  worksSkipped: number;
  profileUpdated: boolean;
  githubImported: number;
  message: string;
};

export async function syncCuratedWorks(options?: {
  /** 默认 false：不覆盖个人资料 */
  updateProfile?: boolean;
  /** 默认 false：不覆盖已锁定作品；true 时强制用仓库文案覆盖（仍保留 coverImage） */
  forceOverwrite?: boolean;
}): Promise<
  Pick<SyncResult, "worksCreated" | "worksUpdated" | "worksSkipped" | "profileUpdated">
> {
  const force = Boolean(options?.forceOverwrite);
  let worksCreated = 0;
  let worksUpdated = 0;
  let worksSkipped = 0;

  for (const work of worksContent) {
    const existing = await prisma.work.findFirst({ where: { title: work.title } });
    const data = {
      title: work.title,
      description: work.description,
      content: work.content,
      category: work.category,
      tags: work.tags,
      featured: work.featured,
      published: work.published,
      sortOrder: work.sortOrder,
      github: work.github ?? null,
      link: work.link ?? null,
    };

    if (!existing) {
      await prisma.work.create({ data: { ...data, locked: false } });
      worksCreated += 1;
      continue;
    }

    // 默认跳过已有作品；仅勾选「强制覆盖」时才用仓库文案覆盖（含已保护条目）
    if (!force) {
      worksSkipped += 1;
      continue;
    }

    await prisma.work.update({ where: { id: existing.id }, data });
    worksUpdated += 1;
  }

  let profileUpdated = false;
  if (options?.updateProfile === true) {
    const profile = await prisma.profile.findFirst();
    if (profile) {
      // 仅覆盖仓库声明的文本字段；头像/赞助/电话/微信等后台字段一律保留
      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          name: profileContent.name,
          title: profileContent.title,
          tagline: profileContent.tagline,
          bio: profileContent.bio,
          github: profileContent.github,
          website: profileContent.website,
          location: profileContent.location || profile.location,
        },
      });
      profileUpdated = true;
    } else {
      await prisma.profile.create({
        data: { id: "default-profile", ...profileContent },
      });
      profileUpdated = true;
    }
  }

  return { worksCreated, worksUpdated, worksSkipped, profileUpdated };
}

export async function syncGithubRepos(username: string): Promise<number> {
  const res = await fetch(
    `https://api.github.com/users/${username}/repos?per_page=30&sort=updated`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "personal-portfolio-sync",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) return 0;

  const repos = (await res.json()) as Array<{
    name: string;
    description: string | null;
    html_url: string;
    language: string | null;
    fork: boolean;
    stargazers_count: number;
    updated_at: string;
  }>;

  let imported = 0;
  const curatedTitles = new Set(worksContent.map((w) => w.title));

  for (const repo of repos) {
    if (repo.fork) continue;
    if (repo.name === "personal-portfolio") continue;

    const title = `GitHub · ${repo.name}`;
    if (curatedTitles.has(title)) continue;

    const existing = await prisma.work.findFirst({ where: { title } });
    if (existing?.locked) continue;

    const description =
      repo.description ||
      `来自 GitHub 的公开仓库 ${repo.name}，最近更新 ${repo.updated_at.slice(0, 10)}。`;
    const tags = ["GitHub", repo.language, "自动同步"].filter(Boolean).join(",");
    const content = `## GitHub 仓库

[${repo.name}](${repo.html_url})

${repo.description || "_暂无描述_"}

- 语言：${repo.language || "未知"}
- Stars：${repo.stargazers_count}
- 最近更新：${repo.updated_at.slice(0, 10)}
`;

    const data = {
      title,
      description,
      content,
      category: "code",
      tags,
      featured: false,
      published: true,
      sortOrder: 100 + imported,
      github: repo.html_url,
      link: repo.html_url,
    };

    if (existing) {
      await prisma.work.update({ where: { id: existing.id }, data });
    } else {
      await prisma.work.create({ data: { ...data, locked: false } });
      imported += 1;
    }
  }

  return imported;
}

export async function runFullSync(
  githubUser = "Az0998",
  options?: { updateProfile?: boolean; forceOverwrite?: boolean }
): Promise<SyncResult> {
  const curated = await syncCuratedWorks({
    updateProfile: options?.updateProfile === true,
    forceOverwrite: options?.forceOverwrite === true,
  });
  let githubImported = 0;
  try {
    githubImported = await syncGithubRepos(githubUser);
  } catch {
    githubImported = 0;
  }

  return {
    ...curated,
    githubImported,
    message: `新建 ${curated.worksCreated} · 更新 ${curated.worksUpdated} · 跳过锁定 ${curated.worksSkipped} · GitHub ${githubImported}${
      curated.profileUpdated ? " · 已覆盖资料文案" : " · 资料未动"
    }`,
  };
}
