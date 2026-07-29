import { prisma } from "@/lib/db";
import { worksContent, profileContent } from "@/data/works-content";

export type SyncResult = {
  worksCreated: number;
  worksUpdated: number;
  profileUpdated: boolean;
  githubImported: number;
  message: string;
};

export async function syncCuratedWorks(options?: {
  updateProfile?: boolean;
}): Promise<Pick<SyncResult, "worksCreated" | "worksUpdated" | "profileUpdated">> {
  let worksCreated = 0;
  let worksUpdated = 0;

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

    if (existing) {
      await prisma.work.update({ where: { id: existing.id }, data });
      worksUpdated += 1;
    } else {
      await prisma.work.create({ data });
      worksCreated += 1;
    }
  }

  let profileUpdated = false;
  if (options?.updateProfile !== false) {
    const profile = await prisma.profile.findFirst();
    if (profile) {
      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          name: profileContent.name,
          title: profileContent.title,
          tagline: profileContent.tagline,
          bio: profileContent.bio,
          email: profileContent.email,
          location: profileContent.location,
          github: profileContent.github,
          website: profileContent.website,
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

  return { worksCreated, worksUpdated, profileUpdated };
}

/** Import public GitHub repos that are not already curated by title. */
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
    const description =
      repo.description ||
      `来自 GitHub 的公开仓库 ${repo.name}，最近更新 ${repo.updated_at.slice(0, 10)}。`;
    const tags = ["GitHub", repo.language, "自动同步"].filter(Boolean).join(",");
    const content = `## 自动同步自 GitHub

仓库：[${repo.name}](${repo.html_url})

${repo.description || "_暂无描述_"}

- 语言：${repo.language || "未知"}
- Stars：${repo.stargazers_count}
- 最近更新：${repo.updated_at.slice(0, 10)}

> 精选项目请编辑 \`src/data/works-content.ts\`；本卡片由 GitHub API 自动导入。
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
      await prisma.work.create({ data });
      imported += 1;
    }
  }

  return imported;
}

export async function runFullSync(githubUser = "Az0998"): Promise<SyncResult> {
  const curated = await syncCuratedWorks({ updateProfile: true });
  let githubImported = 0;
  try {
    githubImported = await syncGithubRepos(githubUser);
  } catch {
    githubImported = 0;
  }

  return {
    ...curated,
    githubImported,
    message: `精选更新 ${curated.worksUpdated} · 新建 ${curated.worksCreated} · GitHub 导入 ${githubImported}`,
  };
}
