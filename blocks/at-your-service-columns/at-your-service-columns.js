export default function decorate(block) {
  const [imageCell, textCell] = [...block.children[0].children];

  const pic = imageCell.querySelector('picture');
  const h2 = textCell.querySelector('h2');
  const paras = [...textCell.querySelectorAll('p')];
  const descP = paras.find((p) => !p.querySelector('a') && p.textContent.trim());
  const ul = textCell.querySelector('ul');
  const ctaLink = textCell.querySelector('p:last-of-type > a');

  const imgDiv = document.createElement('div');
  imgDiv.className = 'aysc-image';
  if (pic) imgDiv.append(pic);

  const contentDiv = document.createElement('div');
  contentDiv.className = 'aysc-content';

  if (h2) contentDiv.append(h2);

  if (descP) {
    const desc = document.createElement('p');
    desc.className = 'aysc-desc';
    desc.textContent = descP.textContent.trim();
    contentDiv.append(desc);
  }

  if (ul) {
    const serviceList = document.createElement('ul');
    serviceList.className = 'aysc-service-list';

    [...ul.querySelectorAll('li')].forEach((li) => {
      const link = li.querySelector('a');
      const itemPic = li.querySelector('picture');

      const fullText = link ? link.textContent.trim() : li.textContent.trim();
      const parts = fullText.replace(/([a-z®])([A-Z])/g, '$1|||$2').split('|||');
      const name = parts[0];
      const desc = parts.slice(1).join('');

      const item = document.createElement('li');
      item.className = 'aysc-service-item';

      if (itemPic) {
        const iconWrap = document.createElement('div');
        iconWrap.className = 'aysc-service-icon';
        iconWrap.append(itemPic);
        item.append(iconWrap);
      }

      const textWrap = document.createElement('div');
      textWrap.className = 'aysc-service-text';

      const nameEl = document.createElement('span');
      nameEl.className = 'aysc-service-name';
      nameEl.textContent = name;
      textWrap.append(nameEl);

      if (desc) {
        const descEl = document.createElement('span');
        descEl.className = 'aysc-service-desc';
        descEl.textContent = desc;
        textWrap.append(descEl);
      }

      item.append(textWrap);

      const arrow = document.createElement('span');
      arrow.className = 'aysc-service-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '→';
      item.append(arrow);

      serviceList.append(item);
    });

    contentDiv.append(serviceList);
  }

  if (ctaLink) {
    const cta = document.createElement('a');
    cta.href = ctaLink.href;
    cta.className = 'aysc-cta';
    cta.textContent = ctaLink.textContent.trim();
    contentDiv.append(cta);
  }

  block.textContent = '';
  block.append(imgDiv, contentDiv);
}
