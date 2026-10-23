package com.sflab.config;

import com.fasterxml.jackson.core.json.JsonWriteFeature;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {
    @Bean
    Jackson2ObjectMapperBuilderCustomizer nanAsString() {
        return builder -> builder.featuresToEnable(JsonWriteFeature.WRITE_NAN_AS_STRINGS.mappedFeature());
    }
}
