(function(){
  "use strict";
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isFinePointer = window.matchMedia('(pointer:fine)').matches;

  /* ---------- Footer year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Custom cursor ---------- */
  if (isFinePointer && !reduceMotion){
    var dot = document.querySelector('.cursor-dot');
    var ring = document.querySelector('.cursor-ring');
    var mx = window.innerWidth/2, my = window.innerHeight/2;
    var rx = mx, ry = my;
    window.addEventListener('mousemove', function(e){
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate('+mx+'px,'+my+'px) translate(-50%,-50%)';
    });
    (function loop(){
      rx += (mx-rx)*0.16; ry += (my-ry)*0.16;
      ring.style.transform = 'translate('+rx+'px,'+ry+'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();
    var hoverTargets = document.querySelectorAll('a, button, .skill-card, .proj-card, .service-row, .t-card, [data-tilt]');
    hoverTargets.forEach(function(el){
      el.addEventListener('mouseenter', function(){ ring.classList.add('is-hover'); });
      el.addEventListener('mouseleave', function(){ ring.classList.remove('is-hover'); });
    });
    document.querySelectorAll('input, textarea').forEach(function(el){
      el.addEventListener('mouseenter', function(){ ring.classList.add('is-text'); });
      el.addEventListener('mouseleave', function(){ ring.classList.remove('is-text'); });
    });
  } else {
    document.querySelector('.cursor-dot').style.display='none';
    document.querySelector('.cursor-ring').style.display='none';
  }

  /* ---------- Nav hide/reveal on scroll + mobile menu ---------- */
  var nav = document.getElementById('nav');
  var lastY = window.scrollY;
  window.addEventListener('scroll', function(){
    var y = window.scrollY;
    if (y > lastY && y > 140){ nav.classList.add('nav-hidden'); }
    else { nav.classList.remove('nav-hidden'); }
    lastY = y;
  }, {passive:true});

  var navToggle = document.getElementById('navToggle');
  var mobilePanel = document.getElementById('mobilePanel');
  var mobileClose = document.getElementById('mobileClose');
  function openMobile(){ mobilePanel.classList.add('open'); navToggle.setAttribute('aria-expanded','true'); }
  function closeMobile(){ mobilePanel.classList.remove('open'); navToggle.setAttribute('aria-expanded','false'); }
  navToggle.addEventListener('click', openMobile);
  mobileClose.addEventListener('click', closeMobile);
  mobilePanel.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeMobile); });

  /* ---------- Magnetic buttons + ripple ---------- */
  document.querySelectorAll('.magnetic').forEach(function(btn){
    if (isFinePointer && !reduceMotion){
      btn.addEventListener('mousemove', function(e){
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width/2;
        var y = e.clientY - r.top - r.height/2;
        btn.style.transform = 'translate('+x*0.25+'px,'+y*0.35+'px)';
      });
      btn.addEventListener('mouseleave', function(){ btn.style.transform=''; });
    }
    btn.addEventListener('click', function(e){
      var r = btn.getBoundingClientRect();
      var span = document.createElement('span');
      span.className='ripple';
      span.style.left = (e.clientX-r.left)+'px';
      span.style.top = (e.clientY-r.top)+'px';
      span.style.width = span.style.height = Math.max(r.width,r.height)+'px';
      span.style.marginLeft = span.style.marginTop = (-Math.max(r.width,r.height)/2)+'px';
      btn.appendChild(span);
      setTimeout(function(){ span.remove(); }, 650);
    });
  });

  /* ---------- Hero canvas: particle field + glass orb ---------- */
  var canvas = document.getElementById('orbCanvas');
  var ctx = canvas.getContext('2d');
  var W,H,DPR;
  var particles = [];
  var pointer = {x:0,y:0,active:false};
  var targetParallax = {x:0,y:0}; var parallax = {x:0,y:0};

  function resize(){
    DPR = Math.min(window.devicePixelRatio||1, 2);
    W = canvas.parentElement.offsetWidth; H = canvas.parentElement.offsetHeight;
    canvas.width = W*DPR; canvas.height = H*DPR;
    canvas.style.width = W+'px'; canvas.style.height = H+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  function initParticles(){
    particles = [];
    var count = reduceMotion ? 0 : (window.innerWidth < 700 ? 26 : 54);
    for (var i=0;i<count;i++){
      var ang = Math.random()*Math.PI*2;
      var rad = 90 + Math.random()*170;
      particles.push({
        baseAng: ang, rad: rad, speed: 0.0016 + Math.random()*0.0022,
        size: 1 + Math.random()*1.8, hueMix: Math.random(), tw: Math.random()*Math.PI*2
      });
    }
  }
  resize(); initParticles();
  window.addEventListener('resize', function(){ resize(); initParticles(); });

  canvas.parentElement.addEventListener('mousemove', function(e){
    var r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
    targetParallax.x = (pointer.x/W - 0.5) * 24;
    targetParallax.y = (pointer.y/H - 0.5) * 24;
  });

  var t = 0;
  var colA = {r:76,g:126,b:255}, colB = {r:155,g:107,b:255}, colC = {r:63,g:224,b:208};
  function mixColor(a,b,f){ return 'rgba('+Math.round(a.r+(b.r-a.r)*f)+','+Math.round(a.g+(b.g-a.g)*f)+','+Math.round(a.b+(b.b-a.b)*f)+','; }

  function draw(){
    t += 1;
    parallax.x += (targetParallax.x - parallax.x)*0.06;
    parallax.y += (targetParallax.y - parallax.y)*0.06;
    ctx.clearRect(0,0,W,H);

    var cx = W*0.72 + parallax.x, cy = H*0.42 + parallax.y;
    if (window.innerWidth < 900){ cx = W*0.5 + parallax.x; cy = H*0.38+parallax.y; }

    // orb core glow
    var breathe = 1 + Math.sin(t*0.012)*0.035;
    var coreR = Math.min(W,H)*0.16*breathe;
    var grad = ctx.createRadialGradient(cx-coreR*0.3, cy-coreR*0.3, coreR*0.1, cx, cy, coreR*1.4);
    grad.addColorStop(0,'rgba(255,255,255,0.55)');
    grad.addColorStop(0.28,'rgba(120,150,255,0.35)');
    grad.addColorStop(0.6,'rgba(120,90,255,0.16)');
    grad.addColorStop(1,'rgba(120,90,255,0)');
    ctx.beginPath(); ctx.arc(cx,cy,coreR*1.4,0,Math.PI*2); ctx.fillStyle=grad; ctx.fill();

    // ring
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(t*0.0006);
    ctx.beginPath();
    ctx.ellipse(0,0, coreR*1.75, coreR*0.62, 0, 0, Math.PI*2);
    ctx.strokeStyle='rgba(200,215,255,0.16)';
    ctx.lineWidth=1;
    ctx.stroke();
    ctx.restore();

    // particles orbiting
    for (var i=0;i<particles.length;i++){
      var p = particles[i];
      var ang = p.baseAng + t*p.speed;
      var wob = Math.sin(t*0.01 + p.tw)*10;
      var px = cx + Math.cos(ang)*(p.rad+wob);
      var py = cy + Math.sin(ang)*(p.rad+wob)*0.62;
      var alpha = 0.35 + Math.sin(t*0.02+p.tw)*0.25;
      var col = p.hueMix < 0.5 ? mixColor(colA,colC,p.hueMix*2) : mixColor(colB,colC,(p.hueMix-0.5)*2);
      ctx.beginPath();
      ctx.arc(px,py,p.size,0,Math.PI*2);
      ctx.fillStyle = col+Math.max(0,alpha)+')';
      ctx.fill();
    }

    if (!reduceMotion){ requestAnimationFrame(draw); }
  }
  draw();
  if (reduceMotion){
    // draw a single static-ish frame occasionally for reduced motion users
    setInterval(draw, 4000);
  }

  /* ---------- Hero headline reveal ---------- */
  window.addEventListener('load', function(){
    document.querySelectorAll('.hero h1 .reveal').forEach(function(el,i){
      el.style.transition = 'transform 1s '+(0.15+i*0.12)+'s cubic-bezier(.16,1,.3,1)';
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){ el.style.transform='translateY(0)'; });
      });
    });
  });

  /* ---------- GSAP scroll reveals ---------- */
  function initScrollReveals(){
    if (typeof gsap === 'undefined'){ 
      document.querySelectorAll('[data-reveal]').forEach(function(el){ el.style.visibility='visible'; });
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    var variants = {
      up:    {y:36, opacity:0},
      left:  {x:-36, opacity:0},
      fade:  {opacity:0},
      scale: {scale:0.94, opacity:0}
    };
    document.querySelectorAll('[data-reveal]').forEach(function(el){
      var type = el.getAttribute('data-reveal') || 'up';
      var from = variants[type] || variants.up;
      el.style.visibility='visible';
      gsap.fromTo(el, from, {
        y:0, x:0, scale:1, opacity:1, duration: reduceMotion?0.01:1,
        ease:'power3.out',
        scrollTrigger:{ trigger: el, start:'top 88%', toggleActions:'play none none reverse' }
      });
    });

    // stagger project cards & skill cards & pillars as groups
    ['.skills-grid','.projects-grid','.pillars'].forEach(function(sel){
      var group = document.querySelector(sel);
      if (!group) return;
      var items = group.children;
      gsap.from(items, {
        y:30, opacity:0, duration: reduceMotion?0.01:0.8, stagger:0.08, ease:'power3.out',
        scrollTrigger:{ trigger:group, start:'top 85%' }
      });
    });

    // timeline fill
    var fill = document.getElementById('timelineFill');
    var timeline = document.querySelector('.timeline');
    if (fill && timeline){
      gsap.to(fill, {
        height:'100%', ease:'none',
        scrollTrigger:{ trigger: timeline, start:'top 70%', end:'bottom 80%', scrub:0.6 }
      });
    }
  }
  window.addEventListener('DOMContentLoaded', function(){
    if (typeof gsap === 'undefined'){
      window.addEventListener('load', initScrollReveals);
    } else { initScrollReveals(); }
  });
  // fallback in case defer scripts load after DOMContentLoaded already fired
  window.addEventListener('load', function(){
    setTimeout(function(){
      document.querySelectorAll('[data-reveal]').forEach(function(el){ el.style.visibility='visible'; });
      if (typeof ScrollTrigger !== 'undefined'){ initScrollReveals(); }
    }, 600);
  });

  /* ---------- 3D tilt for project cards & about art ---------- */
  if (isFinePointer && !reduceMotion){
    document.querySelectorAll('[data-tilt-card]').forEach(function(card){
      card.addEventListener('mousemove', function(e){
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left)/r.width;
        var py = (e.clientY - r.top)/r.height;
        var rx = (py-0.5)*-8, ry = (px-0.5)*10;
        card.style.transform = 'perspective(900px) rotateX('+rx+'deg) rotateY('+ry+'deg) translateY(-4px)';
        card.style.setProperty('--ang', (px*360)+'deg');
      });
      card.addEventListener('mouseleave', function(){ card.style.transform=''; });
    });
    document.querySelectorAll('[data-tilt-soft]').forEach(function(card){
      card.addEventListener('mousemove', function(e){
        var r = card.getBoundingClientRect();
        var px = (e.clientX-r.left)/r.width*100;
        var py = (e.clientY-r.top)/r.height*100;
        card.style.setProperty('--mx', px+'%');
        card.style.setProperty('--my', py+'%');
        var rx = ((py/100)-0.5)*-6, ry=((px/100)-0.5)*8;
        card.style.transform='perspective(700px) rotateX('+rx+'deg) rotateY('+ry+'deg) translateY(-6px)';
      });
      card.addEventListener('mouseleave', function(){ card.style.transform='translateY(0)'; });
    });
    document.querySelectorAll('[data-tilt]').forEach(function(card){
      card.addEventListener('mousemove', function(e){
        var r = card.getBoundingClientRect();
        var px = (e.clientX-r.left)/r.width;
        var py = (e.clientY-r.top)/r.height;
        var rx = (py-0.5)*-6, ry=(px-0.5)*8;
        card.style.transform='perspective(900px) rotateX('+rx+'deg) rotateY('+ry+'deg)';
      });
      card.addEventListener('mouseleave', function(){ card.style.transform=''; });
    });
  }

  /* ---------- Animated counters ---------- */
  var countEls = document.querySelectorAll('[data-count]');
  var counted = false;
  function runCounters(){
    if (counted) return; counted = true;
    countEls.forEach(function(el){
      var target = parseInt(el.getAttribute('data-count'),10);
      var suffix = el.getAttribute('data-suffix') || '';
      var dur = reduceMotion ? 1 : 1600;
      var start = null;
      function step(ts){
        if (!start) start = ts;
        var progress = Math.min((ts-start)/dur, 1);
        var eased = 1 - Math.pow(1-progress, 3);
        el.textContent = Math.round(eased*target) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }
  var statsBand = document.querySelector('.stats-band');
  if (statsBand){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){ if (entry.isIntersecting) runCounters(); });
    }, {threshold:0.4});
    io.observe(statsBand);
  }

  /* ---------- Testimonial marquee pause on focus ---------- */
  var track = document.getElementById('marqueeTrack');
  track.querySelectorAll('a,button').forEach(function(el){
    el.addEventListener('focus', function(){ track.classList.add('paused'); });
    el.addEventListener('blur', function(){ track.classList.remove('paused'); });
  });

  /* ---------- Contact form (demo submit) ---------- */
  var form = document.getElementById('contactForm');
  var status = document.getElementById('submitStatus');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    status.classList.add('show');
    form.querySelector('button[type="submit"]').style.opacity = '0.7';
    setTimeout(function(){
      form.querySelector('button[type="submit"]').style.opacity = '1';
    }, 400);
  });

  /* ---------- Back to top ---------- */
  document.getElementById('toTop').addEventListener('click', function(){
    window.scrollTo({top:0, behavior: reduceMotion ? 'auto' : 'smooth'});
  });

})();
