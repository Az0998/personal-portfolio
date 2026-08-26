package com.hydro.smartwater.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.Data;

@Data
public class AttendanceConfig {
  @TableId(type = IdType.AUTO)
  private Long id;
  private String workIn;
  private String workOut;
}
