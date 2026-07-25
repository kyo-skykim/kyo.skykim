// commit ไฟล์ขึ้น GitHub ผ่าน Git Data API — รองรับหลายไฟล์ใน commit เดียว
const API = "https://api.github.com";

const repo = () => process.env.GITHUB_REPO ?? "kyo-skykim/kyo.skykim";
const branch = () => process.env.GITHUB_BRANCH ?? "main";

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

export async function readFileAtRef(path: string, ref: string): Promise<string | null> {
  const res = await fetch(
    `${API}/repos/${repo()}/contents/${encodeURI(path)}?ref=${encodeURIComponent(ref)}`,
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

export async function readFileBase64AtRef(path: string, ref: string): Promise<string | null> {
  const data = await gh(
    `/repos/${repo()}/contents/${encodeURI(path)}?ref=${encodeURIComponent(ref)}`
  );
  if (!data || data.type !== "file" || typeof data.content !== "string") return null;
  return data.content.replace(/\s/g, "");
}

export interface FileHistoryItem {
  sha: string;
  message: string;
  date: string;
  url: string;
}

export async function getFileHistory(
  path: string,
  limit = 10
): Promise<FileHistoryItem[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 20);
  const commits = await gh(
    `/repos/${repo()}/commits?path=${encodeURIComponent(path)}&sha=${encodeURIComponent(branch())}&per_page=${safeLimit}`
  );
  if (!Array.isArray(commits)) return [];
  return commits.map((item: {
    sha?: string;
    html_url?: string;
    commit?: {
      message?: string;
      committer?: { date?: string };
      author?: { date?: string };
    };
  }) => ({
    sha: item.sha ?? "",
    message: item.commit?.message?.split("\n")[0] ?? "CV / About update",
    date: item.commit?.committer?.date ?? item.commit?.author?.date ?? "",
    url: item.html_url ?? "",
  })).filter((item: FileHistoryItem) => Boolean(item.sha));
}

export async function deleteFile(filePath: string, message: string): Promise<void> {
  const r = repo();
  const b = branch();
  // ดึง SHA ของไฟล์ก่อนลบ
  const infoRes = await fetch(
    `${API}/repos/${r}/contents/${encodeURI(filePath)}?ref=${encodeURIComponent(b)}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    }
  );
  if (!infoRes.ok) {
    const text = await infoRes.text();
    throw new Error(`ไม่พบไฟล์ ${filePath}: ${infoRes.status} ${text.slice(0, 200)}`);
  }
  const info = await infoRes.json();
  const sha: string = info.sha;

  await gh(`/repos/${r}/contents/${encodeURI(filePath)}`, {
    method: "DELETE",
    body: JSON.stringify({ message, sha, branch: b }),
  });
}

export async function listFiles(dir: string): Promise<string[]> {
  const r = repo();
  const b = branch();
  const res = await fetch(
    `${API}/repos/${r}/contents/${encodeURI(dir)}?ref=${encodeURIComponent(b)}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    }
  );
  if (!res.ok) return [];
  const items = await res.json();
  if (!Array.isArray(items)) return [];
  return items
    .filter((item: { type: string; name: string }) => item.type === "file")
    .map((item: { name: string }) => item.name);
}

export interface PublishStatus {
  repository: string;
  branch: string;
  commitSha: string;
  commitMessage: string;
  commitUrl: string;
  updatedAt: string;
  state: "success" | "pending" | "failure" | "unknown";
  checks: Array<{ name: string; status: string; conclusion: string | null; url?: string }>;
}

export async function getPublishStatus(): Promise<PublishStatus> {
  const r = repo();
  const b = branch();
  const ref = await gh(`/repos/${r}/git/ref/heads/${encodeURIComponent(b)}`);
  const commitSha: string = ref.object.sha;
  const [commit, combined, checkRuns] = await Promise.all([
    gh(`/repos/${r}/commits/${commitSha}`),
    gh(`/repos/${r}/commits/${commitSha}/status`),
    gh(`/repos/${r}/commits/${commitSha}/check-runs`),
  ]);

  const checks = Array.isArray(checkRuns.check_runs)
    ? checkRuns.check_runs.map((check: {
        name?: string;
        status?: string;
        conclusion?: string | null;
        html_url?: string;
      }) => ({
        name: check.name ?? "Deployment",
        status: check.status ?? "queued",
        conclusion: check.conclusion ?? null,
        ...(check.html_url ? { url: check.html_url } : {}),
      }))
    : [];

  const failed = checks.some((check: { conclusion: string | null }) =>
    ["failure", "cancelled", "timed_out", "action_required"].includes(check.conclusion ?? "")
  );
  const pending = checks.some((check: { status: string }) => check.status !== "completed");
  const successful = checks.length > 0 && checks.every(
    (check: { conclusion: string | null }) =>
      ["success", "neutral", "skipped"].includes(check.conclusion ?? "")
  );

  let state: PublishStatus["state"] = "unknown";
  if (failed || combined.state === "failure" || combined.state === "error") state = "failure";
  else if (pending || combined.state === "pending") state = "pending";
  else if (successful || combined.state === "success") state = "success";

  return {
    repository: r,
    branch: b,
    commitSha,
    commitMessage: commit.commit?.message?.split("\n")[0] ?? "Content update",
    commitUrl: commit.html_url ?? `https://github.com/${r}/commit/${commitSha}`,
    updatedAt: commit.commit?.committer?.date ?? "",
    state,
    checks,
  };
}
