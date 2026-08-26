const { createApp, ref, computed, reactive, onMounted, nextTick, watch } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

function toast(msg, type = "success") {
  ElementPlus.ElMessage({ message: msg, type, duration: 1800 });
}
function fail(e) {
  toast(e.message || String(e), "error");
}
function nameOf(id, list, key = "name") {
  const x = list.find((i) => i.id === id);
  return x ? x[key] : id;
}

const UserLayout = {
  template: `
  <div class="u-shell">
    <header class="u-header">
      <div class="u-logo"><span class="mark">水</span>智慧水利管理系统</div>
      <nav class="u-nav">
        <router-link to="/u/home">首页</router-link>
        <router-link to="/u/attend">我的考勤</router-link>
        <router-link to="/u/leave">请假申请</router-link>
        <router-link to="/u/tasks">我的任务</router-link>
        <router-link to="/u/report">测报上报</router-link>
        <router-link to="/u/equip">仪器借用</router-link>
      </nav>
      <div class="u-user">
        <router-link to="/u/profile" class="u-user" style="text-decoration:none">
          <span class="u-avatar">{{ (me.name||'巡')[0] }}</span>
          <span>{{ me.name }}</span>
        </router-link>
        <el-button text size="small" @click="out">退出</el-button>
      </div>
    </header>
    <main class="u-main"><router-view /></main>
  </div>`,
  setup() {
    const me = computed(() => SW.auth.current() || {});
    const out = () => { SW.auth.logout(); location.hash = "#/login"; };
    return { me, out };
  },
};

const AdminLayout = {
  template: `
  <div class="a-shell">
    <aside class="a-side">
      <div class="brand"><span class="mark" style="width:28px;height:28px;border-radius:8px;background:#1ec9b0;display:grid;place-items:center;color:#08332e">管</span>水利后台</div>
      <router-link to="/a/dashboard">首页看板</router-link>
      <router-link to="/a/users">用户管理</router-link>
      <router-link to="/a/stations">测站管理</router-link>
      <router-link to="/a/tasks">水事任务</router-link>
      <router-link to="/a/reports">测报管理</router-link>
      <router-link to="/a/attend">考勤管理</router-link>
      <router-link to="/a/leave">请假审核</router-link>
      <router-link to="/a/equip">仪器管理</router-link>
      <router-link to="/a/borrow">借用审核</router-link>
      <router-link to="/a/stock">防汛物资</router-link>
      <router-link to="/a/inout">出入库记录</router-link>
      <router-link to="/a/banners">轮播图管理</router-link>
      <router-link to="/a/logs">操作日志</router-link>
      <router-link to="/a/profile">个人信息</router-link>
    </aside>
    <div>
      <div class="a-top">
        <span style="color:#909399;font-size:13px">SpringBoot + Vue 演示 · 数据保存在本机</span>
        <div class="u-user">
          <span class="u-avatar">{{ (me.name||'管')[0] }}</span>{{ me.name }}
          <el-button text size="small" @click="out">退出</el-button>
        </div>
      </div>
      <div class="a-body"><router-view /></div>
    </div>
  </div>`,
  setup() {
    const me = computed(() => SW.auth.current() || {});
    const out = () => { SW.auth.logout(); location.hash = "#/login"; };
    return { me, out };
  },
};

const Login = {
  template: `
  <div class="login-page">
    <div class="login-card">
      <div class="login-brand"><span class="mark">水</span><div><b>智慧水利管理系统</b><div style="font-size:12px;color:#909399">巡测协同 · 测报闭环</div></div></div>
      <h1>{{ tab==='login' ? '登录' : '注册巡测账号' }}</h1>
      <p class="hint">前后端分离架构演示：角色权限分流。在线版用浏览器存储；完整版对接 SpringBoot + MySQL。</p>
      <el-form label-position="top">
        <el-form-item label="用户名"><el-input v-model="form.username" placeholder="账号" /></el-form-item>
        <el-form-item v-if="tab==='reg'" label="姓名"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="密码"><el-input v-model="form.password" type="password" show-password /></el-form-item>
        <el-button type="primary" style="width:100%;background:#0f9d8a;border:0" @click="go">{{ tab==='login'?'进入系统':'立即注册' }}</el-button>
        <el-button text style="width:100%;margin-left:0;margin-top:6px" @click="tab = tab==='login'?'reg':'login'">
          {{ tab==='login' ? '没有账号？注册巡测员' : '已有账号，去登录' }}
        </el-button>
      </el-form>
      <div class="demo-acc">
        演示账号<br/>
        巡测员 <b>lintao / 123456</b>（前台）<br/>
        管理员 <b>admin / admin123</b>（后台）
      </div>
    </div>
  </div>`,
  setup() {
    const tab = ref("login");
    const form = reactive({ username: "lintao", password: "123456", name: "" });
    const go = () => {
      try {
        if (tab.value === "reg") {
          SW.auth.register(form);
          toast("注册成功，请登录");
          tab.value = "login";
          return;
        }
        const s = SW.auth.login(form.username, form.password);
        location.hash = s.role === "admin" ? "#/a/dashboard" : "#/u/home";
      } catch (e) { fail(e); }
    };
    return { tab, form, go };
  },
};

