export default function decorate(block) {
  const cell = block.querySelector(':scope > div > div');
  const pic = cell.querySelector('picture');
  const h2 = cell.querySelector('h2');
  const paras = [...cell.querySelectorAll('p')];
  const descP = paras.find((p) => !p.querySelector('a, picture') && p.textContent.trim());
  const ctaLink = cell.querySelector('a');

  const imgDiv = document.createElement('div');
  imgDiv.className = 'etm-image';
  if (pic) imgDiv.append(pic);

  const contentDiv = document.createElement('div');
  contentDiv.className = 'etm-content';

  if (h2) contentDiv.append(h2);

  if (descP) {
    const desc = document.createElement('p');
    desc.className = 'etm-desc';
    desc.textContent = descP.textContent.trim();
    contentDiv.append(desc);
  }

  if (ctaLink) {
    const cta = document.createElement('a');
    cta.href = ctaLink.href;
    cta.className = 'etm-cta';
    cta.textContent = ctaLink.textContent.trim();
    contentDiv.append(cta);
  }

  block.textContent = '';
  block.append(imgDiv, contentDiv);
}
