package com.hydro.smartwater.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class LeaveRequest {
  @TableId(type = IdType.AUTO)
  private Long id;
  private Long userId;
  private String leaveType;
  private LocalDate startDate;
  private LocalDate endDate;
  private String reason;
  private String status;
  private String reply;
  private LocalDateTime createdAt;
}
