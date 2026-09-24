---
title: 'AI 圈爆火的 Jev：为什么“不会聊天”的 AI 才是程序员的真爱？'
tags:
  - AI
  - Jev
  - TypeSafe
  - 决策模型
  - 具身智能
  - 自动化
categories:
  - 技术
description: 一个不会聊天、不写代码的模型为什么能刷屏 AI 圈？用大白话讲清 Jev 是什么、怎么用、为什么又快又便宜，以及它对具身智能意味着什么。
cover: '/img/jev-cover.jpg'
abbrlink: 51328
date: 2026-09-22 21:00:00
updated: 2026-09-22 21:00:00
---

## 一个不会聊天的 AI，凭什么刷屏

进去之前以为是又一个聊天模型。看完才发现——**它不会聊天，不会写代码，不会写文案**。你问它一句话，它一个字都不往外生成。

它只干一件事：**做判断**。

偏偏就在大模型神仙打架的 2026 年 9 月，这个「哑巴」模型成了 AI 圈风头最劲的选手：发布 36 小时就涌进 14 万开发者；接入 Vercel 的 AI Gateway 后，24 小时内被接近 13% 的付费团队用上，成为该平台历史上被采用最快的新模型；到 9 月 21 日，它直接取消了候补名单，向所有用户开放，注册还送 5 美元额度。

一个不会说话的模型能火，这事本身就够反常了。所以我想用最通俗的话，把它讲清楚。

## 先说痛点：被「JSON 解析错误」支配的恐惧

要理解 Jev 解决了什么问题，得先回忆一个很常见的开发场景。

假设你在扣子（Coze）上搭了个自动化工作流，或者写了一段 Python 脚本，想让 AI 帮你盯着飞书群：如果有人反馈 Bug，就自动打上「紧急」标签并转发给技术团队。

用传统大模型（比如 GPT 系列），你得在 Prompt 里苦口婆心地写：

> 请分析这句话，如果紧急就输出 JSON，格式为 `{"status": "urgent"}`，千万不要输出任何多余的废话！

结果它偶尔还是会「戏精附体」：

```json
好的，我已经为您分析完毕。以下是 JSON 结果：
{"status": "urgent"}
希望对您有帮助！
```

你的脚本执行到 `json.loads()` 时撞上前面那句「好的」，程序当场崩溃。为了对付这种事，只能被迫写一堆正则表达式去「抠」数据。

**传统大模型像个文科生，很感性、爱写小作文。你想让它老老实实当个系统开关，它总在关键时刻掉链子。**

这背后其实有个很本质的原因：大语言模型是**逐字往外蹦**的（自回归生成）。它被训练成「把话说得漂亮」，而不是「把事判断准确」。你要它给一个 yes / no，它也得先写完一整段分析才肯给结论——慢、烧钱，还得你自己从文字里把答案捞出来。

## 破局：Jev 只做三道题

前 OpenAI 研究员 Diogo Almeida 受不了这件事。他是 RLHF（ChatGPT 背后的关键训练方法）的奠基人之一，却在 ChatGPT 爆火之后开始怀疑：**为什么超人类的聊天模型，没能带来真正的自动化？**

他的结论很直接：我们花了几年时间优化「说人话」，但计算机并不说人话。**文字是世界上最难优化的东西**，硬要在文字上追求 100% 可靠，是在逆着生成式 AI 的底层原理干活。

那就干脆别让它说话了。

他离开 OpenAI，创办了 TypeSafe AI（旧金山，4000 万美元种子轮，DCVC 领投），做出了 Jev。官方给它贴的标签是 **System One Model（系统一模型）**，名字来自诺贝尔奖得主卡尼曼的《思考，快与慢》：系统一是不过脑子的直觉判断，系统二是慢下来一步步推理。这几年所有人都在造系统二，可软件里真正需要的判断，大多数是系统一。

一句话概括两者的分工：

> **聊天模型是「写答案的」，Jev 是「挑答案的」。**

Jev 只认三种问法，官方叫「AI 原语」：

| 类型 | 干什么 | 返回什么 |
| --- | --- | --- |
| `Noul` | 是非判断 | 一个 0~1 之间的概率 |
| `Choice` | 多选一（最多 255 个选项） | 命中的选项 + 全概率分布 + 置信度 |
| `Score` | 按刻度打分（例如 1~10 级） | 一个带置信度的分数 |

