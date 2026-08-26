package com.hydro.smartwater.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BorrowRecord {
  @TableId(type = IdType.AUTO)
  private Long id;
  private Long userId;
  private Long equipmentId;
  private Integer qty;
  private String reason;
  private String status;
  private String reply;
  private LocalDateTime createdAt;
  private LocalDateTime returnAt;
}
