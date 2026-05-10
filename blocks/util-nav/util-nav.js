import { decorateIcons } from '../../scripts/aem.js';

export default async function decorate(block) {
  const row = block.firstElementChild;
  const [promoCell, storeCell] = [...row.children];

  block.innerHTML = '';

  if (promoCell) {
    const promo = document.createElement('div');
    promo.className = 'util-nav-promo';
    promo.append(...promoCell.childNodes);
    block.append(promo);
  }

  if (storeCell) {
    const store = document.createElement('div');
    store.className = 'util-nav-store';
    const icon = document.createElement('span');
    icon.className = 'icon icon-location';
    store.append(icon, ...storeCell.childNodes);
    block.append(store);
  }

  await decorateIcons(block);
}
