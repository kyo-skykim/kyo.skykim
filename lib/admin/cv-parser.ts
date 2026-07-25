import type { CvAboutData } from "./cv-types";

type SectionKey =
  | "profile"
  | "education"
  | "research"
  | "experience"
  | "skills"
  | "languages"
  | "certifications";

type DatedBlock = {
  year: string;
  header: string[];
  items: string[];
};

const YEAR_LINE = /^((?:19|20|25)\d{2}(?:\s*[–—-]\s*(?:(?:19|20|25)\d{2}|Present|Current|Now|ปัจจุบัน))?)\s+(.+)$/i;
const BULLET_LINE = /^[•●▪◦*+\-«]\s*(.*)$/;

function cleanLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeText(value: string): string {
  return value
    .replace(/\r/g, "")
    .replace(/\f/g, "\n")
    .replace(/([A-Za-z])-\s*\n\s*([a-z])/g, "$1$2")
    .replace(/\bdatadriven\b/gi, "data-driven")
    .split("\n")
    .map(cleanLine)
    .filter(Boolean)
    .join("\n");
}

function headingKey(line: string): SectionKey | null {
  const heading = line
    .toUpperCase()
    .replace(/[.:]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (/^(PROFILE|ABOUT|PROFESSIONAL SUMMARY|SUMMARY|ประวัติส่วนตัว|สรุป)$/.test(heading)) return "profile";
  if (/^(EDUCATION(?:AL BACKGROUND)?|การศึกษา)$/.test(heading)) return "education";
  if (/^(RESEARCH(?: PROJECTS?)?|PROJECTS?|PORTFOLIO|งานวิจัย|ผลงาน|โครงการ)$/.test(heading)) return "research";
  if (/^((WORK )?EXPERIENCES?(?: & ACTIVITIES)?|ประสบการณ์|ประสบการณ์ทำงาน)$/.test(heading)) return "experience";
  if (/^((TECHNICAL )?SKILLS|ทักษะ|ความสามารถ)$/.test(heading)) return "skills";
  if (/^(LANGUAGES?|ภาษา)$/.test(heading)) return "languages";
  if (/^(CERTIFICATIONS?(?: & AWARDS)?|ใบรับรอง|ประกาศนียบัตร)$/.test(heading)) return "certifications";
  return null;
}

function splitSections(text: string): {
  header: string[];
  sections: Partial<Record<SectionKey, string[]>>;
} {
  const header: string[] = [];
  const sections: Partial<Record<SectionKey, string[]>> = {};
  let current: SectionKey | null = null;

  for (const line of text.split("\n")) {
    const next = headingKey(line);
    if (next) {
      if (current === next) {
        sections[current]!.push(line);
        continue;
      }
      current = next;
      sections[current] ??= [];
      continue;
    }
    if (current) sections[current]!.push(line);
    else header.push(line);
  }

  return { header, sections };
}

function splitCommaList(value: string): string[] {
  const items: string[] = [];
  let buffer = "";
  let depth = 0;

  for (const char of value) {
    if (char === "(" || char === "[") depth += 1;
    if (char === ")" || char === "]") depth = Math.max(0, depth - 1);
    if (char === "," && depth === 0) {
      if (buffer.trim()) items.push(buffer.trim());
      buffer = "";
    } else {
      buffer += char;
    }
  }
  if (buffer.trim()) items.push(buffer.trim());
  return items;
}

function collectListItems(lines: string[], numbered = false): string[] {
  const result: string[] = [];
  const marker = numbered ? /^\d+[.)]\s*(.*)$/ : BULLET_LINE;

  for (const line of lines) {
    const match = marker.exec(line);
    if (match) {
      if (match[1]?.trim()) result.push(match[1].trim());
    } else if (result.length > 0) {
      result[result.length - 1] = `${result[result.length - 1]} ${line}`.trim();
    } else if (line.trim()) {
      result.push(line.trim());
    }
  }
  return result.map(cleanLine).filter(Boolean);
}

function splitDatedBlocks(lines: string[]): DatedBlock[] {
  const blocks: DatedBlock[] = [];
  let current: DatedBlock | null = null;
  let readingItems = false;

  for (const line of lines) {
    const dated = YEAR_LINE.exec(line);
    if (dated) {
      current = { year: cleanLine(dated[1]), header: [cleanLine(dated[2])], items: [] };
      blocks.push(current);
      readingItems = false;
      continue;
    }
    if (!current) continue;

    const bullet = BULLET_LINE.exec(line);
    if (bullet) {
      readingItems = true;
      if (bullet[1]?.trim()) current.items.push(bullet[1].trim());
      continue;
    }
    if (readingItems && current.items.length > 0) {
      current.items[current.items.length - 1] = `${current.items[current.items.length - 1]} ${line}`.trim();
    } else {
      current.header.push(line);
    }
  }

  return blocks.map((block) => ({
    ...block,
    header: block.header.map(cleanLine).filter(Boolean),
    items: block.items.map(cleanLine).filter(Boolean),
  }));
}

