package com.hydro.smartwater;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.hydro.smartwater.mapper")
public class SmartWaterApplication {
  public static void main(String[] args) {
    SpringApplication.run(SmartWaterApplication.class, args);
  }
}
