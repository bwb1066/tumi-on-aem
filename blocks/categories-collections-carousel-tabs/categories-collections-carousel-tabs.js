export default function decorate(block) {
  const tabSections = [...block.children];

  const tabBar = document.createElement('div');
  tabBar.className = 'cct-tabs';

  const panelsEl = document.createElement('div');
  panelsEl.className = 'cct-panels';

  tabSections.forEach((section, i) => {
    const [labelDiv, tableDiv] = [...section.children];

    const tabLink = labelDiv?.querySelector('a');
    const label = tabLink?.textContent.trim() || `Tab ${i + 1}`;

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = i === 0 ? 'cct-tab active' : 'cct-tab';
    tab.textContent = label;
    tabBar.append(tab);

    const panel = document.createElement('div');
    panel.className = i === 0 ? 'cct-panel active' : 'cct-panel';

    const table = tableDiv?.querySelector('table');
    const rows = table ? [...table.querySelectorAll('tbody tr')] : [];

    const carouselWrapper = document.createElement('div');
    carouselWrapper.className = 'cct-carousel-wrapper';

    const carousel = document.createElement('ul');
    carousel.className = 'cct-carousel';

    let cta = null;

    rows.forEach((row) => {
      const cells = [...row.querySelectorAll('td')];
      if (cells.length === 1) {
        const text = cells[0].textContent.trim().toLowerCase();
        if (text === 'carousel') return;
        const a = cells[0].querySelector('a');
        if (a) {
          cta = document.createElement('a');
          cta.href = a.href;
          cta.className = 'cct-cta';
          cta.textContent = a.textContent.trim();
        }
        return;
      }
      if (cells.length < 2) return;

      const [imgCell, labelCell] = cells;
      const pic = imgCell.querySelector('picture');
      if (!pic) return;

      const card = document.createElement('li');
      card.className = 'cct-card';

      const imgDiv = document.createElement('div');
      imgDiv.className = 'cct-card-image';
      imgDiv.append(pic);
      card.append(imgDiv);

      const a = labelCell.querySelector('a');
      if (a) {
        const labelWrap = document.createElement('div');
        labelWrap.className = 'cct-card-label';

        const link = document.createElement('a');
        link.href = a.href;
        link.textContent = `${a.textContent.trim()} ›`;
        labelWrap.append(link);

        const descP = labelCell.querySelectorAll('p')[1];
        if (descP?.textContent.trim()) {
          const desc = document.createElement('p');
          desc.className = 'cct-card-desc';
          desc.textContent = descP.textContent.trim();
          labelWrap.append(desc);
        }

        card.append(labelWrap);
      }

      carousel.append(card);
    });

    carouselWrapper.append(carousel);

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'cct-arrow cct-arrow-prev';
    prevBtn.setAttribute('aria-label', 'Previous');
    prevBtn.innerHTML = '&#x2190;';
    prevBtn.hidden = true; // always hidden at scroll position 0

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'cct-arrow cct-arrow-next';
    nextBtn.setAttribute('aria-label', 'Next');
    nextBtn.innerHTML = '&#x2192;';
    // next starts visible; hidden only if all items fit (checked after layout)

    const updateArrows = () => {
      prevBtn.hidden = carousel.scrollLeft < 1;
      const atEnd = Math.round(carousel.scrollLeft + carousel.clientWidth) >= carousel.scrollWidth;
      nextBtn.hidden = atEnd;
    };

    const getScrollAmount = () => {
      const card = carousel.querySelector('.cct-card');
      if (!card) return 300;
      const gap = parseInt(getComputedStyle(carousel).gap, 10) || 16;
      return card.offsetWidth + gap;
    };

    prevBtn.addEventListener('click', () => carousel.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' }));
    nextBtn.addEventListener('click', () => carousel.scrollBy({ left: getScrollAmount(), behavior: 'smooth' }));
    carousel.addEventListener('scroll', updateArrows, { passive: true });

    // Only check scroll bounds once CSS has been applied (clientWidth > 0)
    const ro = new ResizeObserver(() => {
      if (carousel.clientWidth > 0) {
        updateArrows();
        ro.disconnect();
      }
    });
    ro.observe(carousel);

    carouselWrapper.append(prevBtn, nextBtn);
    panel.append(carouselWrapper);
    if (cta) panel.append(cta);
    panelsEl.append(panel);

    tab.addEventListener('click', () => {
      [...tabBar.querySelectorAll('.cct-tab')].forEach((t, j) => t.classList.toggle('active', j === i));
      [...panelsEl.querySelectorAll('.cct-panel')].forEach((p, j) => p.classList.toggle('active', j === i));
    });
  });

  block.textContent = '';
  block.append(tabBar, panelsEl);
}
