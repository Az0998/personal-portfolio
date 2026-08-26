package com.hydro.smartwater.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.Data;

@Data
public class Banner {
  @TableId(type = IdType.AUTO)
  private Long id;
  private String title;
  private String subtitle;
  private Integer sortNo;
  private Integer enabled;
}
