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

function mergeIconLink(li) {
  const picP = li.querySelector(':scope > p:has(picture)');
  const linkP = [...li.querySelectorAll(':scope > p')]
    .find((p) => p.querySelector('a') && !p.querySelector('picture'));
  if (!picP || !linkP) return;
  picP.append(...linkP.childNodes);
  linkP.remove();
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

  // Flatten tools: extract all pictures into direct children of nav-tools.
  // The search icon becomes a real button that opens the Porter brand concierge.
  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    const pictures = [...navTools.querySelectorAll('picture')];
    navTools.textContent = '';
    pictures.forEach((pic) => {
      const isSearch = !!pic.querySelector('img[src*="search"]');
      if (isSearch) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nav-tools-search';
        btn.setAttribute('aria-label', 'Open Porter — TUMI Brand Concierge');
        btn.append(pic);
        navTools.append(btn);

        let conciergeOpen = null;
        btn.addEventListener('click', async () => {
          if (conciergeOpen) { conciergeOpen(); return; }

          // Load CSS once
          if (!document.querySelector('link[href*="brand-concierge.css"]')) {
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = `${window.hlx.codeBasePath}/blocks/brand-concierge/brand-concierge.css`;
            document.head.append(cssLink);
          }

          const { default: openConcierge, init } = await import('../brand-concierge/brand-concierge.js');
          init({
            supabaseUrl: getMetadata('concierge-url') || 'https://cyjquwhkmzyedkwuaffc.supabase.co',
            anonKey: getMetadata('concierge-key'),
            siteKey: getMetadata('concierge-site') || 'tumi',
            brandName: 'TUMI',
            chatTitle: 'Porter — TUMI Brand Concierge',
            noCssAutoLoad: true,
          });
          conciergeOpen = openConcierge;
          openConcierge();
        });
      } else {
        const item = document.createElement('div');
        item.append(pic);
        navTools.append(item);
      }
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
          const fragOverrides = {
            luggage: 'luggage-promo', backpacks: 'backpacks-promo', men: 'mens-promo', women: 'womens-promo', services: 'services-promo',
          };
          const promoSlugs = new Set(['luggage', 'backpacks', 'bags', 'accessories', 'men', 'women', 'collections', 'services', 'sale']);
          // Section-based: each top-level sub-list item becomes its own column
          const sectionSlugs = new Set(['men', 'women']);
          // Per-slug: col1 predicate (true → col1, false → col2)
          const promoSplitFns = {
            luggage: (li) => !!li.querySelector(':scope > ul'),
            backpacks: (li) => !!li.querySelector(':scope picture'),
            bags: (li) => !!li.querySelector(':scope picture'),
          };
          // Per-slug: remove item entirely (won't go in any col)
          const promoRemoveFns = {
            bags: (li) => !li.querySelector(':scope picture') && !li.querySelector(':scope > ul'),
          };
          const ctaLabels = {
            new: 'Shop New Arrivals',
            gifts: 'Shop the Gift Guide',
            luggage: 'Shop all Luggage',
            backpacks: 'Shop all Backpacks',
            bags: 'Shop all Bags',
            accessories: 'Shop all Accessories',
            men: "Shop All Men's",
            women: "Shop All Women's",
            collections: 'Shop All Collections',
          };
          const fragSlug = fragOverrides[slug] || slug;
          loadFragment(`/fragments/nav-${fragSlug}`).then((frag) => {
            const panel = navSection.querySelector(':scope > ul');
            if (!panel) return;
            const cards = frag ? frag.querySelector('.cards') : null;
            const cta = document.createElement('a');
            cta.href = link.href;
            cta.className = 'nav-mega-cta';
            cta.textContent = `${ctaLabels[slug] || `Shop ${link.textContent.trim()}`} ›`;

            if (!promoSlugs.has(slug)) {
              const megaContent = document.createElement('div');
              megaContent.className = 'nav-mega-content';
              if (cards) megaContent.append(cards);
              megaContent.append(cta);
              panel.append(megaContent);
              return;
            }

            // ---- Section-based layout (Men, Women) ----
            if (sectionSlugs.has(slug)) {
              const sectionItems = [...panel.querySelectorAll(':scope > li')]
                .filter((li) => li.querySelector(':scope > ul'));
              [...panel.querySelectorAll(':scope > li')].forEach((li) => {
                const a = li.querySelector(':scope > p > a, :scope > a');
                if (a?.href === link.href) li.remove();
              });
              const makeSection = (li, colClass) => {
                const col = document.createElement('div');
                col.className = `nav-promo-col ${colClass} nav-section-col`;
                if (li) col.append(li);
                return col;
              };
              const col3 = document.createElement('div');
              col3.className = 'nav-mega-content nav-section-cards';
              const col3Head = sectionItems[2]?.querySelector(':scope > p');
              if (col3Head?.textContent.trim()) {
                const h = document.createElement('p');
                h.className = 'nav-section-heading';
                h.textContent = col3Head.textContent.trim();
                col3.append(h);
              }
              if (cards) col3.append(cards);
              panel.append(
                makeSection(sectionItems[0], 'nav-promo-col-1'),
                makeSection(sectionItems[1], 'nav-promo-col-2'),
                col3,
                cta,
              );
              return;
            }

            // ---- Sale: columns with icon items (category) + plain links (style/savings) ----
            if (slug === 'sale') {
              const saleItems = [...panel.querySelectorAll(':scope > li')].filter((li) => {
                const a = li.querySelector(':scope > p > a, :scope > a');
                return !a || a.href !== link.href;
              });
              const colRow = document.createElement('div');
              colRow.className = 'nav-sale-cols';
              saleItems.forEach((li) => {
                const headP = li.querySelector(':scope > p');
                const subUl = li.querySelector(':scope > ul');
                if (!headP?.textContent.trim() && !subUl) return;
                const col = document.createElement('div');
                col.className = 'nav-sale-col';
                if (headP && !headP.querySelector('a')) {
                  const h = document.createElement('p');
                  h.className = 'nav-sale-heading';
                  h.textContent = headP.textContent.trim();
                  col.append(h);
                }
                if (subUl) {
                  const list = document.createElement('ul');
                  list.className = 'nav-sale-list';
                  [...subUl.querySelectorAll(':scope > li')].forEach((item) => {
                    mergeIconLink(item);
                    list.append(item);
                  });
                  col.append(list);
                }
                colRow.append(col);
              });
              const wrapper = document.createElement('div');
              wrapper.className = 'nav-sale-wrapper';
              wrapper.append(colRow, cta);
              panel.append(wrapper);
              return;
            }

            // ---- Services: two icon cols + store col from fragment ----
            if (slug === 'services') {
              const sectionItems = [...panel.querySelectorAll(':scope > li')].filter((li) => {
                const a = li.querySelector(':scope > p > a, :scope > a');
                return !a || a.href !== link.href;
              });
              const serviceCols = sectionItems.map((li) => {
                const col = document.createElement('div');
                col.className = 'nav-services-col';
                const headP = li.querySelector(':scope > p');
                if (headP?.textContent.trim()) {
                  const h = document.createElement('p');
                  h.className = 'nav-services-heading';
                  h.textContent = headP.textContent.trim();
                  col.append(h);
                }
                const subUl = li.querySelector(':scope > ul');
                if (subUl) {
                  const list = document.createElement('ul');
                  list.className = 'nav-services-list';
                  [...subUl.querySelectorAll(':scope > li')].forEach((item) => {
                    mergeIconLink(item);
                    list.append(item);
                  });
                  col.append(list);
                }
                return col;
              });
              const storeCol = document.createElement('div');
              storeCol.className = 'nav-services-col nav-services-store';
              if (frag) {
                const h2 = frag.querySelector('h2');
                if (h2) {
                  const h = document.createElement('p');
                  h.className = 'nav-services-heading';
                  h.textContent = h2.textContent.trim();
                  storeCol.append(h);
                }
                const pic = frag.querySelector('picture');
                if (pic) storeCol.append(pic);
                [...frag.querySelectorAll('p')].forEach((p) => {
                  if (p.querySelector('picture')) return;
                  const links = [...p.querySelectorAll('a')];
                  if (links.length >= 2) {
                    links.forEach((a, i) => {
                      const btn = document.createElement('a');
                      btn.href = a.href;
                      btn.textContent = a.textContent;
                      btn.className = i === 0 ? 'nav-services-btn-primary' : 'nav-services-btn-secondary';
                      storeCol.append(btn);
                    });
                  } else {
                    storeCol.append(p.cloneNode(true));
                  }
                });
              }
              const wrapper = document.createElement('div');
              wrapper.className = 'nav-services-wrapper';
              [...serviceCols, storeCol].forEach((col) => wrapper.append(col));
              panel.append(wrapper);
              return;
            }

            // ---- Collections: tabbed layout ----
            if (slug === 'collections') {
              const tabsBlock = frag ? frag.querySelector('.tabs') : null;
              if (!tabsBlock) return;
              const tabBar = document.createElement('div');
              tabBar.className = 'nav-collections-tabs';
              const panelContainer = document.createElement('div');
              panelContainer.className = 'nav-collections-panels';
              [...tabsBlock.children].forEach((row, idx) => {
                const cols = [...row.children];
                const labelDiv = cols[0];
                const contentDiv = cols[1];
                if (!labelDiv || !contentDiv) return;
                const btn = document.createElement('button');
                btn.textContent = labelDiv.textContent.trim();
                btn.className = 'nav-collections-tab';
                if (idx === 0) btn.classList.add('is-active');
                tabBar.append(btn);
                const tabPanel = document.createElement('div');
                tabPanel.className = 'nav-collections-panel';
                if (idx !== 0) tabPanel.hidden = true;
                const table = contentDiv.querySelector('table');
                if (table) {
                  const cardList = document.createElement('ul');
                  cardList.className = 'nav-collections-cards';
                  [...table.querySelectorAll('tr')].slice(1).forEach((tr) => {
                    const tds = [...tr.querySelectorAll('td')];
                    if (tds.length < 2) return;
                    const card = document.createElement('li');
                    card.className = 'nav-collections-card';
                    const pic = tds[0].querySelector('picture');
                    if (pic) card.append(pic);
                    const body = document.createElement('div');
                    body.className = 'nav-collections-card-body';
                    const titleA = tds[1].querySelector('a');
                    if (titleA) {
                      const tp = document.createElement('p');
                      tp.className = 'nav-collections-card-title';
                      tp.append(titleA.cloneNode(true));
                      body.append(tp);
                    }
                    const descA = tds[1].querySelector('ul li a');
                    if (descA) {
                      const dp = document.createElement('p');
                      dp.className = 'nav-collections-card-desc';
                      dp.textContent = descA.textContent;
                      body.append(dp);
                    }
                    card.append(body);
                    cardList.append(card);
                  });
                  tabPanel.append(cardList);
                }
                panelContainer.append(tabPanel);
                btn.addEventListener('click', () => {
                  [...tabBar.querySelectorAll('.nav-collections-tab')].forEach((b) => b.classList.remove('is-active'));
                  [...panelContainer.querySelectorAll('.nav-collections-panel')].forEach((p) => { p.hidden = true; });
                  btn.classList.add('is-active');
                  tabPanel.hidden = false;
                });
              });
              const wrapper = document.createElement('div');
              wrapper.className = 'nav-collections-wrapper';
              wrapper.append(tabBar, panelContainer);
              panel.append(wrapper, cta);
              return;
            }

            // ---- Accessories: two icon cols + one sublist col ----
            if (slug === 'accessories') {
              const iconItems = [];
              const sublistItems = [];
              [...panel.querySelectorAll(':scope > li')].forEach((li) => {
                const a = li.querySelector(':scope > p > a, :scope > a');
                if (a?.href === link.href) { li.remove(); return; }
                if (li.querySelector(':scope picture')) iconItems.push(li);
                else if (li.querySelector(':scope > ul')) sublistItems.push(li);
                else li.remove();
              });
              const col1 = document.createElement('div');
              col1.className = 'nav-promo-col nav-promo-col-1';
              const col2 = document.createElement('div');
              col2.className = 'nav-promo-col nav-promo-col-2';
              const col3 = document.createElement('div');
              col3.className = 'nav-promo-col nav-promo-col-3';
              iconItems.slice(0, 8).forEach((li) => { mergeIconLink(li); col1.append(li); });
              iconItems.slice(8).forEach((li) => { mergeIconLink(li); col2.append(li); });
              sublistItems.forEach((li) => col3.append(li));
              panel.append(col1, col2, col3, cta);
              return;
            }

            // ---- Standard promo (Luggage, Backpacks, Bags) ----
            const promoTitles = new Set();
            if (cards) {
              cards.querySelectorAll('.cards-card-body p:first-child').forEach((p) => {
                const t = p.textContent.trim().toLowerCase();
                if (t) promoTitles.add(t);
              });
            }
            const splitFn = promoSplitFns[slug] || ((li) => !!li.querySelector(':scope > ul'));
            const removeFn = promoRemoveFns[slug];
            const col1 = document.createElement('div');
            col1.className = 'nav-promo-col nav-promo-col-1';
            const col2 = document.createElement('div');
            col2.className = 'nav-promo-col nav-promo-col-2';
            [...panel.querySelectorAll(':scope > li')].forEach((li) => {
              const liLink = li.querySelector(':scope > p > a, :scope > a');
              if (liLink) {
                const liText = liLink.textContent.trim().toLowerCase();
                if (promoTitles.has(liText) || liLink.href === link.href) {
                  li.remove(); return;
                }
              }
              if (removeFn && removeFn(li)) { li.remove(); return; }
              if (splitFn(li)) { mergeIconLink(li); col1.append(li); } else col2.append(li);
            });
            const megaContent = document.createElement('div');
            megaContent.className = 'nav-mega-content nav-mega-promo';
            if (cards) megaContent.append(cards);
            panel.append(col1, col2, megaContent, cta);
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
