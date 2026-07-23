(function () {
  const percentEl = document.getElementById('percent-value');
  const fillEl = document.getElementById('loader-fill');
  let percent = 1;

  function tick() {
    // Uneven steps feel more alive than a perfectly linear count
    const step = percent < 70 ? Math.ceil(Math.random() * 4) : Math.ceil(Math.random() * 2);
    percent = Math.min(percent + step, 100);

    percentEl.textContent = percent;
    fillEl.style.width = percent + '%';

    if (percent >= 100) {
      setTimeout(goToSite, 350);
      return;
    }
    setTimeout(tick, 60 + Math.random() * 90);
  }

  function goToSite() {
    window.location.replace('site.html');
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(tick, 200);
  });
})();
