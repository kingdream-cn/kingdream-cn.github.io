---
title: '💽 不重装系统扩容 Ubuntu 根分区：200G → 293G 完整实战（Windows 双系统通用）'
tags:
  - Linux
  - Ubuntu
  - 双系统
  - 磁盘分区
  - GParted
  - 运维
categories:
  - 技术
  - 系统
keywords: Ubuntu扩容, Windows双系统, GParted, 分区左移, Live USB, swapfile, 根分区, 磁盘分区, GPT
description: 双系统下把 Windows 释放的空间并进 Ubuntu 根分区的完整思路：先判断你属于哪种情况，再决定要不要做、怎么做。含同盘/异盘、在线扩容/Live 扩容，以及 12 个真实踩坑。
cover: /img/posts/expand-ubuntu-root-partition/cover.jpg
abbrlink: 46287
date: 2026-10-16 18:00:00
updated: 2026-10-16 18:00:00
---

> 机器：ASUS TUF Gaming A15（1TB NVMe · GPT · UEFI · Win11 + Ubuntu 24.04.5）
> 结果：根分区 **184.74 GiB → 292.97 GiB**，不重装、不丢数据，**从关机到扩容完重启进系统约 50 分钟**
> 适用：任何 Windows + Ubuntu 双系统（华硕 / 拯救者 / 联想 / 戴尔 / 惠普思路一致）

跑 ROS、深度学习、Docker 的同学大概都经历过这个：当初装 Ubuntu 只切了 200G，半年后 `df -h /` 就剩 20G 了，`docker pull` 都 pull 不动。

重装系统是最省事的答案，但代价是全部环境重配 —— 对做机器人的人来说，那是两三天。**这篇文章记录的是另一条路：把 Windows 那边闲置的空间，"搬"进 Ubuntu 根分区。**

但先说结论：**这件事的难度，完全取决于你那块空闲空间在物理上的位置。** 同样叫"扩容"，有的情况 3 分钟在线搞定，有的情况要搬 184G 数据、耗时 1 小时、中途断电大概率报废。所以本文的重点不是"怎么做"，而是**"先搞清楚你是哪种情况"**。

<!-- more -->

---

## 0. TL;DR · 三分钟版

### 三种情况，难度天差地别

| 情况 | 空闲空间的位置 | 要不要 Live USB | 要不要搬数据 | 耗时 | 风险 |
|---|---|---|---|---|---|
| **A** | 紧贴根分区**右侧** | ❌ 不用，可在线扩容 | ❌ 不用 | 几分钟 | ★☆☆☆☆ |
| **B** | 紧贴根分区**左侧** | ✅ 必须 | ✅ 搬整个根分区 | 30–60 分钟 | ★★★★★ |
| **C** | 和根分区**隔着别的分区** | ✅ 必须 | 先搬走/删掉中间那个 | 视情况 | ★★★★☆ |
| **D** | 在**另一块物理盘**上 | — | **物理上不可能并入** | — | 换思路，见第 6 节 |
| **E** | 你用了 **LVM** | ❌ 不用 | ❌ 不用 | 1 分钟 | ★☆☆☆☆ |

**本文的主角是情况 B**（我的机器就是），它最难，所以把 B 讲透了，A/C/E 都是它的简化版。

### 五条铁律（贴墙上）

1. **必须插电源**。笔记本左移分区到一半没电 = 大概率报废。
2. **点下 Apply 之后没有取消按钮**。进度条跑完之前只能等，不能断电、不能拔盘。
3. **同盘备份等于没备份**。备份必须放到**另一块物理设备**（移动硬盘 / 另一个 U 盘 / 网盘）。分区表坏了，同盘的两个分区一起没。
4. **盘符顺序 ≠ 物理顺序**。`C/D/E/F` 是 Windows 分配的名字，跟磁盘上的物理排列毫无关系。判断能不能合并，**只能看物理位置**。
5. **分区号会变，UUID 不会变**。删掉一个分区后，后面所有分区号整体前移；而你所有的配置（fstab、GRUB）靠 **UUID** 认设备。**永远用 UUID + 大小认盘，不要认死 `/dev/nvme0n1p8`。**

---

## 1. 先搞懂三个原理（不懂原理必踩坑）

### 1.1 空闲空间在"右边"还是"左边"，是两件完全不同的事

分区扩容在技术上只有两个动作：

- **向右扩**：把分区的结束位置往后挪。磁盘上原有的数据一个字节都不用动，只要改分区表 + 让文件系统知道"你的地盘变大了"。**快、安全、可以边运行边做。**
- **向左扩（左移 + 扩容）**：把分区的**起始位置**往前挪。文件系统开头（超级块、块位图、inode 表）的位置全变了，所以必须**把整个文件系统的数据整块搬到新位置**。**慢、不可逆、必须在 Live 环境做。**

```
情况 A：空闲在右边 —— 简单
┌──────────────────┬──────────┐
│ 根分区 ext4 184G │ 空闲 92G │
└──────────────────┴──────────┘
                    ↑ 直接往后吃，不用搬数据

情况 B：空闲在左边 —— 我这次，最难
┌──────────┬──────────┬──────────────────┐
│ 空闲 92G │ swap 15G │ 根分区 ext4 184G │
└──────────┴──────────┴──────────────────┘
                      ↑ 要让根分区吃到左边的空闲，
                        必须把整个 184G 数据整体左移

情况 C：中间隔着别的分区
┌──────────┬────────────┬──────────────────┐
│ 空闲 92G │ Windows D: │ 根分区 ext4 184G │
└──────────┴────────────┴──────────────────┘
            ↑ 得先把这个分区搬走或删掉
```

