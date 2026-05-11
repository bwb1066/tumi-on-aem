export default function decorate(block) {
  const cell = block.querySelector(':scope > div > div');
  const firstP = cell.querySelector('p:first-of-type');
  const pic = firstP?.querySelector('picture');

  const eyebrowText = [...(firstP?.childNodes || [])]
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent.trim())
    .find(Boolean) || '';

  const h2 = cell.querySelector('h2');
  const ctaLink = cell.querySelector('p:last-of-type > a');

  const imgDiv = document.createElement('div');
  imgDiv.className = 'fdh-image';
  if (pic) imgDiv.append(pic);

  const contentDiv = document.createElement('div');
  contentDiv.className = 'fdh-content';

  if (eyebrowText) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'fdh-eyebrow';
    eyebrow.textContent = eyebrowText;
    contentDiv.append(eyebrow);
  }

  if (h2) contentDiv.append(h2);

  if (ctaLink) {
    const cta = document.createElement('a');
    cta.href = ctaLink.href;
    cta.className = 'fdh-cta';
    cta.textContent = ctaLink.textContent.trim();
    contentDiv.append(cta);
  }

  block.textContent = '';
  block.append(imgDiv, contentDiv);
}