function contactFromHeader(
  header: string[],
  current: CvAboutData["profile"]
): CvAboutData["profile"] {
  const email = header.find((line) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(line));
  const phone = header.find(
    (line) => !/(?:19|20)\d{2}/.test(line) && /^\+?[\d()\s.-]{8,}$/.test(line)
  );
  const linkedin = header.find((line) => /linkedin\.com/i.test(line));
  const github = header.find((line) => /github\.com/i.test(line));
  const website = header.find(
    (line) =>
      /^https?:\/\//i.test(line) &&
      !/linkedin\.com|github\.com/i.test(line)
  );
  const plain = header.filter(
    (line) =>
      !/^https?:\/\//i.test(line) &&
      !line.includes("@") &&
      line !== phone
  );
  const name = plain[0] || current.name;
  const nickname = plain[1] && !plain[1].includes(",") ? plain[1] : current.nickname;
  const location =
    plain.find((line, index) => index > 0 && /,\s*[A-Za-z ]+$/.test(line)) ||
    plain[2] ||
    current.location;

  return {
    ...current,
    name,
    nickname,
    location,
    phone: phone || current.phone,
    email: email || current.email,
    linkedin: linkedin || current.linkedin,
    ...(github ? { github } : current.github ? { github: current.github } : {}),
    ...(website ? { website } : current.website ? { website: current.website } : {}),
  };
}

function parseSkills(lines: string[]): CvAboutData["skills"] {
  return collectListItems(lines)
    .map((line) => {
      const separator = line.indexOf(":");
      if (separator < 1) return { category: "Other", items: splitCommaList(line) };
      return {
        category: cleanLine(line.slice(0, separator)),
        items: splitCommaList(line.slice(separator + 1)),
      };
    })
    .filter((entry) => entry.items.length > 0);
}

function parseLanguages(lines: string[]): CvAboutData["languages"] {
  const levelPattern =
    /(Native|Fluent|Advanced|Upper Intermediate|Intermediate|Pre-Intermediate|Elementary|Beginner|Beginning|Basic|Professional Working Proficiency|Limited Working Proficiency|เจ้าของภาษา|ดีมาก|ดี|ปานกลาง|พื้นฐาน)$/i;

  return lines
    .map((line) => {
      const match = levelPattern.exec(line);
      if (!match) return null;
      return {
        lang: cleanLine(line.slice(0, match.index)),
        level: cleanLine(match[1]),
      };
    })
    .filter((entry): entry is CvAboutData["languages"][number] => Boolean(entry?.lang));
}

function parseEducation(
  lines: string[],
  current: CvAboutData["education"]
): CvAboutData["education"] {
  return splitDatedBlocks(lines).map((block) => {
    const joined = block.header.join(" ");
    const existing = current.find(
      (item) => item.year === block.year && joined.toLowerCase().includes(item.degree.toLowerCase())
    );
    if (existing) {
      const firstLine = block.header[0] ?? joined;
      const degreeIndex = firstLine.toLowerCase().indexOf(existing.degree.toLowerCase());
      const afterDegree = firstLine.slice(degreeIndex + existing.degree.length).trim();
      const schoolName = block.header.slice(1).join(" ").trim();
      const school =
        [schoolName, afterDegree].filter(Boolean).join(" · ") ||
        existing.school;
      return {
        year: block.year,
        degree: firstLine.slice(degreeIndex, degreeIndex + existing.degree.length),
        school,
      };
    }

    const locationMatch = joined.match(/\b([A-Za-z][A-Za-z .-]+,\s*Thailand|Thailand)$/i);
    const location = locationMatch?.[1] ?? "";
    const first = block.header[0] ?? "";
    const degree = cleanLine(location ? first.replace(locationMatch![0], "") : first);
    const schoolBase = block.header.slice(1).join(" ").trim();
    return {
      year: block.year,
      degree: degree || joined,
      school: [schoolBase, location].filter(Boolean).join(" · "),
    };
  });
}