### 1.2 盘符顺序 ≠ 物理顺序（最容易犯的错）

我的机器上盘符是 `C: / D: / E: / F:`，但磁盘上的物理排列是这样的：

```
物理顺序： C: → WinRE → F: → E: → swap → Ubuntu根 → D: → 恢复分区
盘符顺序： C:          D:    E:    F:
```

看出来了吗：**`F:` 物理上在 `E:` 前面，`D:` 物理上在最后面。** 所以：

- 我当时想给 Ubuntu 扩容，第一反应是"从 F 盘分点空间出来" —— **完全不可能**，因为 F 和 Ubuntu 之间隔着整个 E 盘（292G）。
- 而 `E:` 恰好紧贴 swap、swap 又紧贴 Ubuntu 根分区 —— 删掉 E 就能拿到一块正好在根分区**左边**的连续空闲。这才让方案成立。

**怎么查自己的物理顺序**（管理员 PowerShell）：

```powershell
Get-Partition -DiskNumber 0 |
  Select-Object PartitionNumber, DriveLetter, Offset, Size |
  Sort-Object Offset | Format-Table -AutoSize
```

按 `Offset`（字节偏移）排序，就是真实物理顺序。或者更直观：打开**磁盘管理**看下面那条图形化色块，位置一目了然。

### 1.3 分区号会变，UUID 不会变

我的根分区在操作前后：

| | 操作前 | 操作后 |
|---|---|---|
| 设备名 | `/dev/nvme0n1p8` | **`/dev/nvme0n1p7`** |
| UUID | `58f902e2-…` | **`58f902e2-…`（不变）** |

为什么变？因为删掉了中间一个分区（原 p6），后面所有分区号前移一位。这也是为什么**所有老教程里的 `/dev/nvme0n1p8` 照抄会出错**。

而 UUID 是文件系统自己的身份证，左移、扩容都不会改它。所以：

- **GRUB 靠 `search --fs-uuid` 找根分区** → UUID 没变，扩容后能正常启动；
- **`/etc/fstab` 靠 UUID 挂载** → 改设备名的教程都是坑；
- 判断"哪个是我根分区"，永远用 `UUID + 大小`，别用设备名。

---

## 2. 先判断你是哪种情况（含自查命令）

在 Ubuntu 里跑这两条，把结果记下来：

```bash
# 1) 看物理布局：LMV 会直接显示出来；看根分区在哪、它左边/右边是什么
lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINT

# 2) 看精确的物理偏移（扇区），这个才是判断"左边右边"的依据
for p in /sys/class/block/nvme0n1p*; do
  s=$(cat $p/start); n=$(cat $p/size)
  printf "%-14s 起始扇区 %12d  大小 %8.2f GiB\n" "$(basename $p)" "$s" "$(echo "$n*512/1073741824"|bc -l)"
done | sort -k3 -n
```

> Windows 侧删卷后，那块空间不会出现在 `lsblk` 里（`lsblk` 只列分区，不列空隙）。**空隙要靠 `起始扇区` 之间的差值自己算**：相邻两个分区的 `前一个起始 + 前一个大小 ≠ 后一个起始`，中间差的就是空闲空间。

### 情况 A：空闲紧贴根分区右侧

```bash
# 例如：根分区是磁盘上最后一个分区，右边有一块未分配
sudo apt install -y cloud-guest-utils
sudo growpart /dev/nvme0n1 7        # 注意：设备名和分区号之间是空格
sudo resize2fs /dev/nvme0n1p7
df -h /
```

**不用关机、不用 Live USB、几分钟搞定。** `growpart` 只改分区表末尾，`resize2fs` 支持在线扩大。

> ⚠️ 一个小坑：如果那块空闲不在磁盘最末尾，内核可能没法重读分区表（提示 device busy）。这时重启一次，再跑 `resize2fs` 即可。

### 情况 B：空闲紧贴根分区左侧 ← 我这次

**必须用 Live USB，必须搬数据。** 完整流程见第 4 节。

### 情况 C：中间隔着别的分区

把中间那个分区处理掉：

- **中间是 swap**：这是最常见也最好办的情况 —— **直接删掉 swap 分区**，然后在系统里用 **swapfile** 顶替（第 4.7 节）。这也是我这次的方案，因为我的布局正是 `[空闲][swap][根分区]`。
- **中间是 Windows 数据分区**：需要把它整体搬移（GParted 的 Move）。**搬 NTFS 比搬 ext4 更危险**，务必备份该分区数据，且中途绝不能断电。搬完 Windows 可能要跑一次 chkdsk，属正常。
- **中间是 Windows 的恢复分区 / EFI 分区**：**别动**。恢复分区删了不影响使用但会丢恢复功能；EFI 分区动了直接开不了机。

### 情况 D：空闲在另一块盘上

```
盘0 (nvme0n1)： [C:] [F:] [swap] [Ubuntu 根]     ← 满了
盘1 (nvme1n1)： [空闲 500G]                      ← 有的是空间
```

**物理上够不着，不能并进根分区。** 别被"我有 500G 空闲"骗了 —— 分区只能在同一块盘上相邻合并。

正确思路是**换目标**：不是"扩大根分区"，而是"**把吃空间的东西搬到另一块盘**"。具体见第 6 节，实际上这才是双硬盘机器更该用的方案。

### 情况 E：你装 Ubuntu 时选了 LVM（最幸运的情况）

