/**
 * Obsidian Graph Studio Frontend Controller
 * Cytoscape.js によるワークフロー実行アニメーション & Vaultナレッジトポロジー可視化
 */

let wfCy = null;
let topoCy = null;
let currentWorkflows = {};
let activeEventSource = null;
let fullTopologyData = null;
let selectedNodeData = null;

// =========================================================================
// Initialization
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initWorkflows();
  initRoutineAndStats();
});

// =========================================================================
// Tab Navigation
// =========================================================================
function switchTab(tabId) {
  document.querySelectorAll("nav .nav-tab").forEach(btn => btn.classList.remove("active"));
  document.getElementById(`tab-${tabId}-btn`).classList.add("active");

  document.getElementById("tab-workflow").classList.add("hidden");
  document.getElementById("tab-topology").classList.add("hidden");
  document.getElementById("tab-routine").classList.add("hidden");

  document.getElementById(`tab-${tabId}`).classList.remove("hidden");

  if (tabId === "workflow") {
    if (wfCy) setTimeout(() => wfCy.resize().fit(), 100);
  } else if (tabId === "topology") {
    if (!topoCy) {
      loadTopologyGraph();
    } else {
      setTimeout(() => topoCy.resize().fit(), 100);
    }
  } else if (tabId === "routine") {
    loadRoutineData();
  }
}

// =========================================================================
// TAB 1: WORKFLOW STUDIO
// =========================================================================

async function initWorkflows() {
  try {
    const res = await fetch("/api/graph/workflows");
    currentWorkflows = await res.json();

    const select = document.getElementById("wf-select");
    select.innerHTML = "";
    Object.keys(currentWorkflows).forEach(key => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = currentWorkflows[key].name;
      select.appendChild(opt);
    });

    onWorkflowChanged();
  } catch (err) {
    console.error("Failed to load workflows:", err);
  }
}

function onWorkflowChanged() {
  const select = document.getElementById("wf-select");
  const wfKey = select.value;
  const wf = currentWorkflows[wfKey];
  if (!wf) return;

  document.getElementById("wf-desc").textContent = wf.description || "";
  renderWorkflowGraph(wf);
}

function renderWorkflowGraph(wf) {
  const container = document.getElementById("wf-cy-container");

  const elements = [];
  wf.nodes.forEach(n => {
    let nodeClass = "standard-node";
    if (n.id === "__start__") nodeClass = "start-node";
    if (n.id === "__end__") nodeClass = "end-node";

    elements.push({
      data: {
        id: n.id,
        label: n.id === "__start__" ? "START" : (n.id === "__end__" ? "END" : n.id),
        desc: n.description || ""
      },
      classes: nodeClass
    });
  });

  wf.edges.forEach((e, idx) => {
    elements.push({
      data: {
        id: `we_${idx}`,
        source: e.from,
        target: e.to,
        label: e.label || ""
      },
      classes: e.type === "conditional" ? "cond-edge" : "direct-edge"
    });
  });

  if (wfCy) wfCy.destroy();

  wfCy = cytoscape({
    container: container,
    elements: elements,
    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(label)',
          'color': '#f8fafc',
          'font-size': '12px',
          'font-weight': 'bold',
          'text-valign': 'center',
          'text-halign': 'center',
          'background-color': '#1e293b',
          'border-width': 2,
          'border-color': '#475569',
          'width': 130,
          'height': 50,
          'shape': 'round-rectangle',
          'text-wrap': 'wrap',
          'text-max-width': 110,
          'transition-property': 'background-color, border-color, width, height, line-color, target-arrow-color',
          'transition-duration': '0.3s'
        }
      },
      {
        selector: '.start-node',
        style: {
          'background-color': '#065f46',
          'border-color': '#10b981',
          'shape': 'ellipse',
          'width': 70,
          'height': 70
        }
      },
      {
        selector: '.end-node',
        style: {
          'background-color': '#881337',
          'border-color': '#f43f5e',
          'shape': 'ellipse',
          'width': 70,
          'height': 70
        }
      },
      {
        selector: '.node-active',
        style: {
          'background-color': '#6366f1',
          'border-color': '#a855f7',
          'border-width': 4,
          'color': '#ffffff'
        }
      },
      {
        selector: '.node-done',
        style: {
          'background-color': '#0f766e',
          'border-color': '#14b8a6',
          'border-width': 2
        }
      },
      {
        selector: '.node-error',
        style: {
          'background-color': '#e11d48',
          'border-color': '#fda4af',
          'border-width': 4
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 2,
          'line-color': '#475569',
          'target-arrow-color': '#475569',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'label': 'data(label)',
          'color': '#94a3b8',
          'font-size': '10px',
          'text-background-color': '#020617',
          'text-background-opacity': 0.8,
          'text-background-padding': '2px',
          'text-rotation': 'autorotate'
        }
      },
      {
        selector: '.edge-active',
        style: {
          'width': 4,
          'line-color': '#a855f7',
          'target-arrow-color': '#a855f7'
        }
      },
      {
        selector: '.cond-edge',
        style: {
          'line-style': 'dashed',
          'line-color': '#d97706',
          'target-arrow-color': '#d97706'
        }
      }
    ],
    layout: {
      name: 'dagre',
      rankDir: 'LR',
      spacingFactor: 1.25,
      nodeDimensionsIncludeLabels: true
    }
  });

  wfCy.on('tap', 'node', (evt) => {
    const node = evt.target;
    console.log("Clicked workflow node:", node.id());
  });
}

