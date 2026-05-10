function getVideoType(src) {
  if (src.endsWith('.m3u8')) return 'application/x-mpegURL';
  return 'video/mp4';
}

function getPoster(src) {
  // Dynamic Media: derive poster from image server
  if (src.includes('scene7.com/is/content/')) {
    return `${src.replace('/is/content/', '/is/image/')}?fmt=jpg&wid=1280`;
  }
  return null;
}

function buildVideo(src, poster, isBackground) {
  const video = document.createElement('video');
  video.setAttribute('playsinline', '');
  if (isBackground) {
    video.setAttribute('autoplay', '');
    video.setAttribute('loop', '');
    video.setAttribute('muted', '');
    video.muted = true;
    video.setAttribute('aria-hidden', 'true');
  } else {
    video.setAttribute('controls', '');
    video.setAttribute('preload', 'none');
  }
  if (poster) video.setAttribute('poster', poster);
  const source = document.createElement('source');
  source.src = src;
  source.type = getVideoType(src);
  video.append(source);
  return video;
}

export default function decorate(block) {
  const isBackground = block.classList.contains('background');
  const rows = [...block.children];
  const link = rows[0].querySelector('a');
  if (!link) return;
  const { href } = link;

  // Poster: authored image in row 2, or derived from Dynamic Media URL
  const posterImg = rows[1]?.querySelector('img');
  const poster = posterImg?.src || getPoster(href);

  // Caption: text-only row after video (and optional poster)
  const captionRow = posterImg ? rows[2] : rows[1];
  const caption = captionRow?.textContent.trim();

  const figure = document.createElement('figure');
  if (caption) {
    const figcaption = document.createElement('figcaption');
    figcaption.textContent = caption;
    figure.append(figcaption);
  }

  block.innerHTML = '';
  block.append(figure);

  const observer = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    observer.disconnect();
    figure.prepend(buildVideo(href, poster, isBackground));
  });
  observer.observe(block);
}