`lsblk` 里如果看到 `ubuntu--vg-ubuntu--lv` 这类名字，恭喜：

```bash
sudo growpart /dev/nvme0n1 3                     # 扩 PV 所在分区（用实际号）
sudo pvresize /dev/nvme0n1p3
sudo lvextend -l +100%FREE /dev/ubuntu-vg/ubuntu-lv
sudo resize2fs /dev/ubuntu-vg/ubuntu-lv
df -h /
```

**全程在线、不用关机、秒级完成。** 这也顺便回答了"装系统时该不该选 LVM" —— 该选，它是你未来的后悔药。

---

## 3. 需要准备什么

### 3.1 备份（唯一不能省的一步，也是最容易做错的一步）

**先说三个反直觉的坑：**

1. **同盘备份无效。** 如果分区表损坏，同一块盘上的所有分区一起受影响。必须备份到**另一块物理设备**。
2. **用 `rsync` 逐个文件拷到 U 盘，可能悄悄丢掉符号链接。** 因为 U 盘常见的 **exFAT 文件系统根本不支持符号链接**。我这次要备份的 `/home` 里有 **1399 个符号链接**，逐文件复制会全部失败（报 `symlink failed: Operation not permitted`）。
3. **exFAT 处理海量小文件极慢。** 我的 `/home` 有 **27.5 万个文件**，逐文件写 U 盘会慢到离谱。

**所以推荐用 `tar` 打成单个大文件** —— 顺序写入更快，而且完整保留**符号链接 / 权限 / 属主 / 硬链接 / xattr**：

```bash
# 先看一眼要备份多少东西
find /home/$USER -xdev \( -path '*/.cache' -o -path '*/snap' \) -prune -o \
  -printf '%y\n' 2>/dev/null | sort | uniq -c

# 打包（排除缓存；插上移动硬盘后把路径换成你的挂载点）
sudo tar -cpf /mnt/backup/home_$(date +%Y%m%d).tar \
  --one-file-system --acls --xattrs \
  --checkpoint=200 --checkpoint-action=dot \
  --exclude="$USER/.cache" --exclude="$USER/snap" \
  -C /home "$USER"
```

`--checkpoint-action=dot` 每约 100MB 打一个点，方便看进度。还原：

```bash
sudo tar -xpf /mnt/backup/home_20261016.tar -C /home
```

**打完必须校验**，否则你不知道这个 tar 能不能读回来：

```bash
# 结构校验：成员数 / 体积
tar -tf  xxx.tar | wc -l
ls -lh   xxx.tar

# 内容校验：把所有数据读回来逐字节对比（慢，但这是唯一可靠的方式）
sudo tar -df xxx.tar -C /home "$USER"
```

> 我这次打出来 33.54 GiB / 340,291 个成员，完整读回对比后**只有 662 处差异，全部是钉钉 / 微信 / 搜狗输入法正在写的运行时文件** —— 这种"文件在我们读入时发生了变化"的提示是**正常**的，不是损坏。真正要警惕的是成片的 `Unexpected EOF`、`无法读取`。

**如果没有外置盘呢？** 至少把真正值钱的目录（代码仓库、ROS 工作空间、论文、数据集）单独打个 tar 传网盘。我的 `/home` 44G 里，真正不可再生的部分只有 11G 左右，剩下的都是缓存和配置。

### 3.2 信息记录表（关机之后就查不到电脑了，必须抄下来）

```bash
lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINT,UUID,PARTUUID   # 布局 + UUID
cat /etc/fstab                                        # 挂载配置原文
sudo blkid                                            # 所有 UUID
```

需要抄下来的：

| 项目 | 示例（我的） |
|---|---|
| 根分区 ext4 UUID | `58f902e2-…`（**扩容后必须还是它**） |
| EFI 分区 UUID | `DF69-9B0A` |
| swap 行原文（待注释） | `UUID=41536387-… none swap sw 0 0` |
| 空闲空间大小 | 92.97 GiB |
| 目标大小 | 292.97 GiB（GParted 里 `New size` ≈ 300002 MiB） |

**拍照 / 发微信文件传输助手 / 存手机** —— 进了 Live 环境，电脑上的文档全读不到，只有手机能看。

### 3.3 Windows 侧准备（不做这几步，后面必出问题）

| 项目 | 命令 / 位置 | 为什么 |
|---|---|---|
| **关闭快速启动** | 控制面板 → 电源选项 → 选择电源按钮的功能 → 更改当前不可用的设置 → 取消勾选「启用快速启动」 | 快速启动会让 Windows 关机时**不完全释放分区**，分区表处于"脏"状态，删卷可能失败 |
| **关闭休眠** | 管理员 CMD：`powercfg /h off` | 休眠会把内存镜像写进磁盘，NTFS 变脏，Linux 侧工具不敢动它 |
| **确认没开 BitLocker** | 管理员 CMD：`manage-bde -status` | 加密分区被 Linux 工具改动后可能需要 48 位恢复密钥。**开着就先解密**（暂停保护不够，要完全解密） |
| **确认不是动态磁盘** | 管理员 PowerShell：`Get-Disk` | 动态磁盘 Linux 工具认不了，先转回基本磁盘 |
| **退出占用的程序** | 百度网盘（会挂载同步盘）、杀软 | 卷被占用时删不掉 |

### 3.4 制作 Live USB

**为什么非要 Live USB？** 因为**运行中的系统没法改自己所在的分区**。你在 Ubuntu 里跑 gparted 去动 `/`，它会直接拒绝。