三种题可以塞进**同一次请求**，而且是并行的。官方说，问一个问题还是问四个问题，延迟几乎一样。

### 第一招：Noul —— 是非判断

用来做「是／否」的绝对门控。

你问它：这条飞书消息是在骂人吗？

```json
{ "is_insult": { "type": "noul", "noul": 0.05 } }
```

只有 5% 的概率是骂人，程序直接判定安全放行。

### 第二招：Choice —— 智能路由

用来做分类分发，是最实用的一个。

你问它：这个用户的技术咨询该分发给哪个端？选项是「前端 / 后端 / 运维 / UI」。

```json
{
  "department": {
    "type": "choice",
    "choice": "technical",
    "confidence": 0.76,
    "probabilities": { "frontend": 0.05, "backend": 0.84, "ops": 0.09, "ui": 0.02 }
  }
}
```

拿到 `backend` 这个字符串直接触发 Webhook 就行。**它绝不会给你生造一个「服务器端」，导致匹配失败**——因为选项是你预先框死的，它只能在框里挑。

### 第三招：Score —— 程度量化

用来做「有多严重」「有多紧急」这类带梯度的判断。

你问它：这位用户的愤怒指数是几分（1~10）？

```json
{ "anger": { "type": "score", "score": 8 } }
```

代码里一句 `if score > 8:` 就可以立刻给主管发告警。

一个完整的请求长这样——**给一段状态，问几个预先定义好的问题**：

```json
{
  "state": "我连续 3 天连不上支付账户，正在丢单，请尽快处理！",
  "questions": {
    "is_urgent": { "type": "noul", "instructions": "这条消息是否传达了紧急性" },
    "team": {
      "type": "choice",
      "instructions": "这个工单该交给哪个团队",
      "criteria": { "billing": "付款、发票、退款", "technical": "Bug、系统故障" }
    }
  }
}
```

返回的是强类型结果：不用写 JSON 提示词，不用额外的解析器，也不用担心模型突然给你包一层 Markdown 代码块。

<div style="margin:1.6em 0;padding:20px 18px;border:1px solid #2b2e3b;border-radius:12px;background:#17181f;color:#d6dae3;font-size:14px;line-height:1.7;">
  <div style="font-weight:600;font-size:15px;">亲手体验：Jev 的三连问</div>
  <div style="color:#8b93a1;font-size:12.5px;margin-top:2px;">选一个场景，点「运行判断」，看看它会返回什么（前端演示，非真实 API 调用，结果随所选场景固定展示）</div>

  <div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0;align-items:center;">
    <button data-scene="pay" class="jev-scene" style="padding:7px 12px;border:1px solid #33374a;border-radius:8px;background:#20232d;color:#d6dae3;cursor:pointer;">付款故障</button>
    <button data-scene="tech" class="jev-scene" style="padding:7px 12px;border:1px solid #33374a;border-radius:8px;background:#20232d;color:#d6dae3;cursor:pointer;">技术报错</button>
    <button data-scene="refund" class="jev-scene" style="padding:7px 12px;border:1px solid #33374a;border-radius:8px;background:#20232d;color:#d6dae3;cursor:pointer;">退款抱怨</button>
    <button id="jev-run" style="margin-left:auto;padding:7px 16px;border:none;border-radius:8px;background:#4f8cff;color:#fff;cursor:pointer;">运行判断 →</button>
  </div>

  <div id="jev-loading" style="display:none;margin-top:12px;color:#8b93a1;font-size:13px;">正在判断……</div>

  <div id="jev-out" style="display:none;margin-top:10px;border-top:1px dashed #2b2e3b;padding-top:12px;">
    <div style="font-size:12px;color:#8b93a1;">输入 state</div>
    <div id="jev-state" style="margin:4px 0 10px;padding:8px 10px;background:#20232d;border-radius:8px;color:#c9d1d9;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;white-space:pre-wrap;"></div>
    <div id="jev-latency" style="font-size:12px;color:#46c48e;margin:2px 0 10px;"></div>
    <div id="jev-results"></div>
  </div>
</div>

