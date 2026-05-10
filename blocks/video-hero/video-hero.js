function buildVideo(src) {
  const video = document.createElement('video');
  video.setAttribute('autoplay', '');
  video.setAttribute('loop', '');
  video.setAttribute('muted', '');
  video.muted = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('aria-hidden', 'true');
  const source = document.createElement('source');
  source.src = src;
  if (src.includes('.m3u8')) source.type = 'application/x-mpegURL';
  else if (src.includes('.webm')) source.type = 'video/webm';
  else source.type = 'video/mp4';
  video.append(source);
  return video;
}

function extractTextAfter(el) {
  let text = '';
  let node = el.nextSibling;
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) text += node.textContent;
    node = node.nextSibling;
  }
  return text.trim();
}

export default function decorate(block) {
  const cell = block.querySelector(':scope > div > div');
  if (!cell) return;

  const paragraphs = [...cell.querySelectorAll(':scope > p')];

  // P1: video link + lockup overlay picture + subtitle text
  const p1 = paragraphs[0];
  const videoLink = p1?.querySelector('a[href]');
  if (!videoLink) return;
  const { href: src } = videoLink;

  // The picture in P1 is the overlay lockup image (transparent PNG — e.g. semi-annual sale)
  const lockupPicture = p1?.querySelector('picture');
  const subtitle = lockupPicture ? extractTextAfter(lockupPicture) : '';

  // P2: CTA link + fine print
  const p2 = paragraphs[1];
  const ctaLink = p2?.querySelector('a');
  const finePrint = ctaLink ? extractTextAfter(ctaLink) : '';

  // Build DOM
  block.textContent = '';
  block.append(buildVideo(src));

  const content = document.createElement('div');
  content.className = 'video-hero-content';

  if (lockupPicture) {
    const lockupWrapper = document.createElement('div');
    lockupWrapper.className = 'video-hero-lockup';
    lockupWrapper.append(lockupPicture);
    content.append(lockupWrapper);
  }

  if (subtitle) {
    const subtitleEl = document.createElement('p');
    subtitleEl.className = 'video-hero-subtitle';
    subtitleEl.textContent = subtitle;
    content.append(subtitleEl);
  }

  if (ctaLink) {
    const cta = document.createElement('a');
    cta.className = 'video-hero-cta';
    cta.href = ctaLink.href;
    cta.textContent = ctaLink.textContent;
    content.append(cta);
  }

  block.append(content);

  if (finePrint) {
    const fine = document.createElement('p');
    fine.className = 'video-hero-fine-print';
    fine.textContent = finePrint;
    block.append(fine);
  }

  // Pause / play toggle
  const pauseBtn = document.createElement('button');
  pauseBtn.className = 'video-hero-pause';
  pauseBtn.setAttribute('aria-label', 'Pause video');
  pauseBtn.setAttribute('type', 'button');
  pauseBtn.innerHTML = '<span aria-hidden="true">&#9646;&#9646;</span>';
  const video = block.querySelector('video');
  pauseBtn.addEventListener('click', () => {
    if (video.paused) {
      video.play();
      pauseBtn.setAttribute('aria-label', 'Pause video');
      pauseBtn.innerHTML = '<span aria-hidden="true">&#9646;&#9646;</span>';
    } else {
      video.pause();
      pauseBtn.setAttribute('aria-label', 'Play video');
      pauseBtn.innerHTML = '<span aria-hidden="true">&#9654;</span>';
    }
  });
  block.append(pauseBtn);
}