**推荐用 Ventoy**，理由是**一块盘能同时干两件事**：既是启动盘，又能装下你的备份（我这次 U 盘 57.6G，装 6.4G 的 ISO + 33.5G 的备份，还剩 17G）。ISO 就是个文件，随便放、随便删。

要放两个 ISO：

| ISO | 用途 | 大小 |
|---|---|---|
| **Ubuntu 桌面版**（**版本要和你的系统一致**） | 熟悉的 Live 环境，用来改 fstab、修引导 | ~6 GB |
| **GParted Live** | **保底的分区工具**，开机直接是 GParted | ~620 MB |

**为什么还要单独一个 GParted Live？** 两个原因，都是血泪：

1. **Ubuntu Live 桌面默认不带 GParted**，要 `sudo apt install gparted`，而 Live 环境里 **WiFi 网卡不一定能用** —— 没网就装不了，直接卡死。GParted Live 开机就是 root 权限的 GParted，**不需要联网**。
2. **ISO 版本必须和你系统版本一致**。我系统是 24.04，如果拿 22.04 的盘去扩容，它自带的 `e2fsprogs` 是 1.46.5（2022 年），**不认识 24.04 ext4 的新特性（如 `orphan_file`）**，会直接报"文件系统有不支持的特性"而**拒绝扩容**。新版工具能认旧文件系统，反过来不行。

**Rufus 还是 dd？** 用 Rufus（Windows）或 Ventoy 都行。关键选项：**分区类型 GPT、目标系统 UEFI(非 CSM)**。用 Rufus 时若提示下载 `ldlinux.sys` 等文件，选"是"。

> **Ventoy 的一个坑（我踩了）**：GPT 模式下它的数据分区是 **p1**、引导分区是 **p2**（和 MBR 模式**正好相反**）。写脚本时如果写死 `/dev/sda2` 当数据分区，就会把 6G 的 ISO 往 32M 的引导分区里塞，报"设备上没有空间"。**永远按卷标识别，不要认分区号。**

### 3.5 物理准备

- **插电源**（笔记本必做）
- **别合盖、别休眠**。息屏无所谓，**挂起才是致命的**：
  ```bash
  gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-type 'nothing'
  gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-battery-type 'nothing'
  ```
- 留出**至少 1.5 小时**不被打扰（我这次全程约 50 分钟，但慢的机器可能 1.5 小时以上）

---

## 4. 实战：我这次的完整过程（情况 B）

### 4.0 我的初始布局

```
物理顺序（扇区偏移）：
  p1 MSR          0.12G
  p2 EFI          0.25G   ← 共用 Windows 的 EFI 分区
  p3 C:  OS      313.29G
  p4 WinRE        1.01G
  p5 F: 其他应用  292.97G
  ────────────── 92.97G 未分配（原 E 盘，已删）← 正好在 swap 左边 ✅
  p6 linux-swap   15.26G  ← 待删除
  p7 ext4 根分区 184.74G  ← 待左移扩容
  ────────────── 0.93G 既有空隙（忽略）
  p8 D: RESTORE   52.07G
  p9 MYASUS       0.26G
```

注意 `E:` 和 `F:` 的物理位置是反的 —— 这就是 1.2 节说的坑。

### 4.1 Windows 侧：删掉 E 盘，拿到 92.97G 空闲

`Win + X` → **磁盘管理** → 找到 `E:`（**再三确认盘符，别删错成 D 或 F**）→ 右键 **删除卷** → 确认。

删完必须验证（管理员 PowerShell）：

```powershell
Get-Partition -DiskNumber 0 | Select-Object PartitionNumber, DriveLetter, Offset, Size | Sort-Object Offset
```

- [ ] `E:` 盘符消失
- [ ] 多出一块约 92.97 GiB 的**未分配**（黑色），且**紧贴 Linux swap 的左边**
- [ ] **绝对不要**右键新建卷、不要格式化 —— 新建卷会把这块空间重新变成 Windows 分区，前功尽弃

我删卷后实测：`C / D / F` 盘符保留，其余分区偏移与大小**完全未变**。

### 4.2 Ubuntu 侧：备份 + 记录

见第 3.1 / 3.2 节。我的备份结果：**33.54 GiB tar，340,291 个成员，完整读回校验通过**。

### 4.3 提前改 `/etc/fstab`（这是我对老教程的一个改进）

**老教程的做法**：删掉 swap 分区后，在 Live 环境里挂载根分区，用 `nano` 手改 fstab。

**我的做法**：**在还正常运行的 Ubuntu 里就改好**。

```bash
sudo cp -a /etc/fstab /etc/fstab.bak-$(date +%Y%m%d-%H%M%S)
# 只注释掉 swap 那一行，用精确 UUID 匹配，不会误伤别的行
sudo sed -i 's|^UUID=41536387-…|#UUID=41536387-…|' /etc/fstab
grep -n '' /etc/fstab
```

改前 → 改后：

```
UUID=58f902e2-… /        ext4  errors=remount-ro 0 1     ← 不动
UUID=DF69-9B0A   /boot/efi vfat  umask=0077       0 1     ← 不动
UUID=41536387-… none      swap  sw               0 0     ← 注释掉这一行
```

**为什么这样更安全？** Live 环境里没有你熟悉的编辑器和撤销手段，改错一行就是开不了机。而在正常系统里，有备份、有精确匹配、改完能立刻用 `findmnt --verify` 自检。

**顺手检查两个容易漏的地方**：