<script>
(function () {
  // 卡片容器没有 id，脚本从场景按钮向上反查外层卡片
  var scenes = document.querySelectorAll('button.jev-scene');
  if (!scenes.length) return;
  var card = scenes[0];
  while (card && !card.querySelector('#jev-out')) { card = card.parentElement; }
  var out = card.querySelector('#jev-out');
  var loading = card.querySelector('#jev-loading');
  var stateEl = card.querySelector('#jev-state');
  var latencyEl = card.querySelector('#jev-latency');
  var resultsEl = card.querySelector('#jev-results');
  var runBtn = card.querySelector('#jev-run');

  var data = {
    pay: {
      msg: '我连续 3 天连不上支付账户，正在丢单，请尽快处理！',
      latency: '78 毫秒',
      noul: { k: 'is_urgent（是否紧急）', v: 0.93 },
      choice: { k: 'team（转给哪个团队）', pick: 'billing', conf: 0.84, probs: [['billing', 0.84], ['technical', 0.16]] },
      score: { k: 'anger（愤怒指数 1~10）', v: 8 }
    },
    tech: {
      msg: "你们的 SDK 在 Python 3.12 上报错：ModuleNotFoundError: No module named 'typesafe'",
      latency: '85 毫秒',
      noul: { k: 'is_urgent（是否紧急）', v: 0.21 },
      choice: { k: 'team（转给哪个团队）', pick: 'technical', conf: 0.79, probs: [['technical', 0.79], ['billing', 0.21]] },
      score: { k: 'anger（愤怒指数 1~10）', v: 2 }
    },
    refund: {
      msg: '我要退款！这个功能根本没法用，纯属浪费时间。',
      latency: '92 毫秒',
      noul: { k: 'is_urgent（是否紧急）', v: 0.68 },
      choice: { k: 'team（转给哪个团队）', pick: 'billing', conf: 0.72, probs: [['billing', 0.72], ['technical', 0.28]] },
      score: { k: 'anger（愤怒指数 1~10）', v: 7 }
    }
  };

  function bar(pct, color) {
    return '<div style="background:#262a36;border-radius:6px;height:8px;margin-top:5px;overflow:hidden;"><div style="width:' + pct + '%;height:100%;background:' + color + ';"></div></div>';
  }

  function render(s) {
    var d = data[s];
    stateEl.textContent = d.msg;
    latencyEl.textContent = '本次判断耗时 ≈ ' + d.latency;
    var inner = '';
    inner += '<div style="margin-bottom:10px;"><span style="color:#8b93a1;">Noul · </span>' + d.noul.k + ' → <b style="color:#e0a94e;">' + Math.round(d.noul.v * 100) + '%</b>' + bar(d.noul.v * 100, '#e0a94e') + '</div>';
    var probs = d.choice.probs.map(function (p) {
      return '<span style="color:#c9d1d9;">' + p[0] + '</span> <span style="color:#8b93a1;">' + Math.round(p[1] * 100) + '%</span>';
    }).join(' &nbsp;·&nbsp; ');
    inner += '<div style="margin-bottom:10px;"><span style="color:#8b93a1;">Choice · </span>' + d.choice.k + ' → <b style="color:#4f8cff;">' + d.choice.pick + '</b> <span style="color:#8b93a1;">（置信度 ' + Math.round(d.choice.conf * 100) + '%）</span><div style="color:#8b93a1;font-size:12px;margin-top:3px;">选项分布：' + probs + '</div></div>';
    inner += '<div><span style="color:#8b93a1;">Score · </span>' + d.score.k + ' → <b style="color:#46c48e;">' + d.score.v + ' / 10</b>' + bar(d.score.v * 10, '#46c48e') + '</div>';
    resultsEl.innerHTML = inner;
    out.style.display = 'none';
    loading.style.display = 'block';
    setTimeout(function () {
      loading.style.display = 'none';
      out.style.display = 'block';
    }, 320);
  }

  var current = 'pay';
  function setActive(key) {
    current = key;
    scenes.forEach(function (b) {
      var on = b.getAttribute('data-scene') === key;
      b.style.borderColor = on ? '#4f8cff' : '#33374a';
      b.style.background = on ? '#2a2f3d' : '#20232d';
    });
  }
  scenes.forEach(function (b) {
    b.addEventListener('click', function () {
      setActive(b.getAttribute('data-scene'));
      render(current);
    });
  });
  runBtn.addEventListener('click', function () { render(current); });

  setActive('pay');
  render('pay');
})();
</script>

## 为什么它能快到飞起

