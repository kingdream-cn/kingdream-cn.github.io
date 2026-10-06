/**
 * ROS Developer - Particle Network Background
 * 模拟 ROS 节点通信的动态粒子网络背景
 */
(function() {
  'use strict';

  // 创建 canvas 元素
  const canvas = document.createElement('canvas');
  canvas.id = 'ros-particle-canvas';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;';
  
  // 插入到 body 最前面
  document.body.insertBefore(canvas, document.body.firstChild);
  
  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  let animationId;
  
  // 配置参数
  const config = {
    particleCount: 80,        // 粒子数量
    particleRadius: 2,        // 粒子半径
    maxSpeed: 0.5,            // 最大速度
    connectionDistance: 150,  // 连线距离
    mouseDistance: 200,       // 鼠标影响距离
    colors: {
      particle: ['#00d4ff', '#00ff88', '#0080ff', '#40e0d0', '#00ced1'],
      line: 'rgba(0, 212, 255, 0.15)',
      lineHighlight: 'rgba(0, 255, 136, 0.3)'
    }
  };
  
  // 鼠标位置
  let mouse = { x: null, y: null };
  
  // 粒子类
  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * config.maxSpeed;
      this.vy = (Math.random() - 0.5) * config.maxSpeed;
      this.radius = config.particleRadius + Math.random() * 1.5;
      this.color = config.colors.particle[Math.floor(Math.random() * config.colors.particle.length)];
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.pulseSpeed = 0.02 + Math.random() * 0.02;
    }
    
    update() {
      // 鼠标交互 - 粒子被鼠标吸引
      if (mouse.x != null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < config.mouseDistance) {
          const force = (config.mouseDistance - distance) / config.mouseDistance;
          const angle = Math.atan2(dy, dx);
          this.vx += Math.cos(angle) * force * 0.02;
          this.vy += Math.sin(angle) * force * 0.02;
        }
      }
      
      // 更新位置
      this.x += this.vx;
      this.y += this.vy;
      
      // 边界反弹
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
      
      // 限制速度
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > config.maxSpeed * 2) {
        this.vx = (this.vx / speed) * config.maxSpeed * 2;
        this.vy = (this.vy / speed) * config.maxSpeed * 2;
      }
      
      // 脉冲动画
      this.pulsePhase += this.pulseSpeed;
    }
    
    draw() {
      const pulse = Math.sin(this.pulsePhase) * 0.3 + 1;
      const currentRadius = this.radius * pulse;
      
      // 绘制粒子光晕
      const gradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, currentRadius * 3
      );
      gradient.addColorStop(0, this.color);
      gradient.addColorStop(0.5, this.color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
      gradient.addColorStop(1, 'transparent');
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, currentRadius * 3, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // 绘制粒子核心
      ctx.beginPath();
      ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }
  
  // 初始化粒子
  function initParticles() {
    particles = [];
    for (let i = 0; i < config.particleCount; i++) {
      particles.push(new Particle());
    }
  }
  
  // 绘制连线
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < config.connectionDistance) {
          const opacity = 1 - (distance / config.connectionDistance);
          
          // 检查是否靠近鼠标
          let lineColor = config.colors.line;
          if (mouse.x != null) {
            const midX = (particles[i].x + particles[j].x) / 2;
            const midY = (particles[i].y + particles[j].y) / 2;
            const mouseDist = Math.sqrt((mouse.x - midX) ** 2 + (mouse.y - midY) ** 2);
            if (mouseDist < config.mouseDistance) {
              lineColor = config.colors.lineHighlight;
            }
          }
          
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = lineColor.replace(/[\d\.]+\)$/, (opacity * 0.5) + ')');
          ctx.lineWidth = opacity * 1.5;
          ctx.stroke();
        }
      }
    }
  }
  
  // 动画循环
  function animate() {
    ctx.clearRect(0, 0, width, height);
    
    // 绘制深色渐变背景
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#0a0a1a');
    bgGradient.addColorStop(0.5, '#0d1525');
    bgGradient.addColorStop(1, '#050510');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // 绘制连线
    drawConnections();
    
    // 更新和绘制粒子
    particles.forEach(particle => {
      particle.update();
      particle.draw();
    });
    
    animationId = requestAnimationFrame(animate);
  }
  
  // 调整画布大小
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  
  // 鼠标移动监听
  function onMouseMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }
  
  function onMouseLeave() {
    mouse.x = null;
    mouse.y = null;
  }
  
  // 初始化
  function init() {
    resize();
    initParticles();
    animate();
    
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);
  }
  
  // 页面加载完成后启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // 清理函数（用于 pjax 等场景）
  window.addEventListener('pjax:send', () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    window.removeEventListener('resize', resize);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseleave', onMouseLeave);
  });
  
})();