```bash
grep -rn 'resume=' /etc/default/grub            # 有的话要删掉指向被删 swap 的那段
cat /etc/initramfs-tools/conf.d/resume 2>/dev/null   # 老系统这里可能钉着 swap 的 UUID
```

我机器上这两处都没有，省事。**如果不检查**：开机可能卡在 `A start job is running for dev-disk-by\x2duuid-…` 整整 90 秒，或者进 emergency mode。

### 4.4 关机 → 从 U 盘启动

1. 开始菜单 → **关机**（❌ 不要"重启" —— 可能走 Windows 快速启动路径；❌ 不要"休眠"）
2. **拔掉除 Ventoy U 盘外的所有 USB 设备**（拓展坞、鼠标接收器都拔，避免启动顺序混乱）
3. 开机狂按**启动菜单键**（见第 8 节的品牌表；**华硕是 `Esc`**）
4. 选带 **`UEFI:`** 前缀的那一项
5. Ventoy 菜单里选 **`gparted-live-x.x.x-amd64.iso`** → 回车
6. GParted Live 会连问 3 个问题（Keymap / Language / Mode），**一路回车**即可
7. 进桌面后 GParted **自动打开，且已是 root**

进桌面第一件事（防止息屏让你以为死机了）：

```bash
xset -dpms; xset s off
```

### 4.5 GParted 操作（核心，最高风险）

**右上角下拉框选 `/dev/nvme0n1`**，然后**三查**：

```
├─ p5  ntfs        292.97 GiB   ← F:，别动
├─ unallocated      92.97 GiB   ← 原 E 盘 ★ 必须在 swap 左边
├─ p6  linux-swap    15.26 GiB  ← 待删除
├─ p7  ext4         184.74 GiB  ← 待左移扩容
```

- [ ] 那块 **92.97 GiB 未分配**存在，且紧贴 **linux-swap 左边**
- [ ] swap 是 **15.26 GiB**
- [ ] ext4 是 **184.74 GiB**

**任一条不符 → 关掉 GParted，重启回 Ubuntu，不要点 Apply。**

**步骤 1：删 swap**
右键 `linux-swap` → **Delete**。此时只是**排队**，界面下方会列出待执行操作，**先不要 Apply**。

**步骤 2：记录 ext4 的 UUID**
右键 `ext4` → **Information** → 抄下 UUID（应该和你 4.2 记的一致）→ 关闭。

**步骤 3：左移 + 扩容（关键动作）**
右键 `ext4` → **Resize/Move**：

| 输入框 | 设成 |
|---|---|
| **Free space preceding (MiB)** | **`0`** |
| **New size (MiB)** | 自动变成约 **`300002`** |
| **Free space following (MiB)** | **不动** |

`Free space preceding = 0` 这一下，就是"把整个 184.74 GiB 的文件系统平移到左边" —— 它会真的去搬 184 GiB 数据，所以慢。

**步骤 4：核对队列（只能有两条）**

```
1.  Delete  /dev/nvme0n1p6  (linux-swap)
2.  Move    /dev/nvme0n1p7  (ext4)
```

多一条、少一条、顺序不对 → 菜单 **Edit → Undo Last Operation** 逐条撤销重来。**绝不能**出现针对 p3 / p5 / p8 的操作。

**步骤 5：执行**
点绿色对勾 **✓ Apply All Operations** →

- 「about to apply the pending operations」→ **Apply**
- 「Moving a partition might cause your operating system to fail to boot」→ **OK**（**这是预期提示，不是出错**）
- 「e2fsck 需要检查文件系统」→ **Fix / Yes**

然后就是等：

| 阶段 | 耗时 |
|---|---|
| 删 swap | 几秒 |
| 检查 ext4 | 1–3 分钟 |
| **搬运 184 GiB 数据（Move）** | **30–60 分钟**，进度条会长时间"看着不动" |
| 扩容 resize2fs | 1–5 分钟 |

**判断是否真卡死：看笔记本的硬盘指示灯。** 偶尔还在闪 = 在干活，继续等。
**任何情况下都不要强行断电** —— 这是全文最危险的地方。

6. 直到 **「All operations successfully completed」** → **Close**

### 4.6 Live 里立即验证

```bash
sudo partprobe /dev/nvme0n1
lsblk -o NAME,SIZE,FSTYPE,UUID /dev/nvme0n1
```

- [ ] swap 分区（p6）**已消失**
- [ ] ext4 大小 ≈ **292.9G**
- [ ] UUID **和之前记录的一致**

我这次的精确结果（和事先预测值**一扇区不差**）：

```
p5  起始 659922944    292.97 GiB   （F:，未变）
p7  起始 1274320896   292.97 GiB   ← 起始正好落到原 E 盘起点
p8  起始 1890670592   52.07 GiB   （D:，未变）
```

### 4.7 顺手只读检查 fstab（不用改）

```bash
sudo mkdir -p /mnt/ubuntu
sudo mount -o ro /dev/nvme0n1p7 /mnt/ubuntu
grep -n swap /mnt/ubuntu/etc/fstab
sudo umount /mnt/ubuntu
```

预期：swap 那一行**行首有 `#`**（4.3 节已经改好了）。

### 4.8 重启进 Ubuntu

GParted Live 里关机 → **拔掉 U 盘** → 开机 → GRUB → Ubuntu。

**为什么大概率能进？** GRUB 用 `search --fs-uuid` 按**文件系统 UUID**找根分区，而左移**保留了 UUID**；EFI 分区从头到尾没被动过。

