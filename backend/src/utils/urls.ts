type RawItem = {
  url: string;
  thumbnail?: string | null;
};

const asString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const normalizeUrl = (url: string) => url.split("?")[0];

const buildItem = (url: string, thumbnail?: string | null): RawItem | null => {
  const normalized = asString(url);
  if (!normalized) {
    return null;
  }

  return {
    url: normalizeUrl(normalized),
    thumbnail: asString(thumbnail) || null
  };
};

const parseJsonItems = (text: string): RawItem[] => {
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry) => {
        if (typeof entry === "string") {
          return buildItem(entry);
        }

        if (entry && typeof entry === "object") {
          const item = entry as { url?: unknown; thumbnail?: unknown };
          return buildItem(asString(item.url), asString(item.thumbnail));
        }

        return null;
      })
      .filter((item): item is RawItem => Boolean(item));
  } catch (error) {
    return [];
  }
};

const parseTextItems = (text: string): RawItem[] => {
  return text
    .split(/\r?\n/)
    .map((line) => buildItem(line))
    .filter((item): item is RawItem => Boolean(item));
};

export const parseInputItems = (body: unknown): RawItem[] => {
  if (!body || typeof body !== "object") {
    return [];
  }

  const payload = body as {
    items?: unknown;
    urls?: unknown;
    urlsText?: unknown;
  };

  const items: RawItem[] = [];

  if (Array.isArray(payload.items)) {
    payload.items.forEach((entry) => {
      if (typeof entry === "string") {
        const item = buildItem(entry);
        if (item) {
          items.push(item);
        }
        return;
      }

      if (entry && typeof entry === "object") {
        const item = entry as { url?: unknown; thumbnail?: unknown };
        const parsed = buildItem(asString(item.url), asString(item.thumbnail));
        if (parsed) {
          items.push(parsed);
        }
      }
    });
  }

  if (Array.isArray(payload.urls)) {
    payload.urls.forEach((entry) => {
      const item = buildItem(asString(entry));
      if (item) {
        items.push(item);
      }
    });
  }

  const urlsText = asString(payload.urlsText);
  if (urlsText) {
    const parsedJson = parseJsonItems(urlsText);
    if (parsedJson.length > 0) {
      items.push(...parsedJson);
    } else {
      items.push(...parseTextItems(urlsText));
    }
  }

  const unique = new Map<string, RawItem>();
  items.forEach((item) => {
    if (!unique.has(item.url)) {
      unique.set(item.url, item);
    }
  });

  return Array.from(unique.values());
};

export const buildTitleFromUrl = (url: string) => {
  const match = url.match(/\/(reel|videos?|video)\/(\d+)/i);
  if (match) {
    const type = match[1].toLowerCase();
    const id = match[2];
    return `Facebook ${type} ${id.slice(-6)}`;
  }

  return "Facebook video";
};
