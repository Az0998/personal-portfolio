package com.hydro.smartwater.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.hydro.smartwater.common.R;
import com.hydro.smartwater.entity.*;
import com.hydro.smartwater.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ApiController {
  private final SysUserMapper userMapper;
  private final StationMapper stationMapper;
  private final AttendanceMapper attendanceMapper;
  private final AttendanceConfigMapper configMapper;
  private final LeaveRequestMapper leaveMapper;
  private final HydroTaskMapper taskMapper;
  private final MeasureReportMapper reportMapper;
  private final EquipmentMapper equipmentMapper;
  private final BorrowRecordMapper borrowMapper;
  private final MaterialMapper materialMapper;
  private final StockRecordMapper stockMapper;
  private final BannerMapper bannerMapper;
  private final OpLogMapper logMapper;
  private final PasswordEncoder encoder;

  private final Map<String, SysUser> tokens = new ConcurrentHashMap<>();

  private SysUser user(String token) {
    SysUser u = tokens.get(token);
    if (u == null) throw new RuntimeException("未登录");
    return u;
  }

  private SysUser admin(String token) {
    SysUser u = user(token);
    if (!"admin".equals(u.getRole())) throw new RuntimeException("需要管理员权限");
    return u;
  }

  private void log(SysUser u, String action, String detail) {
    OpLog l = new OpLog();
    l.setUserId(u.getId());
    l.setAction(action);
    l.setDetail(detail);
    l.setCreatedAt(LocalDateTime.now());
    logMapper.insert(l);
  }

  @PostMapping("/auth/login")
  public R login(@RequestBody Map<String, String> body) {
    SysUser u = userMapper.selectOne(new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, body.get("username")));
    if (u == null) return R.fail("账号或密码错误");
    boolean ok = encoder.matches(body.get("password"), u.getPassword())
        || body.get("password").equals(u.getPassword());
    if (!ok) return R.fail("账号或密码错误");
    String token = UUID.randomUUID().toString();
    u.setPassword(null);
    tokens.put(token, u);
    Map<String, Object> data = new HashMap<>();
    data.put("token", token);
    data.put("user", u);
    return R.ok(data);
  }

  @PostMapping("/auth/register")
  public R register(@RequestBody SysUser body) {
    if (userMapper.selectOne(new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, body.getUsername())) != null) {
      return R.fail("用户名已存在");
    }
    body.setRole("user");
    body.setPassword(encoder.encode(body.getPassword() == null ? "123456" : body.getPassword()));
    body.setCreatedAt(LocalDateTime.now());
    userMapper.insert(body);
    return R.ok();
  }

  @GetMapping("/stations")
  public R stations() {
    return R.ok(stationMapper.selectList(null));
  }

  @GetMapping("/banners")
  public R banners() {
    return R.ok(bannerMapper.selectList(new LambdaQueryWrapper<Banner>().eq(Banner::getEnabled, 1)));
  }

  @PostMapping("/attendance/clock")
  public R clock(@RequestHeader("X-Token") String token, @RequestBody Map<String, String> body) {
    SysUser u = user(token);
    AttendanceConfig cfg = configMapper.selectById(1L);
    String type = body.get("type");
    LocalTime now = LocalTime.now();
    Attendance a = new Attendance();
    a.setUserId(u.getId());
    a.setPunchType(type);
    a.setPunchTime(LocalDateTime.now());
    a.setPlace(u.getDept());
    a.setStatus("正常");
    a.setRemark("in".equals(type) ? "正常上班" : "正常下班");
    if (cfg != null && "in".equals(type) && now.isAfter(LocalTime.parse(cfg.getWorkIn()))) {
      a.setStatus("异常");
      a.setRemark("迟到");
    }
    if (cfg != null && "out".equals(type) && now.isBefore(LocalTime.parse(cfg.getWorkOut()))) {
      a.setStatus("异常");
      a.setRemark("早退");
    }
    attendanceMapper.insert(a);
    log(u, "打卡", a.getRemark());
    return R.ok(a);
  }

  @GetMapping("/attendance/mine")
  public R myAttend(@RequestHeader("X-Token") String token) {
    SysUser u = user(token);
    return R.ok(attendanceMapper.selectList(new LambdaQueryWrapper<Attendance>().eq(Attendance::getUserId, u.getId())));
  }

  @PostMapping("/leave")
  public R leave(@RequestHeader("X-Token") String token, @RequestBody LeaveRequest row) {
    SysUser u = user(token);
    row.setUserId(u.getId());
    row.setStatus("pending");
    row.setCreatedAt(LocalDateTime.now());
    leaveMapper.insert(row);
    return R.ok();
  }

  @GetMapping("/leave/mine")
  public R myLeave(@RequestHeader("X-Token") String token) {
    SysUser u = user(token);
    return R.ok(leaveMapper.selectList(new LambdaQueryWrapper<LeaveRequest>().eq(LeaveRequest::getUserId, u.getId())));
  }

  @GetMapping("/tasks/mine")
  public R myTasks(@RequestHeader("X-Token") String token) {
    SysUser u = user(token);
    return R.ok(taskMapper.selectList(new LambdaQueryWrapper<HydroTask>().eq(HydroTask::getAssigneeId, u.getId())));
  }

  @PutMapping("/tasks/{id}/feedback")
  public R taskFb(@RequestHeader("X-Token") String token, @PathVariable Long id, @RequestBody HydroTask patch) {
    user(token);
    HydroTask t = taskMapper.selectById(id);
    t.setProgress(patch.getProgress());
    t.setFeedback(patch.getFeedback());
    t.setStatus(patch.getProgress() != null && patch.getProgress() >= 100 ? "已完成" : "进行中");
    taskMapper.updateById(t);
    return R.ok();
  }

  @GetMapping("/reports/mine")
  public R myReports(@RequestHeader("X-Token") String token) {
    SysUser u = user(token);
    return R.ok(reportMapper.selectList(new LambdaQueryWrapper<MeasureReport>().eq(MeasureReport::getUserId, u.getId())));
  }

  @PostMapping("/reports")
  public R saveReport(@RequestHeader("X-Token") String token, @RequestBody MeasureReport row) {
    SysUser u = user(token);
    if (row.getId() == null) {
      row.setUserId(u.getId());
      row.setCreatedAt(LocalDateTime.now());
      reportMapper.insert(row);
    } else {
      reportMapper.updateById(row);
    }
    return R.ok();
  }

  @DeleteMapping("/reports/{id}")
  public R delReport(@RequestHeader("X-Token") String token, @PathVariable Long id) {
    user(token);
    reportMapper.deleteById(id);
    return R.ok();
  }

  @GetMapping("/equipment")
  public R equipment() {
    return R.ok(equipmentMapper.selectList(null));
  }

  @PostMapping("/borrows")
  public R borrow(@RequestHeader("X-Token") String token, @RequestBody BorrowRecord row) {
    SysUser u = user(token);
    row.setUserId(u.getId());
    row.setStatus("pending");
    row.setCreatedAt(LocalDateTime.now());
    borrowMapper.insert(row);
    return R.ok();
  }

  @GetMapping("/borrows/mine")
  public R myBorrow(@RequestHeader("X-Token") String token) {
    SysUser u = user(token);
    return R.ok(borrowMapper.selectList(new LambdaQueryWrapper<BorrowRecord>().eq(BorrowRecord::getUserId, u.getId())));
  }

  @PostMapping("/borrows/{id}/return")
  public R giveBack(@RequestHeader("X-Token") String token, @PathVariable Long id) {
    user(token);
    BorrowRecord r = borrowMapper.selectById(id);
    r.setStatus("returned");
    r.setReturnAt(LocalDateTime.now());
    Equipment eq = equipmentMapper.selectById(r.getEquipmentId());
    if (eq != null) {
      eq.setStock(eq.getStock() + r.getQty());
      equipmentMapper.updateById(eq);
    }
    borrowMapper.updateById(r);
    return R.ok();
  }

  @PutMapping("/profile")
  public R profile(@RequestHeader("X-Token") String token, @RequestBody SysUser patch) {
    SysUser u = user(token);
    SysUser db = userMapper.selectById(u.getId());
    db.setName(patch.getName());
    db.setPhone(patch.getPhone());
    db.setDept(patch.getDept());
    userMapper.updateById(db);
    db.setPassword(null);
    tokens.put(token, db);
    return R.ok(db);
  }

  /* —— admin —— */
  @GetMapping("/admin/users")
  public R users(@RequestHeader("X-Token") String token) {
    admin(token);
    List<SysUser> list = userMapper.selectList(null);
    list.forEach(x -> x.setPassword(null));
    return R.ok(list);
  }

  @PostMapping("/admin/users")
  public R saveUser(@RequestHeader("X-Token") String token, @RequestBody SysUser row) {
    admin(token);
    if (row.getId() == null) {
      row.setPassword(encoder.encode(row.getPassword() == null ? "123456" : row.getPassword()));
      row.setCreatedAt(LocalDateTime.now());
      userMapper.insert(row);
    } else {
      if (row.getPassword() != null && !row.getPassword().isEmpty()) {
        row.setPassword(encoder.encode(row.getPassword()));
      } else {
        row.setPassword(null);
      }
      userMapper.updateById(row);
    }
    return R.ok();
  }

  @GetMapping("/admin/leaves")
  public R allLeave(@RequestHeader("X-Token") String token) {
    admin(token);
    return R.ok(leaveMapper.selectList(null));
  }

  @PostMapping("/admin/leaves/{id}/audit")
  public R auditLeave(@RequestHeader("X-Token") String token, @PathVariable Long id, @RequestBody Map<String, String> body) {
    admin(token);
    LeaveRequest r = leaveMapper.selectById(id);
    r.setStatus(body.get("status"));
    r.setReply(body.getOrDefault("reply", ""));
    leaveMapper.updateById(r);
    return R.ok();
  }

  @GetMapping("/admin/tasks")
  public R allTasks(@RequestHeader("X-Token") String token) {
    admin(token);
    return R.ok(taskMapper.selectList(null));
  }

  @PostMapping("/admin/tasks")
  public R saveTask(@RequestHeader("X-Token") String token, @RequestBody HydroTask row) {
    admin(token);
    if (row.getId() == null) {
      row.setCreatedAt(LocalDateTime.now());
      if (row.getStatus() == null) row.setStatus("待接收");
      taskMapper.insert(row);
    } else taskMapper.updateById(row);
    return R.ok();
  }

  @GetMapping("/admin/logs")
  public R logs(@RequestHeader("X-Token") String token) {
    admin(token);
    return R.ok(logMapper.selectList(null));
  }

  @GetMapping("/admin/dashboard")
  public R dash(@RequestHeader("X-Token") String token) {
    admin(token);
    Map<String, Object> m = new HashMap<>();
    m.put("stations", stationMapper.selectCount(null));
    m.put("users", userMapper.selectCount(null));
    m.put("tasks", taskMapper.selectCount(new LambdaQueryWrapper<HydroTask>().ne(HydroTask::getStatus, "已完成")));
    m.put("pendingLeaves", leaveMapper.selectCount(new LambdaQueryWrapper<LeaveRequest>().eq(LeaveRequest::getStatus, "pending")));
    return R.ok(m);
  }

  @ExceptionHandler(RuntimeException.class)
  public R onErr(RuntimeException e) {
    return R.fail(e.getMessage());
  }
}