### 4.9 重建 swapfile + 刷引导 + 最终验证

进入系统后：

```bash
# 1) 创建 swapfile 替代被删的 swap 分区
sudo fallocate -l 16G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 2) ROS / 编译场景建议降低换出倾向
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swappiness.conf
sudo sysctl --system

# 3) 刷新 initramfs 和 GRUB（重要，别省）
sudo update-initramfs -u -k all
sudo update-grub

# 4) 最终自检
df -h /
swapon --show
free -h
findmnt --verify
systemctl --failed
```

> 如果 `mkswap` 报 **「swapfile has holes」**，说明 `fallocate` 生成的是稀疏文件，改用 `sudo dd if=/dev/zero of=/swapfile bs=1M count=16384 status=progress` 重建。

### 4.10 结果对照

| 项目 | 扩容前 | 扩容后 |
|---|---|---|
| 根分区 ext4 | 184.74 GiB | **292.97 GiB** |
| `df -h /` | 181G（可用 83G） | **288G（可用 169G）** |
| 根分区 UUID | `58f902e2-…` | **不变** ✅ |
| swap | 15.3G 分区 | **`/swapfile` 16G** |
| 失败 systemd 单元 | — | **0 个** |
| GRUB | — | Ubuntu + Windows Boot Manager 都在 |
| 其它分区（C/F/D/EFI/恢复） | — | **UUID、卷标、偏移全部未变** |

---

## 5. 可选收尾：再白捡 11 GB

ext4 默认给 root 保留 **5%** 的空间做防碎片缓冲。桌面机器完全用不到这么多，改成 1%：

```bash
sudo tune2fs -m 1 /dev/nvme0n1p7
df -h /
```

293 GiB 的分区，这一下就能多出 **约 11.7 GB** 可用空间。（服务器 / 关键生产环境别这么干，桌面无所谓。）

---

## 6. 如果空闲空间在**另一块盘**上（情况 D）

这是最容易被误解的一点：**分区只能和同一块盘上相邻的空闲合并。** 你有两块盘、第二块空着 500G，**也没法把根分区"扩大"**。

正确的思路是**把吃空间的东西搬过去**，而不是扩大根分区。按推荐程度排序：

### 方案 1（最推荐）：新盘挂到 `/data`，把大目录搬过去

```bash
# 1) 格式化新盘/新分区（⚠️ 会清空该分区，确认设备名！）
sudo mkfs.ext4 -L data /dev/nvme1n1p1

# 2) 取 UUID，写进 fstab —— 注意用 UUID 而不是设备名
sudo blkid /dev/nvme1n1p1
sudo mkdir -p /data
echo 'UUID=<新盘UUID> /data ext4 defaults,nofail 0 2' | sudo tee -a /etc/fstab
sudo mount -a
df -h /data
```

> **`nofail` 很关键**：万一下次这块盘没插/挂了，系统不会卡在开机自检里进 emergency mode。

然后把大头目录搬过去（**用 `rsync` 而不是 `mv`**，确认无误后再删源）：

```bash
sudo rsync -aHAX --info=progress2 /home/$USER/datasets/ /data/datasets/
```

具体哪些目录最值得搬：

| 目录 | 说明 |
|---|---|
| Docker 数据 | `/var/lib/docker`，或改 `/etc/docker/daemon.json` 里的 `data-root` 到 `/data/docker` |
| 数据集 / 模型权重 | 深度学习场景动辄几十上百 G，收益最大 |
| ROS 工作空间 | `catkin_ws` / `colcon_ws`，编译产物很大 |
| `~/.cache` | 浏览器、pip、huggingface 缓存，纯可再生 |

搬完用 **bind mount** 让原路径依然可用（比符号链接更可靠，很多程序不认符号链接）：

```bash
sudo mount --bind /data/cache /home/$USER/.cache
# 写进 fstab 永久化（bind 挂载也要 nofail）
printf '/data/cache /home/%s/.cache none bind,nofail 0 0\n' "$USER" | sudo tee -a /etc/fstab
```

### 方案 2：把整块 `/home` 迁到新盘

```bash
# 从 Live 环境或单用户模式做，确保没有程序在写 /home
sudo rsync -aHAX /home/ /mnt/newhome/
# 改 fstab 里 /home 那一行为新盘 UUID，挂载点 /home
sudo reboot
```

这样根分区只剩系统和软件，能显著缓解空间压力。

### 方案 3（进阶，不推荐新手）：根分区整体迁到新盘

`rsync` 复制根文件系统 → 改 fstab / 重装 GRUB → 从新盘启动。风险等同于重装系统出错，**收益却不如方案 1**，一般没必要。

### 顺手能做的：把 swap 挪到另一块盘

swap 是纯可再生的，放哪都行。把现有的 swap 分区删掉、换成另一块盘上的 swapfile，能**腾出 Ubuntu 系统盘上 15~30G 的连续空间** —— 如果这块空间正好贴着根分区，你就从情况 C 变成了情况 B 甚至 A。

