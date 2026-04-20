# PRD_v0.1.md
# Zotero CS Research Workbench
副标题：面向计算机科研工作流的 Zotero 7 增强插件（v0.1）

---

## 1. 文档目的

本文档定义 Zotero CS Research Workbench 的 **v0.1 产品范围、功能规格、技术边界与验收标准**。

v0.1 的目标不是做“大而全”的计算机科研平台，而是先在 Zotero 内验证一个最小且高频的计算机论文工作流闭环是否成立：

1. 快速识别论文 venue 信息  
2. 快速访问论文相关资源  
3. 快速补充最小结构化标签  
4. 快速生成阅读笔记模板  
5. 快速导出 related work 对比表

---

## 2. 产品定位

Zotero CS Research Workbench 是一个 **面向计算机科研用户的 Zotero 7 增强插件**。

它不是通用文献管理器的简单装饰层，而是一个面向 CS 论文筛选、阅读、整理和综述准备的轻量工作台。

v0.1 的产品定位是：

> 在 Zotero 内构建一个“计算机论文增强层”，把普通书目条目升级为适合 CS 科研使用的半结构化对象。

---

## 3. 版本目标

### 3.1 总目标
在不引入重型在线依赖、不破坏 Zotero 原始元数据的前提下，完成一个可日常使用的第一版插件。

### 3.2 核心目标
v0.1 必须满足以下结果：

- 用户能在列表中直接看到核心 venue 信息
- 用户能在详情面板中直接看到核心资源链接
- 用户能为论文补充最小结构化标签
- 用户能一键生成阅读笔记模板
- 用户能对多篇论文导出 related work 对比表

### 3.3 非目标
v0.1 明确不追求：

- 全自动高精度论文语义抽取
- 知识图谱
- 订阅追踪与提醒
- 团队协作
- 投稿辅助
- LLM 深度分析
- 引文图谱和复杂推荐系统

---

## 4. 目标用户

### 4.1 核心用户
- 计算机专业硕士、博士生
- 高频阅读会议论文的研究者
- 以综述、baseline 调研、复现准备为核心工作的科研用户

### 4.2 重点方向
v0.1 优先服务以下方向的用户：

- AI / ML
- NLP
- CV
- RecSys
- Security
- DB
- SE
- HCI

### 4.3 核心使用场景

#### 场景 A：筛论文
用户在 Zotero 列表中，希望快速判断：
- 这是哪个会议/期刊
- 简称是什么
- CCF / CORE 是什么级别
- 是否有代码
- 是否有 OpenReview

#### 场景 B：读论文
用户点开某篇论文后，希望快速查看：
- DOI
- arXiv
- OpenReview
- Code
- Project Page
- 自己维护的 Task / Method / Dataset / Metric 标签

#### 场景 C：做综述
用户选中若干篇论文，希望导出：
- Markdown 对比表
- CSV 对比表

#### 场景 D：做笔记
用户希望为单篇论文快速生成统一结构的阅读模板。

---

## 5. v0.1 产品范围

v0.1 只包含以下 5 个模块：

1. Venue Lite
2. Artifact Hub
3. Structured Tags Lite
4. Reading Note Template
5. Related Work Export

---

## 6. 模块规格

---

## 6.1 模块一：Venue Lite

### 6.1.1 目标
让用户在 Zotero 中快速获得适合 CS 场景的核心 venue 信息。

### 6.1.2 用户价值
减少用户反复搜索会议简称、会议等级、会议类型的成本。

### 6.1.3 输入
- Zotero item 元数据
- 本地维护的 venue 数据表
- 用户手动修正结果

### 6.1.4 输出
每篇论文至少生成以下增强结果：

- `venue_short`
- `venue_type`（conference / journal / unknown）
- `ccf_rank`
- `core_rank`

### 6.1.5 功能
- 从条目中提取原始 venue 信息
- 进行 venue 名称标准化
- 基于 alias 进行匹配
- 识别 conference / journal / unknown
- 在列表中展示 venue short / CCF / CORE
- 在详情面板中展示 venue 信息
- 支持手动修正
- 支持刷新匹配结果

