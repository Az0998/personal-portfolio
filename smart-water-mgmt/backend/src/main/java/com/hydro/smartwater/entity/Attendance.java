package com.hydro.smartwater.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Attendance {
  @TableId(type = IdType.AUTO)
  private Long id;
  private Long userId;
  private String punchType;
  private LocalDateTime punchTime;
  private String place;
  private String status;
  private String remark;
}