function fitWorkflowGraph() {
  if (wfCy) wfCy.fit(30);
}

function clearWorkflowLogs() {
  document.getElementById("wf-log-container").innerHTML = "";
  document.getElementById("wf-state-json").textContent = "{}";
  document.getElementById("state-step-num").textContent = "Step: -";
  document.getElementById("wf-status-badge").textContent = "待機中";
  if (wfCy) {
    wfCy.nodes().removeClass("node-active node-done node-error");
    wfCy.edges().removeClass("edge-active");
  }
}

function startWorkflowStream() {
  if (activeEventSource) {
    activeEventSource.close();
  }

  clearWorkflowLogs();
  const select = document.getElementById("wf-select");
  const wfKey = select.value;
  const seeds = document.getElementById("wf-input-seeds").value;
  const depth = document.getElementById("wf-input-depth").value;

  const runBtn = document.getElementById("btn-run-stream");
  runBtn.disabled = true;
  runBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 実行中...`;

  const statusBadge = document.getElementById("wf-status-badge");
  statusBadge.innerHTML = `<span class="text-indigo-400 font-bold animate-pulse">Running</span>`;

  const url = `/api/graph/stream?workflow=${encodeURIComponent(wfKey)}&seeds=${encodeURIComponent(seeds)}&depth=${encodeURIComponent(depth)}`;
  activeEventSource = new EventSource(url);

  activeEventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleWorkflowEvent(data);
    } catch (e) {
      console.error("SSE parse error:", e);
    }
  };

  activeEventSource.onerror = (err) => {
    console.log("SSE stream closed or completed.");
    activeEventSource.close();
    activeEventSource = null;
    runBtn.disabled = false;
    runBtn.innerHTML = `<i class="fa-solid fa-play"></i> リアルタイム実行 (SSE)`;
  };
}

function handleWorkflowEvent(data) {
  const logContainer = document.getElementById("wf-log-container");
  const stateJson = document.getElementById("wf-state-json");
  const stepNum = document.getElementById("state-step-num");
  const statusBadge = document.getElementById("wf-status-badge");

  const timeStr = data.timestamp ? data.timestamp.split("T")[1].split(".")[0] : "";

  let logHtml = "";
  if (data.event === "graph_start") {
    logHtml = `<div class="log-item-enter text-emerald-400 font-bold">[${timeStr}] 🟢 ワークフロー '${data.graph_name}' を開始しました</div>`;
    if (wfCy) wfCy.nodes().removeClass("node-active node-done node-error");
  } else if (data.event === "node_start") {
    logHtml = `<div class="log-item-enter text-indigo-300">[${timeStr}] ⚙️ Step ${data.step}: ノード <b>${data.node}</b> を実行中...</div>`;
    if (wfCy) {
      wfCy.nodes().removeClass("node-active");
      const targetNode = wfCy.$(`node[id="${data.node}"]`);
      if (targetNode) targetNode.addClass("node-active");
    }
  } else if (data.event === "node_end") {
    const dur = data.duration_ms ? `${data.duration_ms}ms` : "";
    logHtml = `<div class="log-item-enter text-teal-300">[${timeStr}] ✓ Step ${data.step}: ノード <b>${data.node}</b> 完了 (${dur})</div>`;
    if (wfCy) {
      const targetNode = wfCy.$(`node[id="${data.node}"]`);
      if (targetNode) {
        targetNode.removeClass("node-active");
        targetNode.addClass("node-done");
      }
    }
    if (data.state) {
      stateJson.textContent = JSON.stringify(data.state, null, 2);
      stepNum.textContent = `Step: ${data.step} (${data.node})`;
    }
  } else if (data.event === "edge_transition") {
    logHtml = `<div class="log-item-enter text-purple-400">[${timeStr}] ➔ 遷移: <b>${data.from_node}</b> ➔ <b>${data.to_node}</b> (${data.type})</div>`;
    if (wfCy) {
      wfCy.edges().removeClass("edge-active");
      const edge = wfCy.$(`edge[source="${data.from_node}"][target="${data.to_node}"]`);
      if (edge) edge.addClass("edge-active");
    }
  } else if (data.event === "graph_finish") {
    logHtml = `<div class="log-item-enter text-emerald-400 font-bold">[${timeStr}] 🏁 ワークフロー完了 (Total Steps: ${data.total_steps})</div>`;
    statusBadge.innerHTML = `<span class="text-emerald-400 font-bold">Done</span>`;
    if (data.final_state) {
      stateJson.textContent = JSON.stringify(data.final_state, null, 2);
    }
  } else if (data.event === "node_error" || data.event === "graph_error") {
    logHtml = `<div class="log-item-enter text-rose-400 font-bold">[${timeStr}] ❌ エラー: ${data.error}</div>`;
    statusBadge.innerHTML = `<span class="text-rose-400 font-bold">Error</span>`;
  }

  if (logHtml) {
    logContainer.innerHTML += logHtml;
    logContainer.scrollTop = logContainer.scrollHeight;
  }
}

async function exportWorkflowCanvas() {
  const select = document.getElementById("wf-select");
  const wfKey = select.value;
  try {
    const res = await fetch("/api/graph/export-canvas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "workflow", workflow: wfKey })
    });
    const data = await res.json();
    if (data.success) {
      alert(`Obsidian Canvasを出力しました:\n${data.file}`);
    } else {
      alert(`エラー: ${data.error}`);
    }
  } catch (err) {
    alert("Canvas出力に失敗しました: " + err.message);
  }
}

// =========================================================================
// TAB 2: KNOWLEDGE TOPOLOGY
// =========================================================================

async function loadTopologyGraph(force = false) {
  const container = document.getElementById("topo-cy-container");
  try {
    const res = await fetch(`/api/graph/topology?refresh=${force ? 1 : 0}`);
    fullTopologyData = await res.json();

    loadBridgesList();

    const elements = [];

    // ノード
    fullTopologyData.elements.nodes.forEach(n => {
      const d = n.data;
      // PageRankに基づくサイズ (15px 〜 50px)
      const size = Math.max(15, Math.min(55, 15 + (d.pagerank * 0.4)));
      elements.push({
        data: {
          id: d.id,
          label: d.label,
          path: d.path,
          domain: d.domain,
          color: d.color,
          pagerank: d.pagerank,
          in_degree: d.in_degree,
          out_degree: d.out_degree,
          total_degree: d.total_degree,
          tags: d.tags,
          type: d.type,
          node_size: size
        }
      });
    });

    // エッジ (負荷軽減のため上位接続のみまたは全エッジ)
    fullTopologyData.elements.edges.forEach(e => {
      elements.push({
        data: {
          id: e.data.id,
          source: e.data.source,
          target: e.data.target
        }
      });
    });

    if (topoCy) topoCy.destroy();

    topoCy = cytoscape({
      container: container,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': '#cbd5e1',
            'font-size': '9px',
            'text-valign': 'bottom',
            'text-margin-y': 4,
            'background-color': 'data(color)',
            'width': 'data(node_size)',
            'height': 'data(node_size)',
            'border-width': 1.5,
            'border-color': '#ffffff',
            'border-opacity': 0.6,
            'text-max-width': 90,
            'text-wrap': 'ellipsis'
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#f43f5e',
            'color': '#ffffff',
            'font-size': '11px',
            'font-weight': 'bold'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1,
            'line-color': '#334155',
            'opacity': 0.4,
            'curve-style': 'straight',
            'target-arrow-shape': 'none'
          }
        },
        {
          selector: '.path-node',
          style: {
            'background-color': '#ec4899',
            'border-color': '#ffffff',
            'border-width': 4,
            'z-index': 999
          }
        },
        {
          selector: '.path-edge',
          style: {
            'width': 4,
            'line-color': '#ec4899',
            'opacity': 1.0,
            'z-index': 998
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: false,
        randomize: false,
        componentSpacing: 100,
        nodeOverlap: 20,
        idealEdgeLength: 60,
        edgeElasticity: 100
      }
    });

    topoCy.on('tap', 'node', (evt) => {
      const node = evt.target;
      showNodeInspector(node.data());
    });

  } catch (err) {
    console.error("Failed to load topology graph:", err);
  }
}

function fitTopologyGraph() {
  if (topoCy) topoCy.fit(30);
}

function reloadTopologyGraph(force = true) {
  loadTopologyGraph(force);
}

async function loadBridgesList() {
  try {
    const res = await fetch("/api/graph/bridges");
    const bridges = await res.json();
    const list = document.getElementById("bridges-list");
    list.innerHTML = "";

    bridges.slice(0, 8).forEach(b => {
      const item = document.createElement("div");
      item.className = "p-2 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-pink-500/50 cursor-pointer transition flex items-center justify-between";
      item.innerHTML = `
        <div class="overflow-hidden pr-2">
          <div class="font-bold text-slate-200 truncate">${b.title}</div>
          <div class="text-[10px] text-slate-400">接続: ${b.connected_domains.length} ドメイン (PR: ${b.pagerank}%)</div>
        </div>
        <span class="text-xs text-pink-400"><i class="fa-solid fa-chevron-right"></i></span>
      `;
      item.onclick = () => {
        if (topoCy) {
          const target = topoCy.$(`node[id="${b.id}"]`);
          if (target.length) {
            topoCy.center(target);
            topoCy.zoom(1.8);
            target.select();
            showNodeInspector(target.data());
          }
        }
      };
      list.appendChild(item);
    });
  } catch (err) {
    console.error("Failed to load bridges:", err);
  }
}

function filterTopologyNodes() {
  if (!topoCy) return;

  const query = document.getElementById("topo-search-input").value.toLowerCase().trim();
  const prThreshold = parseFloat(document.getElementById("pr-slider").value);
  const checkedDomains = Array.from(document.querySelectorAll(".domain-cb:checked")).map(cb => cb.value);

  topoCy.batch(() => {
    topoCy.nodes().forEach(node => {
      const d = node.data();
      const matchQuery = !query || d.label.toLowerCase().includes(query) || (d.tags && d.tags.some(t => t.toLowerCase().includes(query)));
      const matchDomain = checkedDomains.includes(d.domain);
      const matchPr = d.pagerank >= prThreshold;

      if (matchQuery && matchDomain && matchPr) {
        node.show();
      } else {
        node.hide();
      }
    });
  });
}

function onPrSliderChanged() {
  const val = document.getElementById("pr-slider").value;
  document.getElementById("pr-threshold-val").textContent = `${val}%`;
  filterTopologyNodes();
}

function showNodeInspector(data) {
  selectedNodeData = data;
  const panel = document.getElementById("node-inspector-panel");
  panel.classList.remove("hidden");

  document.getElementById("insp-title").textContent = data.label;
  document.getElementById("insp-path").textContent = data.path;
  document.getElementById("insp-domain").textContent = data.domain || "Other";
  document.getElementById("insp-pr").textContent = `${data.pagerank}%`;
  document.getElementById("insp-degree").textContent = `${data.total_degree} (In: ${data.in_degree}, Out: ${data.out_degree})`;

  const tagsBox = document.getElementById("insp-tags");
  tagsBox.innerHTML = "";
  if (data.tags && data.tags.length > 0) {
    data.tags.forEach(t => {
      const span = document.createElement("span");
      span.className = "px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px]";
      span.textContent = `#${t}`;
      tagsBox.appendChild(span);
    });
  } else {
    tagsBox.innerHTML = `<span class="text-slate-500 text-[10px]">タグなし</span>`;
  }
}

