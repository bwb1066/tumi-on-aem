import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  if (navSections) {
    const navDrops = navSections.querySelectorAll('.nav-drop');
    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.addEventListener('focus', focusNavSection);
        }
      });
    } else {
      navDrops.forEach((drop) => {
        drop.removeAttribute('tabindex');
        drop.removeEventListener('focus', focusNavSection);
      });
    }
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * Assigns nav-brand / nav-sections / nav-tools classes.
 * Supports the standard 3-section boilerplate layout OR a single-section
 * nav doc where all links are in one block.
 */
function assignNavClasses(nav) {
  const sections = [...nav.children];

  if (sections.length >= 3) {
    // Standard boilerplate: section 0 = brand, 1 = sections, 2 = tools
    sections[0].classList.add('nav-brand');
    sections[1].classList.add('nav-sections');
    sections[2].classList.add('nav-tools');
    return;
  }

  // Single-section nav: classify each child by its content
  sections.forEach((section) => {
    if (section.querySelector('ul')) {
      section.classList.add('nav-sections');
    } else if (section.querySelector(':scope > p > a > picture, :scope > p > a > img')) {
      section.classList.add('nav-brand');
    } else {
      section.classList.add('nav-tools');
    }
  });

  // Ensure a brand element exists — inject a placeholder if not authored yet
  if (!nav.querySelector('.nav-brand')) {
    const brand = document.createElement('div');
    brand.className = 'nav-brand';
    brand.innerHTML = '<p><a href="/">TUMI</a></p>';
    nav.querySelector('.nav-sections').before(brand);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav and util-nav fragments in parallel
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const [fragment, utilNavFragment] = await Promise.all([
    loadFragment(navPath),
    loadFragment('/fragments/util-nav'),
  ]);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  assignNavClasses(nav);

  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const brandLink = navBrand.querySelector('.button');
    if (brandLink) {
      brandLink.className = '';
      brandLink.closest('.button-container').className = '';
    }
  }

  // Flatten tools: extract all pictures into direct children of nav-tools
  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    const pictures = [...navTools.querySelectorAll('picture')];
    navTools.textContent = '';
    pictures.forEach((pic) => {
      const item = document.createElement('div');
      item.append(pic);
      navTools.append(item);
    });
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });

      if (navSection.classList.contains('nav-drop')) {
        const link = navSection.querySelector(':scope > a, :scope > p > a');
        if (link) {
          const slug = link.textContent.trim().toLowerCase()
            .replace(/'/g, '')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
          const fragOverrides = { luggage: 'luggage-promo' };
          const promoSlugs = new Set(['luggage']);
          const fragSlug = fragOverrides[slug] || slug;
          loadFragment(`/fragments/nav-${fragSlug}`).then((frag) => {
            if (!frag) return;
            const panel = navSection.querySelector(':scope > ul');
            if (!panel) return;
            const megaContent = document.createElement('div');
            megaContent.className = promoSlugs.has(slug)
              ? 'nav-mega-content nav-mega-promo'
              : 'nav-mega-content';
            const cards = frag.querySelector('.cards');
            if (cards) megaContent.append(cards);
            const cta = document.createElement('a');
            cta.href = link.href;
            cta.className = 'nav-mega-cta';
            const ctaLabels = { new: 'Shop New Arrivals', gifts: 'Shop the Gift Guide', luggage: 'Shop all Luggage' };
            cta.textContent = `${ctaLabels[slug] || `Shop ${link.textContent.trim()}`} ›`;
            if (promoSlugs.has(slug)) {
              // Collect promo card titles to identify nav items they replace
              const promoTitles = new Set();
              if (cards) {
                cards.querySelectorAll('.cards-card-body p:first-child').forEach((p) => {
                  const t = p.textContent.trim().toLowerCase();
                  if (t) promoTitles.add(t);
                });
              }
              // Col 1 = items with sub-categories (ul); Col 2 = leaf icon-items
              const col1 = document.createElement('div');
              col1.className = 'nav-promo-col nav-promo-col-1';
              const col2 = document.createElement('div');
              col2.className = 'nav-promo-col nav-promo-col-2';
              [...panel.querySelectorAll(':scope > li')].forEach((li) => {
                const liLink = li.querySelector(':scope > p > a, :scope > a');
                if (liLink) {
                  const liText = liLink.textContent.trim().toLowerCase();
                  if (promoTitles.has(liText) || liLink.href === link.href) {
                    li.remove();
                    return;
                  }
                }
                if (li.querySelector(':scope > ul')) {
                  col1.append(li);
                } else {
                  col2.append(li);
                }
              });
              panel.append(col1);
              panel.append(col2);
              panel.append(megaContent);
              panel.append(cta);
            } else {
              megaContent.append(cta);
              panel.append(megaContent);
            }
          });
        }
      }
    });
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);

  if (utilNavFragment) {
    const utilNavWrapper = document.createElement('div');
    utilNavWrapper.className = 'util-nav-wrapper';

    // Extract content from the columns block and rebuild as clean util-nav divs
    const row = utilNavFragment.querySelector('.columns > div');
    if (row) {
      const cols = [...row.children];
      const promoCol = cols[0];
      const storeCol = cols[cols.length - 1];

      const bar = document.createElement('div');
      bar.className = 'util-nav';

      if (promoCol) {
        const promo = document.createElement('div');
        promo.className = 'util-nav-promo';
        promo.append(...promoCol.childNodes);
        bar.append(promo);
      }

      if (storeCol && storeCol !== promoCol) {
        const store = document.createElement('div');
        store.className = 'util-nav-store';
        const storePic = storeCol.querySelector('picture');
        const storeLinks = [...storeCol.querySelectorAll('a')];
        if (storePic) store.append(storePic);
        storeLinks.forEach((a) => store.append(a));
        bar.append(store);
      }

      utilNavWrapper.append(bar);
    } else {
      while (utilNavFragment.firstElementChild) {
        utilNavWrapper.append(utilNavFragment.firstElementChild);
      }
    }

    block.append(utilNavWrapper);
  }

  block.append(navWrapper);
}
