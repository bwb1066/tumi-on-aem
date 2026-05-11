export default function decorate(block) {
  const rows = [...block.children];

  // First row is the heading
  const headingRow = rows.shift();
  const heading = headingRow?.querySelector('h1, h2, h3');
  const headingEl = document.createElement('div');
  headingEl.className = 'bosc-heading';
  if (heading) headingEl.append(heading);

  const carouselWrapper = document.createElement('div');
  carouselWrapper.className = 'bosc-carousel-wrapper';

  const carousel = document.createElement('ul');
  carousel.className = 'bosc-carousel';

  rows.forEach((row) => {
    const [imgCell, infoCell] = [...row.children];
    const pic = imgCell?.querySelector('picture');
    if (!pic) return;

    const paras = infoCell ? [...infoCell.querySelectorAll('p')] : [];
    const collectionLink = paras[0]?.querySelector('a');
    const productLink = paras[1]?.querySelector('a');
    const priceText = paras[2]?.textContent.trim() || '';

    const card = document.createElement('li');
    card.className = 'bosc-card';

    const imgDiv = document.createElement('div');
    imgDiv.className = 'bosc-card-image';
    if (productLink?.href) {
      const imgAnchor = document.createElement('a');
      imgAnchor.href = productLink.href;
      imgAnchor.append(pic);
      imgDiv.append(imgAnchor);
    } else {
      imgDiv.append(pic);
    }
    card.append(imgDiv);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'bosc-card-info';

    if (collectionLink) {
      const coll = document.createElement('a');
      coll.href = collectionLink.href;
      coll.className = 'bosc-card-collection';
      coll.textContent = collectionLink.textContent.trim();
      infoDiv.append(coll);
    }

    if (productLink) {
      const name = document.createElement('a');
      name.href = productLink.href;
      name.className = 'bosc-card-name';
      name.textContent = productLink.textContent.trim();
      infoDiv.append(name);
    }

    const listMatch = priceText.match(/List Price:(\S+)/);
    const saleMatch = priceText.match(/Sale Price:(\S+)/);
    if (listMatch || saleMatch) {
      const priceEl = document.createElement('p');
      priceEl.className = 'bosc-card-price';
      if (listMatch) {
        const [, listPrice] = listMatch;
        const s = document.createElement('s');
        s.textContent = listPrice;
        priceEl.append(s, ' ');
      }
      if (saleMatch) {
        const [, salePrice] = saleMatch;
        const sale = document.createElement('span');
        sale.className = 'bosc-card-sale-price';
        sale.textContent = salePrice;
        priceEl.append(sale);
      }
      infoDiv.append(priceEl);
    }

    card.append(infoDiv);
    carousel.append(card);
  });

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'bosc-arrow bosc-arrow-prev';
  prevBtn.setAttribute('aria-label', 'Previous');
  prevBtn.innerHTML = '&#x2190;';
  prevBtn.hidden = true;

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'bosc-arrow bosc-arrow-next';
  nextBtn.setAttribute('aria-label', 'Next');
  nextBtn.innerHTML = '&#x2192;';

  const updateArrows = () => {
    prevBtn.hidden = carousel.scrollLeft < 1;
    const atEnd = Math.round(carousel.scrollLeft + carousel.clientWidth) >= carousel.scrollWidth;
    nextBtn.hidden = atEnd;
  };

  const getScrollAmount = () => {
    const card = carousel.querySelector('.bosc-card');
    if (!card) return 300;
    const gap = parseInt(getComputedStyle(carousel).gap, 10) || 16;
    return card.offsetWidth + gap;
  };

  prevBtn.addEventListener('click', () => carousel.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' }));
  nextBtn.addEventListener('click', () => carousel.scrollBy({ left: getScrollAmount(), behavior: 'smooth' }));
  carousel.addEventListener('scroll', updateArrows, { passive: true });

  const ro = new ResizeObserver(() => {
    if (carousel.clientWidth > 0) {
      updateArrows();
      ro.disconnect();
    }
  });
  ro.observe(carousel);

  carouselWrapper.append(carousel, prevBtn, nextBtn);
  block.textContent = '';
  block.append(headingEl, carouselWrapper);
}
