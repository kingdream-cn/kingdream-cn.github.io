---
title: '二十几行写个 MCP server'
tags:
  - MCP
  - AI
  - Agent
categories:
  - 技术
description: 用一个二十几行的 MCP server 讲清 MCP 的定位、Host/Client/Server 架构、tool/resource/prompt 三类能力，以及 stdio 和 HTTP 两种传输方式。
keywords: MCP, Model Context Protocol, tool, resource, prompt, stdio, function calling
cover: '/img/posts/mcp-llm-to-agent-skill/cover.jpg'
abbrlink: 18734
date: 2026-11-21 10:00:00
updated: 2026-11-21 10:00:00
---

前几天给一个 Agent 接内部接口，第一版写完还挺得意。结果换了个客户端跑，工具声明的方式完全不一样，我几乎把代码重抄了一遍。当时就想，这事儿不该有个统一接口吗。后来才知道有，就是 MCP。

## MCP 是什么

MCP 全称 Model Context Protocol，模型上下文协议。Anthropic 在 2024 年底提出，之后社区和几家大厂陆续跟进。

名字听着玄，作用其实很窄：它规定了一套标准方式，让外部能力能被模型所在的程序发现、读取、调用。

我拿 USB-C 打比方。以前手机充电口五花八门，Micro-USB、Lightning、各家私有口，一根线配一个手机。现在统一成 USB-C，一根线插哪都行。MCP 干的是同一件事——提供能力的那一方按规范写一次，任何支持 MCP 的客户端都能接上。

有一点要先划清楚：MCP 不负责让模型变聪明，也不参与推理。它只解决"能力怎么挂上去"这一件事。想清楚这点，后面就不容易乱。

## 它和 function calling 不是一回事

我最常被问的就是这句：OpenAI 早就有 function calling，为什么还要 MCP。

我的理解是这样：function calling 解决的是"模型怎么表达我想调哪个函数"，是模型厂商内置的能力。MCP 解决的是"外部能力怎么接入、怎么发现、怎么调用"，是一个跨厂商的协议。

打个不太严谨的比方，function calling 像各家自己定的充电协议，MCP 像 USB-C 的物理接口标准。

真正的差别在复用成本。function calling 的代码通常跟某个模型或某个 SDK 绑在一起，换一家就得改；MCP 的 server 写一次，任何支持 MCP 的客户端都能连。我那段被重抄的代码，就是这个成本的具体表现。

## 三个角色：Host、Client、Server

MCP 里的角色有三个，别被"客户端/服务器"这两个词吓到。

Host 是你实际在用的那个程序，比如 Claude Desktop、某个 IDE 插件、你自己写的 Agent。Client 是 Host 内部负责通信的那部分，一个 Host 可以开多个 client，一个 client 对应一条 server 连接。Server 是提供能力的一方，可以是本地进程，也可以是远端服务。

一次调用大概走这么几步：

1. Host 启动时，client 连上 server，双方握手，交换各自支持的能力
2. client 问 server：你有哪些工具、资源、提示词
3. 模型结合用户的话，决定用哪个工具、传什么参数
4. client 把调用请求发给 server
5. server 执行完，把结果返回
6. 结果进入模型上下文，模型接着生成回答

第 3 步是关键：决定用哪个工具的是模型，真正执行的是 server。模型自己从不执行代码，它只产出"我要调这个"的意图。这一点跟 function calling 的机制是一致的，MCP 没改这个，改的是外面那一圈接口。

## 三类能力：Tool、Resource、Prompt

这是 MCP 最核心的部分，也是我一开始最容易搞混的地方。协议定义了三种能力原语，各管一摊。

**Tool 是模型主动调用的函数。** 它有名字、有参数、有描述，模型根据描述判断什么时候用。我 server 里放了两个：`add` 做加法，`get_weather` 查天气。这类能力通常带副作用，发邮件、查数据库、下单，都归它。用不用、什么时候用，模型说了算。

**Resource 是可读取的数据，不是可执行的函数。** 它用 URI 标识，客户端按需读取。我写了一个 `config://app`，返回应用配置。配置文件、日志片段、文档、数据库 schema 都适合放这里。它不是给模型"调用"的，而是给客户端读进上下文用的。

**Prompt 是服务器预置的提示词模板，可以带参数。** 我写了个 `review_code`，传一段代码进去，它吐出一句完整的"请审查下面这段代码，指出潜在问题并给出修改建议……"。好处是把调好的提示词集中放在服务器上，所有客户端共用一份，不用各抄一遍。

| | 谁触发 | 干什么 | 典型场景 |
|---|---|---|---|
| Tool | 模型 | 执行动作 | 查天气、发邮件、调接口 |
| Resource | 客户端 | 读内容 | 配置文件、日志、文档 |
| Prompt | 用户 | 套模板 | 代码审查、写作提纲 |

我一开始老想把 Resource 当 Tool 用，设计得很别扭。后来按"这个动作要不要模型自己决定"来分，就清楚了。

## 写个 server，三样都放进去

说了这么多，不如跑一遍。我用 Python 的 MCP SDK 写了个最小 server，二十几行：

