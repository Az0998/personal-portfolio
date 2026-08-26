package com.hydro.smartwater.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class OpLog {
  @TableId(type = IdType.AUTO)
  private Long id;
  private Long userId;
  private String action;
  private String detail;
  private LocalDateTime createdAt;
}
