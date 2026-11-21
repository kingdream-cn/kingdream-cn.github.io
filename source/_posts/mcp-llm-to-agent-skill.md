---
title: 'MCP 2.x 把 FastMCP 改名了，我顺着这个坑把 LLM 到 Agent 捋顺了'
tags:
  - MCP
  - LLM
  - Agent
  - AI
categories:
  - 技术
description: 从一个最小 MCP demo 说起，把 LLM、Token、Context、Prompt、Tool、MCP、Agent、Skill 这条链路串起来，讲清楚 MCP 为什么是连接 LLM 与工具世界的通用协议。
keywords: MCP, LLM, Agent, Token, Prompt, Tool, Skill, function calling
cover: '/img/posts/mcp-llm-to-agent-skill/cover.jpg'
abbrlink: 18734
date: 2026-11-21 10:00:00
updated: 2026-11-21 10:00:00
---

我最近在折腾 Agent 相关的东西，卡在一个词上过不去：MCP。网上讲它的文章不少，但要么直接甩一张架构图，要么上来就是"客户端""服务器""协议"一堆术语，我越看越糊涂。后来干脆自己写了个最小 demo 跑了一遍，才把从 LLM 到 Agent 这条线串起来。这篇就是把我捋顺的过程记下来，省得以后忘了。

## 先说 LLM 到底是什么

很多人把大模型想神了，觉得它什么都会。我一开始也这么想。后来读它的实现原理才明白，LLM 干的活其实特别朴素：预测下一个 token。

你给它一句"今天天气真"，它算出下一个最可能出现的词是"好"，于是补成"今天天气真好"。然后拿这整句继续预测下一个，一个词一个词往外吐。它没有意识，没有记忆，也不会思考，本质就是一个概率接龙机。

这个认知很重要。后面所有的事——Context、Prompt、Tool、Agent——都是从这个"只会接龙"的前提推出来的。

## Token、Context、Prompt，三个词把边界说清楚

先说 Token。它是模型处理文本的最小单位。中文里一个 Token 大概是大半个字，英文里一个 Token 大概是小半个词。模型的计费、长度限制，全都按 Token 算。

然后是 Context，上下文窗口。模型一次能"看见"的 Token 是有限的。比如窗口是 8k Token，那超过这个长度的内容，它就直接看不见了。这是硬约束，不是软限制。

Prompt 就好理解了：你塞给模型的那段话。在有限窗口里，你想办法用 Prompt 引导它给出你要的结果。

这三个词放一起，结论就一句话：LLM 只会接龙，而且接龙时能看到的上下文还有长度上限。

那问题来了——它只能"说"，不能"做"。你让它查今天的天气，它没有手，点不了网页，调不了接口，只能凭训练时的记忆瞎编一个温度出来。

## 会"说"还不够，得会"动手"

于是就有了 Tool（工具）这个概念。

思路是这样的：模型虽然不能直接执行代码，但它可以告诉你"我想调哪个工具、参数是什么"。你（或你的程序）拿到这个请求，替它去执行，再把结果塞回给它，让它接着生成。这一套，OpenAI 最早做成了标准能力，叫 function calling（函数调用）。

到这里，模型才第一次有了"动手"的能力。但它带来一个新麻烦——工具怎么接，每家都不一样。

## 问题来了：每家的工具接口都不一样

我最早用 function calling 的时候，OpenAI 的写法是一套 JSON Schema。后来想换个模型试试，比如换成 Anthropic 的 Claude，结果发现工具的声明格式、返回格式全都不一样，得重写。

这还没完。就算模型统一了，你写的工具是给一个 Python 脚本用的，还是给桌面应用用的，还是给另一个 Agent 用的，都得各写各的适配。一个工具写一遍，换一个地方就得再写一遍。

我当时就在想，这玩意儿就没有个统一标准吗？后来知道，有的，就是 MCP。

## MCP，工具界的 USB-C

MCP 全称 Model Context Protocol，模型上下文协议。名字挺唬人，但作用一句话就能说清：给"模型调工具"这件事定一个统一接口。

我用 USB-C 打比方。以前手机充电口五花八门，Micro-USB、Lightning、各家私有口，一根线一个手机。现在统一成 USB-C，一根线插哪都行。MCP 干的是类似的事：工具提供方只要按 MCP 的规范写一次，任何支持 MCP 的客户端都能连上用。

MCP 分两个角色：Server 和 Client。Server 负责提供工具，Client 负责连上 Server 去调工具，中间走一套标准协议通信。

## function calling 不是够用了吗，为什么还要 MCP

这是我被问得最多，也最该正面回答的问题。

function calling 是"模型内置的能力"，解决的是"让模型声明要调哪个工具"这件事，是模型厂商自家定义的一套东西。MCP 解决的是"工具和调用方之间怎么连接"这件事，是一个独立于任何模型厂商的协议。

不严谨地打个比方：function calling 是"充电协议"，MCP 是"充电接口的物理标准"。前者各家自己定，后者是大家约定好的统一口。

更实在的区别在于：用 function calling，你的工具跟某个具体模型绑死了，换模型要重写；用 MCP，工具写一次，换个模型、换个客户端都不用动。

下面这个 demo 能把这个区别看得很清楚。

## 写个最小 demo，看复用性

