/** 智慧水利管理系统 · 浏览器演示数据层（对齐 SpringBoot REST 形态） */
(function (global) {
  const KEY = "smart-water-mgmt:v1";

  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (d) => {
    const x = d instanceof Date ? d : new Date(d);
    return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())} ${pad(x.getHours())}:${pad(x.getMinutes())}:${pad(x.getSeconds())}`;
  };
  const dayKey = (d) => {
    const x = d instanceof Date ? d : new Date(d);
    return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
  };
  const uid = (p) => p + "-" + Math.random().toString(36).slice(2, 9);
  const clone = (v) => JSON.parse(JSON.stringify(v));

  function seed() {
    const users = [
      {
        id: "u-admin",
        username: "admin",
        password: "admin123",
        name: "王调度",
        role: "admin",
        phone: "13900001001",
        dept: "洮河管理局",
        avatar: "",
        createdAt: "2026-03-01 09:00:00",
      },
      {
        id: "u-insp",
        username: "lintao",
        password: "123456",
        name: "李巡测",
        role: "user",
        phone: "13800002002",
        dept: "临洮水文站",
        avatar: "",
        createdAt: "2026-04-12 10:20:00",
      },
      {
        id: "u-insp2",
        username: "weiyuan",
        password: "123456",
        name: "赵测报",
        role: "user",
        phone: "13700003003",
        dept: "渭源水文站",
        avatar: "",
        createdAt: "2026-05-08 08:40:00",
      },
    ];

    const stations = [
      {
        id: "st-lt",
        name: "临洮水文站",
        type: "河道站",
        basin: "洮河",
        cycle: "逐时",
        level: 4.82,
        flow: 128,
        status: "正常",
        note: "控制站 · 可测流",
        cover: "river",
      },
      {
        id: "st-wy",
        name: "渭源水文站",
        type: "降水站",
        basin: "洮河上游",
        cycle: "逐时",
        level: 3.16,
        flow: 41,
        status: "正常",
        note: "山区站 · 暴雨敏感",
        cover: "rain",
      },
      {
        id: "st-kl",
        name: "康乐水文站",
        type: "河道站",
        basin: "洮河支流",
        cycle: "逐时",
        level: 2.74,
        flow: 19,
        status: "关注",
        note: "支流控制",
        cover: "creek",
      },
      {
        id: "st-xk",
        name: "峡口水库",
        type: "水库站",
        basin: "洮河中游",
        cycle: "整点",
        level: 18.6,
        flow: 86,
        status: "正常",
        note: "防洪兴利 · 可泄洪",
        cover: "res",
      },
    ];

    const attendance = [
      { id: "a1", userId: "u-insp", type: "in", time: "2026-08-11 10:15:00", place: "临洮站", status: "异常", remark: "迟到" },
      { id: "a2", userId: "u-insp", type: "out", time: "2026-08-11 18:35:00", place: "临洮站", status: "正常", remark: "正常下班" },
      { id: "a3", userId: "u-insp", type: "in", time: "2026-08-12 09:12:00", place: "临洮站", status: "正常", remark: "正常上班" },
      { id: "a4", userId: "u-insp", type: "out", time: "2026-08-12 18:28:00", place: "临洮站", status: "正常", remark: "正常下班" },
      { id: "a5", userId: "u-insp", type: "in", time: "2026-08-13 09:08:00", place: "康乐断面", status: "正常", remark: "正常上班" },
      { id: "a6", userId: "u-insp", type: "out", time: "2026-08-13 17:40:00", place: "康乐断面", status: "异常", remark: "早退" },
      { id: "a7", userId: "u-insp", type: "in", time: "2026-08-14 09:10:00", place: "临洮站", status: "正常", remark: "正常上班" },
      { id: "a8", userId: "u-insp", type: "out", time: "2026-08-14 18:32:00", place: "临洮站", status: "正常", remark: "正常下班" },
      { id: "a9", userId: "u-insp", type: "in", time: "2026-08-15 09:05:00", place: "临洮站", status: "正常", remark: "正常上班" },
    ];

    const leaves = [
      {
        id: "lv1",
        userId: "u-insp",
        type: "事假",
        start: "2026-08-18",
        end: "2026-08-18",
        reason: "站房设备送检，需随车办理手续",
        status: "pending",
        createdAt: "2026-08-16 11:20:00",
        reply: "",
      },
      {
        id: "lv2",
        userId: "u-insp",
        type: "调休",
        start: "2026-08-08",
        end: "2026-08-08",
        reason: "夜班洪水值班后调休",
        status: "approved",
        createdAt: "2026-08-07 16:00:00",
        reply: "同意",
      },
    ];

    const tasks = [
      {
        id: "tk1",
        title: "临洮站大断面复测",
        stationId: "st-lt",
        assigneeId: "u-insp",
        priority: "高",
        progress: 60,
        status: "进行中",
        deadline: "2026-08-28",
        content: "按规范复测大断面，导出 DAT 并回传室内台。",
        feedback: "已完成左岸 12 个测点，右岸待补测。",
        createdAt: "2026-08-10 09:00:00",
      },
      {
        id: "tk2",
        title: "康乐站水位计校核",
        stationId: "st-kl",
        assigneeId: "u-insp",
        priority: "中",
        progress: 20,
        status: "进行中",
        deadline: "2026-08-30",
        content: "比对水尺与自记水位，填写校核记录。",
        feedback: "",
        createdAt: "2026-08-14 08:30:00",
      },
      {
        id: "tk3",
        title: "峡口水库汛限水位检查",
        stationId: "st-xk",
        assigneeId: "u-insp2",
        priority: "高",
        progress: 100,
        status: "已完成",
        deadline: "2026-08-20",
        content: "核对汛限、可泄流量与闸门状态。",
        feedback: "闸门灵活，水位低于汛限 0.4 m。",
        createdAt: "2026-08-05 09:00:00",
      },
    ];

    const reports = [
      {
        id: "rp1",
        userId: "u-insp",
        stationId: "st-lt",
        kind: "水位",
        value: 4.82,
        unit: "m",
        remark: "08 时人工比测，与自记差 1 cm",
        image: "",
        createdAt: "2026-08-26 08:12:00",
      },
      {
        id: "rp2",
        userId: "u-insp",
        stationId: "st-lt",
        kind: "流量",
        value: 128,
        unit: "m³/s",
        remark: "缆道一点法",
        image: "",
        createdAt: "2026-08-25 10:40:00",
      },
      {
        id: "rp3",
        userId: "u-insp2",
        stationId: "st-wy",
        kind: "降水",
        value: 16.5,
        unit: "mm",
        remark: "局地对流",
        image: "",
        createdAt: "2026-08-24 19:00:00",
      },
    ];

    const equipment = [
      { id: "eq1", name: "ADCP 走航测流仪", spec: "RiverRay", stock: 2, status: "在库", image: "", note: "测流主力装备" },
      { id: "eq2", name: "全站仪", spec: "Leica TS16", stock: 1, status: "在库", image: "", note: "大断面测绘" },
      { id: "eq3", name: "便携式水质仪", spec: "YSI ProDSS", stock: 3, status: "在库", image: "", note: "DO / pH / 电导" },
      { id: "eq4", name: "雷达水位计", spec: "VEGA 备用", stock: 1, status: "维修", image: "", note: "备件" },
    ];

    const borrows = [
      {
        id: "br1",
        userId: "u-insp",
        equipmentId: "eq1",
        qty: 1,
        reason: "临洮站洪水测流",
        status: "approved",
        createdAt: "2026-08-20 09:10:00",
        returnAt: "",
        reply: "同意出库",
      },
      {
        id: "br2",
        userId: "u-insp",
        equipmentId: "eq3",
        qty: 1,
        reason: "康乐断面水质抽检",
        status: "pending",
        createdAt: "2026-08-26 08:40:00",
        returnAt: "",
        reply: "",
      },
    ];

    const materials = [
      { id: "mt1", name: "编织袋", spec: "50kg", stock: 2000, unit: "条", warn: 500 },
      { id: "mt2", name: "铅丝笼", spec: "2×1×1 m", stock: 80, unit: "个", warn: 20 },
      { id: "mt3", name: "救生衣", spec: "成人", stock: 36, unit: "件", warn: 20 },
      { id: "mt4", name: "柴油", spec: "0#", stock: 420, unit: "L", warn: 200 },
    ];

    const stocks = [
      { id: "sk1", materialId: "mt1", type: "in", qty: 500, note: "市局调拨", createdAt: "2026-08-02 14:00:00" },
      { id: "sk2", materialId: "mt3", type: "out", qty: 4, note: "夜班值班配发", createdAt: "2026-08-12 17:20:00" },
    ];

    const banners = [
      { id: "bn1", title: "智慧水利管理系统", subtitle: "水情可视 · 规范测报 · 多端协同", sort: 1, enabled: true },
      { id: "bn2", title: "汛期值班提醒", subtitle: "整点报汛 · 超警即报 · 仪器归还", sort: 2, enabled: true },
    ];

    const logs = [
      { id: "lg1", userId: "u-admin", action: "审核仪器借用", detail: "批准 ADCP 出库", createdAt: "2026-08-20 09:18:00" },
      { id: "lg2", userId: "u-insp", action: "测报上报", detail: "临洮站水位 4.82 m", createdAt: "2026-08-26 08:12:00" },
    ];

    return {
      users,
      stations,
      attendance,
      leaves,
      tasks,
      reports,
      equipment,
      borrows,
      materials,
      stocks,
      banners,
      logs,
      config: { workIn: "09:30", workOut: "18:30" },
      session: null,
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        const s = seed();
        localStorage.setItem(KEY, JSON.stringify(s));
        return s;
      }
      return JSON.parse(raw);
    } catch {
      const s = seed();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
  }

  function save(db) {
    localStorage.setItem(KEY, JSON.stringify(db));
  }

  function log(db, action, detail) {
    const u = db.session;
    db.logs.unshift({
      id: uid("lg"),
      userId: u ? u.id : "system",
      action,
      detail,
      createdAt: fmt(new Date()),
    });
  }

  function requireUser(db) {
    if (!db.session) throw new Error("请先登录");
    return db.session;
  }

  function requireAdmin(db) {
    const u = requireUser(db);
    if (u.role !== "admin") throw new Error("需要管理员权限");
    return u;
  }

  const api = {
    reset() {
      const s = seed();
      save(s);
      return s;
    },
    snapshot() {
      return clone(load());
    },
    auth: {
      login(username, password) {
        const db = load();
        const u = db.users.find((x) => x.username === username && x.password === password);
        if (!u) throw new Error("账号或密码错误");
        db.session = { id: u.id, username: u.username, name: u.name, role: u.role, dept: u.dept, phone: u.phone };
        log(db, "登录", u.name + " 进入系统");
        save(db);
        return clone(db.session);
      },
      register(payload) {
        const db = load();
        if (db.users.some((x) => x.username === payload.username)) throw new Error("用户名已存在");
        const u = {
          id: uid("u"),
          username: payload.username,
          password: payload.password || "123456",
          name: payload.name || payload.username,
          role: "user",
          phone: payload.phone || "",
          dept: payload.dept || "巡测组",
          avatar: "",
          createdAt: fmt(new Date()),
        };
        db.users.push(u);
        log(db, "注册", u.username);
        save(db);
        return { ok: true };
      },
      logout() {
        const db = load();
        db.session = null;
        save(db);
      },
      current() {
        return clone(load().session);
      },
      updateProfile(patch) {
        const db = load();
        const me = requireUser(db);
        const u = db.users.find((x) => x.id === me.id);
        Object.assign(u, { name: patch.name ?? u.name, phone: patch.phone ?? u.phone, dept: patch.dept ?? u.dept });
        db.session = { ...db.session, name: u.name, phone: u.phone, dept: u.dept };
        log(db, "修改资料", u.name);
        save(db);
        return clone(db.session);
      },
      changePassword(oldP, newP) {
        const db = load();
        const me = requireUser(db);
        const u = db.users.find((x) => x.id === me.id);
        if (u.password !== oldP) throw new Error("原密码不正确");
        u.password = newP;
        log(db, "修改密码", me.username);
        save(db);
      },
    },
    users: {
      list() {
        const db = load();
        requireAdmin(db);
        return clone(db.users.map(({ password, ...r }) => r));
      },
      save(row) {
        const db = load();
        requireAdmin(db);
        if (row.id) {
          const i = db.users.findIndex((x) => x.id === row.id);
          if (i >= 0) Object.assign(db.users[i], row, { password: row.password || db.users[i].password });
        } else {
          db.users.push({
            id: uid("u"),
            username: row.username,
            password: row.password || "123456",
            name: row.name,
            role: row.role || "user",
            phone: row.phone || "",
            dept: row.dept || "",
            avatar: "",
            createdAt: fmt(new Date()),
          });
        }
        log(db, "用户管理", row.username || row.name);
        save(db);
      },
      remove(id) {
        const db = load();
        requireAdmin(db);
        if (id === "u-admin") throw new Error("不能删除内置管理员");
        db.users = db.users.filter((x) => x.id !== id);
        save(db);
      },
    },
    stations: {
      list() {
        return clone(load().stations);
      },
      save(row) {
        const db = load();
        requireAdmin(db);
        if (row.id) {
          const i = db.stations.findIndex((x) => x.id === row.id);
          if (i >= 0) Object.assign(db.stations[i], row);
        } else {
          db.stations.push({ ...row, id: uid("st") });
        }
        save(db);
      },
      remove(id) {
        const db = load();
        requireAdmin(db);
        db.stations = db.stations.filter((x) => x.id !== id);
        save(db);
      },
    },
    attendance: {
      config() {
        return clone(load().config);
      },
      setConfig(cfg) {
        const db = load();
        requireAdmin(db);
        db.config = { ...db.config, ...cfg };
        log(db, "考勤配置", `${cfg.workIn} / ${cfg.workOut}`);
        save(db);
      },
      list(userId, month) {
        const db = load();
        let rows = db.attendance;
        if (userId) rows = rows.filter((x) => x.userId === userId);
        if (month) rows = rows.filter((x) => x.time.slice(0, 7) === month);
        return clone(rows.slice().sort((a, b) => (a.time < b.time ? 1 : -1)));
      },
      all() {
        const db = load();
        requireAdmin(db);
        return clone(db.attendance.slice().sort((a, b) => (a.time < b.time ? 1 : -1)));
      },
      clock(type) {
        const db = load();
        const me = requireUser(db);
        const now = new Date();
        const cfg = db.config;
        const hm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
        let status = "正常";
        let remark = type === "in" ? "正常上班" : "正常下班";
        if (type === "in" && hm > cfg.workIn) {
          status = "异常";
          remark = "迟到";
        }
        if (type === "out" && hm < cfg.workOut) {
          status = "异常";
          remark = "早退";
        }
        const today = dayKey(now);
        const exists = db.attendance.find((x) => x.userId === me.id && x.type === type && x.time.startsWith(today));
        if (exists) throw new Error(type === "in" ? "今日已上班打卡" : "今日已下班打卡");
        const row = {
          id: uid("a"),
          userId: me.id,
          type,
          time: fmt(now),
          place: me.dept || "巡测现场",
          status,
          remark,
        };
        db.attendance.push(row);
        log(db, "打卡", remark);
        save(db);
        return clone(row);
      },
    },
    leaves: {
      mine() {
        const db = load();
        const me = requireUser(db);
        return clone(db.leaves.filter((x) => x.userId === me.id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
      },
      all() {
        const db = load();
        requireAdmin(db);
        return clone(db.leaves.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
      },
      create(row) {
        const db = load();
        const me = requireUser(db);
        db.leaves.unshift({
          id: uid("lv"),
          userId: me.id,
          type: row.type,
          start: row.start,
          end: row.end,
          reason: row.reason,
          status: "pending",
          createdAt: fmt(new Date()),
          reply: "",
        });
        log(db, "请假申请", row.type);
        save(db);
      },
      audit(id, status, reply) {
        const db = load();
        requireAdmin(db);
        const r = db.leaves.find((x) => x.id === id);
        if (!r) throw new Error("记录不存在");
        r.status = status;
        r.reply = reply || (status === "approved" ? "同意" : "驳回");
        log(db, "请假审核", r.status);
        save(db);
      },
    },
    tasks: {
      mine() {
        const db = load();
        const me = requireUser(db);
        return clone(db.tasks.filter((x) => x.assigneeId === me.id));
      },
      all() {
        const db = load();
        requireAdmin(db);
        return clone(db.tasks);
      },
      save(row) {
        const db = load();
        requireAdmin(db);
        if (row.id) {
          const i = db.tasks.findIndex((x) => x.id === row.id);
          if (i >= 0) Object.assign(db.tasks[i], row);
        } else {
          db.tasks.unshift({
            ...row,
            id: uid("tk"),
            progress: Number(row.progress) || 0,
            status: row.status || "待接收",
            feedback: "",
            createdAt: fmt(new Date()),
          });
        }
        log(db, "任务管理", row.title);
        save(db);
      },
      updateMine(id, patch) {
        const db = load();
        const me = requireUser(db);
        const t = db.tasks.find((x) => x.id === id && x.assigneeId === me.id);
        if (!t) throw new Error("任务不存在");
        if (patch.progress != null) t.progress = Number(patch.progress);
        if (patch.feedback != null) t.feedback = patch.feedback;
        t.status = t.progress >= 100 ? "已完成" : t.progress > 0 ? "进行中" : "待接收";
        log(db, "任务反馈", t.title);
        save(db);
      },
      remove(id) {
        const db = load();
        requireAdmin(db);
        db.tasks = db.tasks.filter((x) => x.id !== id);
        save(db);
      },
    },
    reports: {
      mine() {
        const db = load();
        const me = requireUser(db);
        return clone(db.reports.filter((x) => x.userId === me.id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
      },
      all() {
        const db = load();
        requireAdmin(db);
        return clone(db.reports.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
      },
      save(row) {
        const db = load();
        const me = requireUser(db);
        if (row.id) {
          const r = db.reports.find((x) => x.id === row.id && (me.role === "admin" || x.userId === me.id));
          if (!r) throw new Error("记录不存在");
          Object.assign(r, row);
        } else {
          db.reports.unshift({
            id: uid("rp"),
            userId: me.id,
            stationId: row.stationId,
            kind: row.kind,
            value: Number(row.value),
            unit: row.unit,
            remark: row.remark || "",
            image: row.image || "",
            createdAt: fmt(new Date()),
          });
        }
        log(db, "测报上报", row.kind);
        save(db);
      },
      remove(id) {
        const db = load();
        const me = requireUser(db);
        const row = db.reports.find((x) => x.id === id);
        if (!row) throw new Error("记录不存在");
        if (me.role !== "admin" && row.userId !== me.id) throw new Error("无权删除");
        db.reports = db.reports.filter((x) => x.id !== id);
        save(db);
      },
    },
    equipment: {
      list() {
        return clone(load().equipment);
      },
      save(row) {
        const db = load();
        requireAdmin(db);
        if (row.id) {
          const i = db.equipment.findIndex((x) => x.id === row.id);
          if (i >= 0) Object.assign(db.equipment[i], row);
        } else db.equipment.push({ ...row, id: uid("eq") });
        save(db);
      },
      remove(id) {
        const db = load();
        requireAdmin(db);
        db.equipment = db.equipment.filter((x) => x.id !== id);
        save(db);
      },
    },
    borrows: {
      mine() {
        const db = load();
        const me = requireUser(db);
        return clone(db.borrows.filter((x) => x.userId === me.id));
      },
      all() {
        const db = load();
        requireAdmin(db);
        return clone(db.borrows);
      },
      apply(row) {
        const db = load();
        const me = requireUser(db);
        db.borrows.unshift({
          id: uid("br"),
          userId: me.id,
          equipmentId: row.equipmentId,
          qty: Number(row.qty) || 1,
          reason: row.reason,
          status: "pending",
          createdAt: fmt(new Date()),
          returnAt: "",
          reply: "",
        });
        log(db, "仪器借用申请", row.reason);
        save(db);
      },
      audit(id, status, reply) {
        const db = load();
        requireAdmin(db);
        const r = db.borrows.find((x) => x.id === id);
        if (!r) throw new Error("记录不存在");
        r.status = status;
        r.reply = reply || "";
        if (status === "approved") {
          const eq = db.equipment.find((x) => x.id === r.equipmentId);
          if (eq) eq.stock = Math.max(0, eq.stock - r.qty);
        }
        log(db, "借用审核", status);
        save(db);
      },
      giveBack(id) {
        const db = load();
        const me = requireUser(db);
        const r = db.borrows.find((x) => x.id === id && x.userId === me.id);
        if (!r) throw new Error("记录不存在");
        if (r.status !== "approved") throw new Error("仅已批准借用可归还");
        r.status = "returned";
        r.returnAt = fmt(new Date());
        const eq = db.equipment.find((x) => x.id === r.equipmentId);
        if (eq) eq.stock += r.qty;
        log(db, "仪器归还", r.id);
        save(db);
      },
    },
    materials: {
      list() {
        const db = load();
        requireUser(db);
        return clone(db.materials);
      },
      save(row) {
        const db = load();
        requireAdmin(db);
        if (row.id) {
          const i = db.materials.findIndex((x) => x.id === row.id);
          if (i >= 0) Object.assign(db.materials[i], row);
        } else db.materials.push({ ...row, id: uid("mt"), stock: Number(row.stock) || 0 });
        save(db);
      },
      stock(row) {
        const db = load();
        requireAdmin(db);
        const m = db.materials.find((x) => x.id === row.materialId);
        if (!m) throw new Error("物资不存在");
        const qty = Number(row.qty);
        if (row.type === "out" && m.stock < qty) throw new Error("库存不足");
        m.stock += row.type === "in" ? qty : -qty;
        db.stocks.unshift({
          id: uid("sk"),
          materialId: row.materialId,
          type: row.type,
          qty,
          note: row.note || "",
          createdAt: fmt(new Date()),
        });
        log(db, "出入库", m.name);
        save(db);
      },
      stocks() {
        const db = load();
        requireAdmin(db);
        return clone(db.stocks);
      },
    },
    banners: {
      list(all) {
        const db = load();
        const rows = all ? db.banners : db.banners.filter((x) => x.enabled);
        return clone(rows.slice().sort((a, b) => a.sort - b.sort));
      },
      save(row) {
        const db = load();
        requireAdmin(db);
        if (row.id) {
          const i = db.banners.findIndex((x) => x.id === row.id);
          if (i >= 0) Object.assign(db.banners[i], row);
        } else db.banners.push({ ...row, id: uid("bn"), enabled: true, sort: row.sort || 9 });
        save(db);
      },
      remove(id) {
        const db = load();
        requireAdmin(db);
        db.banners = db.banners.filter((x) => x.id !== id);
        save(db);
      },
    },
    logs: {
      list() {
        const db = load();
        requireAdmin(db);
        return clone(db.logs);
      },
    },
    helpers: { fmt, dayKey, pad },
  };

  global.SW = api;
})(window);