不用逐字生成文本，给 Jev 带来了极其夸张的速度优势。

传统大模型是一个 Token 一个 Token 往外吐，每个 Token 都依赖上一个，处理一次可能要好几秒——官方给的对照区间是 **3 秒到 329 秒**。在做机器人控制或者高并发客服系统时，这几秒钟的延迟是致命的。

而 Jev 采用的是**单次并行前向传递**：把题目看一遍，直接在底层同时给所有选项算一遍概率，完事。官方公布的端到端延迟是 **70 到 500 毫秒**。

| 对比项 | 传统大模型 | Jev |
| --- | --- | --- |
| 输出方式 | 生成文字，需要解析 | 直接返回结构化决策 |
| 响应速度 | 3 ~ 329 秒 | 70 ~ 500 毫秒 |
| 输入价格 | $0.20 ~ $10 / 百万 token | $0.042 / 百万 token |
| 输出价格 | 约输入价的 5 倍 | 免费 |
| 结构化输出错误率 | 0.58% ~ 45.5% | 0%（数学保证） |

按官方口径，综合下来它在自动化工作流任务上比现有大语言模型**快 193.6 倍、成本低 444.6 倍**。

不过这里得说句公道话：**这组数字来自 TypeSafe 自己的评测**，官网也注明「预计这些数字处于实际收益的较高端」。看方向可以，别当实验室基准。

## 「零幻觉」这件事，得说清楚

Jev 有个很唬人的宣传点：**幻觉率 0%**。

但这句话有前提。它指的是：**Jev 绝不会给出你选项之外的答案，也绝不会拼错字段名**。而选项范围`之内`答错，依然是完全可能的。

TypeSafe 的 CEO 自己也承认过这一点。所以更准确的说法是：**它把「格式不可靠」这个变量彻底消掉了，但「判断本身对不对」还得你自己兜底**。阈值怎么设、置信度多低该转人工，这些工程决策跑不掉。

这也是它和「分类器」最大的区别：传统分类器得在固定任务上标数据重新训练，换个业务场景就废了；Jev 保留了大模型式的语义理解和泛化能力，你用提示词描述一个新判断题就能直接用。

它真正的杀手锏其实是**校准（Calibration）**。它的训练方法叫 RLCD（Reinforcement Learning for Calibrated Decisions，校准决策强化学习）：

- RLHF 追求「人类爱看」
- RLVR 追求「程序能验证对错」
- **RLCD 追求「概率要诚实」**

如果 RLCD 说有 70% 的把握，那就是在数学验证上真的有 70% 的概率是对的。官方有句话说得很扎心：**如果模型能在 95% 的时间里完成任务，却不告诉你那 5% 什么时候会来，那它就没法用在无人值守的场景里。**

## 它干不了什么

边界要讲清楚，免得用错：

- **算不了数**。精确计数、数学计算、日期比较是它的短板。要算钱、比日期，老老实实交给代码。
- **只吃文字**。图片、音频想让它判断，得过一道转文字的工序。
- **数据要发出去**。它不在你本地跑，你喂给它的内容会送到 TypeSafe 的接口处理。哪些东西能给、哪些不能给，得自己掂量。
- **选项之内也会选错**。见上一节。

## 名字的由来：杰文斯悖论

Jev 这个名字来自经济学里的**杰文斯悖论**：蒸汽机效率提高、每吨煤变便宜了，煤炭的总消耗反而涨了——因为便宜的动力被用到了更多地方。

放到 AI 上就很好理解：以前用不起 AI，是因为调一次大模型又贵又慢，为了一个芝麻大的小判断专门调一次太不划算。现在单次判断被压到了万分之一美元量级，**判断这件事就会被用到以前根本不会用的地方去**。

TypeSafe 赌的就是这个。

## 已经有人在这么用了

社区把 Jev 塞进了各种奇奇怪怪的地方，比想象中有意思：

