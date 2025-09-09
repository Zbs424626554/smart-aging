const BASE_SIZE = 130; // 1rem = 130px (放大字号以便老人阅读)

export const setRem = () => {
  const scale = document.documentElement.clientWidth / 750;
  document.documentElement.style.fontSize = `${BASE_SIZE * scale}px`;
};

window.addEventListener('resize', setRem);
setRem();