### 6.1.6 明确不做
v0.1 不做以下内容：
- JCR
- 中科院分区
- IF
- 复杂 field 分类
- 自动跨源纠错服务

### 6.1.7 容错要求
- 匹配失败时显示 unknown 或空值
- 不修改 Zotero 原始 metadata
- 手动修正优先级高于自动匹配
- 自动刷新不能覆盖用户修正

### 6.1.8 验收标准
- 常见 CS venue 能正确展示简称
- CCF / CORE 能正常显示或为空
- 用户可手动修正 venue 结果
- 修正后刷新仍然保留

---

## 6.2 模块二：Artifact Hub

### 6.2.1 目标
把论文相关的核心资源聚合到单条条目层级。

### 6.2.2 用户价值
减少用户在浏览器里重复搜索 DOI、arXiv、OpenReview、代码仓库等资源的成本。

### 6.2.3 输入
- Zotero item 的 DOI、URL、Extra、title 等元数据
- 规范化后的标识符
- 用户手动补充结果

### 6.2.4 输出
每篇论文支持以下资源字段：

- `doi_url`
- `arxiv_url`
- `openreview_url`
- `code_url`
- `project_url`

### 6.2.5 功能
- 自动识别 DOI
- 自动识别 arXiv
- 自动识别 OpenReview
- 读取 item 中已有 URL
- 允许用户手动补充 code / project 链接
- 在详情面板中展示
- 支持一键复制全部链接
- 支持一键打开链接

### 6.2.6 自动化策略
v0.1 只做 **高置信度自动识别**。  
对于不稳定或歧义较大的资源类型，优先采用手动补充而不是激进猜测。

### 6.2.7 明确不做
v0.1 不承诺自动聚合以下资源：
- Dataset 页面
- Papers With Code
- 视频
- poster
- slides
- supplement
- GitLab 自动搜索
- 全网项目页发现

### 6.2.8 容错要求
- 链接缺失时 UI 不报错
- URL 非法时不导致插件崩溃
- 外部解析失败时插件基本功能仍可用

### 6.2.9 验收标准
- 对已有 DOI / arXiv / OpenReview 信息的条目能正确显示链接
- 用户可手动补充 code / project
- 支持复制全部链接
- 缺失链接不影响使用

---

## 6.3 模块三：Structured Tags Lite

### 6.3.1 目标
把论文从纯书目条目升级为最小可用的半结构化科研对象。

### 6.3.2 用户价值
帮助用户在 Zotero 内维护最常用的论文维度，便于后续筛选、对比、导出。

### 6.3.3 v0.1 仅支持四类字段
- `task[]`
- `method[]`
- `dataset[]`
- `metric[]`

所有字段均允许多值。

### 6.3.4 功能
- 单篇论文标签编辑
- 多值添加 / 删除 / 修改
- 批量编辑
- 本地持久化存储
- 用户修正优先级高于自动建议

### 6.3.5 自动建议策略
v0.1 不实现复杂自动抽取。  
如工程代价很低，可预留 suggestion hook，但必须满足：

- 默认可关闭
- 只做建议，不自动写入最终值
- 绝不覆盖用户编辑结果

### 6.3.6 明确不做
v0.1 不做以下字段：
- baseline
- paper type
- field
- reproducibility score
- attack / defense 自动识别
- survey / benchmark 自动判定

### 6.3.7 批量编辑规则
- 支持对多篇条目追加标签
- 默认不清空已有值
- 只有显式操作时才允许覆盖/替换

### 6.3.8 验收标准
- 用户可编辑四类标签
- 多选条目批量添加标签可用
- 标签能持久保存
- UI 读取结果以用户编辑为准

---

## 6.4 模块四：Reading Note Template

### 6.4.1 目标
降低单篇论文阅读笔记的创建成本，形成统一模板。

