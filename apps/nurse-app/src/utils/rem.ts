const BASE_SIZE = 100; // 1rem = 100px (基于750px设计稿)

export const setRem = () => {
  const scale = document.documentElement.clientWidth / 750;
  document.documentElement.style.fontSize = `${BASE_SIZE * scale}px`;
};

window.addEventListener('resize', setRem);
setRem();