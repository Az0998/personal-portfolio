package com.hydro.smartwater.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class Station {
  @TableId(type = IdType.AUTO)
  private Long id;
  private String name;
  private String type;
  private String basin;
  private String cycleType;
  private BigDecimal waterLevel;
  private BigDecimal flowRate;
  private String status;
  private String note;
}