- **微信插件**：这可能是中文社区最接地气的玩法。微信最难的是「精准触达对方想法」——经典的「你看着办」，到底是小改一下、放着不管还是大刀阔斧？于是用法变成了一串判断题：这条要不要回？要不要 @ 对方？这条是不是广告？要不要转人工？这个人是不是想退款？**全是「从有限选项里挑一个」，而且要在几百毫秒内出结果**——正好是 Jev 的形状。
- **浏览器自动化**：Browser Use 团队做的 `jev-ultrafast`，把网页上的按钮、输入框、下拉菜单整理成候选列表，让 Jev 决定下一步点哪个元素。在 Google Flights 上查一趟苏黎世飞伦敦的航班，全程只用了约 7 秒，单次运行成本约 0.0039 美元，决策延迟中位数 178 毫秒。只有「输入 Zurich」这种需要生成文字的动作，才临时叫一个小语言模型。
- **批量分类**：有网友用它分类邮件，几秒内处理 500 封，花了 3.5 美分。这种「便宜到可以无脑跑」的量级，才是它真正改变工作流的地方。
- **游戏 Agent**：有开发者把它和规划模型拼成一套——规划模型当「指挥官」负责大局，Jev 当「执行者」负责每一帧的具体动作。在《我的世界》里，这套组合从空背包开始，8 分 43 秒干掉了末影龙，模型调用成本不到 1 美元。
- **平台采用速度**：9 月 18 日 Vercel 披露，Jev 接入 AI Gateway 后 24 小时内就有近 13% 的付费团队使用；到 9 月 20 日，团队覆盖率已升到 27.8%，请求量占比 20.8%。Cloudflare、LangChain 也都接了。

## 对具身智能意味着什么（我最关心的部分）

回到学长那句话：**这玩意大概率会用上具身智能。**

我后来专门去翻了社区项目，发现这事已经有人动手了，而且思路相当漂亮。

**思路一：让代码和物理模拟先「排除法」，Jev 只做最后那一选。**

有个叫 `jev-robotics-demo` 的项目，在 MuJoCo 仿真里搭了 Franka 机械臂加 Allegro 灵巧手，任务是抓起蓝方块叠到红方块上。纯大模型（Claude Opus 5）那条路径，模型自己读环境状态、逐个调用低层工具，一次顺利运行约 55 秒、成本约 0.19 美元；中途重试那次涨到 158.8 秒、0.75 美元。

Jev 那条路径怎么做的？程序先根据空间几何生成一批候选动作，复制当前物理状态逐个向前推演，把够不着的、可能撞倒方块的、会导致滑落的直接剃掉。**筛完之后，Jev 只需要在剩下的可行选项里做单选。** 那次运行约 19.1 秒，模型调用成本约 0.0006 美元。

要诚实说明的是：**这两条路径不是同一套架构下的横向对比**。Jev 路径已经把几何、运动学和一部分物理约束提前交给了代码和模拟，模型只负责「选」。但这个分工本身才是重点——**把模型放在它擅长的那一层，把数学和约束交还给代码。**

**思路二：按时间尺度分层，Jev 只管战术决策。**

另一个项目 `jev-drone` 把 Jev 放进 MuJoCo 里的 Skydio X2 四旋翼。整个系统按不同频率跑：

- 500Hz 的几何控制器负责推力和姿态
- 50Hz 的安全反射处理近距离风险
- 约 15Hz 更新视觉状态
- **Jev 大约 2.5~3Hz 做一次战术判断**：保持航向、左右绕行、爬升、刹车，还是重新寻找目标

一次 65 秒的运行里，系统调用了 Jev 80 次，单次中位延迟约 0.11 秒。差别很直观：没有 Jev 的基线策略只会按左右剩余空间绕行，遇到横跨通道的低矮障碍就停住；加入 Jev 之后，系统选择**从障碍上方通过**，并且能处理移动障碍和目标短暂丢失。

**思路三：真机验证已经不是纸面推演了。**

开源项目 `robo-harness` 把 Jev 接进了一台真实的 SO-101 机械臂，配合 LeRobot 0.6.0 跑动作测试。9 月 17 日的实机验收中，系统先调整关节位置增益、缓解伺服死区和重力负载的影响，随后 Jev 的 Choice 模式在 14.2 秒内完成了 5 个预设动作。

当然，行业里的判断也没那么乐观。有分析人士的观点是：机器人对响应速度要求确实高，行业还在早期，新决策模型有机会切入；但**这仍然是潜在用途，Jev 能否适应真实环境、满足可靠性要求，还需要专门验证**。

而且具身智能本身也还没到爆发点。宇树创始人王兴兴给「ChatGPT 时刻」下过一个可量化的定义：**在 80% 的陌生场景中，通过语音或文字指令，机器人能完成约 80% 的任务**。他认为这个临界点最快 2~3 年、最慢 5~10 年才会来。

