---
title: '计算机视觉里，看懂一张图其实要会四件事'
tags:
  - 计算机视觉
  - 深度学习
  - 图像分类
  - 目标检测
  - 图像分割
  - 图像重构
categories:
  - 技术
keywords: 计算机视觉, 图像分类, 目标检测, 语义分割, 实例分割, 图像重构, 深度学习
description: 把计算机视觉最核心的四类骨干任务（分类、检测、分割、重构）用大白话讲清，附 3 个可动手的交互演示，帮你在业务里快速判断该用哪种。
cover: '/img/cv-four-backbone-tasks-cover.jpg'
abbrlink: 29085
date: 2026-10-24 10:00:00
updated: 2026-10-24 10:00:00
---

## 从一个再普通不过的场景说起

你掏出手机，扫一下付款码；相册自动把照片按"人脸"分好了组；一键修图把逆光的脸提亮；导航里，车前面的行人和路障被实时圈了出来。

这几秒钟里，其实塞进了好几件完全不同的事。可我们总习惯用一个模糊的词把它们打批发——"图像识别"。

真要拆开看，它们各自回答的是不同的问题：

- 扫付款码，回答的是"**这张图是不是二维码**"；
- 相册分组，回答的是"**图里有没有人、人在哪**"；
- 智能修图，回答的是"**哪个像素是脸、哪个像素是背景**"；
- 老照片修复，回答的是"**能不能把这张残缺的图重新画好**"。

看出来了吗：同样是"看懂一张图"，要的答案粒度差着十万八千里。而计算机视觉里最核心的四大骨干任务，就是把这四类问题分别抽象出来的结果：

**图像分类、目标检测、分割、图像重构。**

> 先记住一个总纲：**分类答"整张图是什么"，检测答"东西在哪、是什么"，分割答"每个像素属于谁"，重构答"把坏图修好或造张新图"。**

后面的所有细节，都是围绕这四句话在转。

## 先搭个框架：你问的是"哪一层"的答案

动手选方案之前，我习惯先问一句：**这场仗，到底要拿到多细的答案？**

这四类任务，如果用"答案粒度"从粗到细排一排，是这样：

| 任务 | 输入 | 输出 | 粒度 |
| --- | --- | --- | --- |
| 图像分类 | 一张图 | 一个类别（如"猫"） | 整图 |
| 目标检测 | 一张图 | 若干个框 + 类别 + 置信度 | 物体级 |
| 分割 | 一张图 | 每个像素的类别 | 像素级 |
| 图像重构 | 坏图 / 低质图 | 一张修好 / 新生成的图 | 输出还是图 |

这一栏"粒度"，是整篇文章的锚点。往下你会发现，很多看起来不一样的活儿，本质是同一类任务；很多看起来很像的词，答案粒度其实完全不同。

## 任务一：图像分类 —— "这是什么"

这是最朴素、也最基础的一类：给一张图，模型吐一个类别标签，比如"猫""狗""路牌""肺炎 CT 阳性"。

它的特点就一句话：**只见森林，不见树木。** 模型不管图里有几个东西、它们待在哪，只对"整张图讲的是个啥"给出一个判断。所以哪怕图里猫和狗挤在一起，分类模型也只会看重那只最"显眼"的，给你一个笼统的答案。

工程上它通常长这样：模型最后接一个 Softmax，输出一串概率，谁的分数最高就判成谁。身份证识别里的"这是正面还是反面"、垃圾图片过滤、遥感影像里"这块是农田还是城市"，都是分类。

### 动手看看分类长什么样

下面这个演示把"图片"降维成三个几何图形。重点看一件事：分类器输出的是**整张图属于某个类别的概率**，而不是在图上找东西。