### 6.4.2 用户价值
让用户在阅读后快速形成结构统一的笔记，便于后续复盘和综述写作。

### 6.4.3 输入
- 当前选中条目
- 用户自定义模板配置（若有）

### 6.4.4 输出
支持以下输出形式：
- Zotero Note
- Markdown 文本
- 纯文本

### 6.4.5 默认模板字段
模板默认包含以下部分：

1. Problem
2. Core Idea
3. Method Overview
4. Experimental Setup
5. Main Results
6. Limitations
7. Relation to My Work

### 6.4.6 明确不做
v0.1 不做：
- 自动总结论文内容
- 基于摘要自动填充模板
- LLM 辅助生成结论
- 自动提炼创新点

### 6.4.7 验收标准
- 用户可一键生成阅读模板
- 可写入 Zotero Note
- 可复制 Markdown / 纯文本
- 生成过程不依赖网络

---

## 6.5 模块五：Related Work Export

### 6.5.1 目标
支持用户从 Zotero 中多选论文后，快速导出 related work 对比表。

### 6.5.2 用户价值
帮助用户把文献管理直接连接到综述写作和 baseline 调研工作流。

### 6.5.3 输入
- 用户选中的多篇条目
- venue 增强结果
- structured tags
- artifact 数据

### 6.5.4 输出格式
v0.1 仅支持：
- Markdown table
- CSV

### 6.5.5 默认导出字段
- Title
- Year
- Venue Short
- CCF Rank
- CORE Rank
- Task
- Method
- Dataset
- Metric
- Code
- Notes

### 6.5.6 行为要求
- 缺失值显示为空，不报错
- 字段顺序固定
- 导出结果稳定
- 100 篇以内条目导出应在可接受时间内完成

### 6.5.7 明确不做
v0.1 不做：
- Excel 原生文件写出
- LaTeX 表格骨架生成
- 自动分组聚类
- 自动生成综述文字草稿

### 6.5.8 验收标准
- 多选条目后可导出 Markdown 和 CSV
- 输出字段完整且顺序稳定
- 缺失值不导致失败
- 中等规模导出可正常完成

---

## 7. 信息架构与 UI

## 7.1 列表层（Item List Columns）

v0.1 仅新增以下列：

- Venue Short
- CCF Rank
- CORE Rank
- Has Code
- Has OpenReview

### 设计原则
- 列数量尽量少
- 优先展示高价值、高稳定字段
- 所有列表字段应优先使用缓存
- 不能明显影响滚动性能

---

## 7.2 右侧详情面板（Detail Pane）

v0.1 仅设计 3 个区域：

### Card A：Venue
展示：
- Full Name
- Short Name
- Type
- CCF
- CORE

### Card B：Artifacts
展示：
- DOI
- arXiv
- OpenReview
- Code
- Project

### Card C：Structure & Workflow
展示：
- Task
- Method
- Dataset
- Metric
- Generate Note
- Export Related Work

---

## 7.3 右键菜单（Context Menu）

v0.1 新增以下菜单项：

- Refresh Venue Match
- Edit Structured Tags
- Generate Reading Note
- Export Related Work
- Copy Artifact Links

---

## 8. 数据模型

v0.1 建议采用本地存储，自动结果与用户修正分离。

### 8.1 `venue_master`
字段：
- `venue_id`
- `canonical_name`
- `short_name`
- `type`
- `ccf_rank`
- `core_rank`
- `aliases_json`
- `updated_at`

### 8.2 `artifact_links`
字段：
- `item_key`
- `doi_url`
- `arxiv_url`
- `openreview_url`
- `code_url`
- `project_url`
- `source`
- `updated_at`

### 8.3 `paper_tags`
字段：
- `item_key`
- `task_json`
- `method_json`
- `dataset_json`
- `metric_json`
- `updated_at`

### 8.4 `user_overrides`
字段：
- `item_key`
- `venue_override_json`
- `artifact_override_json`
- `tag_override_json`
- `updated_at`

