package com.safetrack.server.security.permission;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.safetrack.server.domain.entity.Role;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
public class RolePolicyLoader {

    private static final String POLICY_FILE = "permissions/role-policies.yml";

    private Map<Role.RoleName, List<Statement>> roleStatements;

    @PostConstruct
    public void load() {
        try {
            ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
            mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            ClassPathResource resource = new ClassPathResource(POLICY_FILE);
            PolicyFile policyFile = mapper.readValue(resource.getInputStream(), PolicyFile.class);

            this.roleStatements = policyFile.getPolicies().stream()
                    .collect(Collectors.toMap(
                            p -> Role.RoleName.valueOf(
                                    p.getPolicyName().replace("Policy", "")
                                            .replaceAll("([a-z])([A-Z])", "$1_$2")
                                            .toUpperCase()),
                            p -> p.getPolicyDocument().getStatement()
                    ));

            log.info("Loaded role policies for: {}", roleStatements.keySet());
        } catch (IOException e) {
            log.error("Failed to load role policies from {}", POLICY_FILE, e);
            this.roleStatements = Collections.emptyMap();
        }
    }

    public List<Statement> getStatements(Role.RoleName roleName) {
        return roleStatements.getOrDefault(roleName, Collections.emptyList());
    }

    @Getter
    public static class PolicyFile {
        @JsonProperty("Version")
        private String version;
        @JsonProperty("Policies")
        private List<Policy> policies;
    }

    @Getter
    public static class Policy {
        @JsonProperty("PolicyName")
        private String policyName;
        @JsonProperty("PolicyDocument")
        private PolicyDocument policyDocument;
    }

    @Getter
    public static class PolicyDocument {
        @JsonProperty("Statement")
        private List<Statement> statement;
    }

    @Getter
    public static class Statement {
        @JsonProperty("Sid")
        private String sid;
        @JsonProperty("Effect")
        private Effect effect;
        @JsonProperty("Action")
        private List<String> actions;
        @JsonProperty("Resource")
        private String resource;
    }

    public enum Effect {
        Allow, Deny
    }
}
