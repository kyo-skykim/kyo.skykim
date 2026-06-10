// commit ไฟล์ขึ้น GitHub ผ่าน Git Data API — รองรับหลายไฟล์ใน commit เดียว
const API = "https://api.github.com";

const repo = () => process.env.GITHUB_REPO ?? "kyo-skykim/kyo.skykim";
const branch = () => process.env.GITHUB_BRANCH ?? "claude/create-blog-ypkRL";

export function isConfigured(): boolean {
  return Boolean(process.env.GITHUB_TOKEN);
}

async function gh(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${path} → ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

export interface CommitFile {
  path: string;
  content: string;
  encoding: "utf-8" | "base64";
}

export async function commitFiles(files: CommitFile[], message: string): Promise<string> {
  const r = repo();
  const b = branch();

  const ref = await gh(`/repos/${r}/git/ref/heads/${b}`);
  const headSha: string = ref.object.sha;
  const headCommit = await gh(`/repos/${r}/git/commits/${headSha}`);

  const treeEntries = [];
  for (const f of files) {
    const blob = await gh(`/repos/${r}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: f.content, encoding: f.encoding }),
    });
    treeEntries.push({ path: f.path, mode: "100644", type: "blob", sha: blob.sha });
  }

  const tree = await gh(`/repos/${r}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: headCommit.tree.sha, tree: treeEntries }),
  });

  const commit = await gh(`/repos/${r}/git/commits`, {
    method: "POST",
    body: JSON.stringify({ message, tree: tree.sha, parents: [headSha] }),
  });

  await gh(`/repos/${r}/git/refs/heads/${b}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha }),
  });

  return commit.sha;
}

export async function fileExists(path: string): Promise<boolean> {
  const res = await fetch(
    `${API}/repos/${repo()}/contents/${encodeURI(path)}?ref=${encodeURIComponent(branch())}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    }
  );
  return res.ok;
}

export async function readFile(path: string): Promise<string | null> {
  const res = await fetch(
    `${API}/repos/${repo()}/contents/${encodeURI(path)}?ref=${encodeURIComponent(branch())}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.raw+json",
      },
      cache: "no-store",
    }
  );
  if (!res.ok) return null;
  return res.text();
}
