import { modules, reviewGates, weekOneTasks } from "@shkf/shared";

const overview = [
  { label: "今日订单", value: "待接入", hint: "一期先用测试数据和手工导入验证" },
  { label: "客服待处理", value: "待建模", hint: "AI 只做建议，人工确认后执行" },
  { label: "同步异常", value: "0", hint: "后续由同步日志自动统计" },
  { label: "AI 待审核", value: "0", hint: "高风险建议不自动执行" }
];

const integrationRows = [
  ["飞书", "多维表格、群通知、日报输出", "第 1 周整理权限"],
  ["抖音/抖店", "账号数据、订单和售后预留", "先做权限清单"],
  ["独立站/TK", "订单、客户、内容指标预留", "先用测试数据"],
  ["邮件", "祝福、通知、售后关怀", "必须人工审核"]
];

export default function HomePage() {
  return (
    <main className="shell">
      <aside className="sidebar" aria-label="平台导航">
        <div className="brand">
          <span className="brandMark">AI</span>
          <div>
            <strong>电商自动化平台</strong>
            <small>V1 试点后台</small>
          </div>
        </div>
        <nav>
          <a href="#overview">总览</a>
          <a href="#modules">模块</a>
          <a href="#tasks">任务</a>
          <a href="#integrations">接口</a>
          <a href="#review">审核</a>
        </nav>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">第 1 周执行版</p>
            <h1>平台总控</h1>
          </div>
          <div className="statusPill">内部试点</div>
        </header>

        <section id="overview" className="metrics" aria-label="经营总览">
          {overview.map((item) => (
            <article className="metric" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.hint}</small>
            </article>
          ))}
        </section>

        <section id="modules" className="sectionBlock">
          <div className="sectionHeader">
            <h2>一期模块</h2>
            <p>先跑通业务闭环，不一次性承诺所有平台自动化。</p>
          </div>
          <div className="moduleGrid">
            {modules.map((module) => (
              <article className="moduleCard" key={module.key}>
                <div>
                  <strong>{module.name}</strong>
                  <p>{module.description}</p>
                </div>
                <span>{module.owner}</span>
              </article>
            ))}
          </div>
        </section>

        <section id="tasks" className="sectionBlock">
          <div className="sectionHeader">
            <h2>第 1 周任务</h2>
            <p>小白团队按任务卡执行，每天更新状态和验收证据。</p>
          </div>
          <div className="taskTable" role="table" aria-label="第 1 周任务表">
            <div className="tableRow tableHead" role="row">
              <span>任务</span>
              <span>负责人</span>
              <span>截止</span>
              <span>状态</span>
            </div>
            {weekOneTasks.map((task) => (
              <div className="tableRow" role="row" key={task.id}>
                <span>{task.title}</span>
                <span>{task.owner}</span>
                <span>{task.dueDate}</span>
                <span>{task.status}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="integrations" className="sectionBlock">
          <div className="sectionHeader">
            <h2>平台接口准备</h2>
            <p>真实密钥不进入仓库，先整理字段、权限、风险和账号准备人。</p>
          </div>
          <div className="integrationList">
            {integrationRows.map(([platform, scope, status]) => (
              <article key={platform}>
                <strong>{platform}</strong>
                <span>{scope}</span>
                <em>{status}</em>
              </article>
            ))}
          </div>
        </section>

        <section id="review" className="sectionBlock reviewBlock">
          <div>
            <h2>审核关卡</h2>
            <p>Claude/Codex 只做辅助审核，最终由项目负责人确认。</p>
          </div>
          <ul>
            {reviewGates.map((gate) => (
              <li key={gate}>{gate}</li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  );
}
