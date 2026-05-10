export default function decorate(block) {
  const cols = [...block.querySelectorAll(':scope > div > div')];
  const row = block.firstElementChild;
  row.textContent = '';

  cols.forEach((col) => {
    const picture = col.querySelector('picture');
    const link = col.querySelector('a');
    if (!link) return;

    const item = document.createElement('a');
    item.href = link.href;
    item.className = 'grey-section-columns-item';

    if (picture) item.append(picture);

    const label = document.createElement('span');
    label.textContent = link.textContent;
    item.append(label);

    row.append(item);
  });
}