```bash
sudo fallocate -l 16G /data/swapfile
sudo chmod 600 /data/swapfile
sudo mkswap /data/swapfile
sudo swapon /data/swapfile
echo '/data/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 7. 踩坑合集（12 个，每个都是真金白银）

| # | 坑 | 后果 | 正确做法 |
|---|---|---|---|
| 1 | **盘符顺序当物理顺序** | 以为能从 F 盘分空间，实际物理上够不着，白折腾 | 按 `Offset` 排序看真实布局 |
| 2 | **认死 `/dev/nvme0n1p8`** | 删分区后号前移，命令全打在错误的分区上 | 永远用 **UUID + 大小** 认设备 |
| 3 | **忘注释 fstab 里的旧 swap 行** | 开机卡 90 秒，或进 emergency mode | 删 swap 前就注释掉（本文 4.3） |
| 4 | **忘查 `resume=` / initramfs 的 resume** | 同样卡开机 | `grep -rn resume= /etc/default/grub`、看 `/etc/initramfs-tools/conf.d/resume` |
| 5 | **用 rsync 逐文件备份到 exFAT U 盘** | 1399 个符号链接全部丢失，且报一堆 `Operation not permitted` | 用 **tar 单文件归档** |
| 6 | **exFAT + 27 万小文件** | 慢到怀疑人生 | 同上，tar 顺序写 |
| 7 | **备份到同一块盘** | 分区表一坏，备份一起没 | 必须另一块物理设备 |
| 8 | **热插拔 U 盘** | 内核按 `errors=remount-ro` 把 exFAT 锁成**只读**，备份**静默失败**（我实际踩到，还白白刷了一小时错误） | 全程别拔；脚本里加"可写性"前置检查 |
| 9 | **低价 USB3.0 U 盘长时间大量写入** | 控制器复位、从总线掉线、设备被重新枚举成 `sdb`，读文件报 `输入/输出错误`（我也踩到了） | 直连机身 USB 口（别用拓展坞）+ 先做 2GB 写入自检；出问题就退到 USB 2.0 求稳 |
| 10 | **用老版本 Live ISO 扩容新系统** | GParted 报"文件系统有不支持的特性"直接拒绝 | **ISO 版本和系统版本一致**；再备一个最新 GParted Live |
| 11 | **以为 Ubuntu Live 自带 GParted** | Live 里没网、装不了，卡住 | 单独下一个 GParted Live ISO 放盘里 |
| 12 | **忘了 `update-initramfs` / `update-grub`** | 下次启动可能失败 | 收尾两条命令别省 |

### 还有几个"不是坑但反直觉"的点

- **`df -h /` 显示的总比分区小**：ext4 保留 5% + 元数据开销。293 GiB 的分区显示 288G 是**正常**的。
- **删完分区后，别在 Windows 里"新建卷"**：那块空间会被重新变成 Windows 分区。
- **动完分区表后第一次进 Windows 可能变慢或提示磁盘检查**：正常，让它跑完。
- **不要搬 EFI 分区和恢复分区**：前者直接开不了机，后者丢恢复功能。

---

## 8. 出事了怎么办

### 8.1 进不去系统：`grub rescue>` / `error: unknown filesystem`

重新插 U 盘启动（Ventoy 里选 **Ubuntu ISO** → **Try Ubuntu**，不要点 Install）→ 连网 →

**方案 A：boot-repair（最省事）**

```bash
sudo add-apt-repository ppa:yannubuntu/boot-repair -y
sudo apt update && sudo apt install -y boot-repair
boot-repair          # 选 Recommended repair
```

**方案 B：chroot 重装 GRUB（更可控）**

```bash
sudo mount /dev/nvme0n1p7 /mnt/ubuntu         # 根分区（用实际分区号！）
sudo mount /dev/nvme0n1p2 /mnt/ubuntu/boot/efi
for i in /dev /dev/pts /proc /sys /run; do sudo mount -B $i /mnt/ubuntu$i; done
sudo chroot /mnt/ubuntu
grub-install /dev/nvme0n1
update-grub
exit
for i in /run /sys /proc /dev/pts /dev; do sudo umount /mnt/ubuntu$i; done
sudo umount /mnt/ubuntu/boot/efi
sudo umount /mnt/ubuntu
```

### 8.2 分区表损坏 / 中途断电

1. **别重启、别慌**
2. 重新插好电源，重进 Live USB
3. 先看现状：`sudo partprobe /dev/nvme0n1 && sudo blkid`
4. 分区表乱了用 `testdisk` 扫描恢复：

```bash
sudo apt update && sudo apt install -y testdisk
sudo testdisk
# → Create → 选磁盘 → Intel/EFI GPT → Analyse → Quick Search → 找到分区 → Write
```

5. **实在不行就用第 3.1 节的 tar 备份还原** —— 这也就是为什么备份不能省。

### 8.3 品牌机器启动键对照

| 品牌 | 启动菜单键 | BIOS 键 |
|---|---|---|
| **华硕 ASUS（含 TUF / ROG）** | **`Esc`**（部分机型 `F8`） | `F2` |
| **联想 Lenovo / 拯救者 Legion** | **`F12`**（部分需 `Fn + F12`） | `F2` 或 `Fn + F2` |
| 戴尔 Dell | `F12` | `F2` |
| 惠普 HP | `F9` | `F10` |
| 宏碁 Acer | `F12` | `F2` |
| 微星 MSI | `F11` | `Del` |
| 机械革命 / 神舟 | `F12` / `F7` | `F2` / `Del` |
| 小米 / 华为 | `F12` | `F2` |

**如果按键没反应**：先在 Windows 里执行 `shutdown /s /t 0`（完全关机，不走快速启动），或开机时按住 `Shift` 点关机，再按启动键。

### 8.4 各品牌的两个小差异

- **联想拯救者**：如果 BIOS 里硬盘模式是 **Intel RST / RAID**，Linux 安装器可能看不到硬盘。需要在 BIOS 里切成 **AHCI**（切之前 Windows 可能蓝屏，要先用 `bcdedit /set safeboot minimal` 进安全模式切）。这是**装系统阶段**的问题，扩容阶段不受影响，但排查硬盘时要留意。
- **华硕机器**：通常带 `MyASUS`、`Recovery` 等小分区，在 GParted 里会看到。**别动它们**，删了不影响 Linux 使用，但会丢恢复功能和出厂工具。
- **双硬盘机型（很多拯救者 / ROG）**：Ubuntu 很可能装在**第二块盘**上。这时要特别小心——**扩容只能在同一块盘内做**，别把 Windows 那块盘的空闲当成可用空间。

---

## 9. 检查清单

**动手前：**

- [ ] 已确认**空闲空间在物理上紧贴根分区哪一侧**（用 `Offset` 排序或磁盘管理图形视图）
- [ ] 已确认**不是**"空闲在另一块盘"（那样不能合并，改走第 6 节方案）
- [ ] 已确认没有开 BitLocker / 不是动态磁盘 / 不是 Intel RST 模式
- [ ] Windows 快速启动**已关闭**，休眠**已关闭**（`powercfg /h off`）
- [ ] **重要数据已备份到另一块物理设备**，且**校验通过**
- [ ] 已抄下根分区 **UUID**、EFI UUID、`/etc/fstab` 原文（存手机）
- [ ] Live USB 已做好（Ventoy + **与系统同版本**的 Ubuntu ISO + GParted Live）
- [ ] 已测试过 U 盘能启动（可选但强烈建议，先试一次再动真格）
- [ ] 笔记本**插着电源**，自动挂起已关闭，合盖行为已确认（`HandleLidSwitch=lock`）
- [ ] 留出 **1.5 小时**，期间不会被打断

**操作中：**

- [ ] GParted 里**三查**（空闲位置 / swap 大小 / ext4 大小）不符就停手
- [ ] Resize/Move 的 `Free space preceding = 0`
- [ ] 待执行队列**只有两条**（Delete swap + Move ext4）
- [ ] Apply 前最后确认电源
- [ ] 进度条慢 = 正常，**看硬盘灯判断死活**，绝不强行断电

**重启后：**

- [ ] `lsblk` 里大小对了、**UUID 没变**
- [ ] `df -h /` 容量对了
- [ ] swapfile 建好、`swapon --show` 有 16G
- [ ] `findmnt --verify` 无错误、`systemctl --failed` 为 0
- [ ] `update-initramfs -u -k all` + `update-grub` 无报错
- [ ] 冷启动复测一次，Windows 也进一次确认数据完好
- [ ] 备份保留 1–2 周再删

---

## 10. FAQ

**Q：能边用 Ubuntu 边扩容吗？**
A：只有"空闲在右边"（情况 A）或 LVM（情况 E）可以。只要需要**左移**，就必须 Live USB —— 运行中的系统动不了自己所在的分区。

**Q：为什么不干脆重装？**
A：如果你的环境是"装完就没动过"，重装更快。但跑 ROS / CUDA / Docker 的机器，环境重配通常要 1–3 天，而本文这条路我实测 **50 分钟**。

**Q：为什么不新建一个分区挂上去，非要合并？**
A：这其实是**很合理的替代方案**（尤其双硬盘机器，见第 6 节）。合并的好处是"根分区不再有 200G 的心理天花板"；不合并的好处是零风险。**如果只是某个目录（数据集/Docker）吃空间，挂载新分区是更优解。**

**Q：能扩到多大？**
A：上限是"根分区右边所有空闲 + 它自己"。我这次吃掉了左边的 92.97G（原 E 盘）和中间的 15.26G（swap），变成 292.97 GiB。

**Q：`Free space following` 也设成 0 会怎样？**
A：会顺便吃掉根分区右边那 0.93 GiB 的既有空隙。收益很小、操作变复杂，我保持原样了。

**Q：扩容后 Windows 会受影响吗？**
A：不会。C / F / D 的偏移、大小、UUID 全部未变。但**第一次进 Windows 可能提示磁盘检查**，让它跑完即可。

**Q：为什么不把 5% 保留块留着？**
A：桌面机器用不到。`tune2fs -m 1` 能白捡约 4% 空间（我这个分区是 11.7 GB）。服务器另说。

**Q：Ubuntu 装在第二块盘、Windows 在第一块盘，能扩容吗？**
A：能，但要**从 Ubuntu 那块盘**上腾空闲空间，动 Windows 盘是没用的（物理上不在一根线上）。

---

## 11. 写在最后

这次扩容最深的体会不是"怎么点 GParted"，而是：

**动手之前，花 10 分钟搞清楚"我那块空闲空间到底在物理上的哪个位置"。** 同样是"扩容 100G"，位置在右边是 3 分钟的在线操作，位置在左边是 1 小时的不可逆手术，位置在另一块盘则**根本不可能**。

第二深的体会是：**备份这件事，比扩容本身更容易做错。** 同盘备份等于没备份、exFAT 存不了符号链接、U 盘热插拔会让备份静默失败、便宜的 U 盘长时间写入会掉线 —— 我这一趟把这四个坑全踩了一遍，也都写进第 7 节了。

最后一句：**分区操作是少数"没有撤销键"的事。** 插好电源、别碰机器、别断电，剩下的交给时间就好。

---

*本文记录于 2026-10-16，机器为 ASUS TUF Gaming A15 FA507UV（1TB NVMe · GPT · UEFI · Windows 11 + Ubuntu 24.04.5 LTS）。所有操作请自行评估风险，务必先备份。*