function parseExperience(
  lines: string[],
  current: CvAboutData["experience"],
  warnings: string[]
): CvAboutData["experience"] {
  return splitDatedBlocks(lines).map((block) => {
    const joined = block.header.join(" ");
    const existing = current.find((item) => {
      const source = joined.toLowerCase();
      return (
        source.startsWith(item.role.toLowerCase()) ||
        (item.company && source.endsWith(item.company.toLowerCase()))
      );
    });
    if (existing) {
      const companyAtEnd =
        existing.company &&
        joined.toLowerCase().endsWith(existing.company.toLowerCase());
      return {
        year: block.year,
        role: companyAtEnd
          ? cleanLine(joined.slice(0, -existing.company.length))
          : joined.slice(0, existing.role.length),
        company: companyAtEnd
          ? joined.slice(-existing.company.length)
          : cleanLine(joined.slice(existing.role.length)) || existing.company,
        items: block.items,
      };
    }

    const explicit = joined.split(/\s+(?:@|\||—)\s+/);
    if (explicit.length >= 2) {
      return {
        year: block.year,
        role: explicit.slice(0, -1).join(" — "),
        company: explicit.at(-1) ?? "",
        items: block.items,
      };
    }

    warnings.push(`กรุณาตรวจชื่อองค์กรของประสบการณ์ปี ${block.year}`);
    return { year: block.year, role: joined, company: "", items: block.items };
  });
}

function researchType(lines: string[]): { title: string; type: string } {
  const typePattern =
    /\b(Independent Study|Undergraduate Research Project|Research Project|Capstone Project|Personal Project|Thesis)\b|งานวิจัยระดับปริญญาตรี|โครงงานอิสระ|วิทยานิพนธ์/i;
  const joined = lines.join(" ");
  const match = typePattern.exec(joined);
  if (!match) return { title: cleanLine(joined), type: "" };
  return {
    title: cleanLine(`${joined.slice(0, match.index)} ${joined.slice(match.index + match[0].length)}`),
    type: cleanLine(match[0]),
  };
}

function wordSet(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((word) => word.length > 2)
  );
}

function similarity(a: string, b: string): number {
  const left = wordSet(a);
  const right = wordSet(b);
  if (left.size === 0 || right.size === 0) return 0;
  let overlap = 0;
  for (const word of left) if (right.has(word)) overlap += 1;
  return overlap / Math.max(left.size, right.size);
}

function parseResearch(
  lines: string[],
  current: CvAboutData["research"]
): CvAboutData["research"] {
  return splitDatedBlocks(lines).map((block) => {
    const parsed = researchType(block.header);
    const attachment = current
      .map((item) => ({ item, score: similarity(item.title, parsed.title) }))
      .sort((a, b) => b.score - a.score)[0];

    return {
      year: block.year,
      title: parsed.title,
      type: parsed.type,
      ...(attachment && attachment.score >= 0.45 && attachment.item.pdf
        ? { pdf: attachment.item.pdf }
        : {}),
      ...(attachment && attachment.score >= 0.45 && attachment.item.image
        ? { image: attachment.item.image }
        : {}),
      items: block.items,
    };
  });
}

export function parseCvText(
  rawText: string,
  current: CvAboutData
): { about: CvAboutData; rawText: string; warnings: string[] } {
  const text = normalizeText(rawText);
  const { header, sections } = splitSections(text);
  const warnings: string[] = [];
  const next: CvAboutData = JSON.parse(JSON.stringify(current)) as CvAboutData;

  next.profile = contactFromHeader(header, current.profile);
  if (sections.profile?.length) next.profile.summary = sections.profile.join(" ");

  const education = sections.education
    ? parseEducation(sections.education, current.education)
    : [];
  const experience = sections.experience
    ? parseExperience(sections.experience, current.experience, warnings)
    : [];
  const research = sections.research
    ? parseResearch(sections.research, current.research)
    : [];
  const skills = sections.skills ? parseSkills(sections.skills) : [];
  const languages = sections.languages ? parseLanguages(sections.languages) : [];
  const certifications = sections.certifications
    ? collectListItems(sections.certifications, true)
    : [];

  if (education.length) next.education = education;
  else warnings.push("ไม่พบส่วน Education จึงเก็บข้อมูลเดิมไว้");
  if (experience.length) next.experience = experience;
  else warnings.push("ไม่พบส่วน Experience จึงเก็บข้อมูลเดิมไว้");
  if (research.length) next.research = research;
  else warnings.push("ไม่พบส่วน Projects/Research จึงเก็บข้อมูลเดิมไว้");
  if (skills.length) next.skills = skills;
  else warnings.push("ไม่พบส่วน Skills จึงเก็บข้อมูลเดิมไว้");
  if (languages.length) next.languages = languages;
  else warnings.push("ไม่พบส่วน Languages จึงเก็บข้อมูลเดิมไว้");
  if (certifications.length) next.certifications = certifications;
  else warnings.push("ไม่พบส่วน Certifications จึงเก็บข้อมูลเดิมไว้");

  return { about: next, rawText: text, warnings };
}