function closeNodeInspector() {
  document.getElementById("node-inspector-panel").classList.add("hidden");
  selectedNodeData = null;
}

async function exportNodeSubgraphCanvas() {
  if (!selectedNodeData) return;
  try {
    const res = await fetch("/api/graph/export-canvas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "subgraph", node: selectedNodeData.id, depth: 2 })
    });
    const data = await res.json();
    if (data.success) {
      alert(`Obsidian Canvasを出力しました:\n${data.file}`);
    } else {
      alert(`エラー: ${data.error}`);
    }
  } catch (err) {
    alert("Canvas出力に失敗しました: " + err.message);
  }
}

async function findShortestPath() {
  const start = document.getElementById("path-start").value.trim();
  const end = document.getElementById("path-end").value.trim();
  const resultBox = document.getElementById("path-result-box");

  if (!start || !end) {
    alert("起点と目標ノート名を入力してください。");
    return;
  }

  try {
    const res = await fetch(`/api/graph/path?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
    const data = await res.json();

    if (data.path && data.path.length > 0) {
      resultBox.classList.remove("hidden");
      resultBox.innerHTML = `<b>経路発見 (${data.path.length - 1} steps):</b><br>${data.path.join(" ➔ ")}`;

      if (topoCy) {
        topoCy.nodes().removeClass("path-node");
        topoCy.edges().removeClass("path-edge");

        data.path.forEach((nodeId, idx) => {
          const n = topoCy.$(`node[id="${nodeId}"]`);
          if (n) n.addClass("path-node");

          if (idx < data.path.length - 1) {
            const nextId = data.path[idx + 1];
            const edge = topoCy.$(`edge[source="${nodeId}"][target="${nextId}"], edge[source="${nextId}"][target="${nodeId}"]`);
            if (edge) edge.addClass("path-edge");
          }
        });
      }
    } else {
      resultBox.classList.remove("hidden");
      resultBox.textContent = "経路が見つかりませんでした。";
    }
  } catch (err) {
    alert("経路探索エラー: " + err.message);
  }
}

// =========================================================================
// TAB 3: ROUTINE & STATS
// =========================================================================

async function initRoutineAndStats() {
  loadRoutineData();
}

async function loadRoutineData() {
  // Stats
  try {
    const statsRes = await fetch("/api/stats");
    const stats = await statsRes.json();
    document.getElementById("stat-vault-nodes").textContent = stats.total_vault_nodes || "-";
    document.getElementById("stat-vault-edges").textContent = stats.total_vault_edges || "-";
    document.getElementById("stat-daily-notes").textContent = stats.daily_notes_count || "-";
    document.getElementById("stat-terms").textContent = stats.terms_count || "-";
  } catch (e) {}

  // Weather
  try {
    const weatherRes = await fetch("/api/weather");
    const weather = await weatherRes.json();
    document.getElementById("weather-date").textContent = weather.date || "";
    document.getElementById("weather-desc").textContent = weather.weather || "-";
    document.getElementById("temp-max").textContent = weather.temp_max != null ? `${weather.temp_max}℃` : "-";
    document.getElementById("temp-min").textContent = weather.temp_min != null ? `${weather.temp_min}℃` : "-";
    document.getElementById("pressure").textContent = weather.press_max != null ? `${weather.press_max} hPa` : "-";
  } catch (e) {}

  // Routine Status
  try {
    const rRes = await fetch("/api/routine/status");
    const rData = await rRes.json();
    const list = document.getElementById("routine-steps-list");
    list.innerHTML = "";

    rData.steps.forEach(s => {
      const item = document.createElement("div");
      item.className = "flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800";
      
      let badge = `<span class="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">Pending</span>`;
      if (s.status === "running") badge = `<span class="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[10px] font-bold animate-pulse">Running</span>`;
      if (s.status === "done") badge = `<span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">Done</span>`;
      if (s.status === "error") badge = `<span class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">Error</span>`;

      item.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="font-mono text-slate-500">${s.id + 1}.</span>
          <span class="text-slate-200">${s.name}</span>
        </div>
        ${badge}
      `;
      list.appendChild(item);
    });
  } catch (e) {}
}

async function triggerRoutineStart() {
  try {
    await fetch("/api/routine/start");
    loadRoutineData();
  } catch (e) {
    alert("ルーティン開始に失敗しました");
  }
}