```python
import logging

from mcp.server.fastmcp import FastMCP

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

@mcp.resource("config://app")
def get_config() -> str:
    """返回应用配置。"""
    return "app_name=demo\nversion=1.0\ntimeout=30"

@mcp.prompt()
def review_code(code: str) -> str:
    """生成一个代码审查的提示词。"""
    return f"请审查下面这段代码，指出潜在问题并给出修改建议：\n\n{code}"

mcp.run(transport="stdio")
```

核心就是三个装饰器：`@mcp.tool()`、`@mcp.resource()`、`@mcp.prompt()`，把普通函数注册成对应的能力。函数里的 docstring 也不是摆设，它会变成这个能力的描述，模型就是靠这句描述判断该不该用它。最上面那行 logging 是把 server 的 INFO 日志关掉，不关的话客户端输出里会混进一堆 "Processing request" 之类的日志。剩下的协议细节，SDK 全包了。

客户端这边，我写了两个完全独立的脚本，都去连上面这个 server。第一个把三类能力都走一遍：

```python
import asyncio
import sys

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from pydantic import AnyUrl


async def main():
    server = StdioServerParameters(command=sys.executable, args=["server.py"])

    async with stdio_client(server) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # 1. Tool：列出并调用
            tools = await session.list_tools()
            print("工具:", [t.name for t in tools.tools])
            r = await session.call_tool("add", {"a": 3, "b": 4})
            print("调用 add(3,4) =>", r.content[0].text)

            # 2. Resource：列出并读取
            resources = await session.list_resources()
            print("资源:", [str(x.uri) for x in resources.resources])
            res = await session.read_resource(AnyUrl("config://app"))
            print("读取 config://app =>", res.contents[0].text.replace("\n", " | "))

            # 3. Prompt：列出并渲染
            prompts = await session.list_prompts()
            print("提示词:", [p.name for p in prompts.prompts])
            p = await session.get_prompt("review_code", {"code": "print(1)"})
            print("渲染 review_code =>", p.messages[0].content.text.replace("\n", " "))


asyncio.run(main())
```

第二个 `client_b` 跟它几乎一模一样，只是把调用的工具从 `add` 换成了 `get_weather`。

跑一下，输出是这样：

```
工具: ['add', 'get_weather']
调用 add(3,4) => 7
资源: ['config://app']
读取 config://app => app_name=demo | version=1.0 | timeout=30
提示词: ['review_code']
渲染 review_code => 请审查下面这段代码，指出潜在问题并给出修改建议：  print(1)
----
client_b 看到的工具: ['add', 'get_weather']
client_b 调用 get_weather(上海) => 上海 今天晴，26°C，空气质量优。
```

两个客户端连的是同一个 server，看到的是同一份能力清单，然后各取所需。工具只写一次，谁来用都不用改——这就是我前面说的复用成本差异。

## 传输方式：stdio 和 HTTP

MCP 本身不绑定传输层，目前主要两种。

**stdio**：客户端把 server 当子进程启动，通过标准输入输出通信。适合本地能力，比如读本地文件、跑本地命令、连本地数据库。我的 demo 用的就是这个，`command` 写的是解释器路径，`args` 是脚本名。

**HTTP**：server 作为独立服务常驻，客户端通过网络连过去。适合远端服务、多人共用的能力。早期用的是 HTTP + SSE，后来规范改成了 Streamable HTTP，一个端点就能处理请求和流式响应。

怎么选不复杂：能力在本地、只有自己用，stdio 够了；能力要共享、要跨机器，上 HTTP。我这台机器上的 demo 如果改成 HTTP，server 就得单独起一个进程常驻，客户端那边换成 URL——工作量主要在部署，不在协议。

## 我踩的两个坑

第一个坑，`pip install mcp` 默认装到了 2.x，然后 `from mcp.server.fastmcp import FastMCP` 直接报 `ModuleNotFoundError`，提示说 FastMCP 在 2.x 里改名成了 MCPServer。我一开始没细看报错，还以为是虚拟环境没装好，绕了一会儿，最后 `pip install "mcp<2"` 固定到 1.x 才跑通。

第二个坑，客户端里我一开始写 `command="python3"`，结果子进程启动 server 时用的是系统解释器，里面没装 mcp，server 直接起不来。改成 `sys.executable`（当前解释器）才解决。

两个都不是大问题，但记住能省不少时间：装 `mcp<2`，客户端用 `sys.executable`。

## 别为了 MCP 而 MCP

得泼点冷水。

MCP 现在并没有真的"统一"。OpenAI 有自己的 function calling 和 Apps SDK，Google 有 Gemini 的 tools，各家生态还在各自演进。MCP 只是正在被越来越多人接受的一个标准，不是既成事实。

更实际的一点：如果你的工具只给一个模型、一个客户端用，直接写 function calling 更省事，没必要绕一圈上 MCP。它的价值在复用和多人共用上，规模不到那个程度，收益不明显。我这次上 MCP，是因为同一批工具要同时给两个客户端用，重写代码的成本已经压过学习成本了。

至于以后会不会真的收敛到 MCP，我倾向会，但没有把握。协议这东西，用户量起来才会赢。

## 最后说点实在的

MCP 就是给"模型调外部能力"这件事定了个统一接口。tool 让它能动手，resource 让它能读数据，prompt 让它有现成模板可用；stdio 管本地，HTTP 管远程。

如果你也要接一堆工具，先想清楚有没有必要走 MCP。有必要的话，照着我这个二十几行的 server 改就行，三样能力都在里面了。
