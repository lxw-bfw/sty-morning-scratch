# sty-morning-scratch

![晨读刮刮乐](https://ik.imagekit.io/lxwgemmke/chatai-images/d15495de8d55915a424971752b089ce3.png)

晨读刮刮乐 —— 面向课堂晨读场景的轻量 Web 小工具：用麦克风感知朗读音量，累积进度，完成后以刮卡或拉杆形式揭晓奖励，烘托气氛、提升参与感。

---

## 项目概述

本项目为纯前端单页应用（SPA），无需后端即可在浏览器中运行。教师可配置目标音量阈值、达标所需时长、奖励列表与权重，学生在晨读时开口朗读即可推动进度条；进度满后进入庆祝与开奖流程，支持礼花动效与音效反馈。配置通过 `localStorage` 持久化，刷新页面后仍保留。

---

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | [Vue 3](https://vuejs.org/)（Composition API，`<script setup lang="ts">`） |
| 构建 | [Vite](https://vitejs.dev/) 6.x |
| 语言 | [TypeScript](https://www.typescriptlang.org/)（严格模式，`vue-tsc` 参与构建） |
| 状态 | [Pinia](https://pinia.vuejs.org/) |
| 样式 | [Tailwind CSS](https://tailwindcss.com/) v4（`@tailwindcss/vite`） |
| 工具库 | [@vueuse/core](https://vueuse.org/)（如 `useStorage`、`useEventListener` 等） |
| 动效 | [canvas-confetti](https://www.npmjs.com/package/canvas-confetti) |

---

## 功能介绍

- **欢迎引导**：进入页面后的欢迎弹窗，确认后开始晨读流程。
- **麦克风与音量**：在用户操作后采集麦克风，将时域信号映射为展示用「分贝」刻度，与配置中的阈值比较。
- **进度与引擎**：仅在音量达标时按时间推进进度；使用 `requestAnimationFrame` 累加时间增量，减少定时器漂移。
- **双模式开奖**：支持**刮刮卡**与**拉杆（老虎机）**两种揭晓方式，可在设置中切换。
- **奖励系统**：可编辑奖励文案与权重；开奖前按权重随机预选中奖项。
- **控制中心**：侧滑设置面板，调整目标分贝、目标时长、模式、奖励列表、音量等。
- **庆祝与反馈**：礼花弹窗、进度条与状态机驱动的流程（录音中 / 完成 / 庆祝等）。

更细的模块说明可参考仓库内 [`代码说明文档.md`](./代码说明文档.md)。

---

## 核心技术点细节

1. **Web Audio 分析链**  
   `getUserMedia` → `AudioContext` → `AnalyserNode`，对时域数据做 RMS 类度量并映射到 0–120 的展示值，便于与配置的 `targetDb` 对比（见 `src/composables/useAudioAnalyzer.ts`）。

2. **游戏进度驱动**  
   `useGameEngine` 在 `recording` 状态下根据 `currentDb >= targetDb` 是否成立，按 `targetDurationSeconds` 将进度从 0 推到 100；满进度时调用 `calculateWinner()` 并切换为 `finished`（见 `src/composables/useGameEngine.ts`）。

3. **配置持久化**  
   使用 `@vueuse/core` 的 `useStorage` 将 `GameConfig`（模式、阈值、时长、奖池等）同步到 `localStorage`，键名如 `chen-du-config`（见 `src/stores/useGameStore.ts`）。

4. **加权随机**  
   奖池内按 `weight` 做离散加权抽样，在进度未满前预先确定本轮结果，避免前端重复开奖不一致（见 `useGameStore` 内 `pickWeightedReward`）。

5. **刮刮卡实现**  
   Canvas 上绘制涂层与擦除路径，结合透明像素比例判断是否「刮开」到位（组件 `StratchCard.vue` / `RewardScratchMode.vue`）。

6. **工程路径别名**  
   `@/` 指向 `src/`，与 Vite、`tsconfig` 保持一致，便于组件与 composable 引用。

---

## Cursor Rules（编码规范与协作）

仓库在 `.cursor/rules/` 下为 AI 辅助开发与人工协作约定了一组规则，**始终或按文件类型启用**，用于统一风格、减少低级错误。概要如下：

| 规则文件 | 作用概要 |
|----------|----------|
| `code-quality.mdc` | 新代码使用 TypeScript、禁止滥用 `any`、异步优先 `async/await`、错误路径需 `try/catch` 与日志、注释说明意图而非复述代码。 |
| `function-design.mdc` | 功能函数编写 JSDoc（参数/返回值/用途）、单一职责、控制函数体量、避免「上帝函数」。 |
| `ui-responsive.mdc` | 移动端优先与断点顺序、触控最小点击区域、Tailwind v4 与 CSS 变量/token、`@apply` 仅用于高频复用等。 |
| `vue3-vite-typescript.mdc` | Vue 3 SFC 结构、Composition API、`defineProps`/`defineEmits` 类型、`composables/` 命名、`VITE_` 环境变量与 `import.meta.env`、列表 `key` 与 `computed` 等性能习惯。 |

详细条文以各 `.mdc` 文件为准；修改规范时请同步更新规则文件，便于人机一致。

---

## CI/CD 工作流

GitHub Actions 配置位于 [`.github/workflows/`](./.github/workflows/)。

### CI（`ci.yml`）

- **触发**：向 `main` 分支提交的 **Pull Request**。
- **步骤**：检出代码 → Node.js 22 + npm 缓存 → `npm ci` → `npm run build`（含 `vue-tsc` 类型检查与 Vite 构建）。
- **目的**：合并前发现类型错误与构建失败，**不执行部署**。

### Deploy（`deploy.yml`）

- **触发**：推送到 `main`（含合并 PR），或手动 `workflow_dispatch`。
- **并发**：`concurrency.group` 为 `deploy-sty-morning-scratch`，`cancel-in-progress: true`，新部署会取消仍在进行的旧部署，避免排队积压。
- **步骤**：与 CI 类似完成 `npm ci` 与 `npm run build` → 使用 `webfactory/ssh-agent` 载入私钥 → 配置 `known_hosts`（优先使用 Secret `DEPLOY_KNOWN_HOSTS`，否则对 `DEPLOY_HOST` 执行 `ssh-keyscan`）→ **`rsync` 将 `dist/` 同步到服务器目录**（`--delete` 清理已移除的带 hash 旧资源）。
- **所需 Secrets（示例）**：`DEPLOY_SSH_KEY`、`DEPLOY_USER`、`DEPLOY_HOST`；可选 `DEPLOY_PORT`、`DEPLOY_KNOWN_HOSTS`。具体远程路径以 workflow 内配置为准，部署前请按实际环境修改。

> **安全提示**：私钥仅放在 GitHub Repository Secrets 中，勿将密钥文件提交到仓库。本仓库 `.gitignore` 已忽略示例密钥文件名 `gha_deploy_ed25519` 等，请勿误提交。

---

## 本地开发

```bash
npm install
npm run dev
```

构建与预览：

```bash
npm run build
npm run preview
```

---


