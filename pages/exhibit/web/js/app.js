// ========== Loading Screen ==========
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loading-screen').classList.add('hidden');
  }, 2200);
});

// ========== Particle Canvas (Prologue) ==========
(function() {
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let mouseX = 0, mouseY = 0;
  let w, h;

  function resize() {
    const section = document.getElementById('prologue');
    w = canvas.width = section.offsetWidth;
    h = canvas.height = section.offsetHeight;
  }

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.golden = Math.random() > 0.7;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      // Mouse interaction
      const dx = mouseX - this.x;
      const dy = mouseY - this.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 120) {
        this.x -= dx * 0.01;
        this.y -= dy * 0.01;
        this.opacity = Math.min(0.8, this.opacity + 0.02);
      }
      if (this.x < 0 || this.x > w || this.y < 0 || this.y > h) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      if (this.golden) {
        ctx.fillStyle = `rgba(201,169,110,${this.opacity})`;
      } else {
        ctx.fillStyle = `rgba(240,237,230,${this.opacity * 0.5})`;
      }
      ctx.fill();
    }
  }

  function init() {
    resize();
    particles = [];
    const count = Math.min(150, Math.floor(w * h / 8000));
    for (let i = 0; i < count; i++) particles.push(new Particle());
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(201,169,110,${0.08 * (1 - dist/100)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => { resize(); });
  document.getElementById('prologue').addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  init();
  animate();
})();

