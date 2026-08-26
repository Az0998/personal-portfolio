package com.hydro.smartwater.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class MeasureReport {
  @TableId(type = IdType.AUTO)
  private Long id;
  private Long userId;
  private Long stationId;
  private String kind;
  private BigDecimal valueNum;
  private String unit;
  private String remark;
  private String imageUrl;
  private LocalDateTime createdAt;
}