但我觉得，Jev 这类「决策中间件」的价值恰恰在于它不抢主角：**大模型负责规划（系统二），Jev 负责高频琐碎判断（系统一），控制器负责毫秒级闭环。** 三层各司其职，而不是指望一个模型把所有事都干了。

<div style="margin:1.6em 0;padding:20px 18px;border:1px solid #2b2e3b;border-radius:12px;background:#17181f;color:#d6dae3;font-size:13px;line-height:1.6;">
  <div style="font-weight:600;font-size:15px;margin-bottom:12px;">一个更合理的分工：三层各司其职</div>

  <div style="background:#20232d;border:1px solid #4f8cff;border-radius:10px;padding:12px 14px;">
    <div style="color:#4f8cff;font-weight:600;">规划层 · 大模型（系统二）</div>
    <div style="color:#8b93a1;font-size:12.5px;">想清楚目标与路线，拆出子任务；秒级、低频</div>
  </div>

  <div style="text-align:center;color:#8b93a1;font-size:16px;line-height:1.4;">↓</div>

  <div style="background:#20232d;border:1px solid #e0a94e;border-radius:10px;padding:12px 14px;">
    <div style="color:#e0a94e;font-weight:600;">判断层 · Jev（系统一）</div>
    <div style="color:#8b93a1;font-size:12.5px;">每步的小决策：走 / 停 / 绕 / 抓；百毫秒级，约 2.5~3Hz 做一次战术判断</div>
  </div>

  <div style="text-align:center;color:#8b93a1;font-size:16px;line-height:1.4;">↓</div>

  <div style="background:#20232d;border:1px solid #46c48e;border-radius:10px;padding:12px 14px;">
    <div style="color:#46c48e;font-weight:600;">控制层 · 控制器</div>
    <div style="color:#8b93a1;font-size:12.5px;">推力与姿态的毫秒级闭环；500Hz</div>
  </div>
</div>

## 想试试的话，从哪儿开始

- **控制台**：在 `console.typesafe.ai` 注册，新用户送 5 美元额度，大约折合 1.2 亿 Token——按它这个价格，够你放开跑了。
- **接进你的 AI 编辑器**：社区已经有人写了 MCP server，包名叫 **`typesafe-jev-mcp`**（注意不是 `typesafe-mcp`）。一行 `npx typesafe-jev-mcp` 就能跑起来，它给 Agent 提供一个 `evaluate` 工具，把 state 和类型化问题发出去、拿回带概率的结构化答案。Claude Code、Codex、Cursor、OpenCode 这些都能接。它是**非官方**项目、MIT 协议，这点心里有数就行。
- **官方生态里也有 `jev-mcp`**，以及用来做模型路由的生态项目。Jev 在 Agent 循环里最出彩的三种用法是：**给任务复杂度评级路由到不同模型、给有风险的工具调用把关、决定哪些旧上下文该保留或丢弃**。
- **顺手一提**：Vercel 的 AI Gateway 现在也支持 Jev，而且到 9 月 25 日之前是免费的。

## 最后

AI 并不是只有「聊天」这一种形态。

当我们需要让程序和程序对话、需要极高的稳定性和极低的延迟时，像 Jev 这样「闭嘴干活」的决策引擎，才是真正能落到生产环境里的基础设施。

我认同学长那个判断：**判断型模型是走向自动化的关键一步。** 过去几年我们造出了很会「协助」的 AI，但真正的自动化，是人根本不在场时它也能自己判断、自己执行——而这恰好要求模型**知道自己有多大概率是对的**。

Jev 赌的就是这件事。它会不会成为新范式还不好说，但至少它提出了一个很值得琢磨的问题：

> 我们是不是把「嘴」当成了「脑子」？

（本文写于我还没上手实测的阶段，先把概念和生态理清楚。等真正注册跑通几个场景，再回来补一篇实操记录。）

---

**参考来源**：TypeSafe AI 官方文档与生态页、Vercel Changelog、36 氪、新智元、华尔街见闻、DeepTech、AIX 财经、腾讯云开发者社区等公开报道。

**封面图**：*Digital Abstraction Neural Network Glow* by Michael Gaylard，授权 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0)，来源 [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Digital_Abstraction_Neural_Network_Glow_(55258890373).jpg)。