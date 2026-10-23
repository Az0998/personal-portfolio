package com.sflab.api;

import com.sflab.service.LabService;
import com.sflab.session.LabSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class LabController {
    private final LabService lab;

    public LabController(LabService lab) {
        this.lab = lab;
    }

    @PostMapping("/sessions")
    public Map<String, Object> create() {
        return lab.meta(lab.create());
    }

    @PostMapping("/sessions/demo")
    public Map<String, Object> demo(@RequestParam(defaultValue = "matlab") String kind) throws Exception {
        return lab.meta(lab.loadDemo(kind));
    }

    @PostMapping("/sessions/{id}/files")
    public Map<String, Object> files(@PathVariable String id,
                                     @RequestParam(required = false) MultipartFile weight,
                                     @RequestParam(required = false) MultipartFile probe,
                                     @RequestParam(required = false) MultipartFile weather) throws Exception {
        return lab.meta(lab.upload(id, weight, probe, weather));
    }

    @PostMapping("/sessions/files")
    public Map<String, Object> filesNew(@RequestParam(required = false) MultipartFile weight,
                                        @RequestParam(required = false) MultipartFile probe,
                                        @RequestParam(required = false) MultipartFile weather) throws Exception {
        return lab.meta(lab.upload(null, weight, probe, weather));
    }

    @GetMapping("/sessions/{id}")
    public Map<String, Object> meta(@PathVariable String id) {
        return lab.meta(lab.get(id));
    }

    @PostMapping("/sessions/{id}/run")
    public Map<String, Object> run(@PathVariable String id, @RequestBody(required = false) Map<String, Object> body) {
        LabSession s = lab.get(id);
        return lab.meta(lab.run(s, body == null ? lab.defaultOpts() : body));
    }

    @GetMapping("/sessions/{id}/series")
    public Map<String, Object> series(@PathVariable String id,
                                      @RequestParam(defaultValue = "weight") String group,
                                      @RequestParam(required = false) Long from,
                                      @RequestParam(required = false) Long to,
                                      @RequestParam(defaultValue = "1800") int maxPoints) {
        return lab.series(lab.get(id), group, from, to, maxPoints);
    }

    @GetMapping("/sessions/{id}/temp")
    public Map<String, Object> temp(@PathVariable String id) {
        return lab.tempDetail(lab.get(id));
    }

    @GetMapping("/sessions/{id}/balance")
    public Map<String, Object> balance(@PathVariable String id) {
        return lab.balancePayload(lab.get(id));
    }

    @GetMapping("/sessions/{id}/filters/compare")
    public Map<String, Object> compareFilters(@PathVariable String id) {
        return lab.compareFilters(lab.get(id));
    }

    @GetMapping("/sessions/{id}/flags/summary")
    public Map<String, Object> flagSummary(@PathVariable String id,
                                           @RequestParam(defaultValue = "weight") String stream) {
        return lab.flagSummary(lab.get(id), stream);
    }

    @GetMapping("/sessions/{id}/flags")
    public Map<String, Object> flags(@PathVariable String id,
                                     @RequestParam(defaultValue = "weight") String stream,
                                     @RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "80") int size,
                                     @RequestParam(defaultValue = "true") boolean onlyFlagged) {
        return lab.flagsTable(lab.get(id), stream, page, size, onlyFlagged);
    }

    @PatchMapping("/sessions/{id}/flags")
    public Map<String, Object> patchFlag(@PathVariable String id, @RequestBody Map<String, Object> body) {
        LabSession s = lab.get(id);
        String stream = String.valueOf(body.getOrDefault("stream", "weight"));
        long t = ((Number) body.get("t")).longValue();
        int flag = ((Number) body.get("flag")).intValue();
        String reason = String.valueOf(body.getOrDefault("reason", "人工修订"));
        lab.overrideFlag(s, stream, t, flag, reason);
        return Map.of("ok", true);
    }

    @GetMapping("/sessions/{id}/report")
    public Map<String, Object> report(@PathVariable String id) {
        return lab.report(lab.get(id));
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("ok", true);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> bad(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> fail(Exception e) {
        String msg = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
        return ResponseEntity.status(500).body(Map.of("error", msg));
    }
}
