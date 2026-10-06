package com.mgmtp.gives.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@Tag(name = "Health Check", description = "Endpoints for uptime monitoring and health checks")
public class HealthController {

    @GetMapping
    @Operation(summary = "Check service health", description = "Returns UP status with current UTC timestamp")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "mgm-gives-backend",
                "timestamp", Instant.now().toString()
        ));
    }
}
