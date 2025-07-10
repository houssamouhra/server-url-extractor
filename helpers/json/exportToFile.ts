import fs from "fs";
import path from "path";

// prettier-ignore
// Append or create a JSON file with the links object
export const saveLinksToJson = async <T>(filePath: string,
  idOrData: string | { [id: string]: { links: { [key: string]: T }; date?: string } },
  links?: T[]) => {
  type LinkGroup<T> = {
    links: { [key: string]: T };
    date: string;
  };

  let allLinks: { [id: string]: LinkGroup<T> } = {};

  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

  // Helper to get current date in "YYYY-MM-DD HH:mm" format
  const getFormattedDate = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    return `${dd}-${mm}-${yyyy}`;
  };

  if (fs.existsSync(filePath)) {
    const data = await fs.promises.readFile(filePath, "utf-8");
    if (data.trim()) {
      try {
        allLinks = JSON.parse(data);
      } catch {
        allLinks = {};
      }
    }
  }
  // Ensure the entry is a valid object containing a "links" field before merging.
  if (typeof idOrData === "object" && idOrData !== null && !Array.isArray(idOrData)) {
    for (const [id, rawEntry] of Object.entries(idOrData)) {
      // This prevents accidental duplication like links.links and ensures proper structure.
      if (
        typeof rawEntry === "object" &&
        rawEntry !== null &&
        "links" in rawEntry &&
        typeof (rawEntry as any).links === "object"
      ) {
        const newEntry = rawEntry as unknown as {
          links: { [key: string]: T };
          date?: string;
        };

        const existingLinks = allLinks[id]?.links || {};
        const mergedLinks = { ...existingLinks };

        for (const [linkKey, linkData] of Object.entries(newEntry.links)) {
          if (!mergedLinks[linkKey]) {
            mergedLinks[linkKey] = linkData;
          }
        }

        allLinks[id] = {
          links: mergedLinks,
          date: newEntry.date || allLinks[id]?.date || getFormattedDate(),
        };
      }
    }
  } else {
    const id = idOrData as string;
    const existingLinks = allLinks[id]?.links || {};
    const mergedLinks = { ...existingLinks };

    const existingValues = new Set(Object.values(mergedLinks));

    links?.forEach((link) => {
      if (!existingValues.has(link)) {
        const index = Object.keys(mergedLinks).length + 1;
        mergedLinks[`link${index}`] = link;
      }
    });

    allLinks[id] = {
      links: mergedLinks,
      date: allLinks[id]?.date || getFormattedDate(),
    };
  }

  // Write back to the file
  const tempPath = `${filePath}.tmp`;
  const sortedLinks = Object.fromEntries(
    Object.entries(allLinks).sort((a, b) => {
      const aNum = parseInt(a[0].match(/\d+/)?.[0] || "0", 10);
      const bNum = parseInt(b[0].match(/\d+/)?.[0] || "0", 10);
      // descending order
      return bNum - aNum;
    })
  );
  await fs.promises.writeFile(
    tempPath,
    JSON.stringify(sortedLinks, null, 2),
    "utf-8"
  );
  await fs.promises.rename(tempPath, filePath);
};
