import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

function buildInputRow(placeholder) {
  const row = document.createElement('div');
  row.className = 'footer-input-row';
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = placeholder;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Submit');
  btn.textContent = '→';
  row.append(input, btn);
  return row;
}

function buildNavCol(liItems) {
  const col = document.createElement('div');
  col.className = 'footer-nav-col';
  liItems.forEach((li, i) => {
    const h = document.createElement('h3');
    if (i > 0) h.className = 'footer-nav-heading-below';
    const headingLink = li.querySelector(':scope > p > a') || li.querySelector(':scope > a');
    h.textContent = headingLink ? headingLink.textContent.trim() : '';
    col.append(h);

    const subUl = li.querySelector('ul');
    if (subUl) {
      const ul = document.createElement('ul');
      [...subUl.querySelectorAll(':scope > li')].forEach((subLi) => {
        const a = subLi.querySelector('a');
        if (!a) return;
        const newLi = document.createElement('li');
        const link = document.createElement('a');
        link.href = a.href;
        link.textContent = a.textContent.trim();
        newLi.append(link);
        ul.append(newLi);
      });
      col.append(ul);
    }
  });
  return col;
}

export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  if (!fragment) return;

  // The footer is authored as a columns block with 3 rows:
  // Row 1: [logo] [empty x2] [social icons]
  // Row 2: [store info] [nav links] [CTA]
  // Row 3: [legal links] [ship to]
  const columnsBlock = fragment.querySelector('.columns');
  const rows = columnsBlock ? [...columnsBlock.children] : [];

  block.textContent = '';

  if (!rows.length) {
    // Fallback: dump raw fragment content
    const div = document.createElement('div');
    while (fragment.firstElementChild) div.append(fragment.firstElementChild);
    block.append(div);
    return;
  }

  const [topRow, mainRow, bottomRow] = rows;

  // ---- Top row ----
  const topCells = topRow ? [...topRow.children] : [];
  const logoPic = topCells[0]?.querySelector('picture');
  const socialCell = topCells.find((c) => c.querySelector('ul'));
  const socialItems = socialCell ? [...socialCell.querySelectorAll('ul > li')] : [];

  // ---- Main row ----
  const mainCells = mainRow ? [...mainRow.children] : [];
  const storeCell = mainCells[0];
  const navCell = mainCells[1];
  const ctaCell = mainCells[2];

  // ---- Bottom row ----
  const bottomCells = bottomRow ? [...bottomRow.children] : [];
  const legalCell = bottomCells[0];
  const shipCell = bottomCells[1];

  // ---- TOP BAR ----
  const topBar = document.createElement('div');
  topBar.className = 'footer-top';

  const logoDiv = document.createElement('div');
  logoDiv.className = 'footer-logo';
  if (logoPic) logoDiv.append(logoPic.cloneNode(true));

  const socialsDiv = document.createElement('div');
  socialsDiv.className = 'footer-socials';
  socialItems.forEach((li) => {
    const pic = li.querySelector('picture');
    if (!pic) return;
    const a = li.querySelector('a');
    const wrapper = a ? a.cloneNode(true) : document.createElement('span');
    if (!a) wrapper.append(pic.cloneNode(true));
    socialsDiv.append(wrapper);
  });

  topBar.append(logoDiv, socialsDiv);

  // ---- MAIN GRID ----
  const mainDiv = document.createElement('div');
  mainDiv.className = 'footer-main';

  // Store column
  const storeCol = document.createElement('div');
  storeCol.className = 'footer-store';
  if (storeCell) {
    const storePic = storeCell.querySelector('picture');
    if (storePic) {
      const imgDiv = document.createElement('div');
      imgDiv.className = 'footer-store-image';
      imgDiv.append(storePic.cloneNode(true));
      storeCol.append(imgDiv);
    }
    let nameSet = false;
    [...storeCell.querySelectorAll('p')].forEach((p) => {
      if (p.querySelector('picture')) return;
      const clone = p.cloneNode(true);
      const link = clone.querySelector('a');
      if (link && /^change$/i.test(link.textContent.trim())) {
        link.className = 'footer-store-change';
        storeCol.append(link);
      } else if (link) {
        link.className = 'footer-store-cta';
        storeCol.append(link);
      } else if (!nameSet) {
        clone.className = 'footer-store-name';
        nameSet = true;
        storeCol.append(clone);
      } else {
        clone.className = 'footer-store-info';
        storeCol.append(clone);
      }
    });
  }

  // Nav columns: first li item = Customer Service alone, rest share column 3
  const navUl = navCell ? navCell.querySelector('ul') : null;
  const navItems = navUl ? [...navUl.children] : [];
  const navCol2 = navItems.length > 0 ? buildNavCol([navItems[0]]) : null;
  const navCol3 = navItems.length > 1 ? buildNavCol(navItems.slice(1)) : null;

  // CTA column
  const ctaCol = document.createElement('div');
  ctaCol.className = 'footer-cta-col';
  if (ctaCell) {
    [...ctaCell.querySelectorAll('p')].forEach((p) => {
      const strong = p.querySelector('strong');
      const link = p.querySelector('a');
      if (strong) {
        const h = document.createElement('h3');
        h.textContent = strong.textContent.trim();
        ctaCol.append(h);
      } else if (link) {
        ctaCol.append(buildInputRow(link.textContent.trim()));
      } else if (p.textContent.trim()) {
        const desc = document.createElement('p');
        desc.textContent = p.textContent.trim();
        ctaCol.append(desc);
      }
    });
  }

  mainDiv.append(storeCol);
  if (navCol2) mainDiv.append(navCol2);
  if (navCol3) mainDiv.append(navCol3);
  mainDiv.append(ctaCol);

  // ---- BOTTOM BAR ----
  const bottomDiv = document.createElement('div');
  bottomDiv.className = 'footer-bottom';

  const linksDiv = document.createElement('div');
  linksDiv.className = 'footer-bottom-links';
  if (legalCell) {
    const legalUl = legalCell.querySelector('ul');
    if (legalUl) {
      [...legalUl.querySelectorAll('li')].forEach((li, i) => {
        if (i > 0) {
          const sep = document.createElement('span');
          sep.className = 'footer-bottom-sep';
          sep.textContent = ' | ';
          linksDiv.append(sep);
        }
        const a = li.querySelector('a');
        if (a) {
          const link = document.createElement('a');
          link.href = a.href;
          link.textContent = a.textContent.replace(/\|$/, '').trim();
          linksDiv.append(link);
        } else {
          const span = document.createElement('span');
          span.textContent = li.textContent.replace(/\|$/, '').trim();
          linksDiv.append(span);
        }
      });
    }
  }

  const shipDiv = document.createElement('div');
  shipDiv.className = 'footer-ship';
  if (shipCell) shipDiv.innerHTML = shipCell.innerHTML;

  bottomDiv.append(linksDiv, shipDiv);

  block.append(topBar, mainDiv, bottomDiv);
}