const UHome = {
  template: `
  <div>
    <div class="hero">
      <svg class="hero-art" viewBox="0 0 1200 260" preserveAspectRatio="xMidYMax slice" aria-hidden>
        <path fill="rgba(255,255,255,.12)" d="M0 180 Q 150 140 300 170 T 600 165 T 900 155 T 1200 180 V260 H0Z"/>
        <path fill="rgba(10,70,90,.18)" d="M720 120 l80 100 h-160z"/>
        <rect x="760" y="150" width="18" height="70" fill="rgba(255,255,255,.35)"/>
      </svg>
      <h2>{{ banners[bi] ? banners[bi].title : '智慧水利管理系统' }}</h2>
      <p>{{ banners[bi] ? banners[bi].subtitle : '水情可视 · 规范测报 · 一站式巡测协同' }}</p>
      <div class="hero-btns">
        <span>数据可视</span><span>规范测报</span><span>多端协同</span>
      </div>
      <div class="hero-dots"><i :class="{on:bi===0}"></i><i :class="{on:bi===1}"></i></div>
    </div>
    <div class="section-title">快捷入口</div>
    <div class="quick-grid">
      <router-link v-for="q in quick" :key="q.to" class="quick-card" :to="q.to">
        <div class="quick-ico" :style="{background:q.color}">{{ q.ico }}</div>
        <b>{{ q.title }}</b><small>{{ q.sub }}</small>
      </router-link>
    </div>
    <div class="section-title">重点测站 <router-link class="more" to="/u/report">查看全部 ›</router-link></div>
    <div class="station-grid">
      <article v-for="s in stations" :key="s.id" class="st-card">
        <div class="st-cover" :class="s.cover"></div>
        <div class="st-body">
          <h3>💧 {{ s.name }}</h3>
          <div class="st-meta">类型：{{ s.type }}<br/>水位 {{ s.level }} m · 流量 {{ s.flow }} m³/s</div>
          <div class="st-note">{{ s.note }}</div>
          <el-button type="primary" size="small" @click="$router.push('/u/report')">前往测报上报</el-button>
        </div>
      </article>
    </div>
  </div>`,
  setup() {
    const stations = ref(SW.stations.list());
    const banners = ref(SW.banners.list());
    const bi = ref(0);
    const quick = [
      { to: "/u/attend", title: "我的考勤", sub: "上下班打卡与记录查询", ico: "⏱", color: "#5b8ff9" },
      { to: "/u/leave", title: "请假申请", sub: "在线提交与进度查看", ico: "📅", color: "#61ddaa" },
      { to: "/u/tasks", title: "我的任务", sub: "任务执行与现场反馈", ico: "📋", color: "#f6bd16" },
      { to: "/u/report", title: "测报上报", sub: "水位流量水质登记", ico: "📈", color: "#78d3f8" },
      { to: "/u/equip", title: "仪器借用", sub: "测验仪器申请与归还", ico: "⚙", color: "#9270ca" },
      { to: "/u/profile", title: "个人中心", sub: "维护个人资料", ico: "👤", color: "#909399" },
    ];
    onMounted(() => {
      setInterval(() => { bi.value = (bi.value + 1) % Math.max(banners.value.length, 1); }, 5000);
    });
    return { stations, banners, bi, quick };
  },
};

