export default function decorate(block) {
  block.setAttribute('role', 'region');
  block.setAttribute('aria-label', 'Community photos');
  const rows = [...block.children];
  const [headerRow, ...cardRows] = rows;

  const headerCell = headerRow.querySelector(':scope > div');
  const h2 = headerCell.querySelector('h2');
  const paras = [...headerCell.querySelectorAll('p')];

  const headerDiv = document.createElement('div');
  headerDiv.className = 'ugc-header';

  if (h2) headerDiv.append(h2);

  const metaP = paras.find((p) => p.textContent.trim());
  if (metaP) {
    const meta = document.createElement('p');
    meta.className = 'ugc-meta';
    meta.innerHTML = metaP.innerHTML;
    headerDiv.append(meta);
  }

  const carouselWrapper = document.createElement('div');
  carouselWrapper.className = 'ugc-carousel-wrapper';

  const carousel = document.createElement('ul');
  carousel.className = 'ugc-carousel';

  cardRows.forEach((row) => {
    const cell = row.querySelector(':scope > div');
    const pic = cell.querySelector('picture');
    const link = cell.querySelector('a');

    const li = document.createElement('li');
    li.className = 'ugc-card';

    const inner = document.createElement('div');
    inner.className = 'ugc-card-inner';

    if (pic) {
      const imgWrap = document.createElement('div');
      imgWrap.className = 'ugc-card-image';
      if (link) {
        const a = document.createElement('a');
        a.href = link.href;
        a.setAttribute('aria-label', 'View on Instagram');
        a.append(pic);
        imgWrap.append(a);
      } else {
        imgWrap.append(pic);
      }

      const igIcon = document.createElement('span');
      igIcon.className = 'ugc-ig-icon';
      igIcon.setAttribute('role', 'img');
      igIcon.setAttribute('aria-label', 'Instagram');
      igIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>';

      imgWrap.append(igIcon);
      inner.append(imgWrap);
    }

    li.append(inner);
    carousel.append(li);
  });

  const nextBtn = document.createElement('button');
  nextBtn.className = 'ugc-arrow ugc-arrow-next';
  nextBtn.setAttribute('aria-label', 'Next');
  nextBtn.textContent = '→';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'ugc-arrow ugc-arrow-prev';
  prevBtn.setAttribute('aria-label', 'Previous');
  prevBtn.textContent = '←';

  function updateArrows() {
    prevBtn.hidden = carousel.scrollLeft <= 0;
    nextBtn.hidden = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 4;
  }

  const cardWidth = () => {
    const card = carousel.querySelector('.ugc-card');
    return card ? card.offsetWidth + 16 : 260;
  };

  nextBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: cardWidth() * 2, behavior: 'smooth' });
    setTimeout(updateArrows, 350);
  });

  prevBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: -cardWidth() * 2, behavior: 'smooth' });
    setTimeout(updateArrows, 350);
  });

  carousel.addEventListener('scroll', updateArrows, { passive: true });

  carouselWrapper.append(prevBtn, carousel, nextBtn);

  const attribution = document.createElement('p');
  attribution.className = 'ugc-attribution';
  attribution.innerHTML = '<span class="ugc-emplifi-dot"></span> POWERED BY EMPLIFI';

  block.textContent = '';
  block.append(headerDiv, carouselWrapper, attribution);

  const ro = new ResizeObserver(() => {
    if (carousel.clientWidth > 0) { updateArrows(); ro.disconnect(); }
  });
  ro.observe(carousel);
}
