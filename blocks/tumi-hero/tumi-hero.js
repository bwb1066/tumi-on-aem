export default function decorate(block) {
  const rows = [...block.children];
  const count = rows.length;

  const slides = rows.map((row, i) => {
    const cell = row.querySelector(':scope > div');
    const pic = cell.querySelector('picture');
    const h2 = cell.querySelector('h2');
    const descP = [...cell.querySelectorAll('p')].find(
      (p) => !p.querySelector('a, picture') && p.textContent.trim(),
    );
    const ctaLink = cell.querySelector('a');

    const slide = document.createElement('div');
    slide.className = 'th-slide';
    slide.setAttribute('aria-hidden', i !== 0);

    const imgDiv = document.createElement('div');
    imgDiv.className = 'th-image';
    if (pic) imgDiv.append(pic);

    const panel = document.createElement('div');
    panel.className = 'th-panel';

    // Prev arrow
    const prevBtn = document.createElement('button');
    prevBtn.className = 'th-arrow th-arrow-prev';
    prevBtn.setAttribute('aria-label', 'Previous slide');
    prevBtn.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="13,4 6,10 13,16"/></svg>';
    prevBtn.hidden = i === 0;

    // Next arrow
    const nextBtn = document.createElement('button');
    nextBtn.className = 'th-arrow th-arrow-next';
    nextBtn.setAttribute('aria-label', 'Next slide');
    nextBtn.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="7,4 14,10 7,16"/></svg>';
    nextBtn.hidden = i === count - 1;

    const inner = document.createElement('div');
    inner.className = 'th-panel-inner';

    if (h2) inner.append(h2);

    if (descP) {
      const desc = document.createElement('p');
      desc.className = 'th-desc';
      desc.textContent = descP.textContent.trim();
      inner.append(desc);
    }

    if (ctaLink) {
      const cta = document.createElement('a');
      cta.href = ctaLink.href;
      cta.className = 'th-cta';
      cta.textContent = ctaLink.textContent.trim();
      inner.append(cta);
    }

    panel.append(prevBtn, inner, nextBtn);
    slide.append(imgDiv, panel);
    return { el: slide, prevBtn, nextBtn };
  });

  let current = 0;

  function goTo(index) {
    current = (index + count) % count;
    slides.forEach(({ el, prevBtn, nextBtn }, i) => {
      el.setAttribute('aria-hidden', i !== current);
      el.classList.toggle('th-slide-active', i === current);
      prevBtn.hidden = current === 0;
      nextBtn.hidden = current === count - 1;
    });
  }

  slides.forEach(({ prevBtn, nextBtn }) => {
    prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn.addEventListener('click', () => goTo(current + 1));
  });

  const track = document.createElement('div');
  track.className = 'th-track';
  slides.forEach(({ el }) => track.append(el));

  block.textContent = '';
  block.append(track);

  goTo(0);
}
