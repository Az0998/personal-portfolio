package com.hydro.smartwater.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class StockRecord {
  @TableId(type = IdType.AUTO)
  private Long id;
  private Long materialId;
  private String ioType;
  private Integer qty;
  private String note;
  private LocalDateTime createdAt;
}