function monthCells(ym) {
  const [y, m] = ym.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const start = first.getDay();
  const days = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = 0; i < start; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(`${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}

const UAttend = {
  template: `
  <div>
    <div class="card">
      <h3>快捷打卡</h3>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
        <el-button type="primary" size="large" @click="punch('in')">上班打卡</el-button>
        <el-button type="success" size="large" @click="punch('out')">下班打卡</el-button>
        <span style="color:#909399">当前考勤时间：上班 {{ cfg.workIn }} / 下班 {{ cfg.workOut }}</span>
      </div>
    </div>
    <div class="card">
      <h3>本月概览</h3>
      <div class="stat-row">
        <div class="stat"><div class="n">{{ ov.total }}</div><div class="l">总打卡</div></div>
        <div class="stat"><div class="n">{{ ov.days }}</div><div class="l">出勤天数</div></div>
        <div class="stat"><div class="n" style="color:#67c23a">{{ ov.ok }}</div><div class="l">正常</div></div>
        <div class="stat"><div class="n" style="color:#f56c6c">{{ ov.bad }}</div><div class="l">异常</div></div>
        <div class="stat"><div class="n" style="color:#e6a23c">{{ ov.late }}</div><div class="l">迟到</div></div>
        <div class="stat"><div class="n" style="color:#e6a23c">{{ ov.early }}</div><div class="l">早退</div></div>
      </div>
    </div>
    <div class="card">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:10px">
        <h3 style="margin:0">考勤日历</h3>
        <div style="display:flex;gap:8px;align-items:center">
          <el-button size="small" @click="shift(-1)">上一月</el-button>
          <b>{{ month }}</b>
          <el-button size="small" @click="month = todayM">本月</el-button>
          <el-button size="small" @click="shift(1)">下一月</el-button>
        </div>
      </div>
      <div class="legend" style="margin-bottom:10px">
        <span><i class="dot ok"></i>已完成</span>
        <span><i class="dot wait"></i>待下班</span>
        <span><i class="dot bad"></i>迟到/早退</span>
        <span><i class="dot none"></i>未打卡</span>
        <span><i class="dot leave"></i>请假</span>
      </div>
      <table class="cal">
        <thead><tr><th>日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th></tr></thead>
        <tbody>
          <tr v-for="(row,ri) in rows" :key="ri">
            <td v-for="(c,ci) in row" :key="ci">
              <template v-if="c">
                <div class="d">{{ Number(c.slice(8)) }}</div>
                <div v-if="map[c]" :class="'tag '+map[c].cls">{{ map[c].label }}</div>
                <div v-if="map[c] && map[c].in" style="color:#909399">上 {{ map[c].in }}</div>
                <div v-if="map[c] && map[c].out" style="color:#909399">下 {{ map[c].out }}</div>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="card">
      <h3>当月打卡明细</h3>
      <el-table :data="rowsList" stripe>
        <el-table-column label="打卡类型" width="110">
          <template #default="{row}">{{ row.type==='in'?'上班':'下班' }}</template>
        </el-table-column>
        <el-table-column prop="time" label="打卡时间" />
        <el-table-column prop="place" label="地点" width="140" />
        <el-table-column label="状态" width="100">
          <template #default="{row}"><span :style="{color: row.status==='正常'?'#67c23a':'#f56c6c'}">{{ row.status }}</span></template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" />
      </el-table>
    </div>
  </div>`,
  setup() {
    const me = SW.auth.current();
    const cfg = ref(SW.attendance.config());
    const todayM = new Date().toISOString().slice(0, 7);
    const month = ref(todayM);
    const list = ref([]);
    const leaves = ref([]);
    const load = () => {
      list.value = SW.attendance.list(me.id, month.value);
      leaves.value = SW.leaves.mine();
    };
    load();
    const ov = computed(() => {
      const a = list.value;
      const days = new Set(a.map((x) => x.time.slice(0, 10))).size;
      return {
        total: a.length,
        days,
        ok: a.filter((x) => x.status === "正常").length,
        bad: a.filter((x) => x.status === "异常").length,
        late: a.filter((x) => x.remark === "迟到").length,
        early: a.filter((x) => x.remark === "早退").length,
      };
    });
    const map = computed(() => {
      const m = {};
      list.value.forEach((r) => {
        const d = r.time.slice(0, 10);
        m[d] = m[d] || { in: "", out: "", label: "未打卡", cls: "tag-wait" };
        const hm = r.time.slice(11, 16);
        if (r.type === "in") m[d].in = hm;
        else m[d].out = hm;
      });
      Object.keys(m).forEach((d) => {
        const x = m[d];
        const recs = list.value.filter((r) => r.time.startsWith(d));
        const bad = recs.some((r) => r.status === "异常");
        if (x.in && x.out) { x.label = bad ? (recs.find((r)=>r.remark==='迟到')?'迟到':'早退') : "已完成"; x.cls = bad ? "tag-bad" : "tag-ok"; }
        else if (x.in) { x.label = "待下班"; x.cls = "tag-wait"; }
      });
      leaves.value.filter((l) => l.status === "approved" || l.status === "pending").forEach((l) => {
        if (l.start.slice(0, 7) === month.value) {
          m[l.start] = m[l.start] || {};
          m[l.start].label = l.status === "approved" ? "请假通过" : "请假待审";
          m[l.start].cls = "tag-leave";
        }
      });
      return m;
    });
    const rows = computed(() => {
      const cells = monthCells(month.value);
      const out = [];
      for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
      return out;
    });
    const rowsList = computed(() => list.value);
    const punch = (type) => {
      try { SW.attendance.clock(type); toast("打卡成功"); load(); }
      catch (e) { fail(e); }
    };
    const shift = (n) => {
      const [y, m] = month.value.split("-").map(Number);
      const d = new Date(y, m - 1 + n, 1);
      month.value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    };
    watch(month, load);
    return { cfg, month, todayM, ov, map, rows, rowsList, punch, shift };
  },
};

const ULeave = {
  template: `
  <div class="card">
    <div class="toolbar"><h3 style="margin:0" class="grow">请假申请</h3>
      <el-button type="primary" @click="open=true">在线提交</el-button></div>
    <el-table :data="list">
      <el-table-column prop="type" label="类型" width="100"/>
      <el-table-column label="起止"><template #default="{row}">{{ row.start }} ~ {{ row.end }}</template></el-table-column>
      <el-table-column prop="reason" label="事由"/>
      <el-table-column label="进度" width="120">
        <template #default="{row}">
          <el-tag :type="row.status==='approved'?'success':row.status==='rejected'?'danger':'warning'" size="small">
            {{ {pending:'待审核',approved:'已通过',rejected:'已驳回'}[row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="reply" label="批复"/>
    </el-table>
    <el-dialog v-model="open" title="提交请假" width="480px">
      <el-form label-width="80px">
        <el-form-item label="类型"><el-select v-model="form.type"><el-option label="事假" value="事假"/><el-option label="病假" value="病假"/><el-option label="调休" value="调休"/></el-select></el-form-item>
        <el-form-item label="开始"><el-input v-model="form.start" placeholder="YYYY-MM-DD"/></el-form-item>
        <el-form-item label="结束"><el-input v-model="form.end" placeholder="YYYY-MM-DD"/></el-form-item>
        <el-form-item label="事由"><el-input v-model="form.reason" type="textarea"/></el-form-item>
      </el-form>
      <template #footer><el-button @click="open=false">取消</el-button><el-button type="primary" @click="save">提交</el-button></template>
    </el-dialog>
  </div>`,
  setup() {
    const list = ref(SW.leaves.mine());
    const open = ref(false);
    const form = reactive({ type: "事假", start: "", end: "", reason: "" });
    const save = () => {
      try { SW.leaves.create(form); toast("已提交"); open.value=false; list.value=SW.leaves.mine(); }
      catch(e){ fail(e); }
    };
    return { list, open, form, save };
  },
};

const UTasks = {
  template: `
  <div class="card">
    <h3>我的任务</h3>
    <el-table :data="list">
      <el-table-column prop="title" label="任务"/>
      <el-table-column prop="priority" label="优先级" width="90"/>
      <el-table-column label="进度" width="180">
        <template #default="{row}"><el-progress :percentage="row.progress"/></template>
      </el-table-column>
      <el-table-column prop="deadline" label="截止" width="120"/>
      <el-table-column prop="status" label="状态" width="100"/>
      <el-table-column label="操作" width="120">
        <template #default="{row}"><el-button size="small" @click="edit(row)">反馈</el-button></template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="open" title="执行反馈" width="520px">
      <p style="color:#606266">{{ cur.content }}</p>
      <el-form label-width="80px">
        <el-form-item label="进度"><el-slider v-model="cur.progress"/></el-form-item>
        <el-form-item label="反馈"><el-input v-model="cur.feedback" type="textarea"/></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" @click="save">更新进度</el-button></template>
    </el-dialog>
  </div>`,
  setup() {
    const list = ref(SW.tasks.mine());
    const open = ref(false);
    const cur = reactive({ id: "", content: "", progress: 0, feedback: "" });
    const edit = (row) => { Object.assign(cur, row); open.value = true; };
    const save = () => {
      SW.tasks.updateMine(cur.id, { progress: cur.progress, feedback: cur.feedback });
      toast("已更新"); open.value=false; list.value=SW.tasks.mine();
    };
    return { list, open, cur, edit, save };
  },
};

const UReport = {
  template: `
  <div class="card">
    <div class="toolbar">
      <h3 style="margin:0" class="grow">测报上报</h3>
      <el-input v-model="q" placeholder="搜索测站" style="width:200px" clearable/>
      <el-button type="primary" @click="openNew">登记测报</el-button>
    </div>
    <el-table :data="filtered">
      <el-table-column prop="createdAt" label="时间" width="170"/>
      <el-table-column label="测站"><template #default="{row}">{{ stName(row.stationId) }}</template></el-table-column>
      <el-table-column prop="kind" label="要素" width="90"/>
      <el-table-column label="数值"><template #default="{row}">{{ row.value }} {{ row.unit }}</template></el-table-column>
      <el-table-column prop="remark" label="备注"/>
      <el-table-column label="操作" width="160">
        <template #default="{row}">
          <el-button size="small" @click="edit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="del(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="open" :title="form.id?'编辑测报':'登记测报'" width="520px">
      <el-form label-width="90px">
        <el-form-item label="测站">
          <el-select v-model="form.stationId" filterable>
            <el-option v-for="s in stations" :key="s.id" :label="s.name" :value="s.id"/>
          </el-select>
        </el-form-item>
        <el-form-item label="要素">
          <el-select v-model="form.kind" @change="unitOf">
            <el-option label="水位" value="水位"/><el-option label="流量" value="流量"/>
            <el-option label="降水" value="降水"/><el-option label="水质" value="水质"/>
          </el-select>
        </el-form-item>
        <el-form-item label="数值"><el-input v-model="form.value"/><span style="margin-left:8px;color:#909399">{{ form.unit }}</span></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea"/></el-form-item>
        <el-form-item label="现场照片"><input type="file" accept="image/*" @change="onFile"/></el-form-item>
        <img v-if="form.image" :src="form.image" alt="" style="max-height:120px;border-radius:8px"/>
      </el-form>
      <template #footer><el-button @click="open=false">取消</el-button><el-button type="primary" @click="save">保存</el-button></template>
    </el-dialog>
  </div>`,
  setup() {
    const stations = ref(SW.stations.list());
    const list = ref(SW.reports.mine());
    const q = ref("");
    const open = ref(false);
    const form = reactive({ id: "", stationId: "", kind: "水位", value: "", unit: "m", remark: "", image: "" });
    const stName = (id) => nameOf(id, stations.value);
    const filtered = computed(() => list.value.filter((r) => !q.value || stName(r.stationId).includes(q.value)));
    const unitOf = () => {
      form.unit = { 水位: "m", 流量: "m³/s", 降水: "mm", 水质: "—" }[form.kind] || "";
    };
    const openNew = () => { Object.assign(form, { id: "", stationId: stations.value[0]?.id, kind: "水位", value: "", unit: "m", remark: "", image: "" }); open.value = true; };
    const edit = (row) => { Object.assign(form, row); open.value = true; };
    const save = () => { try { SW.reports.save({ ...form }); toast("已保存"); open.value=false; list.value=SW.reports.mine(); } catch(e){ fail(e);} };
    const del = (row) => { SW.reports.remove(row.id); list.value=SW.reports.mine(); toast("已删除"); };
    const onFile = (e) => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader(); r.onload = () => { form.image = r.result; }; r.readAsDataURL(f);
    };
    return { stations, list, q, open, form, filtered, stName, openNew, edit, save, del, onFile, unitOf };
  },
};

const UEquip = {
  template: `
  <div>
    <div class="card">
      <div class="toolbar"><h3 style="margin:0" class="grow">可借仪器</h3>
        <el-input v-model="q" placeholder="搜索仪器" style="width:200px" clearable/></div>
      <div class="station-grid">
        <article v-for="e in filtered" :key="e.id" class="st-card">
          <div class="st-cover" :class="e.id==='eq1'?'river':e.id==='eq2'?'creek':'rain'"></div>
          <div class="st-body">
            <h3>{{ e.name }}</h3>
            <div class="st-meta">规格：{{ e.spec }}<br/>库存 {{ e.stock }} · {{ e.status }}</div>
            <div class="st-note">{{ e.note }}</div>
            <el-button type="primary" size="small" @click="apply(e)">在线申请</el-button>
          </div>
        </article>
      </div>
    </div>
    <div class="card">
      <h3>我的借用</h3>
      <el-table :data="mine">
        <el-table-column label="仪器"><template #default="{row}">{{ eqName(row.equipmentId) }}</template></el-table-column>
        <el-table-column prop="qty" label="数量" width="80"/>
        <el-table-column prop="reason" label="事由"/>
        <el-table-column prop="status" label="状态" width="100"/>
        <el-table-column label="操作" width="120">
          <template #default="{row}"><el-button v-if="row.status==='approved'" size="small" @click="back(row)">归还</el-button></template>
        </el-table-column>
      </el-table>
    </div>
    <el-dialog v-model="open" title="借用申请" width="460px">
      <el-form label-width="80px">
        <el-form-item label="仪器">{{ cur.name }}</el-form-item>
        <el-form-item label="数量"><el-input-number v-model="cur.qty" :min="1"/></el-form-item>
        <el-form-item label="事由"><el-input v-model="cur.reason" type="textarea"/></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" @click="save">提交</el-button></template>
    </el-dialog>
  </div>`,
  setup() {
    const list = ref(SW.equipment.list());
    const mine = ref(SW.borrows.mine());
    const q = ref("");
    const open = ref(false);
    const cur = reactive({ equipmentId: "", name: "", qty: 1, reason: "" });
    const filtered = computed(() => list.value.filter((e) => e.name.includes(q.value)));
    const eqName = (id) => nameOf(id, list.value);
    const apply = (e) => { Object.assign(cur, { equipmentId: e.id, name: e.name, qty: 1, reason: "" }); open.value = true; };
    const save = () => { SW.borrows.apply(cur); toast("已提交审核"); open.value=false; mine.value=SW.borrows.mine(); };
    const back = (row) => { try { SW.borrows.giveBack(row.id); toast("已归还"); mine.value=SW.borrows.mine(); list.value=SW.equipment.list(); } catch(e){ fail(e);} };
    return { list, mine, q, open, cur, filtered, eqName, apply, save, back };
  },
};

const UProfile = {
  template: `
  <div class="card" style="max-width:560px">
    <h3>个人中心</h3>
    <el-form label-width="90px">
      <el-form-item label="姓名"><el-input v-model="form.name"/></el-form-item>
      <el-form-item label="部门"><el-input v-model="form.dept"/></el-form-item>
      <el-form-item label="电话"><el-input v-model="form.phone"/></el-form-item>
      <el-button type="primary" @click="saveP">保存资料</el-button>
    </el-form>
    <el-divider/>
    <el-form label-width="90px">
      <el-form-item label="原密码"><el-input v-model="pw.oldP" type="password"/></el-form-item>
      <el-form-item label="新密码"><el-input v-model="pw.newP" type="password"/></el-form-item>
      <el-button @click="savePw">修改密码</el-button>
    </el-form>
  </div>`,
  setup() {
    const s = SW.auth.current() || {};
    const form = reactive({ name: s.name, dept: s.dept, phone: s.phone });
    const pw = reactive({ oldP: "", newP: "" });
    const saveP = () => { SW.auth.updateProfile(form); toast("已保存"); };
    const savePw = () => { try { SW.auth.changePassword(pw.oldP, pw.newP); toast("密码已改"); } catch(e){ fail(e);} };
    return { form, pw, saveP, savePw };
  },
};

const ADash = {
  template: `
  <div>
    <div class="kpi-grid">
      <div class="kpi"><div class="n">{{ k.stations }}</div><div class="l">测站</div></div>
      <div class="kpi"><div class="n">{{ k.users }}</div><div class="l">用户</div></div>
      <div class="kpi"><div class="n">{{ k.tasks }}</div><div class="l">进行中任务</div></div>
      <div class="kpi"><div class="n">{{ k.pending }}</div><div class="l">待审事项</div></div>
    </div>
    <div class="card"><h3>测站水位</h3><div ref="c1" class="chart-box"></div></div>
    <div class="card"><h3>本月测报要素</h3><div ref="c2" class="chart-box"></div></div>
  </div>`,
  setup() {
    const c1 = ref(null); const c2 = ref(null);
    const db = SW.snapshot();
    const k = {
      stations: db.stations.length,
      users: db.users.length,
      tasks: db.tasks.filter((t) => t.status !== "已完成").length,
      pending: db.leaves.filter((l) => l.status === "pending").length + db.borrows.filter((b) => b.status === "pending").length,
    };
    onMounted(() => {
      nextTick(() => {
        if (!window.echarts || !c1.value) return;
        const a = echarts.init(c1.value);
        a.setOption({
          tooltip: {},
          xAxis: { type: "category", data: db.stations.map((s) => s.name) },
          yAxis: { type: "value", name: "m" },
          series: [{ type: "bar", data: db.stations.map((s) => s.level), itemStyle: { color: "#0f9d8a" } }],
        });
        const b = echarts.init(c2.value);
        const kinds = ["水位", "流量", "降水", "水质"];
        b.setOption({
          tooltip: { trigger: "item" },
          series: [{ type: "pie", radius: ["40%", "68%"], data: kinds.map((k) => ({ name: k, value: db.reports.filter((r) => r.kind === k).length })) }],
        });
      });
    });
    return { k, c1, c2 };
  },
};

const AUsers = {
  template: `
  <div class="card">
    <div class="toolbar"><h3 class="grow" style="margin:0">用户管理</h3>
      <el-button type="primary" @click="edit({})">新增</el-button></div>
    <el-table :data="list">
      <el-table-column prop="username" label="账号"/>
      <el-table-column prop="name" label="姓名"/>
      <el-table-column prop="role" label="角色"/>
      <el-table-column prop="dept" label="部门"/>
      <el-table-column prop="phone" label="电话"/>
      <el-table-column label="操作" width="160">
        <template #default="{row}">
          <el-button size="small" @click="edit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="del(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="open" title="用户" width="460px">
      <el-form label-width="80px">
        <el-form-item label="账号"><el-input v-model="form.username"/></el-form-item>
        <el-form-item label="姓名"><el-input v-model="form.name"/></el-form-item>
        <el-form-item label="角色"><el-select v-model="form.role"><el-option label="巡测员" value="user"/><el-option label="管理员" value="admin"/></el-select></el-form-item>
        <el-form-item label="部门"><el-input v-model="form.dept"/></el-form-item>
        <el-form-item label="电话"><el-input v-model="form.phone"/></el-form-item>
        <el-form-item label="密码"><el-input v-model="form.password" placeholder="留空则不改"/></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" @click="save">保存</el-button></template>
    </el-dialog>
  </div>`,
  setup() {
    const list = ref([]);
    const load = () => { list.value = SW.users.list(); };
    load();
    const open = ref(false);
    const form = reactive({});
    const edit = (row) => { Object.assign(form, { role: "user", password: "" }, row); open.value = true; };
    const save = () => { SW.users.save({ ...form }); open.value=false; load(); toast("已保存"); };
    const del = (row) => { try { SW.users.remove(row.id); load(); } catch(e){ fail(e);} };
    return { list, open, form, edit, save, del };
  },
};

const AStations = {
  template: `
  <div class="card">
    <div class="toolbar"><h3 class="grow" style="margin:0">测站管理</h3><el-button type="primary" @click="edit({})">新增测站</el-button></div>
    <el-table :data="list">
      <el-table-column prop="name" label="名称"/>
      <el-table-column prop="type" label="类型"/>
      <el-table-column prop="basin" label="流域"/>
      <el-table-column prop="level" label="水位 m"/>
      <el-table-column prop="flow" label="流量"/>
      <el-table-column prop="status" label="状态"/>
      <el-table-column label="操作" width="160">
        <template #default="{row}"><el-button size="small" @click="edit(row)">编辑</el-button>
        <el-button size="small" type="danger" @click="SW.stations.remove(row.id);load()">删</el-button></template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="open" title="测站" width="480px">
      <el-form label-width="80px">
        <el-form-item label="名称"><el-input v-model="form.name"/></el-form-item>
        <el-form-item label="类型"><el-input v-model="form.type"/></el-form-item>
        <el-form-item label="流域"><el-input v-model="form.basin"/></el-form-item>
        <el-form-item label="水位"><el-input v-model="form.level"/></el-form-item>
        <el-form-item label="流量"><el-input v-model="form.flow"/></el-form-item>
        <el-form-item label="状态"><el-input v-model="form.status"/></el-form-item>
        <el-form-item label="说明"><el-input v-model="form.note"/></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" @click="save">保存</el-button></template>
    </el-dialog>
  </div>`,
  setup() {
    const list = ref([]); const load = () => list.value = SW.stations.list(); load();
    const open = ref(false); const form = reactive({ cover: "river", cycle: "逐时" });
    const edit = (row) => { Object.assign(form, { cover: "river", cycle: "逐时" }, row); open.value = true; };
    const save = () => { SW.stations.save({ ...form, level: Number(form.level), flow: Number(form.flow) }); open.value=false; load(); toast("已保存"); };
    return { list, open, form, edit, save, load, SW };
  },
};

const ATasks = {
  template: `
  <div class="card">
    <div class="toolbar"><h3 class="grow" style="margin:0">水事任务 / 分配</h3><el-button type="primary" @click="edit({})">新建任务</el-button></div>
    <el-table :data="list">
      <el-table-column prop="title" label="任务"/>
      <el-table-column label="执行人"><template #default="{row}">{{ uname(row.assigneeId) }}</template></el-table-column>
      <el-table-column prop="priority" label="优先级" width="90"/>
      <el-table-column prop="progress" label="进度" width="90"/>
      <el-table-column prop="deadline" label="截止"/>
      <el-table-column label="操作" width="160">
        <template #default="{row}"><el-button size="small" @click="edit(row)">编辑</el-button>
        <el-button size="small" type="danger" @click="SW.tasks.remove(row.id);load()">删</el-button></template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="open" title="任务" width="520px">
      <el-form label-width="90px">
        <el-form-item label="标题"><el-input v-model="form.title"/></el-form-item>
        <el-form-item label="测站"><el-select v-model="form.stationId"><el-option v-for="s in stations" :key="s.id" :label="s.name" :value="s.id"/></el-select></el-form-item>
        <el-form-item label="执行人"><el-select v-model="form.assigneeId"><el-option v-for="u in users" :key="u.id" :label="u.name" :value="u.id"/></el-select></el-form-item>
        <el-form-item label="优先级"><el-select v-model="form.priority"><el-option label="高" value="高"/><el-option label="中" value="中"/><el-option label="低" value="低"/></el-select></el-form-item>
        <el-form-item label="截止"><el-input v-model="form.deadline" placeholder="YYYY-MM-DD"/></el-form-item>
        <el-form-item label="内容"><el-input v-model="form.content" type="textarea"/></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" @click="save">保存</el-button></template>
    </el-dialog>
  </div>`,
  setup() {
    const list = ref([]); const users = ref([]); const stations = ref(SW.stations.list());
    const load = () => { list.value = SW.tasks.all(); users.value = SW.users.list(); };
    load();
    const open = ref(false); const form = reactive({ priority: "中", status: "待接收", progress: 0 });
    const uname = (id) => nameOf(id, users.value);
    const edit = (row) => { Object.assign(form, { priority: "中", status: "待接收", progress: 0 }, row); open.value = true; };
    const save = () => { SW.tasks.save({ ...form }); open.value=false; load(); toast("已保存"); };
    return { list, users, stations, open, form, uname, edit, save, load, SW };
  },
};

const AReports = {
  template: `
  <div class="card"><h3>测报上报管理</h3>
    <el-table :data="list">
      <el-table-column prop="createdAt" label="时间"/>
      <el-table-column label="测站"><template #default="{row}">{{ st(row.stationId) }}</template></el-table-column>
      <el-table-column prop="kind" label="要素"/>
      <el-table-column prop="value" label="数值"/>
      <el-table-column prop="remark" label="备注"/>
      <el-table-column label="操作" width="90"><template #default="{row}"><el-button size="small" type="danger" @click="SW.reports.remove(row.id);load()">删</el-button></template>
    </el-table>
  </div>`,
  setup() {
    const stations = SW.stations.list();
    const list = ref([]); const load = () => list.value = SW.reports.all(); load();
    return { list, load, st: (id) => nameOf(id, stations), SW };
  },
};

const AAttend = {
  template: `
  <div>
    <div class="card">
      <h3>考勤时间配置</h3>
      <el-form inline>
        <el-form-item label="上班"><el-input v-model="cfg.workIn" style="width:120px"/></el-form-item>
        <el-form-item label="下班"><el-input v-model="cfg.workOut" style="width:120px"/></el-form-item>
        <el-button type="primary" @click="SW.attendance.setConfig(cfg);toast('已保存')">保存</el-button>
      </el-form>
    </div>
    <div class="card"><h3>打卡记录</h3>
      <el-table :data="list">
        <el-table-column prop="time" label="时间"/>
        <el-table-column prop="place" label="地点"/>
        <el-table-column prop="type" label="类型"/>
        <el-table-column prop="status" label="状态"/>
        <el-table-column prop="remark" label="备注"/>
      </el-table>
    </div>
  </div>`,
  setup() {
    const cfg = reactive({ ...SW.attendance.config() });
    const list = ref(SW.attendance.all());
    return { cfg, list, SW, toast };
  },
};

const ALeave = {
  template: `
  <div class="card"><h3>请假审核</h3>
    <el-table :data="list">
      <el-table-column label="申请人"><template #default="{row}">{{ uname(row.userId) }}</template></el-table-column>
      <el-table-column prop="type" label="类型"/>
      <el-table-column label="区间"><template #default="{row}">{{ row.start }}~{{ row.end }}</template></el-table-column>
      <el-table-column prop="reason" label="事由"/>
      <el-table-column prop="status" label="状态"/>
      <el-table-column width="180">
        <template #default="{row}" v-if="row.status==='pending'">
          <el-button size="small" type="success" @click="ok(row,'approved')">通过</el-button>
          <el-button size="small" type="danger" @click="ok(row,'rejected')">驳回</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>`,
  setup() {
    const users = SW.users.list();
    const list = ref(SW.leaves.all());
    const uname = (id) => nameOf(id, users);
    const ok = (row, st) => { SW.leaves.audit(row.id, st); list.value = SW.leaves.all(); toast("已处理"); };
    return { list, uname, ok };
  },
};

const AEquip = {
  template: `
  <div class="card">
    <div class="toolbar"><h3 class="grow" style="margin:0">仪器管理</h3><el-button type="primary" @click="edit({})">新增</el-button></div>
    <el-table :data="list">
      <el-table-column prop="name" label="名称"/>
      <el-table-column prop="spec" label="规格"/>
      <el-table-column prop="stock" label="库存"/>
      <el-table-column prop="status" label="状态"/>
      <el-table-column width="150"><template #default="{row}">
        <el-button size="small" @click="edit(row)">编辑</el-button>
        <el-button size="small" type="danger" @click="SW.equipment.remove(row.id);load()">删</el-button>
      </template></el-table-column>
    </el-table>
    <el-dialog v-model="open" title="仪器" width="460px">
      <el-form label-width="80px">
        <el-form-item label="名称"><el-input v-model="form.name"/></el-form-item>
        <el-form-item label="规格"><el-input v-model="form.spec"/></el-form-item>
        <el-form-item label="库存"><el-input v-model="form.stock"/></el-form-item>
        <el-form-item label="状态"><el-input v-model="form.status"/></el-form-item>
        <el-form-item label="说明"><el-input v-model="form.note"/></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" @click="save">保存</el-button></template>
    </el-dialog>
  </div>`,
  setup() {
    const list = ref([]); const load = () => list.value = SW.equipment.list(); load();
    const open = ref(false); const form = reactive({ status: "在库", stock: 1 });
    const edit = (row) => { Object.assign(form, { status: "在库", stock: 1 }, row); open.value = true; };
    const save = () => { SW.equipment.save({ ...form, stock: Number(form.stock) }); open.value=false; load(); toast("已保存"); };
    return { list, open, form, edit, save, load, SW };
  },
};

const ABorrow = {
  template: `
  <div class="card"><h3>仪器借用审核</h3>
    <el-table :data="list">
      <el-table-column label="申请人"><template #default="{row}">{{ uname(row.userId) }}</template></el-table-column>
      <el-table-column label="仪器"><template #default="{row}">{{ ename(row.equipmentId) }}</template></el-table-column>
      <el-table-column prop="qty" label="数量" width="70"/>
      <el-table-column prop="reason" label="事由"/>
      <el-table-column prop="status" label="状态"/>
      <el-table-column width="180">
        <template #default="{row}">
          <template v-if="row.status==='pending'">
            <el-button size="small" type="success" @click="ok(row,'approved')">批准</el-button>
            <el-button size="small" type="danger" @click="ok(row,'rejected')">驳回</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>
  </div>`,
  setup() {
    const users = SW.users.list(); const eqs = SW.equipment.list();
    const list = ref(SW.borrows.all());
    const ok = (row, st) => { SW.borrows.audit(row.id, st, st==="approved"?"同意出库":"驳回"); list.value = SW.borrows.all(); toast("已处理"); };
    return { list, uname: (id) => nameOf(id, users), ename: (id) => nameOf(id, eqs), ok };
  },
};

const AStock = {
  template: `
  <div class="card">
    <div class="toolbar"><h3 class="grow" style="margin:0">防汛物资库存</h3>
      <el-button @click="openS=true">出入库</el-button>
      <el-button type="primary" @click="edit({})">新增物资</el-button></div>
    <el-table :data="list">
      <el-table-column prop="name" label="物资"/>
      <el-table-column prop="spec" label="规格"/>
      <el-table-column prop="stock" label="库存"/>
      <el-table-column prop="unit" label="单位"/>
      <el-table-column prop="warn" label="预警线"/>
      <el-table-column label="预警"><template #default="{row}"><el-tag :type="row.stock<=row.warn?'danger':'success'" size="small">{{ row.stock<=row.warn?'低于预警':'正常' }}</el-tag></template></el-table-column>
    </el-table>
    <el-dialog v-model="open" title="物资" width="420px">
      <el-form label-width="80px">
        <el-form-item label="名称"><el-input v-model="form.name"/></el-form-item>
        <el-form-item label="规格"><el-input v-model="form.spec"/></el-form-item>
        <el-form-item label="库存"><el-input v-model="form.stock"/></el-form-item>
        <el-form-item label="单位"><el-input v-model="form.unit"/></el-form-item>
        <el-form-item label="预警线"><el-input v-model="form.warn"/></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" @click="save">保存</el-button></template>
    </el-dialog>
    <el-dialog v-model="openS" title="出入库" width="420px">
      <el-form label-width="80px">
        <el-form-item label="物资"><el-select v-model="stk.materialId"><el-option v-for="m in list" :key="m.id" :label="m.name" :value="m.id"/></el-select></el-form-item>
        <el-form-item label="类型"><el-select v-model="stk.type"><el-option label="入库" value="in"/><el-option label="出库" value="out"/></el-select></el-form-item>
        <el-form-item label="数量"><el-input v-model="stk.qty"/></el-form-item>
        <el-form-item label="备注"><el-input v-model="stk.note"/></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" @click="doStock">确认</el-button></template>
    </el-dialog>
  </div>`,
  setup() {
    const list = ref([]); const load = () => list.value = SW.materials.list(); load();
    const open = ref(false); const openS = ref(false);
    const form = reactive({ unit: "件", stock: 0, warn: 10 });
    const stk = reactive({ materialId: "", type: "in", qty: 1, note: "" });
    const edit = (row) => { Object.assign(form, row); open.value = true; };
    const save = () => { SW.materials.save({ ...form, stock: Number(form.stock), warn: Number(form.warn) }); open.value=false; load(); };
    const doStock = () => { try { SW.materials.stock({ ...stk, qty: Number(stk.qty) }); openS.value=false; load(); toast("已记账"); } catch(e){ fail(e);} };
    return { list, open, openS, form, stk, edit, save, doStock };
  },
};

const AInout = {
  template: `
  <div class="card"><h3>进销存 / 出入库记录</h3>
    <el-table :data="list">
      <el-table-column prop="createdAt" label="时间"/>
      <el-table-column label="物资"><template #default="{row}">{{ mname(row.materialId) }}</template></el-table-column>
      <el-table-column label="类型"><template #default="{row}">{{ row.type==='in'?'入库':'出库' }}</template></el-table-column>
      <el-table-column prop="qty" label="数量"/>
      <el-table-column prop="note" label="备注"/>
    </el-table>
  </div>`,
  setup() {
    const mats = SW.materials.list();
    return { list: ref(SW.materials.stocks()), mname: (id) => nameOf(id, mats) };
  },
};

const ABanners = {
  template: `
  <div class="card">
    <div class="toolbar"><h3 class="grow" style="margin:0">轮播图管理</h3><el-button type="primary" @click="edit({})">新增</el-button></div>
    <el-table :data="list">
      <el-table-column prop="title" label="标题"/>
      <el-table-column prop="subtitle" label="副标题"/>
      <el-table-column prop="sort" label="排序" width="80"/>
      <el-table-column width="150"><template #default="{row}">
        <el-button size="small" @click="edit(row)">编辑</el-button>
        <el-button size="small" type="danger" @click="SW.banners.remove(row.id);load()">删</el-button>
      </template></el-table-column>
    </el-table>
    <el-dialog v-model="open" title="轮播" width="460px">
      <el-form label-width="80px">
        <el-form-item label="标题"><el-input v-model="form.title"/></el-form-item>
        <el-form-item label="副标题"><el-input v-model="form.subtitle"/></el-form-item>
        <el-form-item label="排序"><el-input v-model="form.sort"/></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" @click="save">保存</el-button></template>
    </el-dialog>
  </div>`,
  setup() {
    const list = ref([]); const load = () => list.value = SW.banners.list(true); load();
    const open = ref(false); const form = reactive({ enabled: true, sort: 1 });
    const edit = (row) => { Object.assign(form, { enabled: true, sort: 1 }, row); open.value = true; };
    const save = () => { SW.banners.save({ ...form, sort: Number(form.sort) }); open.value=false; load(); };
    return { list, open, form, edit, save, load, SW };
  },
};

const ALogs = {
  template: `
  <div class="card"><h3>操作日志</h3>
    <el-table :data="list">
      <el-table-column prop="createdAt" label="时间"/>
      <el-table-column prop="action" label="动作"/>
      <el-table-column prop="detail" label="详情"/>
      <el-table-column prop="userId" label="用户"/>
    </el-table>
  </div>`,
  setup() { return { list: ref(SW.logs.list()) }; },
};

const routes = [
  { path: "/", redirect: "/login" },
  { path: "/login", component: Login },
  {
    path: "/u", component: UserLayout, children: [
      { path: "home", component: UHome },
      { path: "attend", component: UAttend },
      { path: "leave", component: ULeave },
      { path: "tasks", component: UTasks },
      { path: "report", component: UReport },
      { path: "equip", component: UEquip },
      { path: "profile", component: UProfile },
    ],
  },
  {
    path: "/a", component: AdminLayout, children: [
      { path: "dashboard", component: ADash },
      { path: "users", component: AUsers },
      { path: "stations", component: AStations },
      { path: "tasks", component: ATasks },
      { path: "reports", component: AReports },
      { path: "attend", component: AAttend },
      { path: "leave", component: ALeave },
      { path: "equip", component: AEquip },
      { path: "borrow", component: ABorrow },
      { path: "stock", component: AStock },
      { path: "inout", component: AInout },
      { path: "banners", component: ABanners },
      { path: "logs", component: ALogs },
      { path: "profile", component: UProfile },
    ],
  },
];

const router = createRouter({ history: createWebHashHistory(), routes, linkActiveClass: "is-active" });
router.beforeEach((to) => {
  const s = SW.auth.current();
  if (to.path.startsWith("/u") || to.path.startsWith("/a")) {
    if (!s) return "/login";
    if (to.path.startsWith("/a") && s.role !== "admin") return "/u/home";
  }
  if (to.path === "/login" && s) return s.role === "admin" ? "/a/dashboard" : "/u/home";
  return true;
});

createApp({}).use(router).use(ElementPlus).mount("#app");
