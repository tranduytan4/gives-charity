import DOMPurify from 'dompurify';

export const sanitizeAnnouncementContent = (html: string) => {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1',
      'h2',
      'h3',
      'p',
      'br',
      'strong',
      'em',
      'b',
      'i',
      'u',
      'ul',
      'ol',
      'li',
      'a',
      'img',
      'video',
    ],
    ALLOWED_ATTR: [
      'href',
      'target',
      'rel',
      'src',
      'alt',
      'title',
      'data-text-align',
      'controls',
      'preload',
    ],
  });

  // Announcement feeds can contain several uploaded videos. Prevent each preview from
  // fetching metadata as soon as the tab is opened; playback still loads on demand.
  return sanitized.replace(/<video\b([^>]*)>/gi, (_, attributes: string) => {
    const withoutPreload = attributes.replace(/\s+preload=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    return `<video${withoutPreload} preload="none">`;
  });
};

/**
 * Helper to filter campaign descriptions for card displays.
 * It removes disallowed tags (h1-h6, ul, ol) along with their text content,
 * and strips other formatting tags except for the allowed inline tags (p, strong, b, em, i, u, br, span).
 */
export function filterCardDescription(html: string): string {
  if (!html) return '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove disallowed elements completely, including all their content
    const disallowed = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, ul, ol');
    disallowed.forEach((el) => {
      el.remove();
    });

    // Keep only allowed tags and text nodes
    const allowedTags = new Set(['P', 'STRONG', 'B', 'EM', 'I', 'U', 'BR', 'SPAN']);

    const cleanNode = (node: Node): Node | null => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.cloneNode(true);
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toUpperCase();

        if (allowedTags.has(tagName)) {
          const newElement = doc.createElement(tagName.toLowerCase());
          element.childNodes.forEach((childNode) => {
            const cleanedChild = cleanNode(childNode);
            if (cleanedChild) {
              newElement.appendChild(cleanedChild);
            }
          });
          return newElement;
        }

        // For any other element, strip its tag but retain its text/allowed children
        const fragment = doc.createDocumentFragment();
        element.childNodes.forEach((childNode) => {
          const cleanedChild = cleanNode(childNode);
          if (cleanedChild) {
            fragment.appendChild(cleanedChild);
          }
        });
        return fragment;
      }
      return null;
    };

    const resultFragment = doc.createDocumentFragment();
    doc.body.childNodes.forEach((childNode) => {
      const cleanedChild = cleanNode(childNode);
      if (cleanedChild) {
        resultFragment.appendChild(cleanedChild);
      }
    });

    const tempDiv = doc.createElement('div');
    tempDiv.appendChild(resultFragment);
    return tempDiv.innerHTML.trim();
  } catch (e) {
    console.error('Failed to filter card description HTML', e);
    return html;
  }
}

export const htmlToText = (html: string): string => {
  if (!html) return '';
  try {
    const element = document.createElement('div');
    element.innerHTML = html;
    return element.textContent?.trim() ?? '';
  } catch (e) {
    console.error('Failed to convert HTML to text', e);
    return html;
  }
};