// ========== Event Cloud Canvas ==========
(function() {
  const canvas = document.getElementById('cloud-canvas');
  const ctx = canvas.getContext('2d');
  let w, h;
  let nodes = [];
  let dragNode = null;
  let offsetX = 0, offsetY = 0;
  let hoveredNode = null;
  let animFrame;

  const categories = [
    { name: '求学经历', color: '#C9A96E' },
    { name: '科研成就', color: '#D4564E' },
    { name: '人生大事', color: '#6BA3D6' },
    { name: '社会贡献', color: '#7BC67E' }
  ];

  const events = [
    { text: '1912 出生浏河', cat: 2, size: 22 },
    { text: '明德学校启蒙', cat: 0, size: 16 },
    { text: '1930 中央大学', cat: 0, size: 20 },
    { text: '1936 赴美伯克利', cat: 0, size: 22 },
    { text: '回旋加速器研究', cat: 1, size: 18 },
    { text: '1942 与袁家骝结婚', cat: 2, size: 18 },
    { text: '1944 曼哈顿计划', cat: 1, size: 24 },
    { text: '气体扩散法', cat: 1, size: 16 },
    { text: '1956 宇称不守恒', cat: 1, size: 30 },
    { text: '钴-60实验', cat: 1, size: 20 },
    { text: '1958 科学院院士', cat: 3, size: 20 },
    { text: '1963 矢量流守恒', cat: 1, size: 18 },
    { text: '1973 首次回国', cat: 2, size: 20 },
    { text: '1975 双β衰变', cat: 1, size: 16 },
    { text: '设立奖学金', cat: 3, size: 18 },
    { text: '1997 逝世', cat: 2, size: 22 },
    { text: '普林斯顿荣誉博士', cat: 3, size: 16 },
    { text: '美国物理学会会长', cat: 3, size: 18 },
    { text: '资助中国学者', cat: 3, size: 16 },
    { text: '沃尔夫奖', cat: 3, size: 18 },
  ];

  function resize() {
    const container = canvas.parentElement;
    w = canvas.width = container.offsetWidth;
    h = canvas.height = 500;
  }

  function initNodes() {
    resize();
    nodes = events.map((e, i) => {
      const angle = (i / events.length) * Math.PI * 2;
      const radius = 80 + Math.random() * 140;
      return {
        x: w/2 + Math.cos(angle) * radius,
        y: h/2 + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        text: e.text,
        cat: e.cat,
        size: e.size,
        color: categories[e.cat].color,
        targetX: 0, targetY: 0
      };
    });
  }

  function drawCloud() {
    ctx.clearRect(0, 0, w, h);

    // Draw connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(201,169,110,${0.06 * (1 - dist/150)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    nodes.forEach(n => {
      const isHovered = n === hoveredNode;
      const scale = isHovered ? 1.15 : 1;

      // Glow
      if (isHovered) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.size * scale + 10, 0, Math.PI * 2);
        ctx.fillStyle = n.color.replace(')', ',0.1)').replace('rgb', 'rgba');
        ctx.fill();
      }

      // Circle
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.size * scale, 0, Math.PI * 2);
      ctx.fillStyle = n.color + '18';
      ctx.fill();
      ctx.strokeStyle = n.color + (isHovered ? 'CC' : '66');
      ctx.lineWidth = isHovered ? 2 : 1;
      ctx.stroke();

      // Text
      ctx.fillStyle = isHovered ? '#F0EDE6' : '#9A9AAA';
      ctx.font = `${isHovered ? 'bold ' : ''}${Math.max(10, n.size * 0.42)}px "PingFang SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.text, n.x, n.y);
    });
  }

  function updateNodes() {
    nodes.forEach(n => {
      if (n === dragNode) return;

      // Gentle floating
      n.x += n.vx;
      n.y += n.vy;

      // Boundary
      if (n.x < n.size || n.x > w - n.size) n.vx *= -1;
      if (n.y < n.size || n.y > h - n.size) n.vy *= -1;

      // Center gravity
      const dx = w/2 - n.x;
      const dy = h/2 - n.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist > 200) {
        n.vx += dx * 0.00005;
        n.vy += dy * 0.00005;
      }

      // Damping
      n.vx *= 0.999;
      n.vy *= 0.999;
    });
  }

  function animate() {
    updateNodes();
    drawCloud();
    animFrame = requestAnimationFrame(animate);
  }

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (dragNode) {
      dragNode.x = mx;
      dragNode.y = my;
      return;
    }

    hoveredNode = null;
    for (const n of nodes) {
      const dx = mx - n.x;
      const dy = my - n.y;
      if (Math.sqrt(dx*dx + dy*dy) < n.size) {
        hoveredNode = n;
        canvas.style.cursor = 'pointer';
        break;
      }
    }
    if (!hoveredNode) canvas.style.cursor = 'default';
  });

  canvas.addEventListener('mousedown', e => {
    if (hoveredNode) {
      dragNode = hoveredNode;
      const rect = canvas.getBoundingClientRect();
      offsetX = e.clientX - rect.left - dragNode.x;
      offsetY = e.clientY - rect.top - dragNode.y;
    }
  });

  canvas.addEventListener('mouseup', () => { dragNode = null; });
  canvas.addEventListener('mouseleave', () => { dragNode = null; hoveredNode = null; });

  canvas.addEventListener('click', () => {
    if (hoveredNode) {
      const cat = categories[hoveredNode.cat].name;
      // Map to sections
      const sectionMap = { '求学经历': '#biography', '科研成就': '#research', '人生大事': '#biography', '社会贡献': '#spirit' };
      const target = sectionMap[cat] || '#biography';
      document.querySelector(target).scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Touch support
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const mx = touch.clientX - rect.left;
    const my = touch.clientY - rect.top;
    for (const n of nodes) {
      const dx = mx - n.x;
      const dy = my - n.y;
      if (Math.sqrt(dx*dx + dy*dy) < n.size + 10) {
        dragNode = n;
        break;
      }
    }
  }, { passive: false });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (dragNode) {
      const rect = canvas.getBoundingClientRect();
      dragNode.x = e.touches[0].clientX - rect.left;
      dragNode.y = e.touches[0].clientY - rect.top;
    }
  }, { passive: false });
  canvas.addEventListener('touchend', () => { dragNode = null; });

  window.addEventListener('resize', () => {
    resize();
  });

  // Use IntersectionObserver to only animate when visible
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (!animFrame) animate();
      } else {
        if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
      }
    });
  }, { threshold: 0.1 });
  observer.observe(canvas);

  initNodes();
})();

// ========== Scroll Effects ==========
(function() {
  const nav = document.getElementById('main-nav');
  const progress = document.getElementById('scroll-progress');
  const indicator = document.getElementById('chapter-indicator');
  const dots = document.querySelectorAll('.chapter-dot');
  const sections = document.querySelectorAll('.section');
  const navLinks = document.querySelectorAll('.nav-links a');

  // Reveal animation
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // Progress bar & active section
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    progress.style.width = scrollPercent + '%';

    // Nav visibility
    if (scrollTop > window.innerHeight * 0.5) {
      nav.classList.add('visible');
      indicator.classList.add('visible');
    } else {
      nav.classList.remove('visible');
      indicator.classList.remove('visible');
    }

    // Active section
    let currentSection = '';
    sections.forEach(section => {
      const top = section.offsetTop - 200;
      if (scrollTop >= top) currentSection = section.id;
    });

    dots.forEach(dot => {
      dot.classList.toggle('active', dot.dataset.section === currentSection);
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + currentSection);
    });
  });

  // Chapter dot click
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      document.getElementById(dot.dataset.section).scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Achievement progress animation
  const progressFill = document.getElementById('progress-fill');
  const achieveObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        progressFill.style.width = '62.5%'; // 5/8
      }
    });
  }, { threshold: 0.3 });
  achieveObserver.observe(document.getElementById('achievements'));
})();

// ========== AI Chat ==========
(function() {
  const messages = document.getElementById('chat-messages');
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const quickQs = document.querySelectorAll('.quick-q');

  const responses = {
    '吴健雄最著名的实验是什么？': '吴健雄最著名的实验是1956年完成的**钴-60 β衰变实验**。她通过精密的实验设计，在接近绝对零度的极低温条件下，观察到了电子发射方向的不对称性，有力地证实了杨振宁和李政道提出的"弱相互作用中宇称不守恒"理论。这一发现被认为是战后最激动人心的物理学突破之一。',
    '吴健雄为什么被称为"东方居里夫人"？': '吴健雄被称为"东方居里夫人"是因为她在核物理和放射性研究领域的杰出贡献，以及她与居里夫人相似的科研精神——严谨、精确、不懈追求。她是20世纪最伟大的实验物理学家之一，在放射性研究、核物理、弱相互作用等多个领域都做出了开创性贡献。',
    '宇称不守恒是什么意思？': '宇称不守恒是指在弱相互作用中，物理定律不具有左右对称性。简单来说，就像一面镜子里的世界和真实世界在微观粒子的行为上是不同的。在1956年之前，物理学家普遍认为宇称守恒是自然界的基本对称性。杨振宁和李政道提出宇称可能在弱相互作用中不守恒，吴健雄的实验完美地证实了这一假说，彻底改变了物理学界的基本认知。',
    '吴健雄对中国的贡献有哪些？': '吴健雄对中国的贡献是多方面的：①1973年首次回国，受到周恩来总理接见；②多次回国讲学，推动中美科学交流；③慷慨资助中国学者赴美深造；④设立"吴健雄科学奖学金"等多种奖学金；⑤参与创建南京大学金陵女子学院；⑥推动中国物理学研究和教育的发展。她始终心系祖国，为中美科学交流架起了桥梁。',
    '吴健雄获得了哪些荣誉？': '吴健雄获得的荣誉包括：①1958年当选美国科学院院士；②1975年当选美国物理学会会长（首位女性会长）；③1978年获沃尔夫物理学奖；④普林斯顿大学首位女性荣誉博士；⑤美国国家科学奖章；⑥多所世界顶尖大学的名誉博士学位。遗憾的是，尽管她的实验直接推动了杨振宁和李政道获得诺贝尔奖，她本人却未能获此殊荣，这被认为是诺贝尔奖历史上的重大遗憾之一。'
  };

  const defaultResponse = '感谢你的提问！吴健雄教授是一位伟大的实验物理学家，她在核物理、弱相互作用等领域做出了卓越贡献。建议你浏览展馆的各个章节来了解更多关于她的故事。你可以试试点击上方的快捷问题按钮！';

  function addMessage(text, isUser) {
    const msg = document.createElement('div');
    msg.className = `chat-msg ${isUser ? 'user' : 'ai'}`;
    msg.innerHTML = `
      <div class="chat-avatar-sm">${isUser ? '我' : 'AI'}</div>
      <div class="chat-bubble">${text}</div>
    `;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  function addTyping() {
    const msg = document.createElement('div');
    msg.className = 'chat-msg ai';
    msg.id = 'typing-msg';
    msg.innerHTML = `
      <div class="chat-avatar-sm">AI</div>
      <div class="chat-bubble">
        <div class="typing-indicator"><span></span><span></span><span></span></div>
      </div>
    `;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById('typing-msg');
    if (el) el.remove();
  }

  function handleSend() {
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, true);
    input.value = '';

    addTyping();
    setTimeout(() => {
      removeTyping();
      const response = responses[text] || defaultResponse;
      addMessage(response, false);
    }, 800 + Math.random() * 600);
  }

  sendBtn.addEventListener('click', handleSend);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') handleSend(); });

  quickQs.forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.dataset.q;
      input.value = q;
      handleSend();
    });
  });
})();

// ========== Share Button ==========
document.getElementById('share-btn').addEventListener('click', () => {
  const text = '我正在参观「追光健雄｜云端数字展馆」，已解锁5枚勋章！一起来了解伟大的物理学家吴健雄的故事吧！🔬✨';
  if (navigator.share) {
    navigator.share({ title: '追光健雄｜云端数字展馆', text: text });
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('share-btn');
      const original = btn.textContent;
      btn.textContent = '✅ 已复制到剪贴板';
      setTimeout(() => { btn.textContent = original; }, 2000);
    });
  }
});

// ========== Badge Click Effect ==========
document.querySelectorAll('.badge-item:not(.locked)').forEach(badge => {
  badge.addEventListener('click', () => {
    badge.style.transform = 'scale(1.05)';
    setTimeout(() => { badge.style.transform = ''; }, 300);
  });
});