### 8.5 读取优先级
最终展示值必须遵循以下优先级：

> user override > automatic resolved value > empty

### 8.6 数据写入原则
- 不破坏原始 Zotero item metadata
- 自动结果与人工修正分表或分结构保存
- 刷新自动结果时，不覆盖用户修正

---

## 9. 技术方案

## 9.1 技术形态
- Zotero 7 插件
- TypeScript / JavaScript
- 本地 SQLite 或与现有代码风格一致的本地存储方案
- UI 基于：
  - item tree columns
  - detail pane
  - context menus

## 9.2 架构分层

### Layer 1：Data Adapter
负责适配：
- Zotero item 元数据
- item 中已有 DOI / URL / Extra 等信息
- 本地 venue 数据表

### Layer 2：Normalizer
负责：
- venue 归一化
- DOI / arXiv / OpenReview 标识符标准化
- alias 映射
- type 判断

### Layer 3：Resolver
负责：
- venue 匹配
- artifact 聚合
- structured tag 最终值整合
- override 合并

### Layer 4：Storage
负责：
- 本地缓存
- 用户修正
- 更新时间
- 读取优先级控制

### Layer 5：UI
负责：
- 列表列
- 详情面板
- 右键菜单
- 导出功能

---

## 10. 非功能需求

## 10.1 性能
- 文献列表滚动不能明显卡顿
- 自定义列优先读取缓存
- 100 篇以内导出应在可接受时间内完成
- 详情面板不应因为单次解析阻塞 UI

## 10.2 可维护性
- venue 数据表应与逻辑分离
- 匹配规则与 UI 解耦
- 新增字段不应破坏旧数据结构
- 代码结构应便于扩展 v0.2

## 10.3 可扩展性
v0.1 的设计应允许后续扩展：
- 更多 ranking 体系
- 更多 artifact 平台
- 更多结构化字段
- 半自动建议能力

## 10.4 容错
- 匹配失败不污染原始 metadata
- 用户修正不被自动刷新覆盖
- 外部 URL 异常不影响整体功能
- 缺失字段时界面仍可渲染

---

## 11. 版本边界与延期功能

以下功能全部延后至 v0.2 及以后：

- JCR / 中科院 / IF
- baseline / repro 标签体系
- paper type
- 自动抽取任务/方法/数据集/指标
- Topic Map
- Citation & Lineage
- Subscription & Tracking
- 团队协作
- 投稿辅助
- LLM 辅助分析
- 知识图谱视图

---

## 12. 成功标准

v0.1 被认为成功，至少需要达到：

1. 用户安装后可在列表中看到 venue short / CCF / CORE
2. 用户点开论文时可看到 DOI / arXiv / OpenReview / Code / Project
3. 用户可维护 Task / Method / Dataset / Metric 四类标签
4. 用户可一键生成阅读模板
5. 用户可多选论文导出 Markdown / CSV 对比表
6. 手动修正不会被刷新覆盖
7. 无网络时已缓存信息仍可读取

---

## 13. 开发约束

开发实现必须遵循以下约束：

- 严格限制在 v0.1 范围内
- 不引入重型在线依赖
- 不对 Zotero 原始元数据进行破坏性写入
- 自动数据和用户修正必须分开存储
- 优先小步迭代，可随时运行和验证
- 不做大规模猜测性重构
- 不实现未在本 PRD 中定义的高级功能

---

## 14. 推荐开发顺序

建议按以下顺序落地：

1. Storage + typed model
2. Venue Lite
3. Artifact Hub
4. Structured Tags Lite
5. Reading Note Template
6. Related Work Export
7. UI integration
8. Settings / error handling / README

---

## 15. README 用一句话简介

Zotero CS Research Workbench is a Zotero 7 plugin for computer science researchers. It enhances papers with venue metadata, artifact links, lightweight structured tags, reading-note templates, and related-work export tools, turning Zotero into a practical CS literature workbench.