我写了一个最小的 MCP Server，暴露两个工具：一个加法 `add`，一个查天气 `get_weather`。

```python
"""最小 MCP server：暴露两个工具，供任意客户端复用。"""
import logging

from mcp.server.fastmcp import FastMCP

# 关掉 server 端 INFO 日志，让演示输出干净
logging.getLogger("mcp.server.lowlevel.server").setLevel(logging.WARNING)

mcp = FastMCP("demo")


@mcp.tool()
def add(a: int, b: int) -> int:
    """两个整数相加。"""
    return a + b


@mcp.tool()
def get_weather(city: str) -> str:
    """查询某个城市的天气（演示用模拟数据）。"""
    return f"{city} 今天晴，26°C，空气质量优。"


if __name__ == "__main__":
    mcp.run(transport="stdio")
```

二十几行就完事了。核心是 `@mcp.tool()` 这个装饰器，把普通函数注册成 MCP 工具。

然后是客户端。我写了两个完全独立的客户端，都去连上面这个 server：

```python
"""客户端 A：独立进程，复用同一个 server 的 add 工具。"""
import asyncio
import sys

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


async def main():
    server = StdioServerParameters(command=sys.executable, args=["server.py"])

    async with stdio_client(server) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            tools = await session.list_tools()
            print("client_a 看到的工具:", [t.name for t in tools.tools])

            r = await session.call_tool("add", {"a": 3, "b": 4})
            print("client_a 调用 add(3,4) =>", r.content[0].text)


asyncio.run(main())
```

另一个 `client_b` 跟它几乎一模一样，只是把调用的工具从 `add` 换成了 `get_weather`。

跑一下，两个客户端各自的输出：

```
client_a 看到的工具: ['add', 'get_weather']
client_a 调用 add(3,4) => 7
----
client_b 看到的工具: ['add', 'get_weather']
client_b 调用 get_weather(上海) => 上海 今天晴，26°C，空气质量优。
```

注意看：两个客户端连的是同一个 server，各自看到了同样的工具列表，然后各取所需——一个调 `add`，一个调 `get_weather`，都成功了。

这就是复用性。工具只写一次（在 server 里），谁来用都行，不用改。换成 function calling 的那套写法，换个模型或换个客户端，大概率要重来一遍。

## 说个我踩的坑

写到这，我把踩的两个坑交代一下，免得你跟着复现时卡住。

第一个坑：我一开始直接 `pip install mcp`，装到的是 2.x。然后跑代码，`from mcp.server.fastmcp import FastMCP` 直接报 `ModuleNotFoundError`，提示说 FastMCP 在 2.x 里改名成了 MCPServer。我一开始没细看报错，还以为是环境问题，绕了一会儿，最后 `pip install "mcp<2"` 固定到 1.x 才跑通。

第二个坑：客户端里我一开始写 `command="python3"`，结果在虚拟环境里跑，子进程启动 server 时用的 `python3` 是系统的，没装 mcp，server 直接起不来。改成 `sys.executable`（当前解释器）才解决。

都不是大问题，但记住这两点能省不少时间：装 `mcp<2`，客户端用 `sys.executable`。

## 说句实话：MCP 还没统一

再泼盆冷水。MCP 现在并没有真的"统一"。OpenAI 有 function calling，Google 有 Gemini tools，Anthropic 在推 MCP，各家还是各玩各的。MCP 只是"正在被越来越多人接受"的标准，不是"已经一统天下"的既成事实。

但我还是看好它。原因不复杂：工具复用这个需求是真实的，谁先解决它，谁就能让开发者少写一堆重复代码。协议这种东西，一旦用户量起来，收敛是迟早的事。

## Agent，是把工具、记忆、规划攒在一起的模型

有了 MCP 把工具接入标准化，Agent 就顺理成章了。

什么是 Agent？我的理解是：一个 LLM，加上能调工具的能力，再加上记忆（记住上下文和历史），再加上规划（把大任务拆成小步骤），就变成了能自主干活的 Agent。

MCP 在这里的角色，是给 Agent 提供"手"。没有 MCP 之前，Agent 调工具是各家各写；有了 MCP，Agent 调工具就像插 USB-C，插上就能用。

## Skill，把 Agent 的能力打包复用

最后是 Skill（技能）。这个词最近到处都在提，我理解它就是一句话：把 Agent 完成某类任务的能力，封装成一个可复用的技能包。

比如一个 Agent 学会了"写周报"这件事，你把它打包成一个 Skill，下次别的 Agent 要写周报，直接挂上这个 Skill 就行，不用重新教。

Skill 和 MCP 的关系也顺：Skill 是上层的能力封装，MCP 是底层的工具连接。Skill 在干活的时候，底层很可能就是通过 MCP 去调各种工具。

## 把这条线捋一遍

把我捋的这条线再说一遍：LLM 只会预测下一个 Token，在有限的 Context 里靠 Prompt 引导；它只会"说"不会"做"，所以要靠 Tool 让它动手；各家工具的接口又不一样，于是有了 MCP 这个统一协议；有了标准化的工具接入，LLM 才升级成能自主干活的 Agent；Agent 的能力再打包，就是 Skill。

一句话：MCP 是连接 LLM 和工具世界的那根统一接口。搞懂它，从 Token 到 Skill 这条线就通了。
