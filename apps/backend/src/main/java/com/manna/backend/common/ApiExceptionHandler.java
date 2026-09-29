package com.manna.backend.common;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** 에러를 공통 규약 한 가지 형태로: { "error": { "code", "message" } }. */
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handle(ApiException e) {
        return body(e.getStatus(), e.getMessage());
    }

    // @Valid 실패(빈 이름 등). 첫 번째 필드 메시지만 준다 — 화면이 한 줄만 띄운다.
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handle(MethodArgumentNotValidException e) {
        String message =
            e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(f -> f.getDefaultMessage())
                .orElse("요청이 올바르지 않습니다.");
        return body(HttpStatus.BAD_REQUEST, message);
    }

    private static ResponseEntity<Map<String, Object>> body(HttpStatus status, String message) {
        return ResponseEntity.status(status)
            .body(Map.of("error", Map.of("code", status.name(), "message", message)));
    }
}