{% raw %}
<style>
.cv-demo{margin:1.6em 0;padding:18px 16px;border-radius:12px;border:1px solid #2f3340;background:#181a21;color:#e6e9ef;font-size:14px;line-height:1.6;overflow:hidden}
.cv-demo .t{font-weight:600;font-size:15px;margin-bottom:2px}
.cv-demo .s{color:#9aa3b2;font-size:12.5px;margin-bottom:14px}
.cv-demo button{font-family:inherit;cursor:pointer}
.cv-shapes{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:14px}
.cv-shape{width:64px;height:64px;border-radius:12px;border:1px solid #33374a;background:#20232d;display:flex;align-items:center;justify-content:center}
.cv-shape.on{border-color:#4f8cff;background:#262c3b}
.cv-row{margin-bottom:10px}
.cv-row:last-child{margin-bottom:0}
.cv-row-h{display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px}
.cv-row-name{color:#c9d1d9}
.cv-row-pct{color:#9aa3b2}
.cv-bar{height:8px;border-radius:6px;background:#262a36;overflow:hidden}
.cv-bar div{height:100%;border-radius:6px;transition:width .3s ease}
@media (prefers-color-scheme: light){
.cv-demo{background:#f6f7f9;border-color:#e2e5ea;color:#23272f}
.cv-demo .s{color:#6b7280}
.cv-shape{background:#fff;border-color:#e2e5ea}
.cv-shape.on{background:#eef3ff}
.cv-row-name{color:#3a3f4a}
.cv-bar{background:#eceef2}
}
</style>
<div class="cv-demo" id="cv-cls">
<div class="t">分类演示：三个图形，各代表一张"图"</div>
<div class="s">点一下任意图形，看看分类器给出的概率分布（这里把置信度固定，方便对比，非真实模型推理）。</div>
<div class="cv-shapes">
<button class="cv-shape on" data-k="round"><svg width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="11" fill="#ff7b72"/></svg></button>
<button class="cv-shape" data-k="square"><svg width="30" height="30" viewBox="0 0 30 30"><rect x="5" y="5" width="20" height="20" rx="2" fill="#5a9cff"/></svg></button>
<button class="cv-shape" data-k="tri"><svg width="30" height="30" viewBox="0 0 30 30"><polygon points="15,4 28,25 2,25" fill="#57c88f"/></svg></button>
</div>
<div class="cv-cls-out"></div>
</div>
<script>
(function () {
  var root = document.getElementById('cv-cls');
  if (!root) return;
  var btns = root.querySelectorAll('.cv-shape');
  var out = root.querySelector('.cv-cls-out');
  var map = {
    round: [['圆形', 93], ['方形', 4], ['三角形', 3]],
    square: [['圆形', 3], ['方形', 94], ['三角形', 3]],
    tri: [['圆形', 5], ['方形', 2], ['三角形', 93]]
  };
  function bar(name, pct) {
    var top = pct >= 90;
    var color = top ? '#46c48e' : '#4f8cff';
    var pc = top ? '#46c48e' : '#9aa3b2';
    var fw = top ? '600' : '400';
    return '<div class="cv-row"><div class="cv-row-h"><span class="cv-row-name">' + name + '</span><span class="cv-row-pct" style="color:' + pc + ';font-weight:' + fw + '">' + pct + '%</span></div><div class="cv-bar"><div style="width:' + pct + '%;background:' + color + '"></div></div></div>';
  }
  function render(k) {
    var rows = map[k], html = '';
    for (var i = 0; i < rows.length; i++) html += bar(rows[i][0], rows[i][1]);
    out.innerHTML = html;
    for (var j = 0; j < btns.length; j++) {
      var on = btns[j].getAttribute('data-k') === k;
      btns[j].className = 'cv-shape' + (on ? ' on' : '');
    }
  }
  for (var n = 0; n < btns.length; n++) {
    btns[n].addEventListener('click', function () { render(this.getAttribute('data-k')); });
  }
  render('round');
})();
</script>
{% endraw %}

> 分类的"坑"也最明显：**它对位置和数量完全不敏感**。一张图里有两只猫还是一只猫，它可能都答"猫"。所以凡是需要"数数"或"定位"的活儿，光靠分类不够。

## 任务二：目标检测 —— "在哪，是什么"

分类只回答"有什么"，但很多场景你必须知道"**东西具体在哪**"。这时候就轮到目标检测了。

检测干的事，是在图上同时做两件：**先圈出每个感兴趣的东西（定位），再判断它是啥（分类）**。所以它的输出是一串**检测框**，每个框都带着类别和置信度——这就是为什么你在 YOLO 的演示图里能看到一个个带文字的彩色框。

它俩的关系可以这么记：**分类是检测的子集**。检测 ≈ "在整张图上跑了无数次分类"，只不过多了一步"这个位置有没有东西、有多大"。

### 动手看看"框"是怎么来的

下面这张"图"里放了三个几何物体（这里把它们叫作"球、锥、箱"）。模型会先找到东西在哪、再判断它是什么。

{% raw %}
<style>
.cv-demo{margin:1.6em 0;padding:18px 16px;border-radius:12px;border:1px solid #2f3340;background:#181a21;color:#e6e9ef;font-size:14px;line-height:1.6;overflow:hidden}
.cv-demo .t{font-weight:600;font-size:15px;margin-bottom:2px}
.cv-demo .s{color:#9aa3b2;font-size:12.5px;margin-bottom:14px}
.cv-demo button{font-family:inherit;cursor:pointer}
.cv-run{padding:7px 16px;border:none;border-radius:8px;background:#4f8cff;color:#fff;font-size:13px}
.cv-note{color:#9aa3b2;font-size:12.5px}
@media (prefers-color-scheme: light){
.cv-demo{background:#f6f7f9;border-color:#e2e5ea;color:#23272f}
.cv-demo .s{color:#6b7280}
.cv-note{color:#6b7280}
}
</style>
<div class="cv-demo" id="cv-det">
<div class="t">检测演示：三个物体，先定位再分类</div>
<div class="s">点"运行检测"，逐个物体被框住并标上类别与置信度（演示用，非真实模型）。</div>
<canvas id="cv-det-c" width="340" height="200" style="max-width:100%;height:auto;border-radius:10px;display:block;background:#14161c"></canvas>
<div style="margin-top:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
<button class="cv-run" id="cv-det-run">运行检测 →</button>
<span class="cv-note" id="cv-det-info">点按钮开始</span>
</div>
</div>
<script>
(function () {
  var c = document.getElementById('cv-det-c');
  if (!c) return;
  var btn = document.getElementById('cv-det-run');
  var info = document.getElementById('cv-det-info');
  var W = 340, H = 200;
  var dpr = window.devicePixelRatio || 1;
  c.width = W * dpr; c.height = H * dpr;
  var ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  var objs = [
    { kind: 'circle', cx: 90, cy: 70, r: 26, bx: 64, by: 44, bw: 52, bh: 52, color: '#ff7b72', label: '球', conf: '0.92' },
    { kind: 'tri', cx: 148, cy: 148, s: 46, bx: 120, by: 122, bw: 56, bh: 52, color: '#57c88f', label: '锥', conf: '0.88' },
    { kind: 'rect', x: 215, y: 108, w: 50, h: 50, bx: 215, by: 108, bw: 50, bh: 50, color: '#5a9cff', label: '箱', conf: '0.96' }
  ];
  function bg() {
    ctx.fillStyle = '#14161c';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#232733';
    ctx.lineWidth = 1;
    for (var x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (var y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }
  function drawObj(o) {
    ctx.fillStyle = o.color;
    if (o.kind === 'circle') { ctx.beginPath(); ctx.arc(o.cx, o.cy, o.r, 0, Math.PI * 2); ctx.fill(); }
    else if (o.kind === 'rect') { ctx.fillRect(o.x, o.y, o.w, o.h); }
    else { ctx.beginPath(); ctx.moveTo(o.cx, o.cy - o.s * 0.55); ctx.lineTo(o.cx + o.s * 0.6, o.cy + o.s * 0.45); ctx.lineTo(o.cx - o.s * 0.6, o.cy + o.s * 0.45); ctx.closePath(); ctx.fill(); }
  }
  function box(o) {
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
    ctx.strokeRect(o.bx, o.by, o.bw, o.bh);
    var lab = o.label + ' ' + o.conf;
    ctx.font = '12px system-ui,sans-serif';
    var tw = ctx.measureText(lab).width;
    ctx.fillStyle = '#ffd166'; ctx.fillRect(o.bx, o.by - 18, tw + 10, 16);
    ctx.fillStyle = '#14161c'; ctx.fillText(lab, o.bx + 5, o.by - 6);
  }
  function all(i) {
    bg();
    for (var j = 0; j < objs.length; j++) { drawObj(objs[j]); if (j <= i) box(objs[j]); }
  }
  all(-1);
  var timer = null;
  btn.addEventListener('click', function () {
    if (timer) return;
    all(-1);
    info.textContent = '正在检测……';
    var i = 0;
    timer = setInterval(function () {
      all(i);
      i++;
      if (i >= objs.length) {
        clearInterval(timer); timer = null;
        info.textContent = '共找到 ' + objs.length + ' 个物体';
      }
    }, 360);
  });
})();
</script>
{% endraw %}

自动驾驶里圈出行人和车辆、工业质检里圈出瑕疵、安防监控里圈出可疑目标——这些都是检测。绝大多数要"画框"的活儿，都归它。

## 任务三：分割 —— "每个像素属于谁"

到这里，答案粒度一下子细到了像素。

检测给的是"框"——框是方的，但真实物体的形状几乎不可能是方的。一只摊开的手、一条弯弯的道路，框都会把旁边无关的背景一起兜进去。分割就是来解决这个的：**它要给图里的每一个像素，都标上"你属于谁"。**

分割又分两大家族，这是最容易混的一对：

- **语义分割（Semantic Segmentation）**：只分"类"，不分"个体"。所有"行人"的像素涂同一种色，所有"汽车"涂另一种色。它告诉你"这一片是人、那一片是车"，但**不告诉你"这是第几个人"**。
- **实例分割（Instance Segmentation）**：既分"类"，又分"个体"。同样是行人，站左边的和站右边的会被当成两个独立对象，涂成不同深浅。它相当于**在语义分割的基础上，再叠加了目标检测的"逐个"能力**。

一句话区分：**语义分割数的是"有哪几类东西"，实例分割数的是"有几个东西"。**

### 动手看看两种分割的差别

场景里有【两个行人（红圆）】和【两辆汽车（蓝方）】。切换下面的三种模式，重点看两个同类物体是不是被"分了家"。（分割模式会换成伪彩色，颜色会和原图不同，别慌——它只是用来区分类别和个体。）

{% raw %}
<style>
.cv-demo{margin:1.6em 0;padding:18px 16px;border-radius:12px;border:1px solid #2f3340;background:#181a21;color:#e6e9ef;font-size:14px;line-height:1.6;overflow:hidden}
.cv-demo .t{font-weight:600;font-size:15px;margin-bottom:2px}
.cv-demo .s{color:#9aa3b2;font-size:12.5px;margin-bottom:14px}
.cv-demo button{font-family:inherit;cursor:pointer}
.cv-seg-bar{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.cv-btn{padding:7px 14px;border:1px solid #33374a;border-radius:8px;background:#20232d;color:#d6dae3;font-size:13px}
.cv-tip{margin-top:10px;color:#9aa3b2;font-size:12.5px}
@media (prefers-color-scheme: light){
.cv-demo{background:#f6f7f9;border-color:#e2e5ea;color:#23272f}
.cv-demo .s{color:#6b7280}
.cv-btn{background:#fff;color:#23272f;border-color:#d8dbe0}
.cv-tip{color:#6b7280}
}
</style>
<div class="cv-demo" id="cv-seg">
<div class="t">分割演示：语义 vs 实例，一眼看出差别</div>
<div class="s">两个行人（红圆）＋ 两辆汽车（蓝方）。切换模式，观察同类物体是否被区分开来。</div>
<canvas id="cv-seg-c" width="340" height="200" style="max-width:100%;height:auto;border-radius:10px;display:block"></canvas>
<div class="cv-seg-bar">
<button class="cv-btn" data-m="orig" id="cv-seg-orig">原图</button>
<button class="cv-btn" data-m="sem" id="cv-seg-sem">语义分割</button>
<button class="cv-btn" data-m="inst" id="cv-seg-inst">实例分割</button>
</div>
<div class="cv-tip" id="cv-seg-tip">原图：两个行人（红）＋ 两辆汽车（蓝）。</div>
</div>
<script>
(function () {
  var c = document.getElementById('cv-seg-c');
  if (!c) return;
  var W = 340, H = 200;
  var dpr = window.devicePixelRatio || 1;
  c.width = W * dpr; c.height = H * dpr;
  var ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  var persons = [ { cx: 80, cy: 80, r: 28 }, { cx: 235, cy: 62, r: 22 } ];
  var cars = [ { x: 125, y: 118, w: 44, h: 44 }, { x: 250, y: 132, w: 40, h: 40 } ];
  var btns = [document.getElementById('cv-seg-orig'), document.getElementById('cv-seg-sem'), document.getElementById('cv-seg-inst')];
  var tip = document.getElementById('cv-seg-tip');
  var tips = {
    orig: '原图：两个行人（红）＋ 两辆汽车（蓝），还没做任何分割。',
    sem: '语义分割：同类物体涂成【同一种颜色】——两个行人都是橙、两辆车都是青，【不区分个体】。',
    inst: '实例分割：同类物体也【逐个分开】——两个行人用深浅不同的橙，两辆车用深浅不同的蓝。'
  };
  function draw(m) {
    var grid = m === 'orig';
    ctx.fillStyle = grid ? '#14161c' : '#1d2029';
    ctx.fillRect(0, 0, W, H);
    if (grid) {
      ctx.strokeStyle = '#232733'; ctx.lineWidth = 1;
      for (var x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (var y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    }
    var p0, p1, c0, c1;
    if (m === 'orig') { p0 = p1 = '#ff7b72'; c0 = c1 = '#5a9cff'; }
    else if (m === 'sem') { p0 = p1 = '#ff9f43'; c0 = c1 = '#4dabf7'; }
    else { p0 = '#ffb96b'; p1 = '#e07b1a'; c0 = '#8ecbff'; c1 = '#2f7fd6'; }
    ctx.fillStyle = p0; ctx.beginPath(); ctx.arc(persons[0].cx, persons[0].cy, persons[0].r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p1; ctx.beginPath(); ctx.arc(persons[1].cx, persons[1].cy, persons[1].r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c0; ctx.fillRect(cars[0].x, cars[0].y, cars[0].w, cars[0].h);
    ctx.fillStyle = c1; ctx.fillRect(cars[1].x, cars[1].y, cars[1].w, cars[1].h);
  }
  function setActive(m) {
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute('data-m') === m;
      btns[i].style.borderColor = on ? '#4f8cff' : '#33374a';
      btns[i].style.background = on ? '#262c3b' : '#20232d';
      btns[i].style.color = '#d6dae3';
    }
  }
  for (var n = 0; n < btns.length; n++) {
    btns[n].addEventListener('click', function () {
      var m = this.getAttribute('data-m');
      draw(m);
      setActive(m);
      tip.textContent = tips[m];
    });
  }
  draw('orig');
  setActive('orig');
})();
</script>
{% endraw %}

语义分割用在自动驾驶的路面 / 车道线 / 天空分析、遥感地物分类；实例分割则用在需要"数清楚有几个"的场景，比如细胞计数、货架商品逐个定位。

## 任务四：图像重构 —— "把图修好，或直接造一张"

前三类任务，输入是图、输出是**标签**（类别 / 框 / 像素标签）。重构不一样：**它输入的是一张不完整的、低质的图，输出的还是一张图**，只不过这张图比原来更清晰、更完整，甚至是全新的一张。

它涵盖的范围比名字听起来宽。粗分两条线：

- **补全修复**：超分辨率（把糊图放大变清）、去噪、去模糊、老照片上色、图像修复（inpainting，把图里的水印 / 杂物抹掉再填上合理内容）。
- **从无到有**：文生图、图生图、风格迁移。给一句"一只戴着宇航头盔的猫"，模型从噪声里一步步"画"出一张图。

这几年大火的各种生成式模型（扩散模型、GAN），干的本质都是重构这条线。它和前三个任务最大的区别是：**前三个是"理解"图，重构是"制造"图。** 一个是读数，一个是作画。

所以如果你的需求是"让图变清楚"或"生成一张图"，就别往检测 / 分割上使劲了，那是重构的地盘。

## 常见应用，怎么对上号

很多人上来就背"YOLO 做检测、U-Net 做分割"，背完还是不知道怎么用。其实把应用往前述四个任务上一套，关系就清楚了：

| 实际应用 | 背后主要是哪种骨干任务 | 为什么 |
| --- | --- | --- |
| 手机相册按人脸 / 场景分组 | 目标检测 + 图像分类 | 先框出人脸，再判断是谁 |
| 身份证 / 证件 OCR 前的版面判断 | 图像分类 | 判断正反面、证件类型 |
| 自动驾驶感知道路 | 分割 + 检测 + 分类 | 框车辆、分车道、认路牌 |
| 医疗影像病灶勾画 | 分割（常语义） | 要精确到像素找出病灶边界 |
| 工业质检"有没有瑕疵" | 目标检测 / 分割 | 粗定位用检测，精边界用分割 |
| 老照片修复 / 上色 | 图像重构 | 从残缺图补全 |
| 文生图 / 风格迁移 | 图像重构 | 从文本 / 参考图生成新图 |
| 门禁刷脸"是不是你" | 检测 + 分类（识别） | 先定位人脸，再比对身份 |

注意上表里几乎**没有一个真实产品是"只用一个任务"**。它们大多是多个骨干任务的组合拳。这也是为什么必须先拆清楚四个任务——拆清楚了，你才知道一个复杂产品里，哪些部分该用哪种武器。

## 容易混的概念，掰开说

写代码前，先把这几个高频混淆点过一遍，能少走不少弯路：

**1. 目标检测 vs 语义分割**

共同点：都能告诉你"图里有什么"。区别在**输出的形状**——检测给"框"（方形、数量少、和物体形状无关），分割给"像素掩码"（贴合物体轮廓、逐像素）。要不要精确边界，是选型的分水岭。

**2. 语义分割 vs 实例分割**

前面演示里已经看得很清楚了：差在**"分不分个体"**。数人头的场景必须实例分割；只看"哪里是路、哪里是天"用语义分割就够，还更省。

**3. 图像分类 vs 目标检测**

分类是"整图一个标签"，检测是"每个物体一个框 + 标签"。判断标准特别简单：**你的答案里需不需要"位置"？** 不需要就是分类，需要就是检测。

**4. 重构不是"识别"**

很多人把超分、美颜也当成"图像识别"，其实它们根本不输出标签，输出的是图。任务性质（理解 vs 生成）都不同，选模型、选损失函数、选评测指标，全然两套体系。

## 业务里怎么选：先问三个问题

真到落地，别再纠结"用哪个 SOTA 模型"，先拿这三个问题逼自己一把，任务类型多半就出来了：

1. **我要的答案，是"标签"还是"图"？** 要标签 → 前三类；要图 → 重构。
2. **需不需要"位置 / 数量"？** 不需要 → 分类；需要但只圈范围 → 检测；要精确边界 → 分割。
3. **要分清"每个个体"吗？** 不要 → 语义分割；要 → 实例分割。

走完这三个问题，答案基本就锁定在某一个任务上了。剩下的所谓"模型选型、数据标注、调参"，那都是选定任务之后的执行层细节。

顺带一句经验：**数据标注成本是会随任务变本加厉的**。分类只要一张图一个标签，检测要每张图框一批框，分割要每张图逐像素抠轮廓。任务越"细"，标注越贵。所以能用分类解决的就别上检测，能用检测的别硬上分割——省下来的标注预算，往往比省一点模型精度更实在。

---

以后我再遇到"要识别个什么东西"的需求，不会第一反应去搜"图像识别怎么做"了。我会先问自己三句：**要标签还是图？要位置吗？要分清个体吗？**

这三个问题问完，该上哪类任务基本就定了。剩下选网络、标数据、调参，都是敲定方向之后的执行活。

写这篇，是因为我见过不少朋友把"图像识别"当成一个词，一接到需求就懵，不知道从哪下手。把这四件事拆开来看，是我自己绕了挺久才想明白的。希望你能少绕一点。