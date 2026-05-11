export default function decorate(block) {
  const [textCell, imageCell] = [...block.children[0].children];

  const paras = [...textCell.querySelectorAll('p')];
  const h2 = textCell.querySelector('h2');

  const eyebrowP = paras.find((p) => !p.querySelector('a') && p.textContent.trim());
  const ctaP = paras.find((p) => p.querySelectorAll('a').length >= 2);
  const statusP = paras.find((p) => p.querySelector('a') && p !== ctaP);

  const pic = imageCell.querySelector('picture');

  const imgDiv = document.createElement('div');
  imgDiv.className = 'ysc-image';
  if (pic) imgDiv.append(pic);

  const contentDiv = document.createElement('div');
  contentDiv.className = 'ysc-content';

  if (eyebrowP) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'ysc-eyebrow';
    eyebrow.textContent = eyebrowP.textContent.trim();
    contentDiv.append(eyebrow);
  }

  if (h2) contentDiv.append(h2);

  if (statusP) {
    const status = document.createElement('p');
    status.className = 'ysc-status';
    status.innerHTML = statusP.innerHTML;
    contentDiv.append(status);
  }

  if (ctaP) {
    const links = [...ctaP.querySelectorAll('a')];
    const btnWrap = document.createElement('div');
    btnWrap.className = 'ysc-buttons';

    links.forEach((link, i) => {
      const btn = document.createElement('a');
      btn.href = link.href;
      btn.textContent = link.textContent.trim();
      btn.className = i === 0 ? 'ysc-btn-primary' : 'ysc-btn-secondary';
      btnWrap.append(btn);
    });

    contentDiv.append(btnWrap);
  }

  block.textContent = '';
  block.append(contentDiv, imgDiv);
}
