// A single little guide follows the selected atlas category.
export function installAtlasMascot({reducedMotion}) {
  const dialog = document.querySelector('#atlas-dialog');
  const rail = dialog.querySelector('.atlas-filters');
  const guide = document.createElement('span');
  guide.className = 'atlas-mini';
  guide.setAttribute('aria-hidden', 'true');
  guide.innerHTML = '<span class="atlas-mini-lift"><span class="atlas-mini-roll"><img src="/assets/jiangxiaotun-v5/planner-peeker-v1.webp" alt="" width="384" height="384" draggable="false"></span></span>';
  rail.prepend(guide);
  const lift = guide.firstElementChild;
  const roll = lift.firstElementChild;
  let x = 0, angle = 0, destination = null, frame = 0, placed = false;
  const ease = t => t*t*t*(t*(t*6-15)+10);
  function draw(y = 0, squash = 0) {
    guide.style.transform = `translate3d(${x}px,0,0)`;
    lift.style.transform = `translateY(${-y}px) scale(${1+squash},${1-squash})`;
    roll.style.transform = `rotate(${angle}deg)`;
  }
  function sync({animate = true} = {}) {
    if (!dialog.open) return;
    const active = rail.querySelector('[data-atlas-filter].active');
    if (!active) return;
    const target = active.offsetLeft + active.offsetWidth/2 - guide.offsetWidth/2;
    if (placed && Math.abs(target-destination) < .5) return;
    cancelAnimationFrame(frame);
    destination = target;
    if (!placed || !animate || reducedMotion.matches || Math.abs(target-x) < .5) {
      x = target; angle = 0; placed = true; draw(); guide.classList.add('is-ready'); return;
    }
    const fromX = x, fromAngle = angle;
    const direction = Math.sign(target-x);
    const turns = Math.max(1, Math.round(Math.abs(target-x)/(guide.offsetWidth*Math.PI)));
    // Finish upright; interruption keeps the current angle and reverses naturally.
    const endAngle = (direction > 0 ? Math.floor(angle/360)+turns : Math.ceil(angle/360)-turns)*360;
    const duration = Math.min(1150, 650 + Math.abs(target-x)*1.15);
    const started = performance.now();
    function tick(now) {
      if (!dialog.open) { frame = 0; return; }
      const t = Math.min(1, (now-started)/duration), p = ease(t);
      x = fromX + (target-fromX)*p;
      angle = fromAngle + (endAngle-fromAngle)*p;
      const landing = Math.sin(Math.PI*Math.max(0,(t-.78)/.22))*.035;
      draw(Math.sin(Math.PI*p)*5, landing);
      if (t < 1) frame = requestAnimationFrame(tick);
      else { angle = 0; draw(); frame = 0; }
    }
    frame = requestAnimationFrame(tick);
  }
  const observer = new ResizeObserver(() => sync({animate:false}));
  observer.observe(rail);
  rail.querySelectorAll('button').forEach(button => observer.observe(button));
  dialog.addEventListener('close', () => {
    cancelAnimationFrame(frame); frame = 0; placed = false; destination = null;
    guide.classList.remove('is-ready');
  });
  reducedMotion.addEventListener('change', () => { destination = null; sync({animate:false}); });
  return {sync};
}
