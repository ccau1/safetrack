package com.safetrack.shared.config;

import com.safetrack.shared.security.JwtParser;
import com.safetrack.shared.security.JwtProperties;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

@AutoConfiguration
@EnableConfigurationProperties(JwtProperties.class)
public class SharedAutoConfiguration {

    @Bean
    public JwtParser jwtParser(JwtProperties jwtProperties) {
        return new JwtParser(jwtProperties);
    }
}
