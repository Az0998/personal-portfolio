package com.hydro.smartwater.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.Data;

@Data
public class Material {
  @TableId(type = IdType.AUTO)
  private Long id;
  private String name;
  private String spec;
  private Integer stock;
  private String unit;
  private Integer warnLine;
}
