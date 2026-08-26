package com.hydro.smartwater.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class HydroTask {
  @TableId(type = IdType.AUTO)
  private Long id;
  private String title;
  private Long stationId;
  private Long assigneeId;
  private String priority;
  private Integer progress;
  private String status;
  private LocalDate deadline;
  private String content;
  private String feedback;
  private LocalDateTime createdAt;
}